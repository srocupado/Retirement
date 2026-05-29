import type { AssetSnapshot } from "./instruments";
import { SEED_ASSETS } from "./seed";
import { fetchQuotes, fetchCrypto } from "./providers/brapi";
import { fetchRates, type MarketRates } from "./providers/bcb";

export type DataMode = "live" | "cache-only" | "manual";

export interface LiveFetchStatus {
  attempted: boolean; // tentou buscar ao vivo
  ok: boolean; // conseguiu cotações
  updatedCount: number; // nº de ativos atualizados
  tokenInvalid: boolean; // token rejeitado (401/403)
  message: string;
}

export interface AssetsResult {
  assets: AssetSnapshot[];
  status: LiveFetchStatus;
}

/** Classifica um erro do brapi a partir do código HTTP embutido na mensagem. */
function classifyBrapiError(e: unknown): { message: string; tokenInvalid: boolean } {
  const msg = e instanceof Error ? e.message : String(e);
  const code = parseInt(msg.match(/HTTP (\d+)/)?.[1] ?? "0", 10);
  if (code === 401 || code === 403) return { message: `Token brapi inválido ou sem permissão (HTTP ${code}).`, tokenInvalid: true };
  if (code === 429) return { message: "Limite de requisições da brapi atingido (HTTP 429).", tokenInvalid: false };
  if (code) return { message: `Falha na brapi (HTTP ${code}).`, tokenInvalid: false };
  return { message: "Não foi possível conectar à brapi (rede/CORS).", tokenInvalid: false };
}

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
  // FI-Infra são listados na B3 (família rendaFixa, mas com ticker/cotação públicos).
  const equities = SEED_ASSETS.filter(
    (a) => ["fii", "acao", "etf"].includes(a.family) || a.kind === "fiInfra",
  ).map((a) => a.ticker);
  const crypto = SEED_ASSETS.filter((a) => a.kind === "cryptoDirect").map((a) => a.ticker);
  return { equities, crypto };
}

/**
 * Carrega o universo de ativos. Sempre parte da semente (offline-first) e, em
 * modo `live`, sobrepõe preços do brapi quando possível; em `cache-only` usa o
 * último cache; em `manual` fica só na semente.
 */
export async function loadAssets(mode: DataMode, brapiToken?: string): Promise<AssetsResult> {
  const base = SEED_ASSETS.map((a) => ({ ...a }));

  let patches: Record<string, Partial<AssetSnapshot>> = {};
  const cached = readCache<Record<string, Partial<AssetSnapshot>>>(QUOTES_KEY);
  const status: LiveFetchStatus = { attempted: false, ok: false, updatedCount: 0, tokenInvalid: false, message: "Modo offline — dados da semente." };

  if (mode === "live") {
    status.attempted = true;
    try {
      const { equities, crypto } = liveTickers();
      // Cotações (ações/FII/ETF/FI-Infra) são o sinal principal; cripto é opcional.
      const q = await fetchQuotes(equities, brapiToken);
      const c = await fetchCrypto(crypto, brapiToken).catch(() => ({}));
      patches = { ...q, ...c };
      const updated = Object.values(patches).filter((p) => p.source === "brapi" && p.price != null);
      status.updatedCount = updated.length;
      if (updated.length > 0) {
        writeCache(QUOTES_KEY, patches);
        status.ok = true;
        status.message = `${updated.length} ativo(s) atualizado(s) via brapi.`;
      } else {
        status.message = "A brapi não retornou cotações. Usando cache/semente.";
        if (cached) patches = cached.value;
      }
    } catch (e) {
      const c = classifyBrapiError(e);
      status.message = `${c.message} Usando cache/semente.`;
      status.tokenInvalid = c.tokenInvalid;
      if (cached) patches = cached.value;
    }
  } else if (mode === "cache-only" && cached) {
    patches = cached.value;
    status.message = "Usando o último cache salvo.";
  }

  const assets = base.map((a) => (patches[a.ticker] ? { ...a, ...patches[a.ticker] } : a));
  return { assets, status };
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
