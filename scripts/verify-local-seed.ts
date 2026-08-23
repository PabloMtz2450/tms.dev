import { db } from '../src/lib/db';

async function main() {
  const org = await db.organization.findUnique({ where: { slug: 'xolum-demo-logistics' } });
  if (!org) throw new Error('DEMO_ORGANIZATION_MISSING');

  const [memberships, customers, vehicles, drivers, shipments, routes, stops] = await Promise.all([
    db.membership.count({ where: { organizationId: org.id } }),
    db.customer.count({ where: { organizationId: org.id } }),
    db.vehicle.count({ where: { organizationId: org.id } }),
    db.driver.count({ where: { organizationId: org.id } }),
    db.shipment.count({ where: { organizationId: org.id } }),
    db.route.count({ where: { organizationId: org.id } }),
    db.stop.count({ where: { organizationId: org.id } }),
  ]);

  const expected = { memberships: 10, customers: 8, vehicles: 5, drivers: 5, shipments: 12, routes: 5, stops: 9 };
  const actual = { memberships, customers, vehicles, drivers, shipments, routes, stops };
  for (const [key, minimum] of Object.entries(expected)) {
    if ((actual as Record<string, number>)[key] < minimum) throw new Error(`DEMO_SEED_INCOMPLETE:${key}`);
  }

  const secondOrg = await db.organization.findUnique({ where: { slug: 'norte-demo-transportes' } });
  if (!secondOrg) throw new Error('SECOND_TENANT_MISSING');

  console.log('LOCAL_DEMO_SEED_OK', actual);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => db.$disconnect());
