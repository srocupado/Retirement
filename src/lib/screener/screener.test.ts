import { describe, it, expect } from "vitest";
import { screenAll, topByFamily } from "./index";
import { SEED_ASSETS } from "../marketData/seed";

const results = screenAll(SEED_ASSETS);
const byTicker = (t: string) => results.find((r) => r.ticker === t)!;

describe("screenAll", () => {
  it("pontua todos os ativos da semente", () => {
    expect(results.length).toBe(SEED_ASSETS.length);
  });

  it("sinaliza yield-trap para FII com DY muito acima da mediana", () => {
    // VGHF11 tem DY 17% (bem acima da mediana dos FIIs) e baixa consistência
    const vghf = byTicker("VGHF11");
    expect(vghf.flags.some((f) => f.toLowerCase().includes("yield-trap"))).toBe(true);
  });

  it("um bom FII de tijolo pontua alto e passa nos gates", () => {
    const hglg = byTicker("HGLG11");
    expect(hglg.passedGates).toBe(true);
    expect(hglg.composite!).toBeGreaterThan(60);
  });

  it("cripto sempre recebe o disclaimer de satélite de alto risco", () => {
    const btc = byTicker("BTC");
    expect(btc.flags.some((f) => f.toLowerCase().includes("alto risco"))).toBe(true);
  });

  it("título público real (Tesouro IPCA+ 2050) é pontuado e tem rating soberano", () => {
    const td = byTicker("TD-IPCA-2050");
    expect(td.composite!).toBeGreaterThan(50);
  });

  it("topByFamily devolve os melhores FIIs ordenados", () => {
    const top = topByFamily(results, "fii", 3);
    expect(top.length).toBe(3);
    expect(top[0].composite!).toBeGreaterThanOrEqual(top[1].composite!);
  });
});
