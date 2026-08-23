import { XMLParser } from 'fast-xml-parser';
import { parseFinkokStampResponse, validateFinkokPayload, type FinkokConfig, type FinkokStampResult } from './finkok';

const ENDPOINT = {
  demo: 'https://demo-facturacion.finkok.com/servicios/soap/stamp',
  production: 'https://facturacion.finkok.com/servicios/soap/stamp',
} as const;

const parser = new XMLParser({ ignoreAttributes:false, removeNSPrefix:true, processEntities:false, parseTagValue:false, trimValues:true });

function esc(value: string): string {
  return value.replace(/[<>&"']/g, (char) => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;' }[char] as string));
}

async function postSoap(config: FinkokConfig, action: string, body: string): Promise<string> {
  if (!config.username || !config.password) throw new Error('FINKOK_CREDENTIALS_MISSING');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 30_000);
  try {
    const envelope = `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:stamp="http://facturacion.finkok.com/stamp"><soapenv:Header/><soapenv:Body>${body}</soapenv:Body></soapenv:Envelope>`;
    const response = await fetch(ENDPOINT[config.environment], {
      method:'POST',
      headers:{ 'Content-Type':'text/xml; charset=utf-8', SOAPAction:`"${action}"` },
      body: envelope,
      signal: controller.signal,
      cache:'no-store',
      redirect:'error',
    });
    const text = await response.text();
    if (!response.ok && !text) throw new Error(`FINKOK_HTTP_${response.status}`);
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Finkok documents `stamped` as the recovery method for a CFDI that was already stamped.
 * The original XML is sent again, but recovery is not treated as a new business issuance.
 */
export async function recoverStampedWithFinkok(xml: string, config: FinkokConfig): Promise<FinkokStampResult> {
  validateFinkokPayload(xml);
  const encoded = Buffer.from(xml, 'utf8').toString('base64');
  const raw = await postSoap(config, 'stamped', `<stamp:stamped><stamp:xml>${encoded}</stamp:xml><stamp:username>${esc(config.username)}</stamp:username><stamp:password>${esc(config.password)}</stamp:password></stamp:stamped>`);
  return parseFinkokStampResponse(raw);
}

export type FinkokPendingResult = {
  status?: string;
  uuid?: string;
  uuidStatus?: string;
  nextAttempt?: string;
  attempts?: string;
  error?: string;
  date?: string;
};

function findFirst(root: unknown, key: string): string | undefined {
  if (!root || typeof root !== 'object') return undefined;
  if (Array.isArray(root)) {
    for (const item of root) { const found = findFirst(item, key); if (found !== undefined) return found; }
    return undefined;
  }
  const record = root as Record<string, unknown>;
  const direct = record[key];
  if (typeof direct === 'string' || typeof direct === 'number' || typeof direct === 'boolean') return String(direct).trim();
  for (const value of Object.values(record)) { const found = findFirst(value, key); if (found !== undefined) return found; }
  return undefined;
}

export async function queryPendingWithFinkok(uuid: string, config: FinkokConfig): Promise<FinkokPendingResult> {
  if (!/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(uuid)) throw new Error('FINKOK_UUID_INVALID');
  const raw = await postSoap(config, 'query_pending', `<stamp:query_pending><stamp:username>${esc(config.username)}</stamp:username><stamp:password>${esc(config.password)}</stamp:password><stamp:uuid>${esc(uuid)}</stamp:uuid></stamp:query_pending>`);
  if (/<!DOCTYPE|<!ENTITY/i.test(raw) || Buffer.byteLength(raw, 'utf8') > 2_500_000) throw new Error('FINKOK_SOAP_REJECTED');
  const parsed = parser.parse(raw);
  return {
    status: findFirst(parsed, 'status'),
    uuid: findFirst(parsed, 'uuid') ?? findFirst(parsed, 'UUID'),
    uuidStatus: findFirst(parsed, 'uuid_status'),
    nextAttempt: findFirst(parsed, 'next_attempt'),
    attempts: findFirst(parsed, 'attempts'),
    error: findFirst(parsed, 'error'),
    date: findFirst(parsed, 'date'),
  };
}
