export function assertTenantAccess(sessionOrganizationId:string, resourceOrganizationId:string): void {
  if (!sessionOrganizationId || sessionOrganizationId !== resourceOrganizationId) throw new Error('TENANT_ACCESS_DENIED');
}
