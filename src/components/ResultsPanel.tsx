import { money, money2, pct } from "../format";

export interface Computed {
  realNetYield: number;
  feasible: boolean;
  nestEggToday: number;
  nestEggNominal: number;
  projectedNetReal: number;
  requiredContribution: number;
  currentContribution: number;
  achievableMonthly: number;
  gap: number;
}

export function ResultsPanel({ c }: { c: Computed }) {
  const onTrack = c.gap <= 0;
  return (
    <div className="panel">
      <h2>Seu diagnóstico</h2>
      {!c.feasible && (
        <div className="disclaimer" style={{ marginBottom: 12 }}>
          Com essas premissas, o rendimento real líquido é ≤ 0 (o "imposto da inflação" consome o ganho).
          A renda perpétua real é inviável — aumente a taxa real, reduza a inflação ou use ativos isentos.
        </div>
      )}
      <div className="grid cols-3">
        <div className="stat">
          <div className="label">Patrimônio necessário (hoje)</div>
          <div className="value">{money(c.nestEggToday)}</div>
          <div className="sub">{money(c.nestEggNominal)} nominais em 2050</div>
        </div>
        <div className="stat">
          <div className="label">Rendimento real líquido</div>
          <div className={`value ${c.realNetYield > 0 ? "good" : "bad"}`}>{pct(c.realNetYield)}</div>
          <div className="sub">i·(1−t) − π·t (gastável)</div>
        </div>
        <div className="stat">
          <div className="label">Você está no caminho?</div>
          <div className={`value ${onTrack ? "good" : "bad"}`}>{onTrack ? "Sim" : "Falta"}</div>
          <div className="sub">{onTrack ? `sobra ${money2(-c.gap)}/mês` : `faltam ${money2(c.gap)}/mês`}</div>
        </div>
      </div>

      <div className="grid cols-3" style={{ marginTop: 12 }}>
        <div className="stat">
          <div className="label">Projeção líquida em 2050 (hoje)</div>
          <div className="value">{money(c.projectedNetReal)}</div>
          <div className="sub">com seu aporte atual de {money(c.currentContribution)}/mês</div>
        </div>
        <div className="stat">
          <div className="label">Renda mensal atingível</div>
          <div className="value">{money2(c.achievableMonthly)}</div>
          <div className="sub">real, líquida, perpétua</div>
        </div>
        <div className="stat">
          <div className="label">Aporte necessário p/ a meta</div>
          <div className="value">{money(c.requiredContribution)}</div>
          <div className="sub">{c.requiredContribution > c.currentContribution ? `+${money(c.requiredContribution - c.currentContribution)} vs atual` : "meta já coberta"}</div>
        </div>
      </div>
    </div>
  );
}
