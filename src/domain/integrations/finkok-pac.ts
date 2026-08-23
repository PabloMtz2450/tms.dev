import type { PacAdapter, PacStampResult } from '@/domain/fiscal/pac';
import { finkokConfigFromEnv, stampWithFinkok, type FinkokConfig, type FinkokIncidence } from './finkok';

export class FinkokStampError extends Error {
  constructor(
    message: string,
    public readonly incidences: FinkokIncidence[],
    public readonly codEstatus?: string,
  ) {
    super(message);
    this.name = 'FinkokStampError';
  }
}

export class FinkokPacAdapter implements PacAdapter {
  constructor(private readonly config: FinkokConfig = finkokConfigFromEnv()) {}

  async stamp(signedXml: string): Promise<PacStampResult> {
    const result = await stampWithFinkok(signedXml, this.config);
    if (!result.ok || !result.uuid || !result.stampedXml || !result.stampedAt) {
      const first = result.incidences[0];
      const detail = [first?.code, first?.message, first?.extraInfo].filter(Boolean).join(' · ');
      throw new FinkokStampError(
        detail ? `Finkok rechazó el CFDI: ${detail}` : `Finkok no confirmó el timbrado. CodEstatus: ${result.codEstatus ?? 'sin estatus'}`,
        result.incidences,
        result.codEstatus,
      );
    }

    return {
      uuid: result.uuid,
      stampedXml: result.stampedXml,
      stampedAt: result.stampedAt,
    };
  }
}
