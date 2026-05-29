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

/**
 * Atualiza preços (e nome/market cap quando disponíveis) de uma lista de tickers.
 * Retorna um mapa ticker → patch parcial; falhas por ticker são ignoradas.
 */
export async function fetchQuotes(
  tickers: string[],
  token?: string,
): Promise<Record<string, Partial<AssetSnapshot>>> {
  if (tickers.length === 0) return {};
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
