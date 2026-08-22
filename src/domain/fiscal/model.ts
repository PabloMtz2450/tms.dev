export type CfdiType = 'I' | 'T';
export type YesNo = 'Sí' | 'No';

export type FiscalParty = {
  rfc: string;
  name: string;
  fiscalRegime: string;
  postalCode: string;
};

export type FiscalLocation = {
  type: 'Origen' | 'Destino';
  id: string;
  rfc?: string;
  dateTime: string;
  distanceKm?: number;
  address: {
    postalCode: string;
    state: string;
    country: string;
    municipality?: string;
    locality?: string;
    street?: string;
  };
};

export type Merchandise = {
  goodsCode: string;
  description: string;
  quantity: number;
  unitCode: string;
  weightKg: number;
  dimensions?: string;
  hazardous?: YesNo;
  hazardousMaterialCode?: string;
  packagingCode?: string;
  tariffFraction?: string;
  uuidForeignTrade?: string;
};

export type RoadTransport = {
  permitType: string;
  permitNumber: string;
  vehicleConfiguration: string;
  plate: string;
  modelYear: number;
  civilLiabilityInsurer: string;
  civilLiabilityPolicy: string;
  environmentalInsurer?: string;
  environmentalPolicy?: string;
  cargoInsurer?: string;
  cargoPolicy?: string;
  trailers?: Array<{ subtype: string; plate: string }>;
};

export type TransportFigure = {
  figureType: '01' | '02' | '03' | '04' | string;
  rfc?: string;
  foreignTaxId?: string;
  name?: string;
  licenseNumber?: string;
};

export type CartaPorte31 = {
  version: '3.1';
  idCCP: string;
  internationalTransport: YesNo;
  entryExit?: 'Entrada' | 'Salida';
  countryOriginDestination?: string;
  transportVia?: string;
  totalDistanceKm: number;
  locations: FiscalLocation[];
  merchandise: Merchandise[];
  roadTransport: RoadTransport;
  figures: TransportFigure[];
};

export type Cfdi40CartaPorteDocument = {
  cfdiVersion: '4.0';
  type: CfdiType;
  series?: string;
  folio?: string;
  issueDate: string;
  expeditionPostalCode: string;
  currency: string;
  subtotal: number;
  total: number;
  exportCode: string;
  issuer: FiscalParty;
  receiver: FiscalParty & { cfdiUse: string };
  certificateNumber?: string;
  certificateBase64?: string;
  seal?: string;
  cartaPorte: CartaPorte31;
};

export type FiscalIssue = {
  code: string;
  severity: 'ERROR' | 'WARNING';
  field: string;
  message: string;
  source: 'CFDI40' | 'CARTAPORTE31' | 'XOLUM';
};

export type FiscalValidationResult = {
  valid: boolean;
  readyForSigning: boolean;
  readyForPac: boolean;
  issues: FiscalIssue[];
  standards: { cfdi: '4.0'; cartaPorte: '3.1' };
};
