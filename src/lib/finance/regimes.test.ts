import { describe, it, expect } from "vitest";
import { accumulationByRegime, equityBreakevenPremium } from "./regimes";

describe("accumulationByRegime", () => {
  const r = accumulationByRegime(0.065, 0.04, 24, 0);

  it("isento compõe à taxa cheia (CAGR = taxa bruta)", () => {
    const exempt = r.find((x) => x.key === "exempt")!;
    expect(exempt.netCagr).toBeCloseTo(0.065, 6);
    expect(exempt.netFactor).toBeCloseTo(Math.pow(1.065, 24), 4);
  });

  it("isento > IPCA+ diferido > come-cotas (à MESMA taxa bruta)", () => {
    const exempt = r.find((x) => x.key === "exempt")!.netFactor;
    const ipca = r.find((x) => x.key === "ipca")!.netFactor;
    const cc = r.find((x) => x.key === "comecotas")!.netFactor;
    expect(exempt).toBeGreaterThan(ipca);
    expect(ipca).toBeGreaterThan(cc);
  });

  it("come-cotas é o pior (vazamento semestral)", () => {
    const factors = r.map((x) => x.netFactor);
    const cc = r.find((x) => x.key === "comecotas")!.netFactor;
    expect(cc).toBe(Math.min(...factors));
  });

  it("com prêmio de retorno suficiente, o ETF supera o isento", () => {
    const withPremium = accumulationByRegime(0.065, 0.04, 24, 0.03);
    const exempt = withPremium.find((x) => x.key === "exempt")!.netFactor;
    const etf = withPremium.find((x) => x.key === "etf")!.netFactor;
    expect(etf).toBeGreaterThan(exempt);
  });
});

describe("equityBreakevenPremium", () => {
  it("é positivo (a bolsa precisa de prêmio para empatar com o isento)", () => {
    const p = equityBreakevenPremium(0.065, 0.04, 24);
    expect(p).not.toBeNull();
    expect(p!).toBeGreaterThan(0);
    expect(p!).toBeLessThan(0.05);
  });

  it("no prêmio de equilíbrio, ETF e isento empatam", () => {
    const p = equityBreakevenPremium(0.065, 0.04, 24)!;
    const r = accumulationByRegime(0.065, 0.04, 24, p);
    const exempt = r.find((x) => x.key === "exempt")!.netFactor;
    const etf = r.find((x) => x.key === "etf")!.netFactor;
    expect(etf).toBeCloseTo(exempt, 2);
  });
});
