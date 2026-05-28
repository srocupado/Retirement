import type { InstrumentKind } from "../marketData/instruments";
import {
  RULES_2026,
  DIVIDEND_MONTHLY_EXEMPT_PER_PAYER,
  HIGH_INCOME_ANNUAL_THRESHOLD,
} from "./rules2026";

/**
 * Alíquota efetiva de IR sobre o RENDIMENTO de um instrumento na fase de renda
 * (cenário-base de longo prazo). Isentos retornam 0.
 */
export function effectiveIncomeTaxRate(kind: InstrumentKind): number {
  return RULES_2026[kind].incomeTaxRateLongTerm;
}

/**
 * Fator de tributação (líquido/bruto) do rendimento. 1,00 para ativos isentos
 * (FII, LCI, LCA, CRI, CRA, debêntures incentivadas) — onde líquido = bruto —
 * e < 1 para os tributados (ex.: 0,85 para renda fixa a 15%; 0,825 p/ ETF de ações).
 */
export function taxDragFactor(kind: InstrumentKind): number {
  return 1 - effectiveIncomeTaxRate(kind);
}

/** Renda líquida a partir da renda bruta, dado o instrumento. */
export function netFromGross(grossIncome: number, kind: InstrumentKind): number {
  return grossIncome * taxDragFactor(kind);
}

/** Renda bruta necessária para uma renda líquida-alvo, dado o instrumento. */
export function grossForNet(netTarget: number, kind: InstrumentKind): number {
  const factor = taxDragFactor(kind);
  return factor === 0 ? Infinity : netTarget / factor;
}

export function capitalGainsRate(kind: InstrumentKind): number {
  return RULES_2026[kind].capitalGainsRate;
}

/**
 * IR sobre dividendos de ações segundo a Lei 1.087/2025: 10% na fonte apenas
 * sobre o que exceder R$50 mil/mês de uma MESMA empresa. Abaixo do limiar, 0.
 * (O imposto mínimo anual para renda > R$600k/ano é tratado à parte.)
 */
export function dividendWithholding(
  monthlyAmountFromSinglePayer: number,
): number {
  const excess = Math.max(0, monthlyAmountFromSinglePayer - DIVIDEND_MONTHLY_EXEMPT_PER_PAYER);
  return excess * 0.1;
}

/** Indica se a renda anual total cai no regime de imposto mínimo (IRPFM). */
export function isHighIncome(annualIncome: number): boolean {
  return annualIncome > HIGH_INCOME_ANNUAL_THRESHOLD;
}
