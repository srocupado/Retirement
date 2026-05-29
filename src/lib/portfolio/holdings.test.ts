import { describe, it, expect } from "vitest";
import { aggregate, buildRealPortfolio, compareToModel, kindToSleeve, type Transaction } from "./holdings";
import { composeModel } from "./composition";
import { MODEL_PORTFOLIOS } from "./models";
import { SEED_ASSETS } from "../marketData/seed";
import { screenAll } from "../screener";
import type { MarketRates } from "../marketData";

const rates: MarketRates = { cdi: 0.1065, selic: 0.1075, ipca12m: 0.04, asOf: "test", source: "test" };

const txns: Transaction[] = [
  { id: "1", date: "2026-01-10", ticker: "HGLG11", kind: "fii", type: "buy", quantity: 100, price: 150 },
  { id: "2", date: "2026-02-10", ticker: "HGLG11", kind: "fii", type: "buy", quantity: 100, price: 170 },
  { id: "3", date: "2026-03-10", ticker: "HGLG11", kind: "fii", type: "sell", quantity: 50, price: 165 },
  { id: "4", date: "2026-01-15", ticker: "ITUB4", kind: "acaoDividendos", type: "buy", quantity: 200, price: 30 },
];

describe("aggregate", () => {
  it("consolida com preço médio e baixa proporcional na venda", () => {
    const positions = aggregate(txns);
    const hglg = positions.find((p) => p.ticker === "HGLG11")!;
    expect(hglg.quantity).toBe(150); // 100 + 100 − 50
    expect(hglg.avgPrice).toBeCloseTo(160, 6); // (100×150 + 100×170)/200
  });

  it("remove posições zeradas", () => {
    const zeroed = aggregate([
      { id: "a", date: "2026-01-01", ticker: "XPML11", kind: "fii", type: "buy", quantity: 10, price: 100 },
      { id: "b", date: "2026-02-01", ticker: "XPML11", kind: "fii", type: "sell", quantity: 10, price: 110 },
    ]);
    expect(zeroed.find((p) => p.ticker === "XPML11")).toBeUndefined();
  });
});

describe("buildRealPortfolio", () => {
  const rp = buildRealPortfolio(txns, SEED_ASSETS, rates, 0.04);

  it("usa o preço de mercado atual e calcula valor/peso", () => {
    const total = rp.positions.reduce((s, p) => s + p.marketValue, 0);
    expect(rp.totalValue).toBeCloseTo(total, 6);
    expect(rp.positions.reduce((s, p) => s + p.weight, 0)).toBeCloseTo(1, 6);
  });

  it("agrupa por sleeve (FII e ação caem em fiiAcoes)", () => {
    expect(rp.allocation.fiiAcoes).toBeGreaterThan(0);
    expect(kindToSleeve("fii")).toBe("fiiAcoes");
  });

  it("projeta renda líquida mensal positiva (FII isento + dividendos)", () => {
    expect(rp.monthlyNetIncome).toBeGreaterThan(0);
  });
});

describe("compareToModel", () => {
  it("calcula o delta real − alvo por sleeve", () => {
    const rp = buildRealPortfolio(txns, SEED_ASSETS, rates, 0.04);
    const renda = MODEL_PORTFOLIOS.find((m) => m.id === "renda")!;
    const cmp = compareToModel(rp.allocation, renda);
    const fii = cmp.find((c) => c.sleeve === "fiiAcoes")!;
    expect(fii.delta).toBeCloseTo(fii.realWeight - fii.targetWeight, 6);
  });
});

describe("composeModel", () => {
  it("preenche cada sleeve com ativos reais do screening", () => {
    const results = screenAll(SEED_ASSETS);
    const comp = composeModel(MODEL_PORTFOLIOS.find((m) => m.id === "renda")!, results);
    const fiiSleeve = comp.sleeves.find((s) => s.sleeve === "fiiAcoes");
    expect(fiiSleeve).toBeDefined();
    expect(fiiSleeve!.examples.length).toBeGreaterThan(0);
    expect(fiiSleeve!.examples[0].ticker).toBeTruthy();
  });

  it("o bloco 'isentos' é preenchido com ativos reais (FI-Infra), não com texto genérico", () => {
    const results = screenAll(SEED_ASSETS);
    const comp = composeModel(MODEL_PORTFOLIOS.find((m) => m.id === "renda")!, results);
    const isentos = comp.sleeves.find((s) => s.sleeve === "isentos")!;
    expect(isentos.examples.length).toBeGreaterThan(0);
    expect(isentos.examples.map((e) => e.ticker)).toContain("KDIF11");
  });

  it("FI-Infra é isento inclusive no ganho de capital", () => {
    expect(kindToSleeve("fiInfra")).toBe("isentos");
  });
});
