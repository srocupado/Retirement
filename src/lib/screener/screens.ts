import type { AssetSnapshot } from "../marketData/instruments";
import { triangular, higherIsBetter, lowerIsBetter, fraction } from "./curves";
import { scoreAsset, type ScreenConfig, type ScreenResult } from "./score";

const num = (v: number | null | undefined): number | null => (v == null ? null : v);

/** FIIs: foco em renda isenta sustentável, evitando yield-traps. */
function fiiConfig(ifixMedianDY: number): ScreenConfig {
  return {
    gates: [
      { label: "liquidez ≥ R$1M/dia", pass: (a) => (a.avgDailyLiquidity ?? 0) >= 1_000_000 },
      { label: "elegível à isenção (≥100 cotistas)", pass: (a) => (a.numCotistas ?? 0) >= 100 },
    ],
    metrics: [
      { key: "dy", label: "Dividend yield 12m", weight: 0.25, value: (a) => num(a.dividendYield12m), curve: (v) => triangular(v, 0.05, 0.095, 0.16) },
      { key: "pvp", label: "P/VP", weight: 0.2, value: (a) => num(a.pvp), curve: (v) => triangular(v, 0.6, 0.95, 1.3) },
      { key: "consist", label: "Consistência das distribuições", weight: 0.2, value: (a) => num(a.dividendConsistency), curve: fraction },
      { key: "vacancy", label: "Vacância financeira", weight: 0.2, value: (a) => num(a.vacancy), curve: (v) => lowerIsBetter(v, 0.03, 0.2) },
      { key: "diversif", label: "Nº de imóveis/CRIs", weight: 0.15, value: (a) => num(a.numAssets), curve: (v) => higherIsBetter(v, 3, 20) },
    ],
    flags: [
      { test: (a) => (a.dividendYield12m ?? 0) > 1.4 * ifixMedianDY, message: "Possível yield-trap (DY muito acima da mediana do IFIX)" },
      { test: (a) => (a.vacancy ?? 0) > 0.15, message: "Vacância elevada (>15%)" },
      { test: (a) => (a.dividendConsistency ?? 1) < 0.7, message: "Distribuições inconsistentes" },
    ],
  };
}

/** Ações pagadoras: renda via dividendos com qualidade e sustentabilidade. */
const stockConfig: ScreenConfig = {
  gates: [{ label: "liquidez ≥ R$5M/dia", pass: (a) => (a.avgDailyLiquidity ?? 0) >= 5_000_000 }],
  metrics: [
    { key: "dy", label: "Dividend yield 12m", weight: 0.2, value: (a) => num(a.dividendYield12m), curve: (v) => triangular(v, 0.02, 0.08, 0.14) },
    { key: "payout", label: "Payout", weight: 0.2, value: (a) => num(a.payoutRatio), curve: (v) => triangular(v, 0.2, 0.55, 0.95) },
    { key: "roe", label: "ROE", weight: 0.2, value: (a) => num(a.roe), curve: (v) => higherIsBetter(v, 0.1, 0.25) },
    { key: "debt", label: "Dívida líq/EBITDA", weight: 0.15, value: (a) => num(a.netDebtToEbitda), curve: (v) => lowerIsBetter(v, 1, 3.5) },
    { key: "consist", label: "Histórico de dividendos", weight: 0.15, value: (a) => num(a.dividendConsistency), curve: fraction },
    { key: "valuation", label: "P/L", weight: 0.1, value: (a) => num(a.pl), curve: (v) => lowerIsBetter(v, 6, 20) },
  ],
  flags: [
    { test: (a) => (a.payoutRatio ?? 0) > 0.9, message: "Payout muito alto (sustentabilidade?)" },
    { test: (a) => (a.netDebtToEbitda ?? 0) > 3.5, message: "Alavancagem elevada" },
  ],
};

