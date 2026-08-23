import { z } from 'zod';

const rfc = z.string().trim().min(12).max(13).regex(/^([A-Z&Ñ]{3,4})\d{6}[A-Z0-9]{3}$/i);
const cp = z.string().regex(/^\d{5}$/);
const shortText = z.string().trim().min(1).max(250);
const positive = z.number().finite().positive();

const party = z.object({
  rfc,
  name: z.string().trim().min(1).max(254),
  fiscalRegime: z.string().trim().min(3).max(3),
  postalCode: cp,
}).strict();

const address = z.object({
  postalCode: cp,
  state: z.string().trim().min(1).max(30),
  country: z.string().trim().min(3).max(3),
  municipality: z.string().trim().max(30).optional(),
  locality: z.string().trim().max(30).optional(),
  street: z.string().trim().max(150).optional(),
}).strict();

const location = z.object({
  type: z.enum(['Origen','Destino']),
  id: z.string().regex(/^(OR|DE)\d{6}$/),
  rfc: rfc.optional(),
  dateTime: z.string().datetime({ local: true }),
  distanceKm: z.number().finite().nonnegative().optional(),
  address,
}).strict();

const merchandise = z.object({
  goodsCode: z.string().regex(/^\d{8}$/),
  description: shortText,
  quantity: positive,
  unitCode: z.string().trim().min(2).max(3),
  weightKg: positive,
  dimensions: z.string().trim().max(50).optional(),
  hazardous: z.enum(['Sí','No']).optional(),
  hazardousMaterialCode: z.string().trim().max(20).optional(),
  packagingCode: z.string().trim().max(20).optional(),
  tariffFraction: z.string().trim().max(20).optional(),
  uuidForeignTrade: z.string().uuid().optional(),
}).strict();

const roadTransport = z.object({
  permitType: shortText,
  permitNumber: shortText,
  vehicleConfiguration: z.string().trim().min(1).max(20),
  plate: z.string().trim().min(5).max(12),
  modelYear: z.number().int().min(1900).max(new Date().getUTCFullYear() + 1),
  grossVehicleWeightKg: positive,
  civilLiabilityInsurer: shortText,
  civilLiabilityPolicy: shortText,
  environmentalInsurer: shortText.optional(),
  environmentalPolicy: shortText.optional(),
  cargoInsurer: shortText.optional(),
  cargoPolicy: shortText.optional(),
  trailers: z.array(z.object({ subtype: shortText, plate: z.string().trim().min(5).max(12) }).strict()).max(2).optional(),
}).strict();

const figure = z.object({
  figureType: z.string().trim().min(2).max(3),
  rfc: rfc.optional(),
  foreignTaxId: z.string().trim().max(40).optional(),
  name: z.string().trim().max(254).optional(),
  licenseNumber: z.string().trim().max(50).optional(),
}).strict();

const transportService = z.object({
  productServiceCode: z.string().regex(/^\d{8}$/),
  quantity: positive,
  unitCode: z.string().trim().min(2).max(3),
  description: shortText,
  unitValue: z.number().finite().nonnegative(),
  amount: z.number().finite().nonnegative(),
}).strict();

export const fiscalDocumentHttpSchema = z.object({
  organizationId: z.string().min(1).max(64),
  document: z.object({
    cfdiVersion: z.literal('4.0'),
    type: z.enum(['I','T']),
    series: z.string().trim().max(25).optional(),
    folio: z.string().trim().max(40).optional(),
    issueDate: z.string().datetime({ local: true }),
    expeditionPostalCode: cp,
    currency: z.string().trim().min(3).max(3),
    subtotal: z.number().finite().nonnegative(),
    total: z.number().finite().nonnegative(),
    exportCode: z.string().trim().min(2).max(2),
    issuer: party,
    receiver: party.extend({ cfdiUse: z.string().trim().min(3).max(3) }).strict(),
    certificateNumber: z.string().trim().max(30).optional(),
    certificateBase64: z.string().max(50000).optional(),
    seal: z.string().max(10000).optional(),
    transportService: transportService.optional(),
    cartaPorte: z.object({
      version: z.literal('3.1'),
      idCCP: z.string().trim().min(36).max(40),
      internationalTransport: z.enum(['Sí','No']),
      entryExit: z.enum(['Entrada','Salida']).optional(),
      countryOriginDestination: z.string().trim().max(3).optional(),
      transportVia: z.string().trim().max(10).optional(),
      totalDistanceKm: positive,
      locations: z.array(location).min(2).max(200),
      merchandise: z.array(merchandise).min(1).max(5000),
      roadTransport,
      figures: z.array(figure).min(1).max(20),
    }).strict(),
  }).strict(),
}).strict();
