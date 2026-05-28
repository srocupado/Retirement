/**
 * Conversões entre taxas reais e nominais (relação de Fisher) e utilitários
 * de juros compostos usados por todo o núcleo financeiro.
 *
 * Convenção: todas as taxas são anuais e em forma decimal (0,06 = 6% a.a.).
 */

/** Taxa nominal exata a partir da real e da inflação: (1+i)(1+π) − 1. */
export function nominalFromReal(realRate: number, inflation: number): number {
  return (1 + realRate) * (1 + inflation) - 1;
}

/** Taxa real exata a partir da nominal e da inflação. */
export function realFromNominal(nominalRate: number, inflation: number): number {
  return (1 + nominalRate) / (1 + inflation) - 1;
}

/** Converte taxa anual efetiva em taxa mensal equivalente. */
export function annualToMonthly(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/** Fator de capitalização composta por `years` anos. */
export function compound(rate: number, years: number): number {
  return Math.pow(1 + rate, years);
}
