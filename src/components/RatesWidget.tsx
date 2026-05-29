import type { MarketRates } from "../lib/marketData";
import type { DataMode } from "../lib/marketData";
import { pct } from "../format";

interface Props {
  rates: MarketRates | null;
  mode: DataMode;
  onMode: (m: DataMode) => void;
  brapiToken: string;
  onBrapiToken: (t: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function RatesWidget({ rates, mode, onMode, brapiToken, onBrapiToken, onRefresh, loading }: Props) {
  return (
    <div className="panel">
      <h2>Dados de mercado</h2>
      <div className="grid cols-3">
        <div className="stat"><div className="label">CDI</div><div className="value">{rates ? pct(rates.cdi ?? 0) : "—"}</div></div>
        <div className="stat"><div className="label">Selic</div><div className="value">{rates ? pct(rates.selic ?? 0) : "—"}</div></div>
        <div className="stat"><div className="label">IPCA 12m</div><div className="value">{rates ? pct(rates.ipca12m ?? 0) : "—"}</div></div>
      </div>
      <div className="field" style={{ marginTop: 12 }}>
        <label>Modo de dados</label>
        <select value={mode} onChange={(e) => onMode(e.target.value as DataMode)}>
          <option value="manual">Manual / semente (offline)</option>
          <option value="cache-only">Apenas cache</option>
          <option value="live">Ao vivo (BCB + brapi)</option>
        </select>
        <div className="hint">{rates ? `Fonte: ${rates.source} · ${rates.asOf}` : ""}</div>
      </div>
      {mode === "live" && (
        <div className="field">
          <label>Token brapi (opcional, para cotações)</label>
          <input type="password" value={brapiToken} placeholder="seu token brapi.dev" onChange={(e) => onBrapiToken(e.target.value)} />
          <div className="hint">CDI/Selic/IPCA vêm do BCB sem token. Cotações de ações/FII/cripto usam o brapi.</div>
        </div>
      )}
      <button className="secondary" onClick={onRefresh} disabled={loading}>{loading ? "Atualizando…" : "Atualizar dados"}</button>
    </div>
  );
}
