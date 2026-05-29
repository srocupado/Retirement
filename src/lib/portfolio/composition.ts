import type { ScreenResult } from "../screener";
import { kindToSleeve } from "./holdings";
import { DEFAULT_SLEEVES, type SleeveKey } from "./assumptions";
import type { ModelPortfolio } from "./models";

export interface SleeveComposition {
  sleeve: SleeveKey;
  label: string;
  weight: number;
  /** Ativos reais (do screening) que poderiam preencher este sleeve. */
  examples: { ticker: string; name: string; score: number | null }[];
}

export interface ModelComposition {
  id: string;
  name: string;
  sleeves: SleeveComposition[];
}

/**
 * Preenche cada sleeve de uma carteira-modelo com ATIVOS REAIS bem ranqueados no
 * screening — uma sugestão ilustrativa de "como montar" a carteira, não recomendação.
 */
export function composeModel(
  model: ModelPortfolio,
  screenResults: ScreenResult[],
  maxPerSleeve = 3,
): ModelComposition {
  const ranked = [...screenResults]
    .filter((r) => r.passedGates && r.composite != null)
    .sort((a, b) => (b.composite ?? 0) - (a.composite ?? 0));

  const sleeves: SleeveComposition[] = (Object.entries(model.allocation) as [SleeveKey, number][])
    .filter(([, w]) => w && w > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([sleeve, weight]) => ({
      sleeve,
      label: DEFAULT_SLEEVES[sleeve].label,
      weight,
      examples: ranked
        .filter((r) => kindToSleeve(r.kind) === sleeve)
        .slice(0, maxPerSleeve)
        .map((r) => ({ ticker: r.ticker, name: r.name, score: r.composite })),
    }));

  return { id: model.id, name: model.name, sleeves };
}

export function composeAllModels(models: ModelPortfolio[], screenResults: ScreenResult[]): ModelComposition[] {
  return models.map((m) => composeModel(m, screenResults));
}
