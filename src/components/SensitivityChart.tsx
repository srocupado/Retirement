import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from "recharts";
import { realNetYield } from "../lib/finance";
import { money2 } from "../format";

/**
 * Sensibilidade ao risco de reinvestimento: a renda mensal perpétua que o
 * patrimônio projetado gera para cada taxa real obtida na aposentadoria (i_dec).
 * O IPCA+ 2050 vence num lump sum — a taxa de reinvestimento é a maior incerteza.
 */
export function SensitivityChart({
  nestEgg,
  inflation,
  taxRate,
  currentRate,
  target,
}: {
  nestEgg: number;
  inflation: number;
  taxRate: number;
  currentRate: number;
  target: number;
}) {
  const data = [];
  for (let i = 0.02; i <= 0.0901; i += 0.0025) {
    data.push({
      rate: +(i * 100).toFixed(2),
      monthly: (nestEgg * Math.max(0, realNetYield(i, inflation, taxRate))) / 12,
    });
  }
  // taxa real necessária para bater a meta: i = (12·M/W + π·t)/(1−t)
  const breakeven = nestEgg > 0 ? ((target * 12) / nestEgg + inflation * taxRate) / (1 - taxRate) : null;

  return (
    <div className="panel">
      <h2>E se a taxa real em 2050 for outra?</h2>
      <p className="muted" style={{ marginTop: 0, fontSize: "0.85rem" }}>
        Renda mensal perpétua do seu patrimônio projetado, para cada taxa real conseguida no reinvestimento
        (risco de reinvestimento do IPCA+ 2050).
        {breakeven != null && isFinite(breakeven) && breakeven < 0.15 && (
          <> Para bater a meta, você precisa reinvestir a pelo menos <strong>IPCA+ {(breakeven * 100).toFixed(1)}%</strong>.</>
        )}
      </p>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid stroke="#2c3848" strokeDasharray="3 3" />
            <XAxis dataKey="rate" stroke="#9aa7b4" tickFormatter={(v) => `${v}%`} />
            <YAxis stroke="#9aa7b4" tickFormatter={(v) => money2(Number(v)).replace(",00", "")} width={86} />
            <Tooltip
              contentStyle={{ background: "#1a212b", border: "1px solid #2c3848", borderRadius: 8, color: "#e6edf3" }}
              formatter={(v: number) => [money2(v) + "/mês", "renda"]}
              labelFormatter={(r) => `IPCA+ ${r}% a.a.`}
            />
            <ReferenceLine y={target} stroke="#fbbf24" strokeDasharray="6 4" label={{ value: "meta", fill: "#fbbf24", position: "insideTopLeft" }} />
            <ReferenceLine x={+(currentRate * 100).toFixed(2)} stroke="#38bdf8" strokeDasharray="4 4" label={{ value: "sua premissa", fill: "#38bdf8", position: "insideTopRight" }} />
            <Line type="monotone" dataKey="monthly" stroke="#4ade80" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
