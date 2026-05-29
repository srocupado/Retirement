import { useState } from "react";
import type { ScreenResult } from "../lib/screener";
import type { AssetSnapshot, AssetFamily } from "../lib/marketData";
import { pct } from "../format";

const FAMILIES: { key: AssetFamily; label: string }[] = [
  { key: "fii", label: "FIIs" },
  { key: "acao", label: "Ações" },
  { key: "rendaFixa", label: "Renda fixa" },
  { key: "etf", label: "ETFs" },
  { key: "cripto", label: "Cripto" },
];

function ScoreBar({ value }: { value: number | null }) {
  if (value == null) return <span className="muted">—</span>;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div className="score-bar" style={{ width: 70 }}>
        <div style={{ width: `${value}%` }} />
      </div>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{value.toFixed(0)}</span>
    </div>
  );
}

export function ScreenerTable({ results, assets }: { results: ScreenResult[]; assets: AssetSnapshot[] }) {
  const [tab, setTab] = useState<AssetFamily>("fii");
  const byTicker = new Map(assets.map((a) => [a.ticker, a]));

  const rows = results
    .filter((r) => r.family === tab)
    .sort((a, b) => (b.composite ?? -1) - (a.composite ?? -1));

  return (
    <div className="panel">
      <h2>Análise de ativos (screening)</h2>
      <div className="tabs">
        {FAMILIES.map((f) => (
          <button key={f.key} className={tab === f.key ? "active" : ""} onClick={() => setTab(f.key)}>
            {f.label}
          </button>
        ))}
      </div>
      <table>
        <thead>
          <tr>
            <th>Ativo</th>
            <th>Score</th>
            <th className="num">Métrica-chave</th>
            <th>Sinais</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const a = byTicker.get(r.ticker);
            const key = r.metrics[0];
            return (
              <tr key={r.ticker}>
                <td>
                  <strong>{r.ticker}</strong>{" "}
                  {a?.stale ? <span className="badge gray">semente</span> : <span className="badge blue">{a?.source}</span>}
                  <div className="muted" style={{ fontSize: "0.75rem" }}>{r.name}</div>
                </td>
                <td><ScoreBar value={r.composite} /></td>
                <td className="num">
                  {key ? <>{key.label}: <strong>{key.key === "rate" || key.key === "dy" || key.key === "ter" ? pct(key.value ?? 0) : (key.value ?? 0).toLocaleString("pt-BR")}</strong></> : "—"}
                </td>
                <td>
                  {r.flags.length === 0 ? <span className="badge green">ok</span> : r.flags.map((f, i) => <span key={i} className="flag">⚠ {f}</span>)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
