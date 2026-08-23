import { db } from '../src/lib/db';
import { setUserPassword } from '../src/lib/auth/password';

const DEMO_PASSWORD = 'XolumDemo2026!';

async function upsertUser(email: string, name: string, organizationId: string, role: any) {
  const user = await db.user.upsert({
    where: { email },
    update: { name },
    create: { email, name },
  });
  await setUserPassword(user.id, DEMO_PASSWORD);
  await db.membership.upsert({
    where: { organizationId_userId: { organizationId, userId: user.id } },
    update: { role },
    create: { organizationId, userId: user.id, role },
  });
  return user;
}

async function main() {
  if (process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production') {
    throw new Error('LOCAL_SEED_BLOCKED_IN_PRODUCTION');
  }

  const organization = await db.organization.upsert({
    where: { slug: 'xolum-demo-logistics' },
    update: { name: 'XOLUM Demo Logistics' },
    create: { name: 'XOLUM Demo Logistics', slug: 'xolum-demo-logistics' },
  });

  const secondOrg = await db.organization.upsert({
    where: { slug: 'norte-demo-transportes' },
    update: { name: 'Norte Demo Transportes' },
    create: { name: 'Norte Demo Transportes', slug: 'norte-demo-transportes' },
  });

  const users = [
    ['admin@demo.xolum.mx', 'Administrador Demo', 'TENANT_ADMIN'],
    ['logistica@demo.xolum.mx', 'Laura Logística', 'LOGISTICS_MANAGER'],
    ['torre@demo.xolum.mx', 'Carlos Torre de Control', 'CONTROL_TOWER'],
    ['planeador@demo.xolum.mx', 'Mariana Planeación', 'PLANNER'],
    ['seguridad@demo.xolum.mx', 'Sergio Seguridad', 'SECURITY_MONITOR'],
    ['finanzas@demo.xolum.mx', 'Fernanda Finanzas', 'FINANCE'],
    ['auditor@demo.xolum.mx', 'Andrea Auditoría', 'AUDITOR'],
    ['operador1@demo.xolum.mx', 'Miguel Hernández', 'DRIVER'],
    ['operador2@demo.xolum.mx', 'Daniel Cruz', 'DRIVER'],
    ['cliente@demo.xolum.mx', 'Cliente Contratante Demo', 'CONTRACTING_CUSTOMER'],
  ] as const;

  for (const [email, name, role] of users) await upsertUser(email, name, organization.id, role);
  await upsertUser('admin@norte-demo.mx', 'Admin Norte Demo', secondOrg.id, 'TENANT_ADMIN');

  const customersData = [
    ['CLI-001', 'Comercializadora Reforma'],
    ['CLI-002', 'Hospital Santa Elena'],
    ['CLI-003', 'Corporativo Insurgentes'],
    ['CLI-004', 'Distribuidora Vallejo'],
    ['CLI-005', 'Centro Logístico Iztapalapa'],
    ['CLI-006', 'Servicios Polanco'],
    ['CLI-007', 'Almacenes Tlalnepantla'],
    ['CLI-008', 'Operadora Santa Fe'],
  ];
  const customers: Record<string, any> = {};
  for (const [code, name] of customersData) {
    customers[code] = await db.customer.upsert({
      where: { organizationId_code: { organizationId: organization.id, code } },
      update: { name },
      create: { organizationId: organization.id, code, name },
    });
  }

  const vehiclesData = [
    ['XLM-101-A', 'Unidad 101 · Van 1.5 t'],
    ['XLM-204-B', 'Unidad 204 · Caja seca 3.5 t'],
    ['XLM-318-C', 'Unidad 318 · Rabón 8 t'],
    ['XLM-422-D', 'Unidad 422 · Van urbana'],
    ['XLM-507-E', 'Unidad 507 · Caja seca 5 t'],
  ];
  const vehicles: any[] = [];
  for (const [plate, label] of vehiclesData) {
    vehicles.push(await db.vehicle.upsert({
      where: { organizationId_plate: { organizationId: organization.id, plate } },
      update: { label },
      create: { organizationId: organization.id, plate, label },
    }));
  }

  const driversData = ['Miguel Hernández', 'Daniel Cruz', 'Roberto Salgado', 'Iván Torres', 'Luis Mendoza'];
  const drivers: any[] = [];
  for (const name of driversData) {
    const existing = await db.driver.findFirst({ where: { organizationId: organization.id, name } });
    drivers.push(existing ?? await db.driver.create({ data: { organizationId: organization.id, name } }));
  }

  const shipmentsData = [
    ['PT-260823-001', 'CLI-001', 'READY'],
    ['PT-260823-002', 'CLI-002', 'PLANNED'],
    ['PT-260823-003', 'CLI-003', 'LOADED'],
    ['PT-260823-004', 'CLI-004', 'IN_TRANSIT'],
    ['PT-260823-005', 'CLI-005', 'IN_TRANSIT'],
    ['PT-260823-006', 'CLI-006', 'DELIVERED'],
    ['PT-260823-007', 'CLI-007', 'PARTIAL'],
    ['PT-260823-008', 'CLI-008', 'READY'],
    ['PT-260823-009', 'CLI-001', 'PLANNED'],
    ['PT-260823-010', 'CLI-004', 'READY'],
    ['PT-260823-011', 'CLI-005', 'REJECTED'],
    ['PT-260823-012', 'CLI-003', 'IN_TRANSIT'],
  ] as const;
  const shipments: Record<string, any> = {};
  for (const [reference, customerCode, status] of shipmentsData) {
    shipments[reference] = await db.shipment.upsert({
      where: { organizationId_reference: { organizationId: organization.id, reference } },
      update: { customerId: customers[customerCode].id, status },
      create: { organizationId: organization.id, customerId: customers[customerCode].id, reference, status },
    });
  }

  const routesData = [
    ['R-CDMX-081', 'IN_PROGRESS', 0, 0],
    ['R-CDMX-082', 'RELEASED', 1, 1],
    ['R-NORTE-019', 'PLANNED', 2, 2],
    ['R-PONIENTE-044', 'IN_PROGRESS', 3, 3],
    ['R-ORIENTE-071', 'COMPLETED', 4, 4],
  ] as const;
  const routes: Record<string, any> = {};
  for (const [code, status, vehicleIndex, driverIndex] of routesData) {
    routes[code] = await db.route.upsert({
      where: { organizationId_code: { organizationId: organization.id, code } },
      update: { status, vehicleId: vehicles[vehicleIndex].id, driverId: drivers[driverIndex].id },
      create: { organizationId: organization.id, code, status, vehicleId: vehicles[vehicleIndex].id, driverId: drivers[driverIndex].id },
    });
  }

  const stopsData = [
    ['R-CDMX-081', 'PT-260823-004', 1, 'Av. Paseo de la Reforma 250, Cuauhtémoc, CDMX'],
    ['R-CDMX-081', 'PT-260823-005', 2, 'Av. Ejército Nacional 843, Miguel Hidalgo, CDMX'],
    ['R-CDMX-081', 'PT-260823-012', 3, 'Av. Insurgentes Sur 1602, Benito Juárez, CDMX'],
    ['R-CDMX-082', 'PT-260823-001', 1, 'Calz. de Tlalpan 1500, Benito Juárez, CDMX'],
    ['R-CDMX-082', 'PT-260823-002', 2, 'Av. Universidad 1000, Coyoacán, CDMX'],
    ['R-NORTE-019', 'PT-260823-009', 1, 'Vallejo 1000, Azcapotzalco, CDMX'],
    ['R-NORTE-019', 'PT-260823-010', 2, 'Gustavo Baz 300, Tlalnepantla, Estado de México'],
    ['R-PONIENTE-044', 'PT-260823-008', 1, 'Vasco de Quiroga 3800, Santa Fe, CDMX'],
    ['R-ORIENTE-071', 'PT-260823-006', 1, 'Eje 6 Sur 560, Iztapalapa, CDMX'],
  ] as const;

  for (const [routeCode, shipmentRef, sequence, address] of stopsData) {
    const route = routes[routeCode];
    const shipment = shipments[shipmentRef];
    const existing = await db.stop.findFirst({ where: { organizationId: organization.id, routeId: route.id, shipmentId: shipment.id } });
    if (existing) {
      await db.stop.update({ where: { id: existing.id }, data: { sequence, address } });
    } else {
      await db.stop.create({ data: { organizationId: organization.id, routeId: route.id, shipmentId: shipment.id, sequence, address } });
    }
  }

  console.log('\n=== TMS XOLUM LOCAL DEMO READY ===');
  console.log(`Organization ID: ${organization.id}`);
  console.log(`Organization: ${organization.name}`);
  console.log(`Password for all demo users: ${DEMO_PASSWORD}`);
  console.log('Users:');
  for (const [email, , role] of users) console.log(`  ${email.padEnd(32)} ${role}`);
  console.log('\nDemo data: 8 customers · 5 vehicles · 5 drivers · 12 shipments · 5 routes · 9 stops');
  console.log('Open: http://localhost:3000');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await db.$disconnect();
});
