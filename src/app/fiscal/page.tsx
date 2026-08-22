import { AppShell } from '@/components/app-shell';
import { StatusPill } from '@/components/status-pill';
import { runFiscalSelfTest } from '@/domain/fiscal/selftest';

export default function Fiscal(){
 const test=runFiscalSelfTest();
 return <AppShell title="Fiscal MX" subtitle="CFDI 4.0 + Carta Porte 3.1: primero validamos, después timbramos.">
  <section className="fiscal-banner"><div><span className="section-kicker">COMPUERTA FISCAL</span><h2>Un documento con error no llega al PAC.</h2><p>Traslado e Ingreso se prevalidan contra reglas estructurales y condicionales. Firma CSD, XSD SAT y PAC son etapas separadas y auditables.</p></div><div className="fiscal-score"><strong>{test.ok?'OK':'!'}</strong><span>motor fiscal en build</span></div></section>
  <section className="metric-strip"><article><strong>4.0</strong><span>CFDI implementado</span></article><article><strong>3.1</strong><span>Carta Porte vigente</span></article><article><strong>{test.negativeControls}</strong><span>controles negativos CI</span></article><article><strong>{test.xmlBytes}</strong><span>bytes XML fixture</span></article></section>
  <section className="panel"><div className="panel-head"><div><span className="section-kicker">PIPELINE DE TIMBRADO</span><h2>Estado de las compuertas</h2></div></div>
   <div className="doc-row"><strong>01</strong><span>Matriz CFDI/Carta Porte XOLUM</span><code>reglas de campo + cruces</code><StatusPill tone="good">ACTIVA</StatusPill><span/></div>
   <div className="doc-row"><strong>02</strong><span>Generador XML CFDI 4.0 + CP 3.1</span><code>Ingreso / Traslado</code><StatusPill tone="good">ACTIVO</StatusPill><span/></div>
   <div className="doc-row"><strong>03</strong><span>Firma con CSD</span><code>adaptador desacoplado</code><StatusPill tone="info">CONECTAR CSD</StatusPill><span/></div>
   <div className="doc-row"><strong>04</strong><span>Validación XSD SAT</span><code>cfdv40 + CartaPorte31</code><StatusPill tone="info">CONECTAR VALIDADOR</StatusPill><span/></div>
   <div className="doc-row"><strong>05</strong><span>Timbrado PAC</span><code>adaptador desacoplado</code><StatusPill tone="info">CONECTAR PAC</StatusPill><span/></div>
  </section>
  <section className="panel"><div className="panel-head"><div><span className="section-kicker">REGLA DE SALIDA</span><h2>Listo para timbrar significa todas las compuertas en verde.</h2></div></div><p>La interfaz no muestra un documento como listo si existen errores críticos. Los detalles técnicos quedan disponibles para soporte sin convertirlos en problema del operador.</p></section>
 </AppShell>
}
