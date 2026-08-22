import { canReleaseRoute, validateRouteRelease } from '../src/domain/rules/release-route';
const ok={hasVehicle:true,hasDriver:true,vehicleDocumentsValid:true,driverDocumentsValid:true,fiscalRequired:true,fiscalValid:true,loadValidated:true};
console.assert(canReleaseRoute(validateRouteRelease(ok))===true);
console.assert(canReleaseRoute(validateRouteRelease({...ok,fiscalValid:false}))===false);
