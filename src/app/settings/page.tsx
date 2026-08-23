import {AppShell} from '@/components/app-shell'; import Link from 'next/link';
export default function Page(){return <AppShell title="Puesta en marcha" subtitle="Cuéntanos cómo trabajas. TMS XOLUM traduce lo demás a reglas seguras.">
<section className="panel onboarding"><span className="section-kicker">CONFIGURACIÓN RECOMENDADA</span><h2>Empieza con tres decisiones de negocio</h2>
<div className="question"><strong>1. ¿Cómo entregas?</strong><div><button>Flota propia</button><button>Transportista</button><button className="chosen">Ambos</button></div></div>
<div className="question"><strong>2. ¿Qué documento utilizan?</strong><div><button className="chosen">Factura</button><button>Remisión</button><button>Entrega</button><button>Otro</button></div></div>
<div className="question"><strong>3. ¿Qué hace válida una entrega?</strong><div><button className="chosen">Firma</button><button className="chosen">Sello</button><button className="chosen">Foto</button><button>Documento</button><button>QR</button></div></div>
<div className="recommend"><div><strong>Recomendado para tu operación</strong><p>Firma en dispositivo + evidencia documental, proximidad a 5 min, alerta ETA desde 20 min y privacidad de ubicación externa.</p></div><Link className="primary" href="/">Usar configuración recomendada →</Link></div>
</section>
<section className="panel role-summary"><div className="panel-head"><div><span className="section-kicker">ACCESO RECOMENDADO</span><h2>Permisos por responsabilidad, no por curiosidad</h2></div><Link className="ghost" href="/security">Ver SafeRoute</Link></div>
<div className="access-grid"><div><strong>Operador</strong><span>Sólo su operación asignada.</span></div><div><strong>Torre de Control</strong><span>Operación activa completa y GPS preciso.</span></div><div><strong>Administrador</strong><span>Configuración de su empresa y usuarios.</span></div><div><strong>Destinatario</strong><span>ETA y estado de su entrega; nunca GPS exacto.</span></div></div></section>
</AppShell>}
