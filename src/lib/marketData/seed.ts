import type { AssetSnapshot } from "./instruments";

/**
 * Dataset semente embarcado para a ferramenta funcionar OFFLINE (sem rede/token).
 *
 * ATENÇÃO: valores APROXIMADOS, de caráter EDUCACIONAL, referência ~início de 2026.
 * NÃO são cotações em tempo real nem recomendação. Quando os dados ao vivo
 * estiverem disponíveis (brapi/BCB/Tesouro), eles substituem estes.
 */
export const SEED_AS_OF = "2026-01-15";

const seed = (a: AssetSnapshot): AssetSnapshot => ({ ...a, asOf: SEED_AS_OF, source: "seed", stale: true });

export const SEED_ASSETS: AssetSnapshot[] = [
  // ===================== FIIs =====================
  seed({ ticker: "KNRI11", name: "Kinea Renda Imobiliária", kind: "fii", family: "fii", sector: "híbrido", price: 158, dividendYield12m: 0.085, pvp: 0.93, vacancy: 0.06, numAssets: 18, numCotistas: 250000, avgDailyLiquidity: 6_000_000, dividendConsistency: 0.95 }),
  seed({ ticker: "HGLG11", name: "CSHG Logística", kind: "fii", family: "fii", sector: "logística", price: 162, dividendYield12m: 0.088, pvp: 0.98, vacancy: 0.03, numAssets: 20, numCotistas: 300000, avgDailyLiquidity: 7_000_000, dividendConsistency: 0.93 }),
  seed({ ticker: "MXRF11", name: "Maxi Renda", kind: "fii", family: "fii", sector: "papel", price: 10.2, dividendYield12m: 0.115, pvp: 1.0, vacancy: 0.0, numAssets: 60, numCotistas: 1300000, avgDailyLiquidity: 12_000_000, dividendConsistency: 0.9 }),
  seed({ ticker: "XPML11", name: "XP Malls", kind: "fii", family: "fii", sector: "shopping", price: 110, dividendYield12m: 0.09, pvp: 0.95, vacancy: 0.04, numAssets: 22, numCotistas: 400000, avgDailyLiquidity: 8_000_000, dividendConsistency: 0.9 }),
  seed({ ticker: "BTLG11", name: "BTG Logística", kind: "fii", family: "fii", sector: "logística", price: 101, dividendYield12m: 0.092, pvp: 0.97, vacancy: 0.02, numAssets: 15, numCotistas: 200000, avgDailyLiquidity: 5_000_000, dividendConsistency: 0.92 }),
  seed({ ticker: "KNCR11", name: "Kinea Rendimentos", kind: "fii", family: "fii", sector: "papel", price: 102, dividendYield12m: 0.105, pvp: 1.0, vacancy: 0.0, numAssets: 50, numCotistas: 350000, avgDailyLiquidity: 9_000_000, dividendConsistency: 0.94 }),
  seed({ ticker: "HGRU11", name: "CSHG Renda Urbana", kind: "fii", family: "fii", sector: "híbrido", price: 118, dividendYield12m: 0.095, pvp: 0.92, vacancy: 0.01, numAssets: 90, numCotistas: 280000, avgDailyLiquidity: 4_000_000, dividendConsistency: 0.93 }),
  seed({ ticker: "VISC11", name: "Vinci Shopping Centers", kind: "fii", family: "fii", sector: "shopping", price: 105, dividendYield12m: 0.094, pvp: 0.85, vacancy: 0.05, numAssets: 20, numCotistas: 240000, avgDailyLiquidity: 4_500_000, dividendConsistency: 0.88 }),
  seed({ ticker: "RECR11", name: "REC Recebíveis Imobiliários", kind: "fii", family: "fii", sector: "papel", price: 78, dividendYield12m: 0.135, pvp: 0.82, vacancy: 0.0, numAssets: 45, numCotistas: 160000, avgDailyLiquidity: 2_500_000, dividendConsistency: 0.78 }),
  seed({ ticker: "VGHF11", name: "Valora Hedge Fund", kind: "fii", family: "fii", sector: "híbrido", price: 8.6, dividendYield12m: 0.17, pvp: 0.88, vacancy: 0.0, numAssets: 40, numCotistas: 300000, avgDailyLiquidity: 3_000_000, dividendConsistency: 0.6 }),

  // ===================== Ações pagadoras =====================
  seed({ ticker: "ITUB4", name: "Itaú Unibanco", kind: "acaoDividendos", family: "acao", sector: "bancos", price: 35, dividendYield12m: 0.06, pl: 9, roe: 0.21, payoutRatio: 0.6, netDebtToEbitda: 0, avgDailyLiquidity: 800_000_000, dividendConsistency: 0.95 }),
  seed({ ticker: "BBAS3", name: "Banco do Brasil", kind: "acaoDividendos", family: "acao", sector: "bancos", price: 27, dividendYield12m: 0.09, pl: 5, roe: 0.2, payoutRatio: 0.45, netDebtToEbitda: 0, avgDailyLiquidity: 600_000_000, dividendConsistency: 0.92 }),
  seed({ ticker: "TAEE11", name: "Taesa", kind: "acaoDividendos", family: "acao", sector: "energia (transmissão)", price: 36, dividendYield12m: 0.09, pl: 8, roe: 0.18, payoutRatio: 0.75, netDebtToEbitda: 2.8, avgDailyLiquidity: 120_000_000, dividendConsistency: 0.9 }),
  seed({ ticker: "BBSE3", name: "BB Seguridade", kind: "acaoDividendos", family: "acao", sector: "seguros", price: 38, dividendYield12m: 0.085, pl: 10, roe: 0.55, payoutRatio: 0.8, netDebtToEbitda: 0, avgDailyLiquidity: 200_000_000, dividendConsistency: 0.9 }),
  seed({ ticker: "EGIE3", name: "Engie Brasil", kind: "acaoDividendos", family: "acao", sector: "energia (geração)", price: 42, dividendYield12m: 0.07, pl: 11, roe: 0.3, payoutRatio: 0.75, netDebtToEbitda: 2.5, avgDailyLiquidity: 130_000_000, dividendConsistency: 0.9 }),
  seed({ ticker: "CPLE6", name: "Copel", kind: "acaoDividendos", family: "acao", sector: "energia (elétrica)", price: 11, dividendYield12m: 0.055, pl: 8, roe: 0.12, payoutRatio: 0.4, netDebtToEbitda: 1.8, avgDailyLiquidity: 150_000_000, dividendConsistency: 0.7 }),
  seed({ ticker: "VIVT3", name: "Telefônica Brasil (Vivo)", kind: "acaoDividendos", family: "acao", sector: "telecom", price: 52, dividendYield12m: 0.065, pl: 14, roe: 0.1, payoutRatio: 0.85, netDebtToEbitda: 0.6, avgDailyLiquidity: 180_000_000, dividendConsistency: 0.85 }),
  seed({ ticker: "SAPR11", name: "Sanepar", kind: "acaoDividendos", family: "acao", sector: "saneamento", price: 28, dividendYield12m: 0.07, pl: 7, roe: 0.16, payoutRatio: 0.5, netDebtToEbitda: 1.5, avgDailyLiquidity: 60_000_000, dividendConsistency: 0.8 }),
  seed({ ticker: "VALE3", name: "Vale", kind: "acaoDividendos", family: "acao", sector: "mineração", price: 60, dividendYield12m: 0.1, pl: 6, roe: 0.22, payoutRatio: 0.5, netDebtToEbitda: 0.5, avgDailyLiquidity: 2_000_000_000, dividendConsistency: 0.75 }),

  // ===================== ETFs =====================
  seed({ ticker: "BOVA11", name: "iShares Ibovespa", kind: "equityEtf", family: "etf", sector: "índice BR", price: 130, benchmark: "IBOV", ter: 0.001, aum: 6_000_000_000, trackingError: 0.003, avgDailyLiquidity: 300_000_000, dividendYield12m: 0 }),
  seed({ ticker: "IVVB11", name: "iShares S&P 500 (BRL)", kind: "intlEtf", family: "etf", sector: "índice internacional", price: 350, benchmark: "S&P 500", ter: 0.0023, aum: 5_000_000_000, trackingError: 0.004, avgDailyLiquidity: 150_000_000, dividendYield12m: 0 }),
  seed({ ticker: "SMAL11", name: "iShares Small Caps", kind: "equityEtf", family: "etf", sector: "small caps BR", price: 95, benchmark: "SMLL", ter: 0.0069, aum: 1_200_000_000, trackingError: 0.006, avgDailyLiquidity: 40_000_000, dividendYield12m: 0 }),
  seed({ ticker: "IMAB11", name: "It Now IMA-B (NTN-B)", kind: "fixedIncomeEtf", family: "etf", sector: "renda fixa IPCA+", price: 95, benchmark: "IMA-B", ter: 0.0025, aum: 800_000_000, trackingError: 0.004, avgDailyLiquidity: 20_000_000, dividendYield12m: 0 }),
  seed({ ticker: "FIXA11", name: "It Now Pré (IRF-M)", kind: "fixedIncomeEtf", family: "etf", sector: "renda fixa prefixada", price: 100, benchmark: "IRF-M", ter: 0.002, aum: 300_000_000, trackingError: 0.004, avgDailyLiquidity: 8_000_000, dividendYield12m: 0 }),
  seed({ ticker: "HASH11", name: "Hashdex Crypto Index", kind: "cryptoEtf", family: "cripto", sector: "índice cripto", price: 38, benchmark: "Nasdaq Crypto Index", ter: 0.013, aum: 1_500_000_000, trackingError: 0.01, avgDailyLiquidity: 30_000_000, volatility: 0.65, dividendYield12m: 0 }),

  // ===================== Cripto direta =====================
  seed({ ticker: "BTC", name: "Bitcoin", kind: "cryptoDirect", family: "cripto", price: 550000, marketCap: 2_000_000_000_000, volatility: 0.55, avgDailyLiquidity: 1_000_000_000, dividendYield12m: 0 }),
  seed({ ticker: "ETH", name: "Ethereum", kind: "cryptoDirect", family: "cripto", price: 18000, marketCap: 450_000_000_000, volatility: 0.7, avgDailyLiquidity: 500_000_000, dividendYield12m: 0 }),

  // ===================== Renda fixa (títulos/ofertas) =====================
  seed({ ticker: "TD-IPCA-2050", name: "Tesouro IPCA+ 2050", kind: "tesouroIpca", family: "rendaFixa", rate: 0.0695, rateKind: "ipcaPlus", maturity: "2050-05-15", fgc: false, rating: "soberano", dividendYield12m: 0 }),
  seed({ ticker: "TD-RENDA-2050", name: "Tesouro RendA+ 2050", kind: "rendaMais", family: "rendaFixa", rate: 0.072, rateKind: "ipcaPlus", maturity: "2050-12-15", fgc: false, rating: "soberano", dividendYield12m: 0 }),
  seed({ ticker: "TD-SELIC-2029", name: "Tesouro Selic 2029", kind: "tesouroSelic", family: "rendaFixa", rate: 1.0, rateKind: "cdiPercent", maturity: "2029-03-01", fgc: false, rating: "soberano", dividendYield12m: 0 }),
  seed({ ticker: "TD-PRE-2031", name: "Tesouro Prefixado 2031", kind: "tesouroPre", family: "rendaFixa", rate: 0.135, rateKind: "prefixado", maturity: "2031-01-01", fgc: false, rating: "soberano", dividendYield12m: 0 }),
  seed({ ticker: "LCI-90CDI", name: "LCI 90% CDI (banco médio)", kind: "lci", family: "rendaFixa", rate: 0.9, rateKind: "cdiPercent", maturity: "2028-06-01", fgc: true, rating: "A", dividendYield12m: 0 }),
  seed({ ticker: "LCA-IPCA5", name: "LCA IPCA+ 5% (banco grande)", kind: "lca", family: "rendaFixa", rate: 0.05, rateKind: "ipcaPlus", maturity: "2030-01-01", fgc: true, rating: "AAA", dividendYield12m: 0 }),
  seed({ ticker: "CDB-110CDI", name: "CDB 110% CDI (banco médio)", kind: "cdb", family: "rendaFixa", rate: 1.1, rateKind: "cdiPercent", maturity: "2029-01-01", fgc: true, rating: "A", dividendYield12m: 0 }),
  seed({ ticker: "DEB-INC-IPCA7", name: "Debênture incentivada IPCA+ 7% (infra)", kind: "debentureIncentivada", family: "rendaFixa", rate: 0.07, rateKind: "ipcaPlus", maturity: "2035-01-01", fgc: false, rating: "AA", dividendYield12m: 0 }),
  seed({ ticker: "CRI-IPCA8", name: "CRI IPCA+ 8%", kind: "cri", family: "rendaFixa", rate: 0.08, rateKind: "ipcaPlus", maturity: "2034-01-01", fgc: false, rating: "A", dividendYield12m: 0 }),
  seed({ ticker: "CRA-IPCA75", name: "CRA IPCA+ 7,5%", kind: "cra", family: "rendaFixa", rate: 0.075, rateKind: "ipcaPlus", maturity: "2033-01-01", fgc: false, rating: "A", dividendYield12m: 0 }),
];
