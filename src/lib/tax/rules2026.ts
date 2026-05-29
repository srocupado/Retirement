import type { InstrumentKind } from "../marketData/instruments";

/**
 * Regras tributárias para pessoa física — ano-base 2026, Brasil.
 *
 * IMPORTANTE: a MP 1303/2025 (que propunha alíquota única de 17,5% sobre cripto,
 * 5% de IRRF sobre renda fixa hoje isenta e mudanças em FII) CADUCOU em
 * 08/10/2025 e NÃO virou lei. As alíquotas abaixo refletem o regime vigente.
 * Revisar a cada ano-base.
 */
export const TAX_YEAR = 2026 as const;

/** Limiares da nova tributação de dividendos (Lei 1.087/2025). */
export const DIVIDEND_MONTHLY_EXEMPT_PER_PAYER = 50_000;
export const HIGH_INCOME_ANNUAL_THRESHOLD = 600_000;

/** Tabela regressiva de IR sobre o ganho NOMINAL (renda fixa em geral). */
export function regressiveRate(holdingDays: number): number {
  if (holdingDays <= 180) return 0.225;
  if (holdingDays <= 360) return 0.2;
  if (holdingDays <= 720) return 0.175;
  return 0.15;
}

/** Tabela dos ETFs de renda fixa: alíquota na fonte conforme o prazo médio (PMR). */
export function fixedIncomeEtfRate(pmrDays: number): number {
  if (pmrDays <= 180) return 0.25;
  if (pmrDays <= 720) return 0.2;
  return 0.15;
}

/** Tabela especial do Tesouro RendA+/Educa+ levado à conversão: piso de 10%. */
export function rendaMaisRate(holdingDays: number): number {
  // Mesma estrutura da regressiva, mas o piso cai para 10% na fase de conversão.
  if (holdingDays <= 180) return 0.225;
  if (holdingDays <= 360) return 0.2;
  if (holdingDays <= 720) return 0.175;
  if (holdingDays <= 1080) return 0.15;
  if (holdingDays <= 1440) return 0.125;
  return 0.1;
}

interface KindRule {
  /** Rendimentos/juros isentos de IR para PF (líquido = bruto). */
  incomeExempt: boolean;
  /**
   * Alíquota de IR sobre o rendimento na fase de RENDA, no cenário-base de
   * longo prazo (>720 dias / conversão). 0 para isentos.
   */
  incomeTaxRateLongTerm: number;
  /** Alíquota de ganho de capital na venda (quando aplicável). */
  capitalGainsRate: number;
  /** Cobertura do FGC. */
  fgc: boolean;
  legalBasis: string;
}

