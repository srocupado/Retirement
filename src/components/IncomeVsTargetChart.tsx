import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from "recharts";
import { compact } from "../format";

export interface AccumPoint {
  year: number;
  netReal: number;
}

export function IncomeVsTargetChart({ data, targetNestEgg }: { data: AccumPoint[]; targetNestEgg: number }) {
  return (
    <div className="panel">
      <h2>Trajetória de acumulação (R$ de hoje, líquido)</h2>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid stroke="#2c3848" strokeDasharray="3 3" />
            <XAxis dataKey="year" stroke="#9aa7b4" tickFormatter={(y) => `${2026 + Number(y)}`} />
            <YAxis stroke="#9aa7b4" tickFormatter={(v) => compact(Number(v))} width={70} />
            <Tooltip
              contentStyle={{ background: "#1a212b", border: "1px solid #2c3848", borderRadius: 8, color: "#e6edf3" }}
              formatter={(v: number) => compact(v)}
              labelFormatter={(y) => `Ano ${2026 + Number(y)}`}
            />
            {isFinite(targetNestEgg) && (
              <ReferenceLine y={targetNestEgg} stroke="#fbbf24" strokeDasharray="6 4" label={{ value: "meta", fill: "#fbbf24", position: "insideTopRight" }} />
            )}
            <Area type="monotone" dataKey="netReal" stroke="#4ade80" fill="rgba(74,222,128,0.18)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
