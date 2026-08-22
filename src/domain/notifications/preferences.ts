export type NotificationChannel='EMAIL'|'SMS'|'WHATSAPP'|'PUSH'|'WEBHOOK';
export type NotificationTrigger='ROUTE_RELEASED'|'ETA_CHANGED'|'DRIVER_ARRIVING'|'DELIVERED'|'INCIDENT'|'RESCHEDULED';
export interface NotificationPreference{trigger:NotificationTrigger;channels:NotificationChannel[];enabled:boolean;}
