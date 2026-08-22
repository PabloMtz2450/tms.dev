import { AppShell } from '@/components/app-shell';
import { StatusPill } from '@/components/status-pill';

const escalation = [
  ['T+0','Seguridad + Torre de Control','Reciben SOS y ubicación precisa del incidente'],
  ['T+2 min','Supervisor','Sólo si nadie ha confirmado atención'],
  ['T+5 min','Responsable logístico','Escalamiento automático por falta de ACK'],
];

export default function Security(){
  return <AppShell title="SafeRoute" subtitle="Seguridad operacional con la mínima exposición de datos necesaria.">
    <section className="security-hero">
      <div><span className="section-kicker">1 ALERTA ACTIVA</span><h2>La seguridad necesita reacción, no ruido.</h2><p>Las emergencias se enrutan a quien puede actuar. El resto de usuarios no recibe información sensible innecesaria.</p></div>
      <div className="sos-badge"><strong>SOS</strong><span>ACK obligatorio</span></div>
    </section>
    <section className="two-grid">
      <article className="panel">
        <div className="panel-head"><div><span className="section-kicker">INCIDENTE CRÍTICO</span><h2>Unidad RB-031</h2></div><StatusPill tone="bad">SIN ATENDER</StatusPill></div>
        <div className="security-facts">
          <div><span>Operador</span><strong>A. Vega</strong></div><div><span>Último GPS</span><strong>Hace 18 s</strong></div>
          <div><span>Ruta</span><strong>MX-0250</strong></div><div><span>Tipo</span><strong>SOS silencioso</strong></div>
        </div>
        <button className="danger-action">Atender incidente</button>
        <p className="privacy-note">Al atender se habilita acceso temporal a los datos sensibles necesarios y queda auditado. No se muestra valor ni detalle de mercancía salvo política explícita.</p>
      </article>
      <article className="panel">
        <div className="panel-head"><div><span className="section-kicker">ESCALAMIENTO</span><h2>Si nadie responde, escala solo</h2></div></div>
        <div className="escalation-list">{escalation.map(([time,who,what])=><div className="escalation-row" key={time}><b>{time}</b><div><strong>{who}</strong><span>{what}</span></div></div>)}</div>
      </article>
    </section>
    <section className="metric-strip">
      <article><strong>3 s</strong><span>Pulsación sostenida para SOS</span></article>
      <article><strong>24/7</strong><span>Monitoreo configurable</span></article>
      <article><strong>0</strong><span>Destinatarios con GPS exacto</span></article>
      <article><strong>100%</strong><span>Accesos de emergencia auditados</span></article>
    </section>
    <section className="panel">
      <div className="panel-head"><div><span className="section-kicker">PRIVACIDAD POR DISEÑO</span><h2>Cada quien ve sólo lo necesario</h2></div></div>
      <div className="access-grid">
        <div><strong>Operador</strong><span>Su unidad, su ruta activa y la siguiente información necesaria. Nunca otras rutas o vehículos.</span></div>
        <div><strong>Torre de Control</strong><span>Operaciones activas, GPS preciso, tráfico, ETA, desvíos e incidencias autorizadas.</span></div>
        <div><strong>Seguridad</strong><span>GPS preciso e incidentes. Sin precios, facturación ni información comercial ajena.</span></div>
        <div><strong>Destinatario</strong><span>Estado, ETA y proximidad. Nunca ubicación exacta, ruta completa, placas o paradas de terceros.</span></div>
      </div>
    </section>
  </AppShell>
}
