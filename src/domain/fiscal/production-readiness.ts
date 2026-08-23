export type ProductionReadinessIssue = {
  code: string;
  message: string;
};

export function fiscalProductionReadiness(env: NodeJS.ProcessEnv = process.env): ProductionReadinessIssue[] {
  const issues: ProductionReadinessIssue[] = [];
  if (env.FINKOK_ENV !== 'production') issues.push({ code: 'PAC_NOT_PRODUCTION', message: 'Finkok no está configurado en producción.' });
  if (!env.FINKOK_USERNAME || !env.FINKOK_PASSWORD) issues.push({ code: 'PAC_CREDENTIALS_MISSING', message: 'Faltan credenciales Finkok.' });
  if (!env.CSD_SECRET_PROVIDER) issues.push({ code: 'CSD_SECRET_PROVIDER_MISSING', message: 'No hay proveedor seguro de secretos CSD.' });
  if (!env.CSD_KMS_KEY_ID) issues.push({ code: 'CSD_KMS_KEY_MISSING', message: 'No hay clave KMS configurada para CSD.' });
  if (!env.FISCAL_STORAGE_PROVIDER || !env.FISCAL_STORAGE_BUCKET) issues.push({ code: 'FISCAL_STORAGE_MISSING', message: 'No hay almacenamiento fiscal privado configurado.' });
  if (!env.APP_URL?.startsWith('https://')) issues.push({ code: 'APP_HTTPS_REQUIRED', message: 'Producción requiere APP_URL HTTPS.' });
  if (env.TRUST_PROXY_HEADERS === 'true' && !env.APP_URL) issues.push({ code: 'TRUST_PROXY_CONFIG_INVALID', message: 'Proxy confiable requiere APP_URL explícito.' });
  return issues;
}

export function assertFiscalProductionReady(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;
  const issues = fiscalProductionReadiness(env);
  if (issues.length) throw new Error(`FISCAL_PRODUCTION_NOT_READY:${issues.map((i) => i.code).join(',')}`);
}
