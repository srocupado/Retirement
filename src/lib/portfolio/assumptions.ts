import type { IncomeRole } from "../marketData/instruments";
import { realNetYield } from "../finance/perpetuity";

/**
 * Premissas por "sleeve" (bloco) da carteira. São EXPLÍCITAS e editáveis — nunca
 * embutidas silenciosamente. Taxas reais/yields são anuais e em decimal.
 */
export type SleeveKey = "ipcaIncome" | "isentos" | "fiiAcoes" | "etfGrowth" | "caixa" | "cripto";

export interface SleeveAssumption {
  label: string;
  role: IncomeRole;
  /** Título indexado à inflação (principal se corrige sozinho)? */
  indexed: boolean;
  /** Taxa real anual (para indexados/caixa). */
  realRate?: number;
  /** Yield de caixa nominal (para FII/ações não indexados). */
  cashYield?: number;
  /** Retorno real esperado (para crescimento/ETF). */
  realReturn?: number;
  /** IR sobre o rendimento (0 para isentos). */
  taxRate?: number;
  /** IR de ganho de capital ao sacar (crescimento). */
  cgRate?: number;
}

export const DEFAULT_SLEEVES: Record<SleeveKey, SleeveAssumption> = {
  ipcaIncome: { label: "IPCA+ / RendA+ (renda)", role: "income", indexed: true, realRate: 0.065, taxRate: 0.15 },
  isentos: { label: "Isentos: LCI/LCA/CRI/CRA/incentivadas", role: "income", indexed: true, realRate: 0.06, taxRate: 0 },
  fiiAcoes: { label: "FIIs / ações pagadoras", role: "income", indexed: false, cashYield: 0.085, taxRate: 0 },
  etfGrowth: { label: "ETFs ações/internacional (crescimento)", role: "growth", realReturn: 0.07, cgRate: 0.175 },
  caixa: { label: "Selic / DI (caixa)", role: "cash", indexed: true, realRate: 0.015, taxRate: 0.15 },
  cripto: { label: "Cripto (satélite)", role: "satellite" },
};

export interface GlobalAssumptions {
  inflation: number; // π
}

export const DEFAULT_GLOBAL: GlobalAssumptions = { inflation: 0.04 };

/**
 * Rendimento real líquido GASTÁVEL de um sleeve, já preservando o capital real
 * (reserva de reinvestimento embutida para ativos não indexados).
 */
export function sleeveSpendableYield(
  s: SleeveAssumption,
  g: GlobalAssumptions,
): number {
  switch (s.role) {
    case "income":
      if (s.indexed) {
        // Principal corrige pela inflação; gasta-se o rendimento real líquido.
        return realNetYield(s.realRate ?? 0, g.inflation, s.taxRate ?? 0);
      }
      // Ativo real (FII/ação): o PREÇO acompanha a inflação por conta própria, então
      // a distribuição em caixa, líquida de IR, já é o rendimento real gastável.
      // (Risco sinalizado: distribuições/preços podem não acompanhar a inflação.)
      return Math.max(0, (s.cashYield ?? 0) * (1 - (s.taxRate ?? 0)));
    case "growth":
      // Saque sistemático: realiza o retorno real pagando ganho de capital.
      return Math.max(0, (s.realReturn ?? 0) * (1 - (s.cgRate ?? 0)));
    case "cash":
      return realNetYield(s.realRate ?? 0, g.inflation, s.taxRate ?? 0);
    case "satellite":
      return 0; // não gera renda
  }
}
