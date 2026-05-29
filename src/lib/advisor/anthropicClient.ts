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
    max_tokens: 1500,
    system,
    messages: [{ role: "user", content: buildUserMessage(ctx) }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const json = extractJson(text);
  const parsed = AdvisorOutputSchema.parse(json);
  return enforceGrounding(parsed, allowedTickers(ctx));
}

/** Extrai o primeiro objeto JSON do texto (tolerante a cercas de código). */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("A IA não retornou um JSON válido.");
  return JSON.parse(candidate.slice(start, end + 1));
}
