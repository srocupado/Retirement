import type { AssetSnapshot } from "./instruments";
import { SEED_ASSETS } from "./seed";
import { fetchQuotes, fetchCrypto } from "./providers/brapi";
import { fetchRates, type MarketRates } from "./providers/bcb";

export type DataMode = "live" | "cache-only" | "manual";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const RATES_KEY = "rp.rates.v1";
const QUOTES_KEY = "rp.quotes.v1";

interface Cached<T> {
  at: number;
  value: T;
}

function readCache<T>(key: string): Cached<T> | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Cached<T>) : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), value }));
  } catch {
    /* localStorage indisponível — segue sem cache */
  }
}

function fresh<T>(c: Cached<T> | null): boolean {
  return !!c && Date.now() - c.at < CACHE_TTL_MS;
}

/** Tickers de bolsa/cripto que o brapi consegue atualizar. */
function liveTickers(): { equities: string[]; crypto: string[] } {
  const equities = SEED_ASSETS.filter((a) => ["fii", "acao", "etf"].includes(a.family)).map((a) => a.ticker);
  const crypto = SEED_ASSETS.filter((a) => a.kind === "cryptoDirect").map((a) => a.ticker);
  return { equities, crypto };
}

/**
 * Carrega o universo de ativos. Sempre parte da semente (offline-first) e, em
 * modo `live`, sobrepõe preços do brapi quando possível; em `cache-only` usa o
 * último cache; em `manual` fica só na semente.
 */
export async function loadAssets(mode: DataMode, brapiToken?: string): Promise<AssetSnapshot[]> {
  const base = SEED_ASSETS.map((a) => ({ ...a }));

  let patches: Record<string, Partial<AssetSnapshot>> = {};
  const cached = readCache<Record<string, Partial<AssetSnapshot>>>(QUOTES_KEY);

  if (mode === "live") {
    try {
      const { equities, crypto } = liveTickers();
      const [q, c] = await Promise.all([
        fetchQuotes(equities, brapiToken).catch(() => ({})),
        fetchCrypto(crypto, brapiToken).catch(() => ({})),
      ]);
      patches = { ...q, ...c };
      if (Object.keys(patches).length > 0) writeCache(QUOTES_KEY, patches);
      else if (cached) patches = cached.value; // nada veio: usa cache
    } catch {
      if (cached) patches = cached.value;
    }
  } else if (mode === "cache-only" && cached) {
    patches = cached.value;
  }

  return base.map((a) => (patches[a.ticker] ? { ...a, ...patches[a.ticker] } : a));
}

/** Taxas macro (CDI/Selic/IPCA), com cache de 24h e fallback. */
export async function loadRates(mode: DataMode): Promise<MarketRates> {
  const cached = readCache<MarketRates>(RATES_KEY);
  const fallback: MarketRates = cached?.value ?? {
    cdi: 0.1065,
    selic: 0.1075,
    ipca12m: 0.04,
    asOf: "estimativa",
    source: "fallback (offline)",
  };

  if (mode !== "live") return fresh(cached) && cached ? cached.value : fallback;

  try {
    const rates = await fetchRates();
    writeCache(RATES_KEY, rates);
    return rates;
  } catch {
    return fallback;
  }
}
