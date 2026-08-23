import { XMLParser } from 'fast-xml-parser';
import type { FinkokConfig } from './finkok';

const ENDPOINT = {
  demo: 'https://demo-facturacion.finkok.com/servicios/soap/cancel',
  production: 'https://facturacion.finkok.com/servicios/soap/cancel',
} as const;

const parser = new XMLParser({ ignoreAttributes:false, removeNSPrefix:true, processEntities:false, parseTagValue:false, trimValues:true });

function esc(value: string): string {
  return value.replace(/[<>&"']/g, (char) => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;' }[char] as string));
}

function assertUuid(uuid: string): void {
  if (!/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(uuid)) throw new Error('FINKOK_UUID_INVALID');
}

function assertSafeSoap(xml: string): void {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('FINKOK_SOAP_DTD_FORBIDDEN');
  if (Buffer.byteLength(xml, 'utf8') > 2_500_000) throw new Error('FINKOK_SOAP_TOO_LARGE');
}

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

async function post(config: FinkokConfig, action: string, body: string): Promise<unknown> {
  if (!config.username || !config.password) throw new Error('FINKOK_CREDENTIALS_MISSING');
  const envelope = `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:can="http://facturacion.finkok.com/cancel"><soapenv:Header/><soapenv:Body>${body}</soapenv:Body></soapenv:Envelope>`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 30_000);
  try {
    const response = await fetch(ENDPOINT[config.environment], {
      method:'POST',
      headers:{ 'Content-Type':'text/xml; charset=utf-8', SOAPAction:`"${action}"` },
      body: envelope,
      signal: controller.signal,
      cache:'no-store',
      redirect:'error',
    });
    const raw = await response.text();
    if (!response.ok && !raw) throw new Error(`FINKOK_HTTP_${response.status}`);
    assertSafeSoap(raw);
    return parser.parse(raw);
  } finally {
    clearTimeout(timer);
  }
}

export type CancelReason = '01'|'02'|'03'|'04';
export type FinkokCancelResult = { uuid?:string; uuidStatus?:string; cancellationStatus?:string; error?:string };

export async function cancelWithFinkok(input: {
  config: FinkokConfig;
  uuid: string;
  reason: CancelReason;
  replacementUuid?: string;
  taxpayerId: string;
  certificatePemBase64: string;
  encryptedPrivateKeyPemBase64: string;
  storePending?: boolean;
}): Promise<FinkokCancelResult> {
  assertUuid(input.uuid);
  if (input.reason === '01') {
    if (!input.replacementUuid) throw new Error('FINKOK_REPLACEMENT_UUID_REQUIRED');
    assertUuid(input.replacementUuid);
  }
  if (input.reason !== '01' && input.replacementUuid) throw new Error('FINKOK_REPLACEMENT_UUID_NOT_ALLOWED');
  if (!/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/i.test(input.taxpayerId)) throw new Error('FINKOK_TAXPAYER_INVALID');
  if (!input.certificatePemBase64 || !input.encryptedPrivateKeyPemBase64) throw new Error('FINKOK_CANCEL_CSD_REQUIRED');

  const uuidNode = `<can:UUID UUID="${esc(input.uuid)}" Motivo="${input.reason}" FolioSustitucion="${esc(input.replacementUuid ?? '')}"/>`;
  const parsed = await post(input.config, 'cancel', `<can:cancel><can:UUIDS>${uuidNode}</can:UUIDS><can:username>${esc(input.config.username)}</can:username><can:password>${esc(input.config.password)}</can:password><can:taxpayer_id>${esc(input.taxpayerId)}</can:taxpayer_id><can:cer>${esc(input.certificatePemBase64)}</can:cer><can:key>${esc(input.encryptedPrivateKeyPemBase64)}</can:key><can:store_pending>${input.storePending === true ? 'true' : 'false'}</can:store_pending></can:cancel>`);
  return {
    uuid: findFirst(parsed, 'UUID'),
    uuidStatus: findFirst(parsed, 'EstatusUUID'),
    cancellationStatus: findFirst(parsed, 'EstatusCancelacion'),
    error: findFirst(parsed, 'CodEstatus') ?? findFirst(parsed, 'faultstring'),
  };
}

export type FinkokSatStatus = {
  code?:string;
  cancellationStatus?:string;
  cfdiStatus?:string;
  cancelable?:string;
  error?:string;
};

export async function getSatStatusWithFinkok(input: {
  config:FinkokConfig;
  taxpayerId:string;
  receiverTaxpayerId:string;
  uuid:string;
  total:string;
}): Promise<FinkokSatStatus> {
  assertUuid(input.uuid);
  if (!/^\d+(?:\.\d{1,6})?$/.test(input.total)) throw new Error('FINKOK_TOTAL_INVALID');
  const parsed = await post(input.config, 'get_sat_status', `<can:get_sat_status><can:username>${esc(input.config.username)}</can:username><can:password>${esc(input.config.password)}</can:password><can:taxpayer_id>${esc(input.taxpayerId)}</can:taxpayer_id><can:rtaxpayer_id>${esc(input.receiverTaxpayerId)}</can:rtaxpayer_id><can:uuid>${esc(input.uuid)}</can:uuid><can:total>${esc(input.total)}</can:total></can:get_sat_status>`);
  return {
    code: findFirst(parsed, 'CodigoEstatus') ?? findFirst(parsed, 'code'),
    cancellationStatus: findFirst(parsed, 'EstatusCancelacion'),
    cfdiStatus: findFirst(parsed, 'Estado'),
    cancelable: findFirst(parsed, 'EsCancelable'),
    error: findFirst(parsed, 'error') ?? findFirst(parsed, 'faultstring'),
  };
}

export async function getCancellationReceiptWithFinkok(input:{ config:FinkokConfig; taxpayerId:string; uuid:string; type?:'R'|'C' }) {
  assertUuid(input.uuid);
  const parsed = await post(input.config, 'get_receipt', `<can:get_receipt><can:username>${esc(input.config.username)}</can:username><can:password>${esc(input.config.password)}</can:password><can:taxpayer_id>${esc(input.taxpayerId)}</can:taxpayer_id><can:uuid>${esc(input.uuid)}</can:uuid><can:type>${input.type ?? 'C'}</can:type></can:get_receipt>`);
  return {
    uuid: findFirst(parsed, 'uuid') ?? findFirst(parsed, 'UUID'),
    success: findFirst(parsed, 'success') === 'true',
    receipt: findFirst(parsed, 'receipt'),
    taxpayerId: findFirst(parsed, 'taxpayer_id'),
    error: findFirst(parsed, 'error'),
    date: findFirst(parsed, 'date'),
  };
}
