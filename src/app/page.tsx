const modules = ['Planeación','Viajes','Torre de control','Flota','Operadores','POD','Fiscal MX','Materialidad','Liquidaciones','Analítica'];

export default function Home() {
  return <main><header><div><span className="eyebrow">LOGISTICS OPERATING SYSTEM</span><h1>TMS.dev</h1><p>Planea, ejecuta, evidencia y controla la última milla desde una sola operación.</p></div><button>Nueva operación</button></header><section className="metrics"><article><small>Viajes activos</small><strong>24</strong></article><article><small>OTIF</small><strong>97.8%</strong></article><article><small>Entregas en riesgo</small><strong>3</strong></article><article><small>Revenue at Risk</small><strong>$184,230</strong></article></section><section><h2>Centro operativo</h2><div className="grid">{modules.map((m,i)=><article className="card" key={m}><span>{String(i+1).padStart(2,'0')}</span><h3>{m}</h3><p>Configuración, operación y trazabilidad del módulo.</p></article>)}</div></section></main>;
}
