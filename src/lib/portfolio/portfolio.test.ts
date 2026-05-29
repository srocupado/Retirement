import { describe, it, expect } from "vitest";
import {
  MODEL_PORTFOLIOS,
  projectPortfolio,
  projectAllModels,
  validateAllocation,
  DEFAULT_GLOBAL,
  DEFAULT_SLEEVES,
  rendaMaisMonthlyPayment,
} from "./index";

const target = 11000;

describe("projectPortfolio", () => {
  it("round-trip: o patrimônio necessário, reaplicado, devolve a renda-alvo", () => {
    const baseline = MODEL_PORTFOLIOS[0];
    const p = projectPortfolio(baseline, target, 0, DEFAULT_GLOBAL);
    const back = projectPortfolio(baseline, target, p.requiredNestEgg, DEFAULT_GLOBAL);
    expect(back.projectedMonthly).toBeCloseTo(target, -1);
  });

  it("a carteira de Renda (isentos/FII) exige menos capital que o baseline 100% IPCA+", () => {
    const all = projectAllModels(target, 0, DEFAULT_GLOBAL);
    const baseline = all.find((p) => p.id === "baseline")!;
    const renda = all.find((p) => p.id === "renda")!;
    expect(renda.requiredNestEgg).toBeLessThan(baseline.requiredNestEgg);
  });

  it("baseline 100% IPCA+ usa a taxa de decumulação informada (bate com a renda atingível)", () => {
    const decumRate = 0.06, infl = 0.04, tax = 0.15, nestEgg = 2_635_776;
    const sleeves = {
      ...DEFAULT_SLEEVES,
      ipcaIncome: { ...DEFAULT_SLEEVES.ipcaIncome, realRate: decumRate, taxRate: tax },
    };
    const all = projectAllModels(target, nestEgg, { inflation: infl }, MODEL_PORTFOLIOS, sleeves);
    const baseline = all.find((p) => p.id === "baseline")!;
    const expected = (nestEgg * (decumRate * (1 - tax) - infl * tax)) / 12;
    expect(baseline.projectedMonthly).toBeCloseTo(expected, 2);
  });

  it("o breakdown soma o yield ponderado da carteira", () => {
    const p = projectPortfolio(MODEL_PORTFOLIOS[1], target, 0, DEFAULT_GLOBAL);
    const sum = p.breakdown.reduce((s, b) => s + b.weight * b.spendableYield, 0);
    expect(sum).toBeCloseTo(p.blendedSpendableYield, 6);
  });
});

describe("validateAllocation (tetos)", () => {
  it("aceita as carteiras-modelo padrão", () => {
    for (const m of MODEL_PORTFOLIOS) {
      expect(validateAllocation(m.id, m.allocation)).toEqual([]);
    }
  });

  it("rejeita cripto acima do teto", () => {
    const errors = validateAllocation("conservador", { ipcaIncome: 0.9, cripto: 0.1 });
    expect(errors.some((e) => e.includes("cripto"))).toBe(true);
  });

  it("rejeita alocação que não soma 100%", () => {
    const errors = validateAllocation("renda", { ipcaIncome: 0.5 });
    expect(errors.some((e) => e.includes("100%"))).toBe(true);
  });
});

describe("rendaMaisMonthlyPayment", () => {
  it("paga uma renda mensal positiva e amortiza em 240 meses", () => {
    const pmt = rendaMaisMonthlyPayment(2_000_000, 0.06, 240);
    expect(pmt).toBeGreaterThan(0);
    // amortizante: paga mais por mês que uma perpetuidade ao mesmo patrimônio/taxa
    const perpetuityMonthly = (2_000_000 * 0.06 * 0.9) / 12;
    expect(pmt).toBeGreaterThan(perpetuityMonthly);
  });
});
