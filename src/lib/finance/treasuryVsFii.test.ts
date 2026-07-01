import { describe, it, expect } from "vitest";
import { compareTreasuryVsFii, breakevenReRating, type TreasuryVsFiiInputs } from "./treasuryVsFii";

const base: TreasuryVsFiiInputs = {
  currentSavings: 150_000,
  monthlyContribution: 3_000,
  years: 20,
  migrateYear: 6,
  inflation: 0.045,
  treasuryRealRate: 0.08, // Selic ~13% com π ~4,5%
  treasuryTax: 0.15,
  fiiTotalReal: 0.06, // dividendo isento + valorização real
  reRating: 0.15, // +15% de reprecificação na janela de espera
};

describe("compareTreasuryVsFii", () => {
  it("sem reprecificação nenhuma, esperar no Tesouro (juro real maior) vence", () => {
    const r = compareTreasuryVsFii({ ...base, reRating: 0 });
    expect(r.winner).toBe("treasuryThenFii");
    expect(r.advantage).toBeLessThan(0);
  });

  it("com reprecificação grande, ir direto pro FII vence", () => {
    const r = compareTreasuryVsFii({ ...base, reRating: 0.5 });
    expect(r.winner).toBe("fiiDirect");
    expect(r.advantage).toBeGreaterThan(0);
  });

  it("migrateYear = 0 ⇒ os dois caminhos são idênticos (tudo FII desde já)", () => {
    const r = compareTreasuryVsFii({ ...base, migrateYear: 0 });
    expect(r.fiiDirectNetReal).toBeCloseTo(r.treasuryThenFiiNetReal, 2);
    expect(r.winner).toBe("tie");
  });

  it("o Tesouro tem IR diferido: o pote na migração é líquido do imposto", () => {
    const r = compareTreasuryVsFii(base);
    // Acumulado real na migração deve ser positivo e menor que o bruto sem IR.
    expect(r.treasuryPotAtMigration).toBeGreaterThan(base.currentSavings);
  });

  it("janela de espera do FII rende mais que o regime (embute a reprecificação)", () => {
    const r = compareTreasuryVsFii(base);
    expect(r.fiiWaitWindowReal).toBeGreaterThan(base.fiiTotalReal);
  });

  it("juro real do Tesouro maior desloca a vantagem a favor de esperar", () => {
    const baixo = compareTreasuryVsFii({ ...base, treasuryRealRate: 0.03 }).advantage;
    const alto = compareTreasuryVsFii({ ...base, treasuryRealRate: 0.10 }).advantage;
    expect(alto).toBeLessThan(baixo); // mais juro ⇒ Tesouro-e-migra melhora (advantage cai)
  });
});

describe("breakevenReRating", () => {
  it("existe uma reprecificação de equilíbrio positiva com esses parâmetros", () => {
    const be = breakevenReRating({ ...base });
    expect(be).not.toBeNull();
    expect(be!).toBeGreaterThan(0);
  });

  it("no equilíbrio, os dois caminhos empatam", () => {
    const be = breakevenReRating({ ...base })!;
    const r = compareTreasuryVsFii({ ...base, reRating: be });
    expect(r.fiiDirectNetReal).toBeCloseTo(r.treasuryThenFiiNetReal, 0);
  });

  it("se o Tesouro rende pouco, o FII pode já ganhar sem reprecificação (equilíbrio 0)", () => {
    const be = breakevenReRating({ ...base, treasuryRealRate: 0.01, fiiTotalReal: 0.08 });
    expect(be).toBe(0);
  });
});
