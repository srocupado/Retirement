import { describe, it, expect } from "vitest";
import {
  realNetYield,
  requiredNestEgg,
  projectAccumulation,
  requiredContribution,
  requiredContributionClosedForm,
  achievableIncome,
} from "./index";

describe("realNetYield", () => {
  it("aplica a fórmula linear i(1-t) - π·t (cenário-âncora)", () => {
    // i=7%, π=4%, t=15% → 0,0595 - 0,006 = 0,0535
    expect(realNetYield(0.07, 0.04, 0.15)).toBeCloseTo(0.0535, 6);
  });

  it("ativo isento (t=0) preserva o rendimento real cheio", () => {
    expect(realNetYield(0.07, 0.04, 0)).toBeCloseTo(0.07, 6);
  });

  it("captura o imposto da inflação: t>0 com i=0 dá rendimento negativo", () => {
    expect(realNetYield(0, 0.04, 0.15)).toBeCloseTo(-0.006, 6);
  });

  it("versão exata de Fisher fica próxima da linear", () => {
    const linear = realNetYield(0.07, 0.04, 0.15, false);
    const exact = realNetYield(0.07, 0.04, 0.15, true);
    expect(Math.abs(exact - linear)).toBeLessThan(0.01);
  });
});

describe("requiredNestEgg", () => {
  it("cenário-âncora ~R$ 2,47 milhões em R$ de hoje", () => {
    const r = requiredNestEgg(11000, 0.07, 0.04, 0.15, 24);
    expect(r.feasible).toBe(true);
    expect(r.nestEggToday).toBeGreaterThan(2_400_000);
    expect(r.nestEggToday).toBeLessThan(2_500_000);
  });

  it("marca inviável quando o rendimento real líquido é ≤ 0", () => {
    // inflação alta + taxa real baixa zera o rendimento gastável
    const r = requiredNestEgg(11000, 0.005, 0.1, 0.15, 24);
    expect(r.feasible).toBe(false);
    expect(r.nestEggToday).toBe(Infinity);
  });

  it("o patrimônio nominal em 2050 é maior que o de hoje", () => {
    const r = requiredNestEgg(11000, 0.07, 0.04, 0.15, 24);
    expect(r.nestEggAtRetirementNominal).toBeGreaterThan(r.nestEggToday);
  });
});

describe("projectAccumulation", () => {
  const base = { realRate: 0.06, inflation: 0.04, years: 24, taxRate: 0.15 };

  it("valor líquido é menor que o bruto por causa do IR diferido", () => {
    const r = projectAccumulation({ ...base, currentSavings: 100_000, monthlyContribution: 3000 });
    expect(r.netReal).toBeLessThan(r.grossReal);
    expect(r.taxReal).toBeGreaterThan(0);
  });

  it("monotônico crescente no aporte", () => {
    const low = projectAccumulation({ ...base, currentSavings: 0, monthlyContribution: 1000 });
    const high = projectAccumulation({ ...base, currentSavings: 0, monthlyContribution: 2000 });
    expect(high.netReal).toBeGreaterThan(low.netReal);
  });

  it("taxa real zero: valor bruto = soma dos aportes (em termos reais)", () => {
    const r = projectAccumulation({ realRate: 0, inflation: 0.04, years: 10, taxRate: 0.15, currentSavings: 0, monthlyContribution: 1000 });
    expect(r.grossReal).toBeCloseTo(120_000, 0);
  });
});

describe("requiredContribution", () => {
  const base = { currentSavings: 50_000, realRate: 0.06, inflation: 0.04, years: 24, taxRate: 0.15 };

  it("o aporte encontrado atinge a meta dentro da tolerância", () => {
    const target = 2_000_000;
    const c = requiredContribution(target, base);
    const achieved = projectAccumulation({ ...base, monthlyContribution: c }).netReal;
    expect(achieved).toBeCloseTo(target, -2); // ~centena de reais
  });

  it("retorna 0 quando o saldo atual já supera a meta", () => {
    const c = requiredContribution(10_000, { ...base, currentSavings: 5_000_000 });
    expect(c).toBe(0);
  });

  it("a forma fechada (bruto) confere com a bisseção dentro de ~5%", () => {
    const targetNet = 1_500_000;
    const c = requiredContribution(targetNet, base);
    const grossTarget = projectAccumulation({ ...base, monthlyContribution: c }).grossReal;
    const cClosed = requiredContributionClosedForm(grossTarget, base);
    expect(Math.abs(cClosed - c) / c).toBeLessThan(0.05);
  });
});

describe("achievableIncome", () => {
  it("calcula a renda mensal e o gap para a meta", () => {
    const r = achievableIncome(2_467_000, 0.07, 0.04, 0.15, 11000);
    expect(r.monthlyReal).toBeCloseTo(11000, -2);
    expect(Math.abs(r.gap)).toBeLessThan(500);
  });
});
