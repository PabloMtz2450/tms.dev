import Link from 'next/link';
import type { ReactNode } from 'react';

const nav = [
  ['/', '▦', 'Control'],
  ['/routes', '⌁', 'Rutas'],
  ['/fleet', '◉', 'Flota'],
  ['/fiscal', '◇', 'Fiscal MX'],
  ['/materiality', '▣', 'Materialidad'],
];

export function AppShell({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">T</div><div><strong>TMS.dev</strong><span>Logistics OS</span></div></div>
      <nav>{nav.map(([href, icon, label]) => <Link key={href} href={href}><span className="nav-icon">{icon}</span>{label}</Link>)}</nav>
      <div className="sidebar-card"><span className="status-dot" /> <strong>Operación estable</strong><p>24 viajes activos · 3 en riesgo</p></div>
      <div className="user-chip"><div>PM</div><span><strong>Administrador</strong><small>Operación México</small></span></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div><span className="section-kicker">TMS / OPERACIÓN</span><h1>{title}</h1><p>{subtitle}</p></div><div className="top-actions"><button className="ghost">Exportar</button><button className="primary">+ Nueva operación</button></div></header>
      {children}
    </div>
  </div>;
}
