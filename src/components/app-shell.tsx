import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

const navGroups = [
  { label: 'OPERACIÓN', items: [
    ['/', '▦', 'Inicio'], ['/exceptions', '!', 'Excepciones'], ['/routes', '⌁', 'Rutas'],
    ['/tracking', '◎', 'Tracking'], ['/deliveries', '□', 'Entregas'],
  ]},
  { label: 'CONTROL', items: [
    ['/security', 'SOS', 'SafeRoute'], ['/fiscal', '◇', 'Fiscal MX'], ['/materiality', '▣', 'Materialidad'],
  ]},
  { label: 'GESTIÓN', items: [
    ['/customers', '○', 'Clientes'], ['/fleet', '◉', 'Flota'], ['/analytics', '↗', 'Valor generado'], ['/settings', '⚙', 'Configuración'],
  ]},
] as const;

export function AppShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark brand-logo"><Image src="/xolum-symbol.png" alt="XOLUM" width={42} height={42} priority /></div><div><strong>TMS XOLUM</strong><span>Soluciones que realmente ayudan.</span></div></div>
      <nav>{navGroups.map(group => <div className="nav-group" key={group.label}><span className="nav-group-label">{group.label}</span>{group.items.map(([href, icon, label]) => <Link key={href} href={href}><span className="nav-icon">{icon}</span>{label}</Link>)}</div>)}</nav>
      <div className="sidebar-card"><span className="status-dot" /> <strong>Operación estable</strong><p>Lo correcto avanza solo · 8 excepciones</p></div>
      <div className="user-chip"><div>PM</div><span><strong>Administrador</strong><small>Operación México</small></span></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div><span className="section-kicker">TMS XOLUM / OPERACIÓN MÉXICO</span><h1>{title}</h1><p>{subtitle}</p></div><div className="top-actions"><Link className="ghost" href="/analytics">Valor generado</Link><Link className="primary" href="/exceptions">Revisar excepciones</Link></div></header>
      {children}
    </div>
  </div>;
}
