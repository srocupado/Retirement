import type { RealPortfolio } from "./holdings";
import { kindToSleeve } from "./holdings";
import type { ModelPortfolio } from "./models";
import { SLEEVE_CAPS } from "./models";
import { DEFAULT_SLEEVES, type SleeveKey } from "./assumptions";
import type { ScreenResult } from "../screener";

export interface RouteSlice {
  sleeve: SleeveKey;
  label: string;
  /** Quanto do aporte deste mês vai para o sleeve (R$). */
  amount: number;
  currentWeight: number;
  targetWeight: number;
  /** Peso projetado após o aporte. */
  afterWeight: number;
  /** Ativos reais bem ranqueados no screening para executar a compra. */
  examples: { ticker: string; name: string }[];
}

export interface ContributionRoute {
  slices: RouteSlice[];
  total: number;
  warnings: string[];
}

/** Limite de cobertura do FGC por instituição (R$). */
export const FGC_LIMIT = 250_000;

/**
 * Roteia o aporte do mês para CONVERGIR a carteira real ao alvo apenas
 * comprando (rebalanceamento por aporte): nada de vender, nada de IR.
 *
 * Algoritmo: com o total futuro (carteira + aporte), calcula o déficit de cada
 * sleeve em relação ao alvo e distribui o aporte proporcionalmente aos déficits.
 * Sleeves acima do alvo recebem zero (vão diluindo com o tempo). Se sobrar
 * aporte após cobrir todos os déficits, o resto segue os pesos-alvo.
 */
export function routeContribution(
  real: RealPortfolio,
  model: ModelPortfolio,
  contribution: number,
  screenResults: ScreenResult[] = [],
): ContributionRoute {
  const warnings: string[] = [];
  const futureTotal = real.totalValue + contribution;
  const entries = (Object.entries(model.allocation) as [SleeveKey, number][]).filter(([, w]) => w > 0);

  const ranked = screenResults
    .filter((r) => r.passedGates && r.composite != null)
    .sort((a, b) => (b.composite ?? 0) - (a.composite ?? 0));

  const deficits = entries.map(([sleeve, targetWeight]) => {
    const current = real.bySleeve[sleeve] ?? 0;
    return { sleeve, targetWeight, current, deficit: Math.max(0, targetWeight * futureTotal - current) };
  });
  const totalDeficit = deficits.reduce((s, d) => s + d.deficit, 0);

  const slices: RouteSlice[] = deficits.map((d) => {
    let amount: number;
    if (contribution <= 0 || futureTotal <= 0) {
      amount = 0;
    } else if (totalDeficit >= contribution) {
      // aporte inteiro vai para onde falta, proporcional ao déficit
      amount = totalDeficit > 0 ? (contribution * d.deficit) / totalDeficit : 0;
    } else {
      // cobre todos os déficits e distribui a sobra pelos pesos-alvo
      amount = d.deficit + (contribution - totalDeficit) * d.targetWeight;
    }
    return {
      sleeve: d.sleeve,
      label: DEFAULT_SLEEVES[d.sleeve].label,
      amount,
      currentWeight: real.totalValue > 0 ? d.current / real.totalValue : 0,
      targetWeight: d.targetWeight,
      afterWeight: futureTotal > 0 ? (d.current + amount) / futureTotal : 0,
      examples: ranked
        .filter((r) => kindToSleeve(r.kind) === d.sleeve)
        .slice(0, 3)
        .map((r) => ({ ticker: r.ticker, name: r.name })),
    };
  });

  // --- alertas de risco ---
  const cap = SLEEVE_CAPS[model.id]?.cripto;
  const cryptoWeight = real.totalValue > 0 ? (real.bySleeve.cripto ?? 0) / real.totalValue : 0;
  if (cap != null && cryptoWeight > cap + 1e-9) {
    warnings.push(
      `Cripto está em ${(cryptoWeight * 100).toFixed(1)}% da carteira — acima do teto de ${(cap * 100).toFixed(0)}% da carteira ${model.name}. Novos aportes não vão para cripto até diluir.`,
    );
  }

  const fgcExposure = real.positions
    .filter((p) => ["cdb", "lci", "lca"].includes(p.kind))
    .reduce((s, p) => s + p.marketValue, 0);
  if (fgcExposure > FGC_LIMIT) {
    warnings.push(
      `Posições em CDB/LCI/LCA somam R$ ${Math.round(fgcExposure).toLocaleString("pt-BR")} — acima de R$ 250 mil. Confira o limite do FGC POR INSTITUIÇÃO (R$ 250 mil) e distribua entre emissores.`,
    );
  }

  return { slices: slices.sort((a, b) => b.amount - a.amount), total: contribution, warnings };
}
