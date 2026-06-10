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

/** Resumo da carteira REAL do usuário (lançamentos consolidados). */
export interface RealPortfolioSummary {
  totalValue: number;
  monthlyNetIncome: number;
  positions: { ticker: string; sleeve: string; weight: number; marketValue: number }[];
  /** Desvios da alocação real vs a carteira-modelo alvo (real − alvo). */
  deltasVsTarget: { sleeve: string; real: number; target: number; delta: number }[];
  targetModel: string;
}

export interface AdvisorContext {
  scenario: PlannerScenario;
  nestEgg: { today: number; feasible: boolean; realNetYield: number };
  contribution: { required: number; current: number };
  portfolios: PortfolioProjection[];
  topAssets: { ticker: string; name: string; family: string; composite: number | null; flags: string[] }[];
  rates: MarketRates;
  /** Carteira real do usuário, quando há lançamentos. */
  realPortfolio?: RealPortfolioSummary | null;
}

/** Lista de tickers permitidos para o grounding do consultor. */
export function allowedTickers(ctx: AdvisorContext): string[] {
  const fromScreen = ctx.topAssets.map((a) => a.ticker);
  const fromHoldings = ctx.realPortfolio?.positions.map((p) => p.ticker) ?? [];
  return [...new Set([...fromScreen, ...fromHoldings])];
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
    "Lembre-se: candidateAssets só pode conter tickers presentes em topAssets ou na carteira real.",
    "Se 'realPortfolio' estiver presente, priorize avaliar a carteira REAL do usuário: comente os desvios em deltasVsTarget (real − alvo, por sleeve) e o que os próximos aportes devem priorizar.",
  ].join("\n");
}
