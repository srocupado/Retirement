import { describe, it, expect } from "vitest";
import { routeContribution } from "./contributionRouter";
import { buildRealPortfolio, type Transaction } from "./holdings";
import { MODEL_PORTFOLIOS } from "./models";
import { SEED_ASSETS } from "../marketData/seed";
import { screenAll } from "../screener";
import type { MarketRates } from "../marketData";

const rates: MarketRates = { cdi: 0.1065, selic: 0.1075, ipca12m: 0.04, asOf: "test", source: "test" };
const renda = MODEL_PORTFOLIOS.find((m) => m.id === "renda")!;

function portfolioOf(txns: Transaction[]) {
  return buildRealPortfolio(txns, SEED_ASSETS, rates, 0.04);
}

describe("routeContribution", () => {
  it("o rateio soma exatamente o aporte do mês", () => {
    const real = portfolioOf([
      { id: "1", date: "2026-01-10", ticker: "HGLG11", kind: "fii", type: "buy", quantity: 100, price: 160 },
    ]);
    const route = routeContribution(real, renda, 3000, screenAll(SEED_ASSETS));
    const sum = route.slices.reduce((s, x) => s + x.amount, 0);
    expect(sum).toBeCloseTo(3000, 6);
  });

  it("sleeve acima do alvo recebe zero (rebalanceamento só por compra)", () => {
    // 100% em FII → fiiAcoes muito acima do alvo de 40% da carteira Renda
    const real = portfolioOf([
      { id: "1", date: "2026-01-10", ticker: "HGLG11", kind: "fii", type: "buy", quantity: 1000, price: 160 },
    ]);
    const route = routeContribution(real, renda, 3000, []);
    const fii = route.slices.find((s) => s.sleeve === "fiiAcoes")!;
    expect(fii.amount).toBe(0);
  });

  it("carteira vazia: divide o aporte pelos pesos-alvo", () => {
    const route = routeContribution(portfolioOf([]), renda, 1000, []);
    for (const s of route.slices) {
      expect(s.amount).toBeCloseTo(1000 * s.targetWeight, 6);
    }
  });

  it("aporte aproxima os pesos do alvo (afterWeight entre atual e alvo)", () => {
    const real = portfolioOf([
      { id: "1", date: "2026-01-10", ticker: "HGLG11", kind: "fii", type: "buy", quantity: 100, price: 160 },
      { id: "2", date: "2026-01-10", ticker: "KDIF11", kind: "fiInfra", type: "buy", quantity: 50, price: 105 },
    ]);
    const route = routeContribution(real, renda, 5000, []);
    const isentos = route.slices.find((s) => s.sleeve === "isentos")!;
    expect(isentos.afterWeight).toBeGreaterThan(isentos.currentWeight);
    expect(isentos.afterWeight).toBeLessThanOrEqual(isentos.targetWeight + 1e-9);
  });

  it("alerta quando cripto excede o teto da carteira", () => {
    const real = portfolioOf([
      { id: "1", date: "2026-01-10", ticker: "BTC", kind: "cryptoDirect", type: "buy", quantity: 0.01, price: 550000 },
      { id: "2", date: "2026-01-10", ticker: "HGLG11", kind: "fii", type: "buy", quantity: 100, price: 160 },
    ]);
    // BTC ≈ 5.500 de ~21.500 → ~25% >> teto de 5% da carteira Renda
    const route = routeContribution(real, renda, 1000, []);
    expect(route.warnings.some((w) => w.toLowerCase().includes("cripto"))).toBe(true);
    expect(route.slices.find((s) => s.sleeve === "cripto")!.amount).toBe(0);
  });

  it("alerta de FGC quando CDB/LCI/LCA passam de R$250 mil", () => {
    const real = portfolioOf([
      { id: "1", date: "2026-01-10", ticker: "CDB-X", kind: "cdb", type: "buy", quantity: 300000, price: 1 },
    ]);
    const route = routeContribution(real, renda, 1000, []);
    expect(route.warnings.some((w) => w.includes("FGC"))).toBe(true);
  });

  it("traz exemplos de ativos reais do screening por sleeve", () => {
    const route = routeContribution(portfolioOf([]), renda, 1000, screenAll(SEED_ASSETS));
    const isentos = route.slices.find((s) => s.sleeve === "isentos")!;
    expect(isentos.examples.map((e) => e.ticker)).toContain("KDIF11");
  });
});
