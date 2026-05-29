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
