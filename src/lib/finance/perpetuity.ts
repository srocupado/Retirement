import { nominalFromReal } from "./rates";

/**
 * Rendimento real líquido GASTÁVEL de um ativo de renda fixa tributado.
 *
 * Nuance central do modelo: o IR brasileiro incide sobre o ganho NOMINAL, não
 * o real. Logo, para preservar o poder de compra é preciso reinvestir a parcela
 * da inflação (que também foi tributada). O excedente que sobra para gastar, em
 * termos reais, é:
 *
 *   linear (aprox.):  r ≈ i·(1−t) − π·t
 *   exato (Fisher):   r = [ ((1+i)(1+π) − 1)·(1−t) − π ] / (1+π)
 *
 * O termo `−π·t` é o "imposto da inflação": mesmo com taxa real positiva, parte
 * do rendimento é corroída por tributar ganhos meramente inflacionários.
 *
 * @param realRate   taxa real anual do título (i)
 * @param inflation  inflação anual esperada (π)
 * @param taxRate    alíquota de IR sobre o ganho nominal (t); 0 para ativos isentos
 * @param exact      usa a fórmula exata de Fisher quando true
 */
export function realNetYield(
  realRate: number,
  inflation: number,
  taxRate: number,
  exact = false,
): number {
  if (exact) {
    const nominal = nominalFromReal(realRate, inflation);
    return (nominal * (1 - taxRate) - inflation) / (1 + inflation);
  }
  return realRate * (1 - taxRate) - inflation * taxRate;
}

export interface NestEggResult {
  /** Rendimento real líquido perpétuo usado no cálculo. */
  realNetYield: number;
  /** Patrimônio necessário em R$ de hoje (poder de compra atual). */
  nestEggToday: number;
  /** O mesmo patrimônio expresso em R$ nominais do ano de aposentadoria. */
  nestEggAtRetirementNominal: number;
  /** false quando o rendimento real líquido é ≤ 0 e a perpetuidade é inviável. */
  feasible: boolean;
}

/**
 * Patrimônio necessário para sustentar uma renda perpétua REAL (poder de compra
 * preservado para sempre), vivendo apenas do rendimento real líquido.
 *
 * @param monthlyIncomeToday  renda mensal alvo em R$ de hoje (ex.: 11000)
 * @param realRate            taxa real anual assumida na fase de renda (i_dec)
 * @param inflation           inflação anual (π)
 * @param taxRate             IR efetivo sobre o rendimento (0 para isentos)
 * @param yearsToRetirement   N anos até a aposentadoria (para a visão nominal)
 */
export function requiredNestEgg(
  monthlyIncomeToday: number,
  realRate: number,
  inflation: number,
  taxRate: number,
  yearsToRetirement: number,
  exact = false,
): NestEggResult {
  const r = realNetYield(realRate, inflation, taxRate, exact);
  const annualIncome = monthlyIncomeToday * 12;
  const feasible = r > 0;
  const nestEggToday = feasible ? annualIncome / r : Infinity;
  return {
    realNetYield: r,
    nestEggToday,
    nestEggAtRetirementNominal: nestEggToday * Math.pow(1 + inflation, yearsToRetirement),
    feasible,
  };
}
