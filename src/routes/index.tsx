import { createFileRoute } from '@tanstack/react-router';
import { useMemo, useRef, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, ArrowRight, BarChart3, CalendarDays, Check, ChevronDown, CircleHelp, Download, Eye, EyeOff, FileSpreadsheet, LayoutDashboard, LockKeyhole, LogOut, Package, ShieldCheck, TrendingUp, Upload, Wallet, X } from 'lucide-react';
import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { categories, currency, initialData, integer, months, period, rowsFor, validateWorkbook, type WorkbookData } from '@/lib/demand';
import logoImg from '@/assets/assets/logo.png';

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'Adega do Robô | Previsão de Demanda e Gestão Financeira' },
    { name: 'description', content: 'Planejamento financeiro com previsões de demanda, faturamento, gastos e vendas por categoria.' },
    { property: 'og:title', content: 'Adega do Robô | Inteligência para o seu negócio' },
    { property: 'og:description', content: 'Acompanhe seus resultados e planeje os próximos meses com dados e previsões.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' },
  ] }), component: Index,
});

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <img src="../src/assets/logo.png" alt="Adega do Robô" className="w-10 h-10 object-contain rounded-full bg-slate-900" />
      <span className="text-xl font-bold">Adega do Robô<span className="text-primary">.</span></span>
    </div>
  );
}

