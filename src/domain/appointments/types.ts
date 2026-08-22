export type AppointmentStatus='REQUESTED'|'CONFIRMED'|'CHECKED_IN'|'DOCKED'|'COMPLETED'|'NO_SHOW'|'CANCELLED';
export interface DeliveryAppointment{id:string;shipmentId:string;facilityId:string;windowStart:string;windowEnd:string;dock?:string;status:AppointmentStatus;confirmationReference?:string;}
