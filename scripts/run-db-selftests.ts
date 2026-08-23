import { PrismaClient } from '@prisma/client';
import { acquireFiscalOperation, markFiscalFailed, markFiscalStamped } from '../src/domain/fiscal/state';
import { setUserPassword, verifyUserPassword } from '../src/lib/auth/password';

const db = new PrismaClient();
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function main() {
  const orgA = await db.organization.create({ data: { name: `Test A ${suffix}`, slug: `test-a-${suffix}` } });
  const orgB = await db.organization.create({ data: { name: `Test B ${suffix}`, slug: `test-b-${suffix}` } });
  const customerA = await db.customer.create({ data: { organizationId: orgA.id, code: `CA-${suffix}`, name: 'Customer A' } });

  let crossTenantBlocked = false;
  try {
    await db.shipment.create({
      data: { organizationId: orgB.id, customerId: customerA.id, reference: `X-${suffix}` },
    });
  } catch {
    crossTenantBlocked = true;
  }
  if (!crossTenantBlocked) throw new Error('Tenant FK permitió Shipment→Customer cruzado.');

  const user = await db.user.create({ data: { email: `test-${suffix}@example.invalid`, name: 'Test User' } });
  await db.membership.create({ data: { organizationId: orgA.id, userId: user.id, role: 'TENANT_ADMIN' } });
  await setUserPassword(user.id, 'Valid-Password-123!');
  if (!(await verifyUserPassword(user.email, 'Valid-Password-123!'))) throw new Error('Password válido no autenticó.');
  if (await verifyUserPassword(user.email, 'Wrong-Password-123!')) throw new Error('Password inválido autenticó.');

  const idem = `idem-${suffix}`;
  const fingerprint = `fp-${suffix}`;
  const concurrent = await Promise.allSettled([
    acquireFiscalOperation({ organizationId: orgA.id, idempotencyKey: idem, documentType: 'TEST', sourceFingerprint: fingerprint }),
    acquireFiscalOperation({ organizationId: orgA.id, idempotencyKey: idem, documentType: 'TEST', sourceFingerprint: fingerprint }),
  ]);
  const docs = await db.fiscalDocument.findMany({ where: { organizationId: orgA.id, idempotencyKey: idem } });
  if (docs.length !== 1) throw new Error(`Idempotencia falló: ${docs.length} registros.`);
  if (!concurrent.some((r) => r.status === 'fulfilled')) throw new Error('Ninguna operación idempotente logró adquirir documento.');

  const doc = docs[0];
  await markFiscalStamped({
    id: doc.id,
    organizationId: orgA.id,
    uuid: '123E4567-E89B-42D3-A456-426614174000',
    stampedXmlHash: 'a'.repeat(64),
    stampedAt: new Date(),
  });
  let illegalTransitionBlocked = false;
  try {
    await markFiscalFailed({ id: doc.id, organizationId: orgA.id, errorCode: 'TEST', safeMessage: 'should fail' });
  } catch {
    illegalTransitionBlocked = true;
  }
  if (!illegalTransitionBlocked) throw new Error('Estado STAMPED permitió transición a FAILED.');
  const final = await db.fiscalDocument.findUniqueOrThrow({ where: { id: doc.id } });
  if (final.status !== 'STAMPED') throw new Error(`Estado terminal alterado: ${final.status}`);

  console.log(JSON.stringify({ ok: true, crossTenantBlocked, idempotentRows: docs.length, illegalTransitionBlocked, passwordVerified: true }));
}

main()
  .finally(async () => { await db.$disconnect(); })
  .catch((error) => { console.error(error); process.exitCode = 1; });
