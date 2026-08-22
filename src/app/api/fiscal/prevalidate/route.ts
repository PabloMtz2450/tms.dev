import { NextResponse } from 'next/server';
import type { Cfdi40CartaPorteDocument } from '@/domain/fiscal/model';
import { validateFiscalDocument } from '@/domain/fiscal/validate';
import { generateCfdi40CartaPorte31Xml } from '@/domain/fiscal/xml';

export async function POST(request: Request) {
  try {
    const document = await request.json() as Cfdi40CartaPorteDocument;
    const validation = validateFiscalDocument(document);
    if (!validation.valid) return NextResponse.json({ ok:false, validation }, { status:422 });
    const xml = generateCfdi40CartaPorte31Xml(document);
    return NextResponse.json({ ok:true, validation, xml, note:'XML prevalidado por reglas XOLUM. Antes de PAC debe firmarse con CSD y validarse contra XSD SAT.' });
  } catch (error) {
    return NextResponse.json({ ok:false, error:error instanceof Error?error.message:'Error fiscal no identificado' }, { status:400 });
  }
}
