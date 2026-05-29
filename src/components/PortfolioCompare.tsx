import { useState } from "react";
import type { PortfolioProjection, ModelComposition } from "../lib/portfolio";
import { money, money2, pct } from "../format";

export function PortfolioCompare({
  projections,
  compositions,
  target,
}: {
  projections: PortfolioProjection[];
  compositions: ModelComposition[];
  target: number;
}) {
  const [tab, setTab] = useState<"capital" | "composicao">("capital");
  const baseline = projections.find((p) => p.id === "baseline");

  return (
    <div className="panel">
      <h2>Carteiras-modelo — quanto capital cada uma exige</h2>
      <div className="tabs">
        <button className={tab === "capital" ? "active" : ""} onClick={() => setTab("capital")}>Capital necessário</button>
        <button className={tab === "composicao" ? "active" : ""} onClick={() => setTab("composicao")}>Composição com ativos reais</button>
      </div>

      {tab === "capital" ? (
        <>
          <p className="muted" style={{ marginTop: 0, fontSize: "0.85rem" }}>
            Para a mesma renda líquida de {money(target)}/mês. Ativos isentos (FII, LCI/LCA/CRI/CRA, incentivadas)
            exigem menos capital porque líquido = bruto.
          </p>
          <table>
            <thead>
              <tr>
                <th>Carteira</th>
                <th className="num">Rend. real líquido</th>
                <th className="num">Patrimônio necessário</th>
                <th className="num">Renda estimada/mês</th>
                <th className="num">vs baseline</th>
              </tr>
            </thead>
            <tbody>
              {projections.map((p) => {
                const delta = baseline && isFinite(p.requiredNestEgg) && isFinite(baseline.requiredNestEgg)
                  ? p.requiredNestEgg / baseline.requiredNestEgg - 1
                  : null;
                const meetsTarget = p.projectedMonthly >= target;
                return (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <div className="muted" style={{ fontSize: "0.75rem" }}>
                        {p.breakdown.map((b) => `${b.label.split(" ")[0]} ${(b.weight * 100).toFixed(0)}%`).join(" · ")}
                      </div>
                    </td>
                    <td className="num">{pct(p.blendedSpendableYield)}</td>
                    <td className="num">{money(p.requiredNestEgg)}</td>
                    <td className="num" style={{ color: meetsTarget ? "var(--accent)" : undefined }} title={meetsTarget ? "Atinge a meta" : "Abaixo da meta"}>
                      {money2(p.projectedMonthly)}
                    </td>
                    <td className="num">
                      {delta == null ? "—" : p.id === "baseline" ? <span className="badge gray">base</span> : (
                        <span className={`badge ${delta < 0 ? "green" : "amber"}`}>{delta < 0 ? "" : "+"}{(delta * 100).toFixed(0)}%</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="muted" style={{ fontSize: "0.75rem", marginBottom: 0 }}>
            "Renda estimada/mês" = quanto cada carteira geraria com o SEU patrimônio projetado para a aposentadoria
            (real, líquida de IR). Em verde, as que atingem a meta de {money2(target)}/mês.
          </p>
        </>
      ) : (
        <>
          <p className="muted" style={{ marginTop: 0, fontSize: "0.85rem" }}>
            Sugestão ilustrativa de como montar cada carteira com <strong>ativos reais</strong> mais bem ranqueados no screening.
            Produtos de balcão sem cotação pública (LCI/LCA/CRI/CRA/CDB/debêntures) aparecem como categoria — não inventamos nomes nem taxas.
          </p>
          <div className="grid cols-2">
            {compositions.map((c) => (
              <div key={c.id} className="stat" style={{ background: "var(--panel-2)" }}>
                <div style={{ fontWeight: 700, marginBottom: 8 }}>{c.name}</div>
                {c.sleeves.map((s) => (
                  <div key={s.sleeve} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: "0.82rem" }}>
                      <span className="badge blue">{(s.weight * 100).toFixed(0)}%</span>{" "}
                      <span className="muted">{s.label}</span>
                    </div>
                    {s.examples.length > 0 ? (
                      <div style={{ fontSize: "0.8rem", marginTop: 2 }}>
                        {s.examples.map((e) => (
                          <span key={e.ticker} title={`${e.name} · score ${e.score?.toFixed(0) ?? "—"}`} style={{ marginRight: 10 }}>
                            <strong>{e.ticker}</strong>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="muted" style={{ fontSize: "0.74rem", marginTop: 2 }}>
                        Alocação por categoria — escolha a oferta na sua corretora.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
