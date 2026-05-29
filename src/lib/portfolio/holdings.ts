import type { AssetSnapshot, AssetFamily, InstrumentKind } from "../marketData/instruments";
import type { MarketRates } from "../marketData";
import { realNetYield } from "../finance/perpetuity";
import { effectiveIncomeTaxRate, capitalGainsRate } from "../tax";
import { DEFAULT_SLEEVES, type SleeveKey } from "./assumptions";
import type { Allocation, ModelPortfolio } from "./models";

/** Um lançamento (compra/venda) que o usuário registra ao longo do tempo. */
export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  ticker: string;
  kind: InstrumentKind;
  type: "buy" | "sell";
  quantity: number;
  price: number; // por unidade, em R$
}

/** Posição consolidada a partir dos lançamentos (método do preço médio). */
export interface Position {
  ticker: string;
  kind: InstrumentKind;
  quantity: number;
  avgPrice: number;
  costBasis: number; // custo da posição remanescente (quantity × avgPrice)
}

/** Posição enriquecida com dados de mercado, sleeve e renda projetada. */
export interface EnrichedPosition extends Position {
  name: string;
  family: AssetFamily;
  sleeve: SleeveKey;
  currentPrice: number;
  marketValue: number;
  unrealizedPL: number;
  weight: number;
  monthlyNetIncome: number;
  inUniverse: boolean;
}

export interface RealPortfolio {
  positions: EnrichedPosition[];
  totalValue: number;
  totalCost: number;
  unrealizedPL: number;
  bySleeve: Partial<Record<SleeveKey, number>>;
  allocation: Partial<Record<SleeveKey, number>>;
  monthlyNetIncome: number;
}

/** Mapeia cada tipo de instrumento ao sleeve da carteira. */
export function kindToSleeve(kind: InstrumentKind): SleeveKey {
  switch (kind) {
    case "tesouroIpca":
    case "tesouroIpcaCoupon":
    case "rendaMais":
    case "educaMais":
      return "ipcaIncome";
    case "lci":
    case "lca":
    case "cri":
    case "cra":
    case "debentureIncentivada":
    case "fiInfra":
      return "isentos";
    case "fii":
    case "acaoDividendos":
      return "fiiAcoes";
    case "equityEtf":
    case "intlEtf":
    case "fixedIncomeEtf":
    case "bdr":
      return "etfGrowth";
    case "tesouroSelic":
    case "tesouroPre":
    case "cdb":
    case "debentureComum":
    case "fundoDI":
      return "caixa";
    case "cryptoDirect":
    case "cryptoEtf":
      return "cripto";
  }
}

/** Família (para UI/screener) a partir do tipo do instrumento. */
export function familyOfKind(kind: InstrumentKind): AssetFamily {
  switch (kind) {
    case "fii":
      return "fii";
    case "acaoDividendos":
      return "acao";
    case "equityEtf":
    case "intlEtf":
    case "fixedIncomeEtf":
    case "bdr":
      return "etf";
    case "cryptoDirect":
    case "cryptoEtf":
      return "cripto";
    default:
      return "rendaFixa";
  }
}

/** Consolida lançamentos em posições, em ordem cronológica (preço médio). */
export function aggregate(transactions: Transaction[]): Position[] {
  const byTicker = new Map<string, Position>();
  const ordered = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  for (const tx of ordered) {
    const key = tx.ticker.toUpperCase();
    const pos = byTicker.get(key) ?? { ticker: key, kind: tx.kind, quantity: 0, avgPrice: 0, costBasis: 0 };
    pos.kind = tx.kind; // mantém o tipo mais recente informado
    if (tx.type === "buy") {
      const newQty = pos.quantity + tx.quantity;
      pos.costBasis += tx.quantity * tx.price;
      pos.quantity = newQty;
      pos.avgPrice = newQty > 0 ? pos.costBasis / newQty : 0;
    } else {
      const sellQty = Math.min(tx.quantity, pos.quantity);
      pos.quantity -= sellQty;
      pos.costBasis = pos.quantity * pos.avgPrice; // baixa proporcional ao preço médio
    }
    byTicker.set(key, pos);
  }
  return [...byTicker.values()].filter((p) => p.quantity > 1e-9);
}

/** Nominal anual de um título de renda fixa, conforme o indexador. */
function nominalRate(asset: AssetSnapshot, rates: MarketRates): number | null {
  const cdi = rates.cdi ?? rates.selic ?? 0.1;
  switch (asset.rateKind) {
    case "prefixado":
      return asset.rate ?? null;
    case "cdiPercent":
      return (asset.rate ?? 0) * cdi;
    case "cdiPlus":
      return cdi + (asset.rate ?? 0);
    default:
      return null;
  }
}

