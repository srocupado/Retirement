import { realNetYield } from "./perpetuity";

export interface AchievableIncomeResult {
  /** Renda mensal perpétua real atingível (R$ de hoje), líquida. */
  monthlyReal: number;
  /** Diferença para a meta (positivo = falta; negativo = sobra). */
  gap: number;
  /** Rendimento real líquido usado na fase de decumulação. */
  decumulationYield: number;
}

/**
 * Renda perpétua real atingível dado um patrimônio líquido acumulado (em R$ de
 * hoje) e as premissas da fase de decumulação. Separa explicitamente a taxa de
 * reinvestimento `i_dec` (risco de reinvestimento ao vencer o IPCA+ 2050).
 */
export function achievableIncome(
  nestEggNetReal: number,
  decumulationRealRate: number,
  inflation: number,
  taxRate: number,
  targetMonthlyToday: number,
  exact = false,
): AchievableIncomeResult {
  const r = realNetYield(decumulationRealRate, inflation, taxRate, exact);
  const monthlyReal = (nestEggNetReal * Math.max(0, r)) / 12;
  return {
    monthlyReal,
    gap: targetMonthlyToday - monthlyReal,
    decumulationYield: r,
  };
}
