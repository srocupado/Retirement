import type { AdvisorOutput } from "../lib/advisor";

interface Props {
  canRun: boolean;
  loading: boolean;
  error: string | null;
  output: AdvisorOutput | null;
  onRun: () => void;
}

export function AdvisorPanel({ canRun, loading, error, output, onRun }: Props) {
  return (
    <div className="panel">
      <h2>Avaliação da IA</h2>
      <button onClick={onRun} disabled={!canRun || loading}>
        {loading ? "Analisando…" : "Avaliar meu plano com a IA"}
      </button>
      {!canRun && <span className="muted" style={{ marginLeft: 10, fontSize: "0.82rem" }}>Cole sua chave da Claude API acima para habilitar.</span>}

      {error && <div className="disclaimer" style={{ marginTop: 12 }}>{error}</div>}

      {output && (
        <div style={{ marginTop: 14 }}>
          <h3>Avaliação</h3>
          <pre className="advisor">{output.evaluation}</pre>

          {output.allocationAdjustments.length > 0 && (
            <>
              <h3>Ajustes de alocação sugeridos</h3>
              <table>
                <thead><tr><th>Sleeve</th><th>Ação</th><th>Por quê</th></tr></thead>
                <tbody>
                  {output.allocationAdjustments.map((a, i) => (
                    <tr key={i}><td>{a.sleeve}</td><td><span className="badge blue">{a.action}</span></td><td>{a.rationale}</td></tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {output.candidateAssets.length > 0 && (
            <>
              <h3>Ativos do screening que merecem atenção</h3>
              <ul>
                {output.candidateAssets.map((c, i) => <li key={i}><strong>{c.ticker}</strong> — {c.reason}</li>)}
              </ul>
            </>
          )}

          {output.caveats.length > 0 && (
            <>
              <h3>Ressalvas</h3>
              <ul>{output.caveats.map((c, i) => <li key={i} className="muted">{c}</li>)}</ul>
            </>
          )}

          <div className="disclaimer" style={{ marginTop: 12 }}>{output.disclaimer}</div>
        </div>
      )}
    </div>
  );
}
