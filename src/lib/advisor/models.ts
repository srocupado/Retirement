export interface AdvisorModel {
  id: string;
  label: string;
  description: string;
}

/** Modelos oferecidos na UI. Default no Sonnet (rápido/barato); Opus para revisão profunda. */
export const ADVISOR_MODELS: AdvisorModel[] = [
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6 (padrão)", description: "Rápido e econômico para a avaliação do dia a dia." },
  { id: "claude-opus-4-8", label: "Opus 4.8 (revisão profunda)", description: "Análise mais detalhada e criteriosa." },
];

export const DEFAULT_MODEL = ADVISOR_MODELS[0].id;
