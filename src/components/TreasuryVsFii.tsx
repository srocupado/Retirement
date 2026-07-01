import { useState } from "react";
import { compareTreasuryVsFii, breakevenReRating } from "../lib/finance";
import { money, pct } from "../format";

/**
 * "Os FIIs pagam 8–9% e o Tesouro pré/Selic rende 12–13% — não vale acumular no
 * Tesouro agora e migrar pro FII depois?" Este painel põe os dois caminhos na
 * mesma régua (real, líquida) e mostra o trade-off que decide: o juro real alto
 * travado no Tesouro × a reprecificação das cotas de FII que quem espera perde.
 */
export function TreasuryVsFii({
  currentSavings,
  monthlyContribution,
  inflation,
  years,
}: {
  currentSavings: number;
  monthlyContribution: number;
  inflation: number;
  years: number;
}) {
  const [migrateYear, setMigrateYear] = useState(Math.min(6, years));
  const [treasuryRealPct, setTreasuryRealPct] = useState(8); // taxa real travada (Selic ~13% com π ~4,5%)
  const [fiiRealPct, setFiiRealPct] = useState(6); // retorno real total do FII (dividendo isento + valorização)
  const [reRatingPct, setReRatingPct] = useState(15); // reprecificação one-time na janela de espera

  const input = {
    currentSavings,
    monthlyContribution,
    years,
    migrateYear,
    inflation,
    treasuryRealRate: treasuryRealPct / 100,
    treasuryTax: 0.15,
    fiiTotalReal: fiiRealPct / 100,
    reRating: reRatingPct / 100,
  };
  const r = compareTreasuryVsFii(input);
  const { reRating, ...withoutReRating } = input;
  const be = breakevenReRating(withoutReRating);

  const fiiWins = r.winner === "fiiDirect";
  const tie = r.winner === "tie";
  const gap = Math.abs(r.advantage);

  return (
    <div className="panel">
      <h2>Acumular no Tesouro e migrar × ir direto pro FII</h2>
      <p className="muted" style={{ marginTop: 0, fontSize: "0.85rem" }}>
        Compara os dois caminhos ao longo de {years} anos, em R$ de hoje e líquidos de IR, com o mesmo saldo inicial ({money(currentSavings)})
        e o mesmo aporte ({money(monthlyContribution)}/mês). O 12–13% do Tesouro é <strong>nominal e bruto</strong>; o 8–9% do FII é só o
        dividendo, <strong>já isento</strong>. Na mesma régua, o duelo é: juro real travado no Tesouro × a reprecificação da cota que quem espera perde.
      </p>

      <div className="grid cols-2" style={{ gap: 12 }}>
        <div className="field">
          <label>Migrar pro FII no ano</label>
          <input type="range" min={0} max={years} step={1} value={migrateYear} onChange={(e) => setMigrateYear(parseInt(e.target.value, 10))} />
          <div className="hint">Ano {migrateYear}: fica no Tesouro até lá e então move tudo pro FII (paga 15% de IR na migração). 0 = já vai direto pro FII.</div>
        </div>
        <div className="field">
          <label>Reprecificação da cota de FII na espera (one-time, real)</label>
          <input type="range" min={0} max={60} step={1} value={reRatingPct} onChange={(e) => setReRatingPct(parseInt(e.target.value, 10))} />
          <div className="hint">+{reRatingPct}% de valorização real da cota conforme o juro normaliza. Quem vai direto captura; quem espera no Tesouro migra caro.</div>
        </div>
        <div className="field">
          <label>Taxa real travada no Tesouro (a.a.)</label>
          <input type="number" step={0.5} value={treasuryRealPct} onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v)) setTreasuryRealPct(v); }} />
          <div className="hint">Real ≈ nominal − inflação. Selic ~13% com π ~{pct(inflation, 1)} ≈ 8% real. IR 15% diferido, sobre o ganho nominal.</div>
        </div>
        <div className="field">
          <label>Retorno real total do FII (a.a.)</label>
          <input type="number" step={0.5} value={fiiRealPct} onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v)) setFiiRealPct(v); }} />
          <div className="hint">Dividendo isento + valorização real da cota, líquido de fricção. Não é só o yield mensal.</div>
        </div>
      </div>

      <div className="grid cols-2" style={{ marginTop: 12 }}>
        <div className="stat">
          <div className="label">Ir direto pro FII</div>
          <div className="value" style={{ color: fiiWins ? "var(--accent)" : undefined }}>{fiiWins ? "★ " : ""}{money(r.fiiDirectNetReal)}</div>
          <div className="sub">isento na trajetória toda; captura a reprecificação</div>
        </div>
        <div className="stat">
          <div className="label">Tesouro até o ano {migrateYear}, depois FII</div>
          <div className="value" style={{ color: !fiiWins && !tie ? "var(--accent)" : undefined }}>{!fiiWins && !tie ? "★ " : ""}{money(r.treasuryThenFiiNetReal)}</div>
          <div className="sub">{money(r.treasuryPotAtMigration)} líquidos ao migrar</div>
        </div>
      </div>

      <div
        className="disclaimer"
        style={{ marginTop: 12, background: "rgba(56,189,248,0.08)", borderColor: "rgba(56,189,248,0.3)", color: "var(--accent-2)" }}
      >
        {tie ? (
          <>Com essas premissas os dois caminhos praticamente <strong>empatam</strong>.</>
        ) : fiiWins ? (
          <><strong>Ir direto pro FII vence por {money(gap)}</strong> — a reprecificação de +{reRatingPct}% da cota supera o juro real de {pct(input.treasuryRealRate)} que o Tesouro travaria.</>
        ) : (
          <><strong>Esperar no Tesouro e migrar vence por {money(gap)}</strong> — o juro real de {pct(input.treasuryRealRate)} rende mais do que a reprecificação de +{reRatingPct}% do FII na janela.</>
        )}
        {be != null && (
          <>
            {" "}
            <br />
            <strong>Ponto de virada:</strong> se a cota de FII reprecificar <strong>mais de +{pct(be)}</strong> na espera, ir direto passa a ganhar. Abaixo disso, esperar no Tesouro vence.
          </>
        )}
        {be == null && (
          <>
            {" "}
            <br />
            Neste horizonte, nem uma reprecificação enorme do FII empata: o juro real do Tesouro domina.
          </>
        )}
        <br />
        <span className="muted" style={{ fontSize: "0.8rem" }}>
          O que a leitura "13% &gt; 8%" ignora: o FII paga pouco <em>porque</em> o juro está alto e a cota está barata — quando o juro cai (o gatilho pra migrar), a cota sobe e você migra caro.
        </span>
      </div>
    </div>
  );
}
