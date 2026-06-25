/**
 * Comparação de ACUMULAÇÃO por regime tributário: como R$ 1 cresce ao longo de
 * N anos em termos reais, conforme o imposto incide (ou não) durante o caminho.
 *
 * A tese: o ativo ISENTO compõe sem vazamento; o diferido (IPCA+/ETF) adia o IR
 * mas paga no fim; o come-cotas vaza a cada semestre. O duelo real é isenção
 * (imposto zero, retorno menor) vs ações (imposto diferido, retorno maior).
 */

/** Valor real líquido de R$1 num título de imposto DIFERIDO (pago só no fim, sobre o ganho nominal). */
function deferredNetRealFactor(realRate: number, inflation: number, years: number, taxRate: number): number {
  const grossNominal = Math.pow(1 + realRate, years) * Math.pow(1 + inflation, years);
  const gain = grossNominal - 1;
  const netNominal = grossNominal - taxRate * Math.max(0, gain);
  return netNominal / Math.pow(1 + inflation, years);
}

/** Valor real líquido de R$1 num fundo com COME-COTAS (IR sobre o ganho nominal a cada semestre). */
function comeCotasNetRealFactor(realRate: number, inflation: number, years: number, taxRate: number): number {
  const nominalAnnual = (1 + realRate) * (1 + inflation) - 1;
  const semi = Math.pow(1 + nominalAnnual, 0.5) - 1;
  const afterTaxSemiFactor = 1 + semi * (1 - taxRate);
  const nominalFactor = Math.pow(afterTaxSemiFactor, years * 2);
  return nominalFactor / Math.pow(1 + inflation, years);
}

export interface RegimeResult {
  key: string;
  label: string;
  grossRealRate: number;
  /** Fator de crescimento real líquido de R$1 em N anos. */
  netFactor: number;
  /** CAGR real líquido equivalente. */
  netCagr: number;
}

/**
 * Compara os quatro regimes para uma taxa real bruta de referência e um prêmio
 * de retorno para a bolsa (ETF de ações cresce a `grossReal + equityPremium`).
 */
export function accumulationByRegime(
  grossReal: number,
  inflation: number,
  years: number,
  equityPremium: number,
): RegimeResult[] {
  const factorToCagr = (f: number) => Math.pow(f, 1 / years) - 1;

  const exemptFactor = Math.pow(1 + grossReal, years);
  const ipcaFactor = deferredNetRealFactor(grossReal, inflation, years, 0.15);
  const etfRate = grossReal + equityPremium;
  const etfFactor = deferredNetRealFactor(etfRate, inflation, years, 0.175);
  const comeCotasFactor = comeCotasNetRealFactor(grossReal, inflation, years, 0.15);

  return [
    { key: "exempt", label: "Isento (FII, FI-Infra, LCI/LCA, incentivada)", grossRealRate: grossReal, netFactor: exemptFactor, netCagr: grossReal },
    { key: "ipca", label: "IPCA+ zero-cupom (IR 15% diferido)", grossRealRate: grossReal, netFactor: ipcaFactor, netCagr: factorToCagr(ipcaFactor) },
    { key: "etf", label: `ETF de ações (IR 17,5% diferido, +${(equityPremium * 100).toFixed(1)}% de prêmio)`, grossRealRate: etfRate, netFactor: etfFactor, netCagr: factorToCagr(etfFactor) },
    { key: "comecotas", label: "Fundo com come-cotas (15% semestral)", grossRealRate: grossReal, netFactor: comeCotasFactor, netCagr: factorToCagr(comeCotasFactor) },
  ];
}

/**
 * Prêmio de retorno real que a bolsa (ETF a 17,5% diferido) precisa SOBRE o ativo
 * isento para empatar o valor líquido acumulado. Retorna null se não houver
 * empate plausível dentro do intervalo pesquisado (até +20% a.a.).
 */
export function equityBreakevenPremium(grossReal: number, inflation: number, years: number): number | null {
  const exemptFactor = Math.pow(1 + grossReal, years);
  const f = (p: number) => deferredNetRealFactor(grossReal + p, inflation, years, 0.175) - exemptFactor;
  if (f(0) >= 0) return 0; // ETF já empata/ganha sem prêmio
  let lo = 0, hi = 0.2;
  if (f(hi) < 0) return null; // nem com +20% empata
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
