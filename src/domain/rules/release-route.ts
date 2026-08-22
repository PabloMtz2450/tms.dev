export type ReleaseCheck = { code: string; ok: boolean; message: string };

export function validateRouteRelease(input: {
  hasVehicle: boolean;
  hasDriver: boolean;
  vehicleDocumentsValid: boolean;
  driverDocumentsValid: boolean;
  fiscalRequired: boolean;
  fiscalValid: boolean;
  loadValidated: boolean;
}): ReleaseCheck[] {
  return [
    { code:'VEHICLE', ok:input.hasVehicle, message:'Vehículo asignado' },
    { code:'DRIVER', ok:input.hasDriver, message:'Operador asignado' },
    { code:'VEHICLE_DOCS', ok:input.vehicleDocumentsValid, message:'Documentos del vehículo vigentes' },
    { code:'DRIVER_DOCS', ok:input.driverDocumentsValid, message:'Documentos del operador vigentes' },
    { code:'LOAD', ok:input.loadValidated, message:'Carga validada' },
    { code:'FISCAL', ok:!input.fiscalRequired || input.fiscalValid, message:'Requisitos fiscales válidos' },
  ];
}

export const canReleaseRoute = (checks: ReleaseCheck[]) => checks.every(c => c.ok);
