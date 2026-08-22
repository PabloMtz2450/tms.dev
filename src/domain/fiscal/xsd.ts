export const SAT_XSD = {
  cfdi40: 'https://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd',
  cartaPorte31: 'https://www.sat.gob.mx/sitio_internet/cfd/CartaPorte/CartaPorte31.xsd',
} as const;

export type XsdValidationMessage = { line?: number; column?: number; message: string };
export type XsdValidationResult = { valid: boolean; messages: XsdValidationMessage[] };

/**
 * Contrato desacoplado para validar el XML contra los XSD oficiales.
 * Producción debe inyectar una implementación libxml/Xerces o servicio equivalente.
 * Nunca se considera "listo para PAC" un XML que no haya pasado esta compuerta.
 */
export interface SatXsdValidator {
  validate(xml: string, schemas?: typeof SAT_XSD): Promise<XsdValidationResult>;
}
