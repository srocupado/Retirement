/**
 * Banco Central — Sistema Gerenciador de Séries Temporais (SGS).
 * Endpoint JSON costuma ser CORS-friendly, então funciona direto do navegador.
 */
export interface MarketRates {
  cdi: number | null; // a.a. (decimal)
  selic: number | null; // meta a.a. (decimal)
  ipca12m: number | null; // acumulado 12m (decimal)
  asOf: string;
  source: string;
}

const SGS = (code: number, last = 1) =>
  `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados/ultimos/${last}?formato=json`;

async function fetchSeries(code: number, last = 1): Promise<number[]> {
  const res = await fetch(SGS(code, last));
  if (!res.ok) throw new Error(`SGS ${code}: HTTP ${res.status}`);
  const data: { data: string; valor: string }[] = await res.json();
  return data.map((d) => parseFloat(d.valor));
}

/** Busca CDI, Selic meta e IPCA (12m). Em caso de falha lança erro. */
export async function fetchRates(): Promise<MarketRates> {
  // 4389 = CDI a.a.; 432 = Selic meta a.a.; 433 = IPCA mensal (%) → acumula 12m
  const [cdi] = await fetchSeries(4389, 1);
  const [selic] = await fetchSeries(432, 1);
  const ipcaMonthly = await fetchSeries(433, 12);
  const ipca12m = ipcaMonthly.reduce((acc, m) => acc * (1 + m / 100), 1) - 1;
  return {
    cdi: cdi != null ? cdi / 100 : null,
    selic: selic != null ? selic / 100 : null,
    ipca12m,
    asOf: new Date().toISOString().slice(0, 10),
    source: "BCB SGS",
  };
}
