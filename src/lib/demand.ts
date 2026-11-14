import initialWorkbook from '@/data/workbook.json';

export const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export type WorkbookData = Record<string, (string | number | boolean | null)[][]>;
export const initialData = initialWorkbook as WorkbookData;
const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export const currency = (n: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 }).format(n);
export const integer = (n: number) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(n);

export function findSheet(data: WorkbookData, name: string) {
  return Object.entries(data).find(([key]) => normalize(key) === normalize(name))?.[1] ?? [];
}
export function rowsFor(data: WorkbookData, name: string) {
  return findSheet(data, name).slice(1).filter(r => Number.isInteger(r[1]) && months.some(m => normalize(m) === normalize(r[2])));
}
function time(row: (string | number | boolean | null)[]) {
  return Number(row[1]) * 12 + months.findIndex(m => normalize(m) === normalize(row[2]));
}
export function forecast(data: WorkbookData, sheet: string, year: number, month: number): number {
  const rows = rowsFor(data, sheet);
  const target = year * 12 + month;
  const exact = rows.find(r => time(r) === target);
  if (exact && typeof exact[3] === 'number') return exact[3];
  if (exact && typeof exact[5] === 'number') return Math.max(0, exact[5]);
  const history = rows.filter(r => typeof r[3] === 'number');
  const first = history[0];
  if (!first) return 0;
  const origin = time(first);
  const avgX = history.reduce((s, r) => s + time(r) - origin + 1, 0) / history.length;
  const avgY = history.reduce((s, r) => s + Number(r[3]), 0) / history.length;
  const denominator = history.reduce((s, r) => s + (time(r) - origin + 1 - avgX) ** 2, 0);
  const slope = denominator ? history.reduce((s, r) => s + (time(r) - origin + 1 - avgX) * (Number(r[3]) - avgY), 0) / denominator : 0;
  const intercept = avgY - slope * avgX;
  const sameMonth = history.filter(r => time(r) % 12 === month);
  const monthAverage = sameMonth.length ? sameMonth.reduce((s, r) => s + Number(r[3]), 0) / sameMonth.length : avgY;
  const seasonality = avgY ? monthAverage / avgY : 1;
  return Math.max(0, (intercept + slope * (target - origin + 1)) * seasonality);
}
export function period(data: WorkbookData, year: number, month: number) {
  const revenue = forecast(data, 'Faturamento Bruto', year, month);
  const expenses = forecast(data, 'Gastos', year, month);
  const sales = forecast(data, 'Qnt Vendas', year, month);
  const actual = rowsFor(data, 'Faturamento Bruto').some(r => time(r) === year * 12 + month && typeof r[3] === 'number');
  return { revenue, expenses, sales, margin: revenue ? (revenue - expenses) / revenue * 100 : 0, actual };
}
export function categories(data: WorkbookData, year: number, month: number) {
  const sheet = findSheet(data, 'Faturamento por Categoria');
  const rows = rowsFor(data, 'Faturamento por Categoria');
  const revenueRow = rows.find(r => time(r) === year * 12 + month);
  const quantities = rowsFor(data, 'Qnt por categoria');
  const quantityRow = quantities.find(r => time(r) === year * 12 + month);
  const selected = period(data, year, month);
  return (sheet[0] ?? []).slice(3).flatMap((name, i) => {
    if (typeof name !== 'string' || !name.trim()) return [];
    const sum = rows.reduce((s, r) => s + (Number(r[i + 3]) || 0), 0);
    const total = rows.reduce((s, r) => s + r.slice(3).reduce<number>((a, v) => a + (Number(v) || 0), 0), 0);
    const share = total ? sum / total : 0;
    const quantitySum = quantities.reduce((s, r) => s + (Number(r[i + 3]) || 0), 0);
    const quantityTotal = quantities.reduce((s, r) => s + r.slice(3).reduce<number>((a, v) => a + (Number(v) || 0), 0), 0);
    return [{ name, revenue: typeof revenueRow?.[i + 3] === 'number' ? Number(revenueRow[i + 3]) : selected.revenue * share, sales: typeof quantityRow?.[i + 3] === 'number' ? Number(quantityRow[i + 3]) : selected.sales * (quantityTotal ? quantitySum / quantityTotal : share), share }];
  }).sort((a, b) => b.revenue - a.revenue);
}
export function validateWorkbook(data: WorkbookData) {
  for (const name of ['Faturamento Bruto', 'Gastos', 'Qnt Vendas']) {
    if (!rowsFor(data, name).some(r => typeof r[3] === 'number')) throw new Error(`A aba “${name}” precisa conter Ano, Mês e valores históricos.`);
  }
}