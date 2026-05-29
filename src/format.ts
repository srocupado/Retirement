const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const brl2 = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

export function money(v: number): string {
  if (!isFinite(v)) return "—";
  return brl.format(v);
}

export function money2(v: number): string {
  if (!isFinite(v)) return "—";
  return brl2.format(v);
}

export function pct(v: number, digits = 2): string {
  if (v == null || !isFinite(v)) return "—";
  return `${(v * 100).toFixed(digits)}%`;
}

export function compact(v: number): string {
  if (!isFinite(v)) return "—";
  return new Intl.NumberFormat("pt-BR", { notation: "compact", style: "currency", currency: "BRL", maximumFractionDigits: 1 }).format(v);
}
