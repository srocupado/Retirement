import type { AssetSnapshot } from "../marketData/instruments";

export interface MetricScore {
  key: string;
  label: string;
  weight: number; // 0..1
  subScore: number; // 0..100
  value: number | null;
  note?: string;
}

export interface ScreenResult {
  ticker: string;
  name: string;
  family: AssetSnapshot["family"];
  kind: AssetSnapshot["kind"];
  /** Score composto 0–100 (média ponderada das métricas). null se reprovado em gate. */
  composite: number | null;
  passedGates: boolean;
  metrics: MetricScore[];
  flags: string[];
}

export interface Gate {
  label: string;
  pass: (a: AssetSnapshot) => boolean;
}

export interface MetricDef {
  key: string;
  label: string;
  weight: number;
  /** Calcula o valor bruto da métrica; null se indisponível. */
  value: (a: AssetSnapshot) => number | null;
  /** Converte o valor em sub-score 0–100. */
  curve: (value: number) => number;
}

export interface FlagDef {
  test: (a: AssetSnapshot) => boolean;
  message: string;
}

export interface ScreenConfig {
  gates: Gate[];
  metrics: MetricDef[];
  flags: FlagDef[];
}

/** Aplica gates, calcula sub-scores ponderados e coleta flags. */
export function scoreAsset(a: AssetSnapshot, config: ScreenConfig): ScreenResult {
  const failedGates = config.gates.filter((g) => !g.pass(a));
  const passedGates = failedGates.length === 0;

  const metrics: MetricScore[] = config.metrics.map((m) => {
    const value = m.value(a);
    return {
      key: m.key,
      label: m.label,
      weight: m.weight,
      value,
      subScore: value === null ? 0 : Math.max(0, Math.min(100, m.curve(value))),
    };
  });

  const totalWeight = metrics.reduce((s, m) => s + m.weight, 0) || 1;
  const composite = passedGates
    ? metrics.reduce((s, m) => s + m.weight * m.subScore, 0) / totalWeight
    : null;

  const flags = config.flags.filter((f) => f.test(a)).map((f) => f.message);
  for (const g of failedGates) flags.push(`Reprovado: ${g.label}`);

  return { ticker: a.ticker, name: a.name, family: a.family, kind: a.kind, composite, passedGates, metrics, flags };
}
