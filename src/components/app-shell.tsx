import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

const navGroups = [
  { label: 'OPERACIÓN', items: [
    ['/', '⌂', 'Inicio'], ['/routes', '⌁', 'Rutas'], ['/deliveries', '▣', 'Entregas'], ['/exceptions', '△', 'Excepciones'], ['/tracking', '⌖', 'Tracking'],
  ]},
  { label: 'CONTROL', items: [
    ['/control', '▧', 'Torre de Control'], ['/security', '◈', 'SafeRoute'], ['/communications', '✉', 'Comunicaciones'], ['/analytics', '▤', 'Reportes'],
  ]},
  { label: 'GESTIÓN', items: [
    ['/fleet', '▱', 'Flota'], ['/drivers', '♙', 'Conductores'], ['/customers', '♧', 'Clientes'], ['/settings', '⚙', 'Configuración'],
  ]},
] as const;

export function AppShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return <div className="x-shell">
    <aside className="x-sidebar">
      <Link className="x-brand" href="/">
        <span className="x-brand-logo"><Image src="/xolum-symbol-official.png" alt="XOLUM" width={54} height={54} priority /></span>
        <span><strong>TMS <em>XOLUM</em></strong><small>Soluciones que realmente ayudan.</small></span>
      </Link>
      <nav className="x-nav">{navGroups.map(group => <section key={group.label}><span className="x-nav-label">{group.label}</span>{group.items.map(([href, icon, label]) => <Link key={href} href={href}><span>{icon}</span>{label}{label==='Excepciones'&&<b>7</b>}{label==='SafeRoute'&&<b>1</b>}</Link>)}</section>)}</nav>
      <div className="x-value"><span>Valor generado hoy</span><strong>$28,450 <small>MXN</small></strong><em>+12.4% vs ayer</em></div>
      <div className="x-user"><span className="avatar">JP</span><span><strong>Juan Pablo Martínez</strong><small>Torre de Control</small></span><span>›</span></div>
    </aside>
    <main className="x-main">
      <header className="x-topbar">
        <div><h1>{title}</h1><p>{subtitle}</p></div>
        <div className="x-top-actions"><button aria-label="Notificaciones">♧<b>3</b></button><div><small>Rol actual</small><strong>Torre de Control⌄</strong></div><span className="avatar">JP</span></div>
      </header>
      {children}
      <footer className="x-footer"><span>● Todos los sistemas operando</span><span>v1.0.0 · Ayuda</span></footer>
    </main>
  </div>;
}
