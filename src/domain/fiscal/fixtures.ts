import type { Cfdi40CartaPorteDocument } from './model';

export const validTrasladoCartaPorte31: Cfdi40CartaPorteDocument = {
  cfdiVersion:'4.0', type:'T', series:'T', folio:'1001', issueDate:'2026-08-21T20:00:00', expeditionPostalCode:'06000', currency:'XXX', subtotal:0, total:0, exportCode:'01',
  issuer:{ rfc:'AAA010101AAA', name:'EMPRESA DEMO SA DE CV', fiscalRegime:'601', postalCode:'06000' },
  receiver:{ rfc:'AAA010101AAA', name:'EMPRESA DEMO SA DE CV', fiscalRegime:'601', postalCode:'06000', cfdiUse:'S01' },
  certificateNumber:'00001000000500000000', certificateBase64:'CERTIFICADO_DE_PRUEBA_NO_PRODUCTIVO', seal:'SELLO_DE_PRUEBA_NO_PRODUCTIVO',
  cartaPorte:{
    version:'3.1', idCCP:'CCC12345-1234-1234-1234-123456789ABC', internationalTransport:'No', totalDistanceKm:22,
    locations:[
      { type:'Origen', id:'OR000001', rfc:'AAA010101AAA', dateTime:'2026-08-21T20:15:00', address:{ postalCode:'06000', state:'CMX', country:'MEX', municipality:'015', street:'Origen Demo' } },
      { type:'Destino', id:'DE000001', rfc:'BBB010101BB0', dateTime:'2026-08-21T21:30:00', distanceKm:22, address:{ postalCode:'03100', state:'CMX', country:'MEX', municipality:'014', street:'Destino Demo' } }
    ],
    merchandise:[{ goodsCode:'14111507', description:'Material demo', quantity:10, unitCode:'H87', weightKg:125, hazardous:'No' }],
    roadTransport:{ permitType:'TPAF01', permitNumber:'PERMISO-DEMO', vehicleConfiguration:'C2', plate:'ABC123A', modelYear:2025, grossVehicleWeightKg:3500, civilLiabilityInsurer:'ASEGURADORA DEMO', civilLiabilityPolicy:'POLIZA-DEMO' },
    figures:[{ figureType:'01', rfc:'CCCC010101CC0', name:'OPERADOR DEMO', licenseNumber:'LIC-DEMO-001' }]
  }
};
