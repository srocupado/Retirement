import type { SleeveKey } from "./assumptions";

export type Allocation = Partial<Record<SleeveKey, number>>;

export interface ModelPortfolio {
  id: string;
  name: string;
  description: string;
  allocation: Allocation; // pesos somam 1
}

/** Tetos rígidos por sleeve, por carteira (ex.: cripto). */
export const SLEEVE_CAPS: Record<string, Partial<Record<SleeveKey, number>>> = {
  baseline: { cripto: 0 },
  conservador: { cripto: 0 },
  balanceado: { cripto: 0.02 },
  renda: { cripto: 0.05 },
};

export const MODEL_PORTFOLIOS: ModelPortfolio[] = [
  {
    id: "baseline",
    name: "Baseline (sua carteira atual)",
    description: "100% Tesouro IPCA+ — ponto de comparação.",
    allocation: { ipcaIncome: 1.0 },
  },
  {
    id: "conservador",
    name: "Conservador",
    description: "Espinha em IPCA+/RendA+, um pouco de isentos e caixa.",
    allocation: { ipcaIncome: 0.7, isentos: 0.15, caixa: 0.1, fiiAcoes: 0.05 },
  },
  {
    id: "balanceado",
    name: "Balanceado",
    description: "Mistura renda (IPCA+, isentos, FIIs/ações) com crescimento e um satélite mínimo.",
    allocation: { ipcaIncome: 0.4, isentos: 0.2, fiiAcoes: 0.2, etfGrowth: 0.13, caixa: 0.05, cripto: 0.02 },
  },
  {
    id: "renda",
    name: "Renda (income-tilted)",
    description: "Peso forte em renda isenta (FIIs e isentos) para maximizar renda líquida.",
    allocation: { ipcaIncome: 0.2, isentos: 0.3, fiiAcoes: 0.4, etfGrowth: 0.05, cripto: 0.05 },
  },
];

/** Valida que a alocação respeita os tetos e soma ~1. */
export function validateAllocation(id: string, alloc: Allocation): string[] {
  const errors: string[] = [];
  const sum = Object.values(alloc).reduce((s, w) => s + (w ?? 0), 0);
  if (Math.abs(sum - 1) > 0.001) errors.push(`A alocação soma ${(sum * 100).toFixed(1)}% (deveria ser 100%).`);
  const caps = SLEEVE_CAPS[id] ?? {};
  for (const [k, cap] of Object.entries(caps)) {
    const w = alloc[k as SleeveKey] ?? 0;
    if (w > (cap ?? 1) + 1e-9) errors.push(`${k}: ${(w * 100).toFixed(1)}% excede o teto de ${((cap ?? 0) * 100).toFixed(0)}%.`);
  }
  return errors;
}
