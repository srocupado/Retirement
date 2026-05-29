import { annualToMonthly } from "../finance/rates";

/**
 * Tesouro RendA+: após a fase de acumulação, paga renda mensal corrigida pela
 * inflação por 240 meses (20 anos) — NÃO é perpétuo. Aqui ele entra como
 * casamento PARCIAL de passivo. Tributação com piso de 10% se levado à conversão.
 *
 * @param lumpSumReal  patrimônio na conversão, em R$ de hoje
 * @param realRate     taxa real anual contratada
 * @param months       nº de pagamentos (padrão 240)
 * @param taxRate      IR efetivo (piso 10%)
 * @returns renda mensal real líquida durante a fase de pagamento
 */
export function rendaMaisMonthlyPayment(
  lumpSumReal: number,
  realRate: number,
  months = 240,
  taxRate = 0.1,
): number {
  const r = annualToMonthly(realRate);
  const grossPmt = r === 0 ? lumpSumReal / months : (lumpSumReal * r) / (1 - Math.pow(1 + r, -months));
  // Aproximação: o IR incide majoritariamente sobre o rendimento; aplica o piso.
  return grossPmt * (1 - taxRate);
}
