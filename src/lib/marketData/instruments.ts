/** Identidade de cada classe/subtipo de ativo do universo coberto. */
export type InstrumentKind =
  // Tesouro Direto
  | "tesouroIpca"
  | "tesouroIpcaCoupon"
  | "tesouroPre"
  | "tesouroSelic"
  | "rendaMais"
  | "educaMais"
  // Crédito / bancário
  | "cdb"
  | "lci"
  | "lca"
  | "debentureComum"
  | "debentureIncentivada"
  | "cri"
  | "cra"
  | "fundoDI"
  | "fiInfra"
  // Renda variável
  | "fii"
  | "acaoDividendos"
  | "equityEtf"
  | "intlEtf"
  | "fixedIncomeEtf"
  | "bdr"
  // Cripto
  | "cryptoDirect"
  | "cryptoEtf";

/** Papel do ativo na carteira de aposentadoria. */
export type IncomeRole = "income" | "growth" | "cash" | "satellite";

/** Famílias usadas pelo screener e pela UI. */
export type AssetFamily = "rendaFixa" | "fii" | "acao" | "etf" | "cripto";

export interface AssetSnapshot {
  ticker: string;
  name: string;
  kind: InstrumentKind;
  family: AssetFamily;
  sector?: string | null;
  price?: number | null;
  asOf?: string;
  source?: string;
  // valuation
  pvp?: number | null;
  pl?: number | null;
  roe?: number | null;
  // renda
  dividendYield12m?: number | null;
  dividendConsistency?: number | null; // 0..1 (1 = muito consistente)
  payoutRatio?: number | null;
  // risco / qualidade
  avgDailyLiquidity?: number | null; // R$/dia
  netDebtToEbitda?: number | null;
  vacancy?: number | null; // FII (financeira, 0..1)
  numAssets?: number | null;
  numCotistas?: number | null;
  // ETF
  ter?: number | null; // taxa de administração (decimal)
  aum?: number | null; // patrimônio (R$)
  trackingError?: number | null;
  benchmark?: string | null;
  // renda fixa de crédito
  rate?: number | null; // taxa (real p/ IPCA+, % do CDI p/ pós, etc.)
  rateKind?: "ipcaPlus" | "prefixado" | "cdiPercent" | "cdiPlus" | null;
  maturity?: string | null;
  fgc?: boolean | null;
  rating?: string | null;
  // cripto
  marketCap?: number | null;
  volatility?: number | null; // anualizada
  // meta
  stale?: boolean;
}
