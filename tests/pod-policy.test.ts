import { validatePod } from '../src/domain/pod/policy';
const policy={requirements:['PHOTO','SIGNATURE'] as const,allowException:true,exceptionRequiresSupervisor:true};
console.assert(validatePod(policy,{captured:['PHOTO']}).ok===false);
console.assert(validatePod(policy,{captured:['PHOTO'],exceptionReason:'Cliente no firma',supervisorApproved:true}).ok===true);
