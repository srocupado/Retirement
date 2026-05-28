import { describe, it, expect } from "vitest";
import {
  regressiveRate,
  fixedIncomeEtfRate,
  rendaMaisRate,
  RULES_2026,
  TAX_YEAR,
  taxDragFactor,
  grossForNet,
  netFromGross,
  dividendWithholding,
  isHighIncome,
} from "./index";

describe("tabelas de IR 2026", () => {
  it("regressiva sobre ganho nominal", () => {
    expect(regressiveRate(100)).toBe(0.225);
    expect(regressiveRate(300)).toBe(0.2);
    expect(regressiveRate(500)).toBe(0.175);
    expect(regressiveRate(1000)).toBe(0.15);
  });

  it("ETF de renda fixa por PMR (piso 15%)", () => {
    expect(fixedIncomeEtfRate(100)).toBe(0.25);
    expect(fixedIncomeEtfRate(400)).toBe(0.2);
    expect(fixedIncomeEtfRate(900)).toBe(0.15);
  });

  it("RendA+ chega ao piso de 10% na conversão", () => {
    expect(rendaMaisRate(100)).toBe(0.225);
    expect(rendaMaisRate(2000)).toBe(0.1);
  });

  it("o ano-base é 2026", () => {
    expect(TAX_YEAR).toBe(2026);
  });
});

describe("isenções verificadas (MP 1303 caducou)", () => {
  it("FII, LCI, LCA, CRI, CRA e debêntures incentivadas têm rendimento isento", () => {
    for (const kind of ["fii", "lci", "lca", "cri", "cra", "debentureIncentivada"] as const) {
      expect(RULES_2026[kind].incomeExempt).toBe(true);
      expect(taxDragFactor(kind)).toBe(1);
    }
  });

  it("ETF de ações é tributado a 17,5% (sem isenção de R$20k)", () => {
    expect(RULES_2026.equityEtf.incomeTaxRateLongTerm).toBe(0.175);
    expect(taxDragFactor("equityEtf")).toBeCloseTo(0.825, 6);
  });

  it("nenhuma classe usa a alíquota única de 17,5% da MP 1303 sobre cripto direta", () => {
    // cripto direta segue a regra antiga (15% base), não a flat de 17,5%
    expect(RULES_2026.cryptoDirect.incomeTaxRateLongTerm).toBe(0.15);
  });
});

describe("reconciliação líquida (a tese da ferramenta)", () => {
  it("isento: bruto = líquido", () => {
    expect(grossForNet(11000, "fii")).toBeCloseTo(11000, 6);
    expect(netFromGross(11000, "lci")).toBeCloseTo(11000, 6);
  });

  it("CDB a 15%: precisa de ~R$12.941 bruto para R$11.000 líquido (~+17,6% capital)", () => {
    const gross = grossForNet(11000, "cdb");
    expect(gross).toBeCloseTo(11000 / 0.85, 2);
    expect(gross / 11000 - 1).toBeCloseTo(0.176, 2);
  });
});

describe("reforma de dividendos (Lei 1.087/2025)", () => {
  it("0% abaixo de R$50k/mês de uma mesma empresa", () => {
    expect(dividendWithholding(11000)).toBe(0);
    expect(dividendWithholding(50000)).toBe(0);
  });

  it("10% só sobre o excedente acima de R$50k", () => {
    expect(dividendWithholding(60000)).toBeCloseTo(1000, 6);
  });

  it("imposto mínimo (IRPFM) só acima de R$600k/ano", () => {
    expect(isHighIncome(132000)).toBe(false);
    expect(isHighIncome(700000)).toBe(true);
  });
});
