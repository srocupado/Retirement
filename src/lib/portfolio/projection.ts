import {
  DEFAULT_SLEEVES,
  sleeveSpendableYield,
  type GlobalAssumptions,
  type SleeveAssumption,
  type SleeveKey,
} from "./assumptions";
import { MODEL_PORTFOLIOS, type Allocation, type ModelPortfolio } from "./models";

export interface PortfolioProjection {
  id: string;
  name: string;
  /** Rendimento real líquido gastável ponderado da carteira (anual). */
  blendedSpendableYield: number;
  /** Patrimônio necessário (R$ de hoje) para a renda-alvo. Infinity se yield ≤ 0. */
  requiredNestEgg: number;
  /** Renda mensal real líquida projetada dado um patrimônio. */
  projectedMonthly: number;
  /** Contribuição de cada sleeve ao yield gastável. */
  breakdown: { sleeve: SleeveKey; weight: number; spendableYield: number; label: string }[];
}

function blendedYield(
  alloc: Allocation,
  g: GlobalAssumptions,
  sleeves: Record<SleeveKey, SleeveAssumption>,
): { blended: number; breakdown: PortfolioProjection["breakdown"] } {
  const breakdown: PortfolioProjection["breakdown"] = [];
  let blended = 0;
  for (const [key, weight] of Object.entries(alloc) as [SleeveKey, number][]) {
    if (!weight) continue;
    const s = sleeves[key];
    const y = sleeveSpendableYield(s, g);
    blended += weight * y;
    breakdown.push({ sleeve: key, weight, spendableYield: y, label: s.label });
  }
  return { blended, breakdown };
}

/**
 * Projeta uma carteira: rendimento gastável ponderado, patrimônio necessário
 * para a renda-alvo e renda projetada para um dado patrimônio.
 */
export function projectPortfolio(
  portfolio: ModelPortfolio,
  targetMonthlyToday: number,
  nestEgg: number,
  g: GlobalAssumptions,
  sleeves: Record<SleeveKey, SleeveAssumption> = DEFAULT_SLEEVES,
): PortfolioProjection {
  const { blended, breakdown } = blendedYield(portfolio.allocation, g, sleeves);
  const requiredNestEgg = blended > 0 ? (targetMonthlyToday * 12) / blended : Infinity;
  const projectedMonthly = (nestEgg * blended) / 12;
  return {
    id: portfolio.id,
    name: portfolio.name,
    blendedSpendableYield: blended,
    requiredNestEgg,
    projectedMonthly,
    breakdown,
  };
}

/** Projeta todas as carteiras-modelo, ordenadas por menor patrimônio necessário. */
export function projectAllModels(
  targetMonthlyToday: number,
  nestEgg: number,
  g: GlobalAssumptions,
  models: ModelPortfolio[] = MODEL_PORTFOLIOS,
  sleeves: Record<SleeveKey, SleeveAssumption> = DEFAULT_SLEEVES,
): PortfolioProjection[] {
  return models
    .map((m) => projectPortfolio(m, targetMonthlyToday, nestEgg, g, sleeves))
    .sort((a, b) => a.requiredNestEgg - b.requiredNestEgg);
}