/**
 * Rendimento real líquido gastável anual de uma posição (fração do valor de
 * mercado). Reaproveita a tese: isentos têm fator 1; renda fixa tributada paga
 * IR sobre o ganho nominal; ETFs entram como saque (ganho de capital); cripto = 0.
 */
export function positionRealNetYield(
  asset: AssetSnapshot | undefined,
  kind: InstrumentKind,
  rates: MarketRates,
  inflation: number,
): number {
  const family = asset?.family ?? familyOfKind(kind);
  const t = effectiveIncomeTaxRate(kind);

  if (family === "fii" || family === "acao") {
    // Distribuição em caixa líquida; o preço do ativo acompanha a inflação.
    return Math.max(0, (asset?.dividendYield12m ?? 0) * (1 - t));
  }
  if (family === "etf") {
    return Math.max(0, (DEFAULT_SLEEVES.etfGrowth.realReturn ?? 0.07) * (1 - capitalGainsRate(kind)));
  }
  if (family === "cripto") return 0;

  // Renda fixa
  if (asset?.rateKind === "ipcaPlus" || kind === "rendaMais" || kind === "educaMais") {
    return realNetYield(asset?.rate ?? DEFAULT_SLEEVES.ipcaIncome.realRate ?? 0.06, inflation, t);
  }
  const nominal = asset ? nominalRate(asset, rates) : null;
  if (nominal == null) return Math.max(0, realNetYield(0.06, inflation, t));
  return Math.max(0, nominal * (1 - t) - inflation);
}

/** Constrói a carteira real a partir dos lançamentos e dos dados de mercado. */
export function buildRealPortfolio(
  transactions: Transaction[],
  assets: AssetSnapshot[],
  rates: MarketRates,
  inflation: number,
): RealPortfolio {
  const byTicker = new Map(assets.map((a) => [a.ticker.toUpperCase(), a]));
  const positions = aggregate(transactions);

  const enriched: EnrichedPosition[] = positions.map((p) => {
    const asset = byTicker.get(p.ticker);
    const currentPrice = asset?.price ?? p.avgPrice;
    const marketValue = p.quantity * currentPrice;
    const sleeve = kindToSleeve(p.kind);
    const y = positionRealNetYield(asset, p.kind, rates, inflation);
    return {
      ...p,
      name: asset?.name ?? p.ticker,
      family: asset?.family ?? familyOfKind(p.kind),
      sleeve,
      currentPrice,
      marketValue,
      unrealizedPL: marketValue - p.costBasis,
      weight: 0,
      monthlyNetIncome: (marketValue * y) / 12,
      inUniverse: !!asset,
    };
  });

  const totalValue = enriched.reduce((s, p) => s + p.marketValue, 0);
  const totalCost = enriched.reduce((s, p) => s + p.costBasis, 0);
  const bySleeve: Partial<Record<SleeveKey, number>> = {};
  for (const p of enriched) {
    p.weight = totalValue > 0 ? p.marketValue / totalValue : 0;
    bySleeve[p.sleeve] = (bySleeve[p.sleeve] ?? 0) + p.marketValue;
  }
  const allocation: Partial<Record<SleeveKey, number>> = {};
  for (const [k, v] of Object.entries(bySleeve) as [SleeveKey, number][]) {
    allocation[k] = totalValue > 0 ? v / totalValue : 0;
  }

  return {
    positions: enriched.sort((a, b) => b.marketValue - a.marketValue),
    totalValue,
    totalCost,
    unrealizedPL: totalValue - totalCost,
    bySleeve,
    allocation,
    monthlyNetIncome: enriched.reduce((s, p) => s + p.monthlyNetIncome, 0),
  };
}

export interface SleeveComparison {
  sleeve: SleeveKey;
  label: string;
  realWeight: number;
  targetWeight: number;
  delta: number; // real − alvo
}

/** Compara a alocação real com a de uma carteira-modelo, sleeve a sleeve. */
export function compareToModel(real: Allocation, model: ModelPortfolio): SleeveComparison[] {
  const keys = new Set<SleeveKey>([
    ...(Object.keys(real) as SleeveKey[]),
    ...(Object.keys(model.allocation) as SleeveKey[]),
  ]);
  return [...keys]
    .map((sleeve) => {
      const realWeight = real[sleeve] ?? 0;
      const targetWeight = model.allocation[sleeve] ?? 0;
      return { sleeve, label: DEFAULT_SLEEVES[sleeve].label, realWeight, targetWeight, delta: realWeight - targetWeight };
    })
    .sort((a, b) => b.targetWeight - a.targetWeight);
}
