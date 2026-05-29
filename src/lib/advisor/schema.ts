import { z } from "zod";

/** Saída estruturada e validada do consultor de IA. */
export const AdvisorOutputSchema = z.object({
  evaluation: z.string().describe("Avaliação geral do cenário e do progresso rumo à meta."),
  allocationAdjustments: z
    .array(
      z.object({
        sleeve: z.string(),
        action: z.enum(["aumentar", "reduzir", "manter"]),
        rationale: z.string(),
      }),
    )
    .default([]),
  candidateAssets: z
    .array(
      z.object({
        ticker: z.string(),
        reason: z.string(),
      }),
    )
    .default([])
    .describe("APENAS tickers presentes no contexto fornecido (anti-alucinação)."),
  caveats: z.array(z.string()).default([]),
  disclaimer: z.string(),
});

export type AdvisorOutput = z.infer<typeof AdvisorOutputSchema>;

/** Garante o grounding: remove candidatos cujo ticker não está no universo dado. */
export function enforceGrounding(output: AdvisorOutput, allowedTickers: string[]): AdvisorOutput {
  const allowed = new Set(allowedTickers.map((t) => t.toUpperCase()));
  const filtered = output.candidateAssets.filter((c) => allowed.has(c.ticker.toUpperCase()));
  const dropped = output.candidateAssets.length - filtered.length;
  const caveats = [...output.caveats];
  if (dropped > 0) caveats.push(`${dropped} ativo(s) sugerido(s) foram descartados por não constarem do screening.`);
  return { ...output, candidateAssets: filtered, caveats };
}
