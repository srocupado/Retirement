import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./systemPrompt";
import { buildUserMessage, allowedTickers, type AdvisorContext } from "./buildContext";
import { AdvisorOutputSchema, enforceGrounding, type AdvisorOutput } from "./schema";
import { DEFAULT_MODEL } from "./models";

/**
 * Chama a Claude API DIRETO do navegador com a chave do usuário (BYO key).
 * A chave fica só no `localStorage` do navegador — nunca vai ao repositório.
 */
export async function runAdvisor(
  ctx: AdvisorContext,
  apiKey: string,
  model: string = DEFAULT_MODEL,
): Promise<AdvisorOutput> {
  if (!apiKey) throw new Error("Cole sua chave da Claude API para usar o consultor.");

  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  });

  // Bloco de sistema estável → habilita prompt caching (GA na API; o cast cobre
  // a tipagem do SDK 0.32, que só declara cache_control no namespace beta).
  const system = [
    { type: "text" as const, text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" as const } },
  ] as unknown as Anthropic.MessageCreateParamsNonStreaming["system"];

  const response = await client.messages.create({
    model,
    // Folga suficiente para o JSON completo; 1500 truncava arrays e quebrava o parse.
    max_tokens: 4096,
    system,
    messages: [{ role: "user", content: buildUserMessage(ctx) }],
    // Saída estruturada via tool use: a API garante um objeto JSON no campo `input`,
    // sem precisar parsear texto/cercas de markdown (origem do bug anterior).
    tools: [ADVISOR_TOOL],
    tool_choice: { type: "tool", name: ADVISOR_TOOL.name },
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error("A resposta da IA foi cortada por limite de tokens. Tente novamente.");
  }

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === ADVISOR_TOOL.name,
  );
  if (!toolUse) throw new Error("A IA não retornou a análise estruturada esperada.");

  const parsed = AdvisorOutputSchema.parse(toolUse.input);
  return enforceGrounding(parsed, allowedTickers(ctx));
}

/** Ferramenta de saída estruturada (espelha o AdvisorOutputSchema). */
const ADVISOR_TOOL: Anthropic.Tool = {
  name: "submit_analysis",
  description: "Registra a análise educacional do cenário de aposentadoria.",
  input_schema: {
    type: "object",
    properties: {
      evaluation: { type: "string", description: "Avaliação geral do cenário e do progresso rumo à meta." },
      allocationAdjustments: {
        type: "array",
        items: {
          type: "object",
          properties: {
            sleeve: { type: "string" },
            action: { type: "string", enum: ["aumentar", "reduzir", "manter"] },
            rationale: { type: "string" },
          },
          required: ["sleeve", "action", "rationale"],
        },
      },
      candidateAssets: {
        type: "array",
        description: "APENAS tickers presentes em topAssets (anti-alucinação).",
        items: {
          type: "object",
          properties: {
            ticker: { type: "string" },
            reason: { type: "string" },
          },
          required: ["ticker", "reason"],
        },
      },
      caveats: { type: "array", items: { type: "string" } },
      disclaimer: { type: "string" },
    },
    required: ["evaluation", "disclaimer"],
  },
};
