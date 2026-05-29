import type { Scenario } from "../types";
import { realNetYield } from "../lib/finance";

interface Props {
  scenario: Scenario;
  onChange: (patch: Partial<Scenario>) => void;
}

interface NumFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  step?: number;
  percent?: boolean;
}

function NumField({ label, value, onChange, hint, step, percent }: NumFieldProps) {
  const display = percent ? +(value * 100).toFixed(4) : value;
  return (
    <div className="field">
      <label>{label}</label>
      <input
        type="number"
        step={step ?? (percent ? 0.1 : 1)}
        value={display}
        onChange={(e) => {
          const raw = parseFloat(e.target.value);
          if (Number.isNaN(raw)) return;
          onChange(percent ? raw / 100 : raw);
        }}
      />
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}

export function PlannerForm({ scenario, onChange }: Props) {
  // Mostra ao vivo quanto da taxa bruta sobra para sacar (após IR sobre o ganho nominal),
  // para o usuário não precisar deduzir: rendimento real líquido = i·(1−t) − π·t.
  const netDecum = realNetYield(scenario.decumulationRealRate, scenario.inflation, scenario.taxRate);
  return (
    <div className="panel">
      <h2>Seu plano</h2>
      <div className="row">
        <NumField label="Renda mensal alvo (R$ de hoje)" value={scenario.targetMonthlyToday} onChange={(v) => onChange({ targetMonthlyToday: v })} step={500} hint="Líquida, poder de compra de hoje" />
        <NumField label="Anos até aposentar" value={scenario.yearsToRetirement} onChange={(v) => onChange({ yearsToRetirement: v })} hint="2026 → 2050 = 24" />
      </div>
      <div className="row">
        <NumField label="Já acumulado (R$)" value={scenario.currentSavings} onChange={(v) => onChange({ currentSavings: v })} step={5000} />
        <NumField label="Aporte mensal (R$)" value={scenario.monthlyContribution} onChange={(v) => onChange({ monthlyContribution: v })} step={100} />
      </div>

      <h3>Premissas</h3>
      <div className="row">
        <NumField label="Inflação (π) a.a." value={scenario.inflation} onChange={(v) => onChange({ inflation: v })} percent hint="ex.: 4%" />
        <NumField label="Taxa real acumulação a.a." value={scenario.realRate} onChange={(v) => onChange({ realRate: v })} percent hint="ex.: IPCA+ 6,5%" />
      </div>
      <div className="row">
        <NumField label="Taxa real na renda (bruta) a.a." value={scenario.decumulationRealRate} onChange={(v) => onChange({ decumulationRealRate: v })} percent hint={`retorno bruto na aposentadoria → ≈ ${(netDecum * 100).toFixed(1)}% líq./ano é o que você saca`} />
        <NumField label="IR efetivo no resgate" value={scenario.taxRate} onChange={(v) => onChange({ taxRate: v })} percent hint="15% p/ >720 dias" />
      </div>
    </div>
  );
}
