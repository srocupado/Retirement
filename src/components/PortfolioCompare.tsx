import type { PortfolioProjection } from "../lib/portfolio";
import { money, money2, pct } from "../format";

export function PortfolioCompare({ projections, target }: { projections: PortfolioProjection[]; target: number }) {
  const baseline = projections.find((p) => p.id === "baseline");
  return (
    <div className="panel">
      <h2>Carteiras-modelo — quanto capital cada uma exige</h2>
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
            <th className="num">vs baseline</th>
          </tr>
        </thead>
        <tbody>
          {projections.map((p) => {
            const delta = baseline && isFinite(p.requiredNestEgg) && isFinite(baseline.requiredNestEgg)
              ? p.requiredNestEgg / baseline.requiredNestEgg - 1
              : null;
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
        Renda projetada para a carteira mais eficiente, com seu patrimônio-alvo: {money2(projections[0]?.projectedMonthly ?? 0)}/mês.
      </p>
    </div>
  );
}
