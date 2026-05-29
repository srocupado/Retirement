import type { AssetSnapshot } from "../instruments";

/**
 * brapi.dev — cotações de ações, FIIs, ETFs e cripto da B3.
 * A maioria dos endpoints exige token (gratuito); o usuário cola o seu.
 */
const BASE = "https://brapi.dev/api";

interface BrapiQuote {
  symbol: string;
  regularMarketPrice?: number;
  longName?: string;
  marketCap?: number;
}

/** Busca um lote de tickers numa única requisição (`/quote/A,B,C`). */
async function fetchQuoteChunk(
  tickers: string[],
  token?: string,
): Promise<Record<string, Partial<AssetSnapshot>>> {
  const url = new URL(`${BASE}/quote/${tickers.join(",")}`);
  if (token) url.searchParams.set("token", token);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`brapi: HTTP ${res.status}`);
  const json: { results?: BrapiQuote[] } = await res.json();
  const out: Record<string, Partial<AssetSnapshot>> = {};
  const asOf = new Date().toISOString().slice(0, 10);
  for (const q of json.results ?? []) {
    out[q.symbol] = {
      price: q.regularMarketPrice ?? null,
      marketCap: q.marketCap ?? null,
      asOf,
      source: "brapi",
      stale: false,
    };
  }
  return out;
}

/** Executa `fn` sobre os itens com concorrência limitada (evita 429). */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const slice = items.slice(i, i + limit);
    results.push(...(await Promise.allSettled(slice.map(fn))));
  }
  return results;
}

/**
 * Atualiza preços de uma lista de tickers. Tenta um único lote (rápido) e, se a
 * brapi recusar (ex.: HTTP 400 — limite de tickers do plano gratuito ou um ticker
 * inválido derrubando o lote), refaz ticker a ticker, tolerando falhas individuais.
 * Só propaga o erro se NENHUM ticker funcionar (assim o status reflete a falha real).
 */
export async function fetchQuotes(
  tickers: string[],
  token?: string,
): Promise<Record<string, Partial<AssetSnapshot>>> {
  if (tickers.length === 0) return {};
  try {
    return await fetchQuoteChunk(tickers, token);
  } catch (batchError) {
    const settled = await mapLimit(tickers, 5, (t) => fetchQuoteChunk([t], token));
    const out: Record<string, Partial<AssetSnapshot>> = {};
    let anySuccess = false;
    for (const r of settled) {
      if (r.status === "fulfilled") {
        Object.assign(out, r.value);
        anySuccess = true;
      }
    }
    if (!anySuccess) throw batchError; // todas falharam → mantém o erro p/ o status
    return out;
  }
}

export interface BrapiValidation {
  valid: boolean;
  message: string;
}

/**
 * Valida o token fazendo uma cotação de teste (PETR4) e classifica o resultado:
 * token OK (com preço), inválido/sem permissão (401/403), limite (429), ou
 * falha de rede/CORS. Dá feedback imediato ao usuário sobre a chave colada.
 */
export async function validateBrapiToken(token: string): Promise<BrapiValidation> {
  try {
    const url = new URL(`${BASE}/quote/PETR4`);
    if (token) url.searchParams.set("token", token);
    const res = await fetch(url.toString());
    if (res.status === 401 || res.status === 403)
      return { valid: false, message: `Token inválido ou sem permissão (HTTP ${res.status}).` };
    if (res.status === 429)
      return { valid: false, message: "Limite de requisições atingido (HTTP 429). Tente mais tarde." };
    if (!res.ok) return { valid: false, message: `Falha na brapi (HTTP ${res.status}).` };
    const json: { results?: BrapiQuote[] } = await res.json();
    const price = json.results?.[0]?.regularMarketPrice;
    if (price == null)
      return { valid: false, message: "Resposta sem cotação — o token pode não ter acesso a esse recurso." };
    return { valid: true, message: `Token OK — PETR4 a R$ ${price.toFixed(2)}.` };
  } catch {
    return { valid: false, message: "Não foi possível conectar à brapi (rede/CORS)." };
  }
}

/** Cotação de cripto (BTC/ETH) em BRL. */
export async function fetchCrypto(
  coins: string[],
  token?: string,
): Promise<Record<string, Partial<AssetSnapshot>>> {
  if (coins.length === 0) return {};
  const url = new URL(`${BASE}/v2/crypto`);
  url.searchParams.set("coin", coins.join(","));
  url.searchParams.set("currency", "BRL");
  if (token) url.searchParams.set("token", token);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`brapi crypto: HTTP ${res.status}`);
  const json: { coins?: { coin: string; regularMarketPrice?: number; marketCap?: number }[] } = await res.json();
  const out: Record<string, Partial<AssetSnapshot>> = {};
  const asOf = new Date().toISOString().slice(0, 10);
  for (const c of json.coins ?? []) {
    out[c.coin] = {
      price: c.regularMarketPrice ?? null,
      marketCap: c.marketCap ?? null,
      asOf,
      source: "brapi",
      stale: false,
    };
  }
  return out;
}