function Index() {
  const [signedIn, setSignedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [data, setData] = useState<WorkbookData>(initialData);
  const [month, setMonth] = useState(10);
  const [year, setYear] = useState(2026);
  const [tab, setTab] = useState('overview');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [filename, setFilename] = useState('Previsão_de_demanda.xlsx');
  const [categoryMode, setCategoryMode] = useState<'revenue' | 'sales'>('revenue');
  const inputRef = useRef<HTMLInputElement>(null);
  const current = useMemo(() => period(data, year, month), [data, year, month]);
  const previous = useMemo(() => period(data, month === 0 ? year - 1 : year, (month + 11) % 12), [data, year, month]);
  const categoryRows = useMemo(() => categories(data, year, month), [data, year, month]);
  const chart = useMemo(() => months.map((name, i) => {
    const p = period(data, year, i);
    return { name: name.slice(0, 3), revenue: p.actual ? p.revenue : null, forecast: p.actual ? null : p.revenue, expenses: p.expenses, margin: p.margin, sales: p.sales };
  }), [data, year]);
  const historyCount = rowsFor(data, 'Faturamento Bruto').filter(r => typeof r[3] === 'number').length;
  const bestMonth = chart.reduce((best, row) => (row.revenue ?? row.forecast ?? 0) > (best.revenue ?? best.forecast ?? 0) ? row : best, { name: '', revenue: null as number | null, forecast: null as number | null, expenses: 0, margin: 0, sales: 0 });

  async function importFile(file: File | undefined) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.xlsx')) { toast.error('Selecione um arquivo .xlsx.'); return; }
    setBusy(true);
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const next: WorkbookData = {};
      workbook.SheetNames.forEach(name => { const sheet = workbook.Sheets[name]; if (sheet) next[name] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }); });
      validateWorkbook(next); setData(next); setFilename(file.name); setUploadOpen(false);
      toast.success('Planilha importada. Previsões atualizadas!');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Não foi possível ler a planilha.'); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ''; }
  }
  async function exportReport(format: 'csv' | 'pdf') {
    const title = `Relatório — ${months[month]} de ${year}`;
    if (format === 'csv') {
      const text = [['Categoria', 'Faturamento (R$)', 'Vendas (un.)', 'Participação (%)'], ...categoryRows.map(c => [c.name, c.revenue.toFixed(2).replace('.', ','), Math.round(c.sales), (c.share * 100).toFixed(2).replace('.', ',')]), ['TOTAL', current.revenue.toFixed(2).replace('.', ','), Math.round(current.sales), '100'], ['Gastos (R$)', current.expenses.toFixed(2).replace('.', ',')], ['Margem (%)', current.margin.toFixed(2).replace('.', ',')]].map(r => r.join(';')).join('\r\n');
      const url = URL.createObjectURL(new Blob(['\uFEFF' + text], { type: 'text/csv;charset=utf-8;' }));
      const link = document.createElement('a'); link.href = url; link.download = `vertice-${year}-${month + 1}.csv`; link.click(); URL.revokeObjectURL(url);
    } else {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF(); pdf.setFontSize(22); pdf.text('Adega do Robô', 18, 23); pdf.setFontSize(13); pdf.text(title, 18, 35);
      pdf.setFontSize(10); [ `Faturamento: ${currency(current.revenue)}`, `Gastos: ${currency(current.expenses)}`, `Vendas: ${integer(current.sales)}`, `Margem: ${current.margin.toFixed(1)}%`, `Fonte: ${filename}`, current.actual ? 'Dados realizados' : 'Projecao: tendencia linear + sazonalidade' ].forEach((text, i) => pdf.text(text, 18, 49 + i * 7));
      pdf.text('Categoria', 18, 100); pdf.text('Faturamento', 100, 100); pdf.text('Vendas', 166, 100);
      categoryRows.forEach((c, i) => { const y = 109 + i * 7; pdf.text(c.name, 18, y); pdf.text(currency(c.revenue), 100, y); pdf.text(integer(c.sales), 166, y); });
      pdf.save(`vertice-${year}-${month + 1}.pdf`);
    }
    setExportOpen(false); toast.success('Relatório exportado.');
  }
  if (!signedIn) return <main className="login-screen">
    <div className="login-content reveal">
      <div className="brand-mark login-symbol"><Activity size={36} strokeWidth={2.5} /></div>
      <div className="eyebrow text-primary mb-3">DEMANDA & FINANÇAS</div>
      <h1 className="text-4xl font-bold">Adega do Robô<span className="text-primary">.</span></h1>
      <p className="text-muted-foreground mt-4 text-sm leading-6">Clareza nos números.<br />Confiança nas próximas decisões.</p>
      <div className="login-divider" />
      <h2 className="font-semibold text-xl">Bem-vindo de volta</h2>
      <p className="text-sm text-muted-foreground mt-2 mb-7">Acesse seu painel de planejamento.</p>
      <form onSubmit={e => { e.preventDefault(); if (password !== 'admin123') { setLoginError('Senha incorreta. Tente novamente.'); return; } setSignedIn(true); setPassword(''); setLoginError(''); toast.success('Bem-vindo ao Adega do Robô!'); }}>
        <label htmlFor="password" className="text-xs font-medium">Senha de acesso</label>
        <div className="relative mt-2"><LockKeyhole size={17} className="absolute left-3 top-3.5 text-muted-foreground" /><input id="password" type={showPassword ? 'text' : 'password'} className="field h-12 w-full pl-10 pr-12" placeholder="Digite sua senha" value={password} onChange={e => setPassword(e.target.value)} required /><Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1.5" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff /> : <Eye />}</Button></div>
        {loginError && <p role="alert" className="text-destructive text-xs mt-3">{loginError}</p>}
        <Button type="submit" className="w-full h-12 mt-5 font-semibold">Acessar painel <ArrowRight /></Button>
      </form>
      <div className="flex items-center gap-2 mt-6 text-xs text-muted-foreground"><ShieldCheck size={15} /><span>Acesso de demonstração · senha: <span className="text-foreground">admin123</span></span></div>
    </div><span className="login-watermark">Adega do Robô · Previsão de demanda e gestão financeira</span>
  </main>;

  const kpis = [
    { label: current.actual ? 'Faturamento bruto' : 'Faturamento previsto', value: currency(current.revenue), delta: previous.revenue ? (current.revenue / previous.revenue - 1) * 100 : null, icon: Wallet, orange: false, spark: 'revenue' },
    { label: current.actual ? 'Gastos realizados' : 'Gastos previstos', value: currency(current.expenses), delta: previous.expenses ? (current.expenses / previous.expenses - 1) * 100 : null, icon: BarChart3, orange: true, spark: 'expenses' },
    { label: 'Quantidade de vendas', value: integer(current.sales), delta: previous.sales ? (current.sales / previous.sales - 1) * 100 : null, icon: Package, orange: false, spark: 'sales' },
    { label: 'Margem estimada', value: `${current.margin.toFixed(1).replace('.', ',')}%`, delta: current.margin - previous.margin, icon: TrendingUp, orange: false, spark: 'margin' },
  ];
  return <div className="min-h-screen">
    <header className="border-b border-border"><div className="max-w-[1480px] mx-auto px-4 md:px-12 flex items-center justify-between h-[76px]"><Brand /><div className="flex items-center gap-2 md:gap-5"><span className="hidden md:flex items-center gap-2 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" />Planejamento inteligente</span><div className="h-6 border-l border-border hidden md:block" /><Button variant="ghost" size="icon" aria-label="Ajuda" onClick={() => setHelpOpen(true)}><CircleHelp /></Button><div className="flex items-center gap-2"><div className="size-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">AD</div><span className="text-xs hidden sm:block">Administrador</span></div><Button variant="ghost" size="icon" aria-label="Sair" onClick={() => { setSignedIn(false); toast.success('Você saiu do painel.'); }}><LogOut /></Button></div></div>
      <div className="max-w-[1480px] mx-auto px-4 md:px-12 flex items-center justify-between"><nav className="flex"><Button variant="ghost" className="nav-item" data-active={tab === 'overview'} onClick={() => setTab('overview')}><LayoutDashboard />Visão geral</Button><Button variant="ghost" className="nav-item" data-active={tab === 'categories'} onClick={() => setTab('categories')}><Package />Categorias</Button><Button variant="ghost" className="nav-item" data-active={tab === 'history'} onClick={() => setTab('history')}><TrendingUp />Histórico</Button></nav><Button variant="ghost" className="text-muted-foreground hidden sm:flex text-xs" onClick={() => setUploadOpen(true)}><Upload />Atualizar dados</Button></div>
    </header>
    <main className="dashboard reveal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5"><div><div className="eyebrow text-muted-foreground mb-2">SEU NEGÓCIO, EM PERSPECTIVA</div><h1 className="text-[28px] font-bold">{tab === 'overview' ? 'Visão geral' : tab === 'categories' ? 'Análise por categoria' : 'Histórico e projeções'}</h1><p className="text-muted-foreground text-sm mt-2">Acompanhe os resultados de hoje. Planeje o crescimento de amanhã.</p></div><div className="flex gap-2"><Button variant="outline" className="h-10 text-xs sm:hidden" onClick={() => setUploadOpen(true)}><Upload />Atualizar</Button><Button variant="outline" className="h-10 text-xs" onClick={() => setExportOpen(true)}><Download />Exportar relatório<ChevronDown /></Button></div></div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-7 mb-6 pb-6 border-b border-border"><div className="flex items-center gap-3"><CalendarDays size={17} className="text-muted-foreground" /><span className="text-xs text-muted-foreground hidden sm:block">Período de análise</span><select aria-label="Mês" value={month} onChange={e => setMonth(Number(e.target.value))} className="text-xs min-w-32">{months.map((m, i) => <option key={m} value={i}>{m}</option>)}</select><input type="number" aria-label="Ano" value={year} min={2023} max={9999} onChange={e => { const n = Number(e.target.value); if (Number.isInteger(n) && n >= 2023 && n <= 9999) setYear(n); }} className="field w-24 text-xs" /></div><div className="flex items-center gap-3"><span className="status"><span className="size-1.5 rounded-full bg-primary" />{current.actual ? 'Dados realizados' : 'Projeção futura'}</span><span className="text-xs text-muted-foreground">{months[month]} de {year}</span></div></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{kpis.map((k, i) => <article key={k.label} className="panel metric"><div className="flex items-center justify-between gap-2 mb-4"><span className="metric-label text-xs text-muted-foreground">{k.label}</span><k.icon size={16} className={k.orange ? 'text-warning' : 'text-primary'} /></div><div className="metric-value">{k.value}</div><div className="flex items-center justify-between gap-1 mt-3"><div className="text-[10px] text-muted-foreground"><span className={k.orange ? 'text-warning' : 'text-primary'}>{k.delta !== null && k.delta < 0 ? <ArrowDownRight size={13} className="inline" /> : <ArrowUpRight size={13} className="inline" />}{k.delta === null ? '—' : `${k.delta >= 0 ? '+' : ''}${k.delta.toFixed(1).replace('.', ',')}${i === 3 ? ' p.p.' : '%'}`}</span><span className="ml-1">vs. mês anterior</span></div><div className="w-16 h-7 hidden xl:block"><ResponsiveContainer><ComposedChart data={chart.map(r => ({ ...r, revenue: r.revenue ?? r.forecast }))}><Line dataKey={k.spark} stroke={k.orange ? 'var(--warning)' : 'var(--primary)'} strokeWidth={1.7} dot={false} isAnimationActive={false} /></ComposedChart></ResponsiveContainer></div></div></article>)}</div>
      {tab === 'overview' && <>
        <div className="grid lg:grid-cols-[1.65fr_1fr] gap-5 mt-6">
          <section className="panel chart-panel"><div className="flex justify-between items-start gap-2"><div><h2 className="text-sm font-semibold">Evolução financeira</h2><p className="text-xs text-muted-foreground mt-1.5">Faturamento e gastos ao longo de {year}</p></div><span className="text-[10px] border border-border px-2 py-1 rounded">Mensal</span></div><div className="flex gap-4 text-[10px] mt-5 flex-wrap"><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-primary" />Faturamento</span><span className="flex items-center gap-1.5"><span className="w-3 border-t border-dashed border-primary" />Previsão</span><span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-warning" />Gastos</span></div><div className="chart-wrap"><ResponsiveContainer><ComposedChart data={chart} margin={{ top: 8, right: 8, left: -17, bottom: 0 }}><defs><linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.16} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" /><XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} /><YAxis tickFormatter={v => `${Math.round(v / 1000)} mil`} axisLine={false} tickLine={false} /><Tooltip content={({ active, payload, label }) => active && payload?.length ? <div className="chart-tooltip"><p className="font-semibold mb-2">{label} / {year}</p>{payload.map(p => <p key={p.dataKey} className={p.dataKey === 'expenses' ? 'text-warning' : 'text-primary'}>{p.name}: {currency(Number(p.value))}</p>)}</div> : null} /><Area dataKey="forecast" name="Previsão" fill="url(#revenueFill)" stroke="var(--primary)" strokeWidth={2.5} strokeDasharray="5 4" type="monotone" /><Line dataKey="revenue" name="Faturamento" stroke="var(--primary)" strokeWidth={2.5} dot={false} type="monotone" /><Line dataKey="expenses" name="Gastos" stroke="var(--warning)" strokeWidth={2} dot={false} type="monotone" /></ComposedChart></ResponsiveContainer></div></section>
          <section className="panel chart-panel"><div className="flex justify-between items-start"><div><h2 className="text-sm font-semibold">Destaques por categoria</h2><p className="text-xs text-muted-foreground mt-1.5">Top 6 em {categoryMode === 'revenue' ? 'faturamento' : 'vendas'}</p></div><Package size={17} className="text-muted-foreground" /></div><div className="flex gap-1 mt-4"><Button size="sm" variant={categoryMode === 'revenue' ? 'secondary' : 'ghost'} onClick={() => setCategoryMode('revenue')} className={categoryMode === 'revenue' ? 'text-primary' : 'text-muted-foreground'}>Faturamento</Button><Button size="sm" variant={categoryMode === 'sales' ? 'secondary' : 'ghost'} onClick={() => setCategoryMode('sales')} className={categoryMode === 'sales' ? 'text-primary' : 'text-muted-foreground'}>Vendas</Button></div><div className="chart-wrap"><ResponsiveContainer><BarChart data={categoryRows.slice(0, 6)} layout="vertical" margin={{ left: 0, right: 20 }}><CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="3 4" /><XAxis type="number" axisLine={false} tickLine={false} tickFormatter={v => categoryMode === 'revenue' ? `${(v / 1000).toFixed(0)} mil` : integer(v)} /><YAxis type="category" dataKey="name" width={78} axisLine={false} tickLine={false} /><Tooltip cursor={{ fill: 'var(--accent)' }} content={({ active, payload }) => active && payload?.length ? <div className="chart-tooltip">{payload[0]?.payload?.name}<p className="text-primary mt-1">{categoryMode === 'revenue' ? currency(Number(payload[0]?.value)) : `${integer(Number(payload[0]?.value))} un.`}</p></div> : null} /><Bar dataKey={categoryMode} fill="var(--primary)" radius={[0, 3, 3, 0]} barSize={19} /></BarChart></ResponsiveContainer></div></section>
        </div>
        <div className="flex items-start sm:items-center gap-3 py-4 px-5 mt-5 border border-primary/20 rounded-md bg-success-soft"><TrendingUp size={19} className="text-primary shrink-0" /><p className="text-xs leading-5 text-muted-foreground"><span className="text-primary font-semibold">Um olhar à frente.</span> {bestMonth.name} tem o maior faturamento {year}: <span className="text-foreground font-medium">{currency(bestMonth.revenue ?? bestMonth.forecast ?? 0)}</span>. As projeções consideram tendência linear e sazonalidade de {historyCount} meses históricos.</p></div>
      </>}
      {tab !== 'history' ? <section className="panel mt-6 overflow-hidden"><div className="flex items-center justify-between p-5 sm:px-6"><div><h2 className="text-sm font-semibold">Desempenho por categoria</h2><p className="text-xs text-muted-foreground mt-1.5">{tab === 'overview' ? 'Principais categorias do período selecionado' : `Todas as ${categoryRows.length} categorias do período`}</p></div>{tab === 'overview' && <Button variant="ghost" size="sm" className="text-primary" onClick={() => setTab('categories')}>Ver todas<ArrowRight /></Button>}</div><div className="table-scroll"><table className="data-table"><thead><tr><th>Categoria</th><th className="numeric">Faturamento previsto</th><th className="numeric">Vendas (un.)</th><th className="numeric">Participação</th><th className="numeric">Situação</th></tr></thead><tbody>{categoryRows.slice(0, tab === 'overview' ? 5 : undefined).map((c, i) => <tr key={c.name}><td><span className="inline-flex items-center gap-3"><span className="size-7 flex items-center justify-center rounded bg-secondary text-muted-foreground"><Package size={14} /></span><span className="font-medium">{c.name}</span></span></td><td className="numeric font-medium">{currency(c.revenue)}</td><td className="numeric text-muted-foreground">{integer(c.sales)}</td><td className="numeric"><span className="inline-flex items-center gap-3">{(c.share * 100).toFixed(1).replace('.', ',')}%<span className="category-bar"><progress max={0.1} value={c.share} /></span></span></td><td className="numeric"><span className={i < 3 ? 'text-primary' : 'text-muted-foreground'}>{current.actual ? 'Realizado' : 'Projetado'}</span></td></tr>)}</tbody></table></div></section> : <section className="panel mt-6 overflow-hidden"><div className="p-6"><h2 className="font-semibold text-sm">Resultados mensais · {year}</h2><p className="text-xs text-muted-foreground mt-2">Valores realizados e projeções sazonais</p></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Mês</th><th className="numeric">Faturamento</th><th className="numeric">Gastos</th><th className="numeric">Vendas</th><th className="numeric">Margem</th><th>Situação</th></tr></thead><tbody>{months.map((m, i) => { const p = period(data, year, i); return <tr key={m}><td>{m}</td><td className="numeric text-primary">{currency(p.revenue)}</td><td className="numeric text-warning">{currency(p.expenses)}</td><td className="numeric">{integer(p.sales)}</td><td className="numeric">{p.margin.toFixed(1)}%</td><td>{p.actual ? 'Realizado' : 'Projeção'}</td></tr>; })}</tbody></table></div></section>}
      <footer className="flex flex-col sm:flex-row justify-between gap-3 mt-6 text-[10px] text-muted-foreground"><span className="flex items-center gap-1.5"><FileSpreadsheet size={12} />Fonte: {filename}<span className="text-primary ml-2 inline-flex items-center gap-1"><Check size={12} />Dados carregados</span></span><span>Adega do Robô · Inteligência para o seu negócio</span></footer>
    </main>
    <Dialog open={uploadOpen} onOpenChange={setUploadOpen}><DialogContent><DialogTitle>Atualizar dados</DialogTitle><DialogDescription>Importe uma planilha com as abas Faturamento Bruto, Gastos e Qnt Vendas. Os dados substituem a base nesta sessão.</DialogDescription><div className="upload-zone" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); void importFile(e.dataTransfer.files[0]); }}><FileSpreadsheet className="mx-auto text-primary mb-4" size={36} /><p className="text-sm mb-2">Arraste sua planilha para cá</p><p className="text-xs text-muted-foreground mb-5">Excel · .xlsx</p><Button disabled={busy} onClick={() => inputRef.current?.click()}><Upload />{busy ? 'Importando…' : 'Selecionar arquivo'}</Button><input ref={inputRef} type="file" accept=".xlsx" className="hidden" onChange={e => void importFile(e.target.files?.[0])} /></div><span className="text-xs text-muted-foreground">Arquivo atual: {filename}</span></DialogContent></Dialog>
    <Dialog open={exportOpen} onOpenChange={setExportOpen}><DialogContent><DialogTitle>Exportar relatório</DialogTitle><DialogDescription>{months[month]} de {year} · indicadores e todas as categorias.</DialogDescription><div className="grid grid-cols-2 gap-3 mt-2"><Button variant="outline" className="h-14" onClick={() => void exportReport('pdf')}><Download />Relatório PDF</Button><Button variant="outline" className="h-14" onClick={() => void exportReport('csv')}><FileSpreadsheet />Planilha CSV</Button></div></DialogContent></Dialog>
    <Dialog open={helpOpen} onOpenChange={setHelpOpen}><DialogContent><DialogTitle>Sobre os dados</DialogTitle><DialogDescription>As previsões da planilha são preservadas. Para novos períodos, a projeção combina a tendência linear histórica com a sazonalidade mensal. Valores de categorias são distribuídos pela participação histórica. Este acesso é uma demonstração; não protege dados confidenciais.</DialogDescription><p className="text-xs text-muted-foreground">Adega do Robô é um nome provisório para o painel.</p></DialogContent></Dialog>
  </div>;
}