export const RULES_2026: Record<InstrumentKind, KindRule> = {
  // --- Tesouro Direto / renda fixa tributada (IR sobre ganho nominal) ---
  tesouroIpca: { incomeExempt: false, incomeTaxRateLongTerm: 0.15, capitalGainsRate: 0.15, fgc: false, legalBasis: "Lei 11.033/2004 (tabela regressiva)" },
  tesouroIpcaCoupon: { incomeExempt: false, incomeTaxRateLongTerm: 0.15, capitalGainsRate: 0.15, fgc: false, legalBasis: "Lei 11.033/2004" },
  tesouroPre: { incomeExempt: false, incomeTaxRateLongTerm: 0.15, capitalGainsRate: 0.15, fgc: false, legalBasis: "Lei 11.033/2004" },
  tesouroSelic: { incomeExempt: false, incomeTaxRateLongTerm: 0.15, capitalGainsRate: 0.15, fgc: false, legalBasis: "Lei 11.033/2004" },
  rendaMais: { incomeExempt: false, incomeTaxRateLongTerm: 0.1, capitalGainsRate: 0.1, fgc: false, legalBasis: "Tesouro RendA+ (tabela especial, piso 10%)" },
  educaMais: { incomeExempt: false, incomeTaxRateLongTerm: 0.1, capitalGainsRate: 0.1, fgc: false, legalBasis: "Tesouro Educa+ (tabela especial, piso 10%)" },

  cdb: { incomeExempt: false, incomeTaxRateLongTerm: 0.15, capitalGainsRate: 0.15, fgc: true, legalBasis: "Lei 11.033/2004; FGC" },
  debentureComum: { incomeExempt: false, incomeTaxRateLongTerm: 0.15, capitalGainsRate: 0.15, fgc: false, legalBasis: "Lei 11.033/2004" },
  fundoDI: { incomeExempt: false, incomeTaxRateLongTerm: 0.15, capitalGainsRate: 0.15, fgc: false, legalBasis: "Lei 11.033/2004 + come-cotas" },

  // --- Renda fixa ISENTA de IR para PF ---
  lci: { incomeExempt: true, incomeTaxRateLongTerm: 0, capitalGainsRate: 0, fgc: true, legalBasis: "Lei 11.033/2004 art. 3º IV; FGC" },
  lca: { incomeExempt: true, incomeTaxRateLongTerm: 0, capitalGainsRate: 0, fgc: true, legalBasis: "Lei 11.033/2004 art. 3º IV; FGC" },
  debentureIncentivada: { incomeExempt: true, incomeTaxRateLongTerm: 0, capitalGainsRate: 0, fgc: false, legalBasis: "Lei 12.431/2011 (isenta inclusive ganho de capital)" },
  cri: { incomeExempt: true, incomeTaxRateLongTerm: 0, capitalGainsRate: 0, fgc: false, legalBasis: "Lei 9.514/1997" },
  cra: { incomeExempt: true, incomeTaxRateLongTerm: 0, capitalGainsRate: 0, fgc: false, legalBasis: "Lei 11.076/2004" },
  fiInfra: { incomeExempt: true, incomeTaxRateLongTerm: 0, capitalGainsRate: 0, fgc: false, legalBasis: "FI-Infra (Lei 12.431): rendimentos E ganho de capital isentos para PF" },

  // --- Renda variável ---
  fii: { incomeExempt: true, incomeTaxRateLongTerm: 0, capitalGainsRate: 0.2, fgc: false, legalBasis: "Lei 11.196/2005 (rendimentos isentos; ganho de capital 20%)" },
  acaoDividendos: { incomeExempt: true, incomeTaxRateLongTerm: 0, capitalGainsRate: 0.15, fgc: false, legalBasis: "Dividendos isentos até R$50k/mês/empresa (Lei 1.087/2025); GC 15%" },
  equityEtf: { incomeExempt: false, incomeTaxRateLongTerm: 0.175, capitalGainsRate: 0.175, fgc: false, legalBasis: "ETF de ações: 17,5% no ganho, sem isenção de R$20k" },
  intlEtf: { incomeExempt: false, incomeTaxRateLongTerm: 0.175, capitalGainsRate: 0.175, fgc: false, legalBasis: "ETF internacional listado na B3: 17,5%" },
  fixedIncomeEtf: { incomeExempt: false, incomeTaxRateLongTerm: 0.15, capitalGainsRate: 0.15, fgc: false, legalBasis: "ETF de renda fixa: 25/20/15% por PMR" },
  bdr: { incomeExempt: false, incomeTaxRateLongTerm: 0.15, capitalGainsRate: 0.15, fgc: false, legalBasis: "BDR: 15% no ganho, sem isenção; dividendos via carnê-leão" },

  // --- Cripto ---
  cryptoDirect: { incomeExempt: false, incomeTaxRateLongTerm: 0.15, capitalGainsRate: 0.15, fgc: false, legalBasis: "Isenção vendas ≤ R$35k/mês; acima, 15–22,5% (MP 1303 caducou)" },
  cryptoEtf: { incomeExempt: false, incomeTaxRateLongTerm: 0.175, capitalGainsRate: 0.175, fgc: false, legalBasis: "Cripto ETF tributado como ETF de ações: 17,5%" },
};
