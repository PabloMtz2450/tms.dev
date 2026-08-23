import { runFiscalSelfTest } from '../src/domain/fiscal/selftest';
import { fiscalFingerprint } from '../src/domain/fiscal/orchestrator';
import { validTrasladoCartaPorte31 } from '../src/domain/fiscal/fixtures';
import { fiscalDocumentHttpSchema } from '../src/domain/fiscal/http-schema';

const fiscal = runFiscalSelfTest();
const fingerprintA = fiscalFingerprint(validTrasladoCartaPorte31);
const fingerprintB = fiscalFingerprint(JSON.parse(JSON.stringify(validTrasladoCartaPorte31)));
if (fingerprintA !== fingerprintB) throw new Error('Fingerprint fiscal no determinístico.');
if (!/^[a-f0-9]{64}$/.test(fingerprintA)) throw new Error('Fingerprint fiscal inválido.');

const parsed = fiscalDocumentHttpSchema.safeParse({ organizationId: 'org_test', document: validTrasladoCartaPorte31 });
if (!parsed.success) throw new Error(`Esquema HTTP rechazó fixture fiscal válida: ${parsed.error.message}`);

const unexpected = fiscalDocumentHttpSchema.safeParse({ organizationId: 'org_test', document: { ...validTrasladoCartaPorte31, injected: true } });
if (unexpected.success) throw new Error('Esquema HTTP permitió propiedades inesperadas.');

console.log(JSON.stringify({ ok: true, fiscal, fingerprint: fingerprintA, negativeHttpControl: true }));
