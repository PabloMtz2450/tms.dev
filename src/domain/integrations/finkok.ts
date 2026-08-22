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
  rawSoap: string;
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
const SUCCESS_STATUS = 'comprobante timbrado satisfactoriamente';

function xmlEscape(value: string): string {
  return value.replace(/[<>&"']/g, (char) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  }[char] as string));
}

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&amp;/g, '&');
}

function tag(xml: string, localName: string): string | undefined {
  const pattern = new RegExp(`<(?:[\\w.-]+:)?${localName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${localName}>`, 'i');
  const match = xml.match(pattern);
  if (!match) return undefined;
  const body = match[1].trim();
  const cdata = body.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/i);
  return decodeEntities((cdata?.[1] ?? body).trim());
}

function allBlocks(xml: string, localName: string): string[] {
  const pattern = new RegExp(`<(?:[\\w.-]+:)?${localName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${localName}>`, 'gi');
  return Array.from(xml.matchAll(pattern), (m) => m[0]);
}

function parseIncidences(soap: string): FinkokIncidence[] {
  return allBlocks(soap, 'Incidencia').map((block) => ({
    id: tag(block, 'IdIncidencia'),
    code: tag(block, 'CodigoError'),
    workProcessId: tag(block, 'WorkProcessId'),
    message: tag(block, 'MensajeIncidencia'),
    extraInfo: tag(block, 'ExtraInfo'),
    registeredAt: tag(block, 'FechaRegistro'),
  }));
}

export function getFinkokWsdl(environment: FinkokEnvironment): string {
  return WSDL[environment];
}

export function validateFinkokPayload(xml: string): void {
  const bytes = Buffer.byteLength(xml, 'utf8');
  if (!xml.trim().startsWith('<?xml') && !xml.includes('<cfdi:Comprobante')) {
    throw new Error('FINKOK_XML_INVALID: el payload no parece ser un CFDI XML.');
  }
  if (bytes <= 0) throw new Error('FINKOK_XML_EMPTY: no hay XML para timbrar.');
  if (bytes >= MAX_XML_BYTES) {
    throw new Error(`FINKOK_XML_TOO_LARGE: ${bytes} bytes. Finkok documenta un límite de 1 MB por XML.`);
  }
}

function buildStampEnvelope(xml: string, config: FinkokConfig): string {
  const encoded = Buffer.from(xml, 'utf8').toString('base64');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:stamp="http://facturacion.finkok.com/stamp"><soapenv:Header/><soapenv:Body><stamp:stamp><stamp:xml>${encoded}</stamp:xml><stamp:username>${xmlEscape(config.username)}</stamp:username><stamp:password>${xmlEscape(config.password)}</stamp:password></stamp:stamp></soapenv:Body></soapenv:Envelope>`;
}

export function parseFinkokStampResponse(rawSoap: string): FinkokStampResult {
  const codEstatus = tag(rawSoap, 'CodEstatus');
  const uuid = tag(rawSoap, 'UUID') ?? tag(rawSoap, 'Uuid');
  const stampedXml = tag(rawSoap, 'xml');
  const incidences = parseIncidences(rawSoap);
  const fault = tag(rawSoap, 'faultstring');
  const normalizedStatus = codEstatus?.trim().toLowerCase();
  const ok = normalizedStatus === SUCCESS_STATUS && Boolean(uuid && stampedXml);

  if (fault && !codEstatus) {
    incidences.push({ code: tag(rawSoap, 'faultcode') ?? 'SOAP_FAULT', message: fault });
  }

  return {
    ok,
    codEstatus,
    uuid,
    stampedXml,
    stampedAt: tag(rawSoap, 'Fecha'),
    satSeal: tag(rawSoap, 'SatSeal'),
    satCertificateNumber: tag(rawSoap, 'NoCertificadoSAT') ?? tag(rawSoap, 'NoCertificadoPac'),
    incidences,
    rawSoap,
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
  return {
    environment,
    username: env.FINKOK_USERNAME ?? '',
    password: env.FINKOK_PASSWORD ?? '',
    timeoutMs: Number(env.FINKOK_TIMEOUT_MS ?? 30000),
  };
}
