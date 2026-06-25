import { useState } from "react";
import { accumulationByRegime, equityBreakevenPremium } from "../lib/finance";
import { pct } from "../format";

/**
 * Compara como R$1 cresce em N anos por regime tributário, deixando o usuário
 * definir o prêmio de retorno da bolsa e mostrando o prêmio de equilíbrio.
 */
export function AccumulationRegimes({
  grossReal,
  inflation,
  years,
}: {
  grossReal: number;
  inflation: number;
  years: number;
}) {
  const [premiumPct, setPremiumPct] = useState(1.5); // prêmio de retorno da bolsa, em p.p.
  const premium = premiumPct / 100;
  const rows = accumulationByRegime(grossReal, inflation, years, premium);
  const breakeven = equityBreakevenPremium(grossReal, inflation, years);
  const best = Math.max(...rows.map((r) => r.netFactor));

  return (
    <div className="panel">
      <h2>Crescer com isenção vs tributado</h2>
      <p className="muted" style={{ marginTop: 0, fontSize: "0.85rem" }}>
        Quanto R$ 1 vira em {years} anos, líquido e em poder de compra de hoje, à taxa real bruta de {pct(grossReal)} a.a.
        O ativo isento compõe sem vazamento; os diferidos pagam IR só no fim; o come-cotas vaza a cada semestre.
      </p>

      <div className="field" style={{ maxWidth: 320 }}>
        <label>Prêmio de retorno da bolsa (ETF de ações), em p.p. a.a.</label>
        <input type="number" step={0.5} value={premiumPct} onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v)) setPremiumPct(v); }} />
        <div className="hint">Quanto a bolsa renderia ACIMA dos {pct(grossReal)} do isento. Ela carrega 17,5% de IR (diferido).</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Regime</th>
            <th className="num">Taxa real bruta</th>
            <th className="num">R$ 1 vira</th>
            <th className="num">CAGR líquido</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td style={{ color: r.netFactor === best ? "var(--accent)" : undefined }}>
                {r.netFactor === best ? "★ " : ""}{r.label}
              </td>
              <td className="num">{pct(r.grossRealRate)}</td>
              <td className="num" style={{ color: r.netFactor === best ? "var(--accent)" : undefined }}>{r.netFactor.toFixed(2)}×</td>
              <td className="num">{pct(r.netCagr)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="disclaimer" style={{ marginTop: 12, background: "rgba(56,189,248,0.08)", borderColor: "rgba(56,189,248,0.3)", color: "var(--accent-2)" }}>
        {breakeven == null ? (
          <>Mesmo com +20% a.a., o ETF de ações não empata o isento neste horizonte — a isenção domina.</>
        ) : breakeven <= 0 ? (
          <>Com essas premissas, o ETF já supera o isento mesmo sem prêmio.</>
        ) : (
          <>
            <strong>Ponto de equilíbrio:</strong> a bolsa precisa render <strong>+{pct(breakeven)} a.a.</strong> acima
            do ativo isento (ou seja, ~{pct(grossReal + breakeven)} real bruto) só para <em>empatar</em> o valor líquido
            acumulado — por causa dos 17,5% de IR na venda. Abaixo disso, a isenção vence.
          </>
        )}
      </div>
    </div>
  );
}
