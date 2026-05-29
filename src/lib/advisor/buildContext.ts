import type { ScreenResult } from "../screener";
import type { PortfolioProjection } from "../portfolio";
import type { MarketRates } from "../marketData";

export interface PlannerScenario {
  targetMonthlyToday: number;
  yearsToRetirement: number;
  currentSavings: number;
  monthlyContribution: number;
  inflation: number;
  realRate: number;
}

export interface AdvisorContext {
  scenario: PlannerScenario;
  nestEgg: { today: number; feasible: boolean; realNetYield: number };
  contribution: { required: number; current: number };
  portfolios: PortfolioProjection[];
  topAssets: { ticker: string; name: string; family: string; composite: number | null; flags: string[] }[];
  rates: MarketRates;
}

/** Lista de tickers permitidos para o grounding do consultor. */
export function allowedTickers(ctx: AdvisorContext): string[] {
  return ctx.topAssets.map((a) => a.ticker);
}

/** Mensagem do usuário: contexto compacto em JSON. */
export function buildUserMessage(ctx: AdvisorContext): string {
  return [
    "Avalie o cenário abaixo e sugira ajustes de alocação (sem recomendação personalizada).",
    "Contexto (JSON):",
    JSON.stringify(ctx, null, 2),
    "",
    "Responda com um JSON no formato:",
    `{
  "evaluation": string,
  "allocationAdjustments": [{ "sleeve": string, "action": "aumentar"|"reduzir"|"manter", "rationale": string }],
  "candidateAssets": [{ "ticker": string, "reason": string }],
  "caveats": string[],
  "disclaimer": string
}`,
    "Lembre-se: candidateAssets só pode conter tickers presentes em topAssets.",
  ].join("\n");
}
