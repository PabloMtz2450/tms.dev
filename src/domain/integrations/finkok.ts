import { XMLParser } from 'fast-xml-parser';

export type FinkokEnvironment = 'demo' | 'production';

export type FinkokConfig = {
  environment: FinkokEnvironment;
  username: string;
  password: string;
  timeoutMs?: number;
};

export type FinkokIncidence = {
  id?: string;
  code?: string;
  workProcessId?: string;
  message?: string;
  extraInfo?: string;
  registeredAt?: string;
};

export type FinkokStampResult = {
  ok: boolean;
  codEstatus?: string;
  uuid?: string;
  stampedXml?: string;
  stampedAt?: string;
  satSeal?: string;
  satCertificateNumber?: string;
  incidences: FinkokIncidence[];
};

const WSDL = {
  demo: 'https://demo-facturacion.finkok.com/servicios/soap/stamp.wsdl',
  production: 'https://facturacion.finkok.com/servicios/soap/stamp.wsdl',
} as const;

const ENDPOINT = {
  demo: 'https://demo-facturacion.finkok.com/servicios/soap/stamp',
  production: 'https://facturacion.finkok.com/servicios/soap/stamp',
} as const;

const MAX_XML_BYTES = 1_000_000;
const MAX_SOAP_BYTES = 2_500_000;
const SUCCESS_STATUS = 'comprobante timbrado satisfactoriamente';
const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  processEntities: false,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: true,
});

function xmlEscape(value: string): string {
  return value.replace(/[<>&"']/g, (char) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  }[char] as string));
}

function rejectDangerousXml(xml: string, maxBytes: number, label: string): void {
  const bytes = Buffer.byteLength(xml, 'utf8');
  if (bytes <= 0) throw new Error(`${label}_EMPTY`);
  if (bytes > maxBytes) throw new Error(`${label}_TOO_LARGE:${bytes}`);
  if (/<!DOCTYPE/i.test(xml) || /<!ENTITY/i.test(xml)) throw new Error(`${label}_DTD_FORBIDDEN`);
}

function toText(value: unknown): string | undefined {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return undefined;
}

function findFirst(root: unknown, key: string): string | undefined {
  if (!root || typeof root !== 'object') return undefined;
  if (Array.isArray(root)) {
    for (const item of root) {
      const found = findFirst(item, key);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  const record = root as Record<string, unknown>;
  if (key in record) {
    const direct = toText(record[key]);
    if (direct !== undefined) return direct;
  }
  for (const value of Object.values(record)) {
    const found = findFirst(value, key);
    if (found !== undefined) return found;
  }
  return undefined;
}

function collectObjects(root: unknown, key: string, out: Record<string, unknown>[] = []): Record<string, unknown>[] {
  if (!root || typeof root !== 'object') return out;
  if (Array.isArray(root)) {
    for (const item of root) collectObjects(item, key, out);
    return out;
  }
  const record = root as Record<string, unknown>;
  if (key in record) {
    const value = record[key];
    if (Array.isArray(value)) {
      for (const item of value) if (item && typeof item === 'object') out.push(item as Record<string, unknown>);
    } else if (value && typeof value === 'object') out.push(value as Record<string, unknown>);
  }
  for (const value of Object.values(record)) collectObjects(value, key, out);
  return out;
}

function parseIncidences(parsed: unknown): FinkokIncidence[] {
  return collectObjects(parsed, 'Incidencia').map((item) => ({
    id: findFirst(item, 'IdIncidencia'),
    code: findFirst(item, 'CodigoError'),
    workProcessId: findFirst(item, 'WorkProcessId'),
    message: findFirst(item, 'MensajeIncidencia'),
    extraInfo: findFirst(item, 'ExtraInfo'),
    registeredAt: findFirst(item, 'FechaRegistro'),
  }));
}

export function getFinkokWsdl(environment: FinkokEnvironment): string {
  return WSDL[environment];
}

export function validateFinkokPayload(xml: string): void {
  rejectDangerousXml(xml, MAX_XML_BYTES - 1, 'FINKOK_XML');
  if (!xml.includes('<cfdi:Comprobante') && !xml.includes(':Comprobante')) {
    throw new Error('FINKOK_XML_INVALID: el payload no parece ser un CFDI XML.');
  }
}

function buildStampEnvelope(xml: string, config: FinkokConfig): string {
  const encoded = Buffer.from(xml, 'utf8').toString('base64');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:stamp="http://facturacion.finkok.com/stamp"><soapenv:Header/><soapenv:Body><stamp:stamp><stamp:xml>${encoded}</stamp:xml><stamp:username>${xmlEscape(config.username)}</stamp:username><stamp:password>${xmlEscape(config.password)}</stamp:password></stamp:stamp></soapenv:Body></soapenv:Envelope>`;
}

export function parseFinkokStampResponse(rawSoap: string): FinkokStampResult {
  rejectDangerousXml(rawSoap, MAX_SOAP_BYTES, 'FINKOK_SOAP');
  let parsed: unknown;
  try {
    parsed = parser.parse(rawSoap);
  } catch {
    throw new Error('FINKOK_SOAP_MALFORMED');
  }

  const codEstatus = findFirst(parsed, 'CodEstatus');
  const uuid = findFirst(parsed, 'UUID') ?? findFirst(parsed, 'Uuid');
  const stampedXml = findFirst(parsed, 'xml');
  const incidences = parseIncidences(parsed);
  const fault = findFirst(parsed, 'faultstring');
  const normalizedStatus = codEstatus?.trim().toLowerCase();
  const ok = normalizedStatus === SUCCESS_STATUS && Boolean(uuid && stampedXml);

  if (fault && !codEstatus) {
    incidences.push({ code: findFirst(parsed, 'faultcode') ?? 'SOAP_FAULT', message: fault });
  }

  return {
    ok,
    codEstatus,
    uuid,
    stampedXml,
    stampedAt: findFirst(parsed, 'Fecha'),
    satSeal: findFirst(parsed, 'SatSeal'),
    satCertificateNumber: findFirst(parsed, 'NoCertificadoSAT') ?? findFirst(parsed, 'NoCertificadoPac'),
    incidences,
  };
}

export async function stampWithFinkok(xml: string, config: FinkokConfig): Promise<FinkokStampResult> {
  validateFinkokPayload(xml);
  if (!config.username || !config.password) throw new Error('FINKOK_CREDENTIALS_MISSING');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? 30_000);
  try {
    const response = await fetch(ENDPOINT[config.environment], {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        SOAPAction: '"stamp"',
      },
      body: buildStampEnvelope(xml, config),
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'error',
    });
    const rawSoap = await response.text();
    if (!response.ok && !rawSoap) throw new Error(`FINKOK_HTTP_${response.status}`);
    return parseFinkokStampResponse(rawSoap);
  } finally {
    clearTimeout(timeout);
  }
}

export function finkokConfigFromEnv(env: NodeJS.ProcessEnv = process.env): FinkokConfig {
  const environment = env.FINKOK_ENV === 'production' ? 'production' : 'demo';
  const timeoutMs = Number(env.FINKOK_TIMEOUT_MS ?? 30000);
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1000 || timeoutMs > 120000) throw new Error('FINKOK_TIMEOUT_INVALID');
  return {
    environment,
    username: env.FINKOK_USERNAME ?? '',
    password: env.FINKOK_PASSWORD ?? '',
    timeoutMs,
  };
}