/** ETFs: veículos de crescimento — custo, aderência e liquidez. */
const etfConfig: ScreenConfig = {
  gates: [{ label: "liquidez ≥ R$5M/dia", pass: (a) => (a.avgDailyLiquidity ?? 0) >= 5_000_000 }],
  metrics: [
    { key: "ter", label: "Taxa de administração", weight: 0.35, value: (a) => num(a.ter), curve: (v) => lowerIsBetter(v, 0.002, 0.015) },
    { key: "track", label: "Tracking error", weight: 0.25, value: (a) => num(a.trackingError), curve: (v) => lowerIsBetter(v, 0.002, 0.012) },
    { key: "liq", label: "Liquidez diária", weight: 0.2, value: (a) => num(a.avgDailyLiquidity), curve: (v) => higherIsBetter(v, 5_000_000, 100_000_000) },
    { key: "aum", label: "Patrimônio (AUM)", weight: 0.2, value: (a) => num(a.aum), curve: (v) => higherIsBetter(v, 100_000_000, 3_000_000_000) },
  ],
  flags: [
    { test: (a) => (a.ter ?? 0) > 0.005, message: "TER acima de 0,50%" },
    { test: (a) => (a.aum ?? Infinity) < 100_000_000, message: "AUM baixo (risco de fechamento/liquidez)" },
  ],
};

/** Renda fixa de crédito: prêmio de taxa, crédito e cobertura. */
const fixedIncomeConfig: ScreenConfig = {
  gates: [],
  metrics: [
    { key: "rate", label: "Taxa (real/proxy)", weight: 0.4, value: (a) => num(a.rate), curve: (v) => higherIsBetter(v, 0.03, 0.09) },
    { key: "credit", label: "Qualidade de crédito", weight: 0.35, value: (a) => ratingScore(a.rating), curve: (v) => v },
    { key: "fgc", label: "Cobertura FGC", weight: 0.25, value: (a) => (a.fgc ? 100 : 0), curve: (v) => v },
  ],
  flags: [
    { test: (a) => !a.fgc && (a.rating ?? "").length > 0 && ratingScore(a.rating)! < 60, message: "Sem FGC e rating moderado — risco de crédito" },
  ],
};

/** Cripto: satélite de alto risco — métricas limitadas + disclaimer. */
const cryptoConfig: ScreenConfig = {
  gates: [{ label: "liquidez ≥ R$10M/dia", pass: (a) => (a.avgDailyLiquidity ?? 0) >= 10_000_000 }],
  metrics: [
    { key: "liq", label: "Liquidez", weight: 0.5, value: (a) => num(a.avgDailyLiquidity), curve: (v) => higherIsBetter(v, 10_000_000, 1_000_000_000) },
    { key: "vol", label: "Volatilidade (menor melhor)", weight: 0.5, value: (a) => num(a.volatility), curve: (v) => lowerIsBetter(v, 0.4, 1.0) },
  ],
  flags: [{ test: () => true, message: "Satélite de alto risco — não gera renda; alocação com teto rígido" }],
};

function ratingScore(rating?: string | null): number | null {
  if (!rating) return null;
  const map: Record<string, number> = { soberano: 100, AAA: 95, AA: 85, A: 70, BBB: 55, BB: 35, B: 20 };
  return map[rating] ?? 50;
}

/** Mediana de uma lista numérica. */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Roda o screening de toda a lista, despachando por família. */
export function screenAll(assets: AssetSnapshot[]): ScreenResult[] {
  const fiiDYs = assets.filter((a) => a.family === "fii" && a.dividendYield12m != null).map((a) => a.dividendYield12m!);
  const ifixMedianDY = median(fiiDYs) || 0.09;
  const fii = fiiConfig(ifixMedianDY);

  return assets.map((a) => {
    switch (a.family) {
      case "fii":
        return scoreAsset(a, fii);
      case "acao":
        return scoreAsset(a, stockConfig);
      case "etf":
        return scoreAsset(a, etfConfig);
      case "rendaFixa":
        return scoreAsset(a, fixedIncomeConfig);
      case "cripto":
        return scoreAsset(a, cryptoConfig);
    }
  });
}

/** Top-N por família (apenas aprovados em gates), ordenados por score. */
export function topByFamily(results: ScreenResult[], family: AssetSnapshot["family"], n = 5): ScreenResult[] {
  return results
    .filter((r) => r.family === family && r.passedGates && r.composite != null)
    .sort((a, b) => (b.composite ?? 0) - (a.composite ?? 0))
    .slice(0, n);
}
