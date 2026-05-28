import { annualToMonthly } from "./rates";

export interface AccumulationInputs {
  /** Saldo atual já acumulado (R$ de hoje). */
  currentSavings: number;
  /** Aporte mensal (R$ de hoje). */
  monthlyContribution: number;
  /** Taxa real anual durante a acumulação (i_acc). */
  realRate: number;
  /** Inflação anual (π) — usada para a base tributável nominal. */
  inflation: number;
  /** Anos até a aposentadoria (N). */
  years: number;
  /** Alíquota de IR no resgate/vencimento (ex.: 0,15 para >720 dias). */
  taxRate: number;
}

export interface AccumulationResult {
  /** Valor futuro bruto em R$ de hoje (antes de IR). */
  grossReal: number;
  /** Valor futuro líquido de IR, em R$ de hoje (comparável ao patrimônio-alvo). */
  netReal: number;
  /** IR estimado, em R$ de hoje. */
  taxReal: number;
  /** Total aportado (principal nominal) ao longo do período. */
  principalNominal: number;
}

/**
 * Projeção da fase de acumulação em termos reais. Como a NTN-B Principal não
 * paga cupom, o IR é diferido e cobrado uma única vez no vencimento, sobre o
 * ganho NOMINAL — por isso o cálculo passa pelo valor nominal antes de deflacionar.
 */
export function projectAccumulation(input: AccumulationInputs): AccumulationResult {
  const { currentSavings, monthlyContribution, realRate, inflation, years, taxRate } = input;
  const m = annualToMonthly(realRate);
  const n = Math.round(years * 12);

  const annuityFactor = m === 0 ? n : (Math.pow(1 + m, n) - 1) / m;
  const grossReal =
    currentSavings * Math.pow(1 + m, n) + monthlyContribution * annuityFactor;

  // IR incide sobre o ganho nominal, apurado no vencimento.
  const inflationFactor = Math.pow(1 + inflation, years);
  const grossNominal = grossReal * inflationFactor;
  const principalNominal = currentSavings + monthlyContribution * n;
  const nominalGain = Math.max(0, grossNominal - principalNominal);
  const taxNominal = taxRate * nominalGain;
  const netNominal = grossNominal - taxNominal;
  const netReal = netNominal / inflationFactor;

  return {
    grossReal,
    netReal,
    taxReal: (grossNominal - netNominal) / inflationFactor,
    principalNominal,
  };
}
