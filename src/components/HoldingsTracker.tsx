import { useMemo, useRef, useState } from "react";
import type { AssetSnapshot, MarketRates } from "../lib/marketData";
import type { InstrumentKind } from "../lib/marketData";
import {
  buildRealPortfolio,
  compareToModel,
  MODEL_PORTFOLIOS,
  type Transaction,
} from "../lib/portfolio";
import { money, money2, pct } from "../format";

/** Rótulos amigáveis para o seletor de tipo de ativo. */
const KIND_LABELS: Record<InstrumentKind, string> = {
  fii: "FII — fundo imobiliário",
  acaoDividendos: "Ação (pagadora de dividendos)",
  equityEtf: "ETF de ações (BR)",
  intlEtf: "ETF internacional",
  fixedIncomeEtf: "ETF de renda fixa",
  bdr: "BDR",
  cryptoDirect: "Cripto (direta)",
  cryptoEtf: "Cripto ETF",
  tesouroIpca: "Tesouro IPCA+",
  tesouroIpcaCoupon: "Tesouro IPCA+ c/ juros",
  tesouroPre: "Tesouro Prefixado",
  tesouroSelic: "Tesouro Selic",
  rendaMais: "Tesouro RendA+",
  educaMais: "Tesouro Educa+",
  cdb: "CDB",
  lci: "LCI (isento)",
  lca: "LCA (isento)",
  debentureComum: "Debênture comum",
  debentureIncentivada: "Debênture incentivada (isenta)",
  cri: "CRI (isento)",
  cra: "CRA (isento)",
  fundoDI: "Fundo DI",
};

const KIND_ORDER = Object.keys(KIND_LABELS) as InstrumentKind[];

const emptyForm = (): { date: string; ticker: string; kind: InstrumentKind; type: "buy" | "sell"; quantity: string; price: string } => ({
  date: new Date().toISOString().slice(0, 10),
  ticker: "",
  kind: "fii",
  type: "buy",
  quantity: "",
  price: "",
});

export function HoldingsTracker({
  transactions,
  setTransactions,
  assets,
  rates,
  inflation,
  targetModelId,
  setTargetModelId,
}: {
  transactions: Transaction[];
  setTransactions: (t: Transaction[]) => void;
  assets: AssetSnapshot[];
  rates: MarketRates | null;
  inflation: number;
  targetModelId: string;
  setTargetModelId: (id: string) => void;
}) {
  const [form, setForm] = useState(emptyForm());
  const fileInput = useRef<HTMLInputElement>(null);

  const effRates: MarketRates = rates ?? { cdi: 0.1065, selic: 0.1075, ipca12m: inflation, asOf: "n/d", source: "n/d" };
  const portfolio = useMemo(
    () => buildRealPortfolio(transactions, assets, effRates, inflation),
    [transactions, assets, effRates, inflation],
  );
  const targetModel = MODEL_PORTFOLIOS.find((m) => m.id === targetModelId) ?? MODEL_PORTFOLIOS[3];
  const comparison = useMemo(() => compareToModel(portfolio.allocation, targetModel), [portfolio.allocation, targetModel]);

  // Quando o ticker digitado existe no universo, infere o tipo automaticamente.
  function onTicker(ticker: string) {
    const found = assets.find((a) => a.ticker.toUpperCase() === ticker.toUpperCase());
    setForm((f) => ({ ...f, ticker, kind: found ? found.kind : f.kind }));
  }

  function addTransaction() {
    const quantity = parseFloat(form.quantity);
    const price = parseFloat(form.price);
    if (!form.ticker.trim() || !isFinite(quantity) || quantity <= 0 || !isFinite(price) || price < 0) return;
    const tx: Transaction = {
      id: crypto.randomUUID(),
      date: form.date,
      ticker: form.ticker.trim().toUpperCase(),
      kind: form.kind,
      type: form.type,
      quantity,
      price,
    };
    setTransactions([...transactions, tx]);
    setForm((f) => ({ ...emptyForm(), date: f.date, ticker: "", kind: f.kind }));
  }

  function removeTransaction(id: string) {
    setTransactions(transactions.filter((t) => t.id !== id));
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ version: 1, transactions }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carteira-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file: File) {
    file.text().then((txt) => {
      try {
        const parsed = JSON.parse(txt);
        const list: Transaction[] = Array.isArray(parsed) ? parsed : parsed.transactions;
        if (Array.isArray(list)) setTransactions(list.filter((t) => t.ticker && t.quantity));
      } catch {
        alert("Arquivo inválido — esperado um JSON exportado por esta ferramenta.");
      }
    });
  }

  return (
    <div className="panel">
      <h2>Minha carteira — lançamentos e acompanhamento</h2>
      <p className="muted" style={{ marginTop: 0, fontSize: "0.85rem" }}>
        Registre o que você for comprando (e vendendo). A carteira é consolidada por preço médio e comparada com a carteira-modelo.
        Os dados ficam só no seu navegador.
      </p>

      {/* Formulário de lançamento */}
      <div className="row" style={{ alignItems: "flex-end" }}>
        <div className="field" style={{ minWidth: 130 }}>
          <label>Data</label>
          <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
        </div>
        <div className="field" style={{ minWidth: 120 }}>
          <label>Ativo</label>
          <input list="universe-tickers" placeholder="ex.: HGLG11" value={form.ticker} onChange={(e) => onTicker(e.target.value)} />
          <datalist id="universe-tickers">
            {assets.map((a) => (
              <option key={a.ticker} value={a.ticker}>{a.name}</option>
            ))}
          </datalist>
        </div>
        <div className="field" style={{ minWidth: 180 }}>
          <label>Tipo</label>
          <select value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value as InstrumentKind }))}>
            {KIND_ORDER.map((k) => (
              <option key={k} value={k}>{KIND_LABELS[k]}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ minWidth: 90, maxWidth: 110 }}>
          <label>Operação</label>
          <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as "buy" | "sell" }))}>
            <option value="buy">Compra</option>
            <option value="sell">Venda</option>
          </select>
        </div>
        <div className="field" style={{ minWidth: 90, maxWidth: 110 }}>
          <label>Qtd.</label>
          <input type="number" min="0" step="any" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
        </div>
        <div className="field" style={{ minWidth: 100, maxWidth: 130 }}>
          <label>Preço (R$)</label>
          <input type="number" min="0" step="any" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
        </div>
        <div className="field" style={{ flex: "0 0 auto" }}>
          <button onClick={addTransaction}>Adicionar</button>
        </div>
      </div>

      {portfolio.positions.length === 0 ? (
        <p className="muted" style={{ fontSize: "0.85rem" }}>Nenhuma posição ainda. Adicione seus lançamentos acima.</p>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid cols-3" style={{ marginTop: 8 }}>
            <div className="stat">
              <div className="label">Valor atual</div>
              <div className="value">{money(portfolio.totalValue)}</div>
              <div className="sub">investido: {money(portfolio.totalCost)}</div>
            </div>
            <div className="stat">
              <div className="label">Resultado não realizado</div>
              <div className={`value ${portfolio.unrealizedPL >= 0 ? "good" : "bad"}`}>{money(portfolio.unrealizedPL)}</div>
              <div className="sub">{portfolio.totalCost > 0 ? pct(portfolio.unrealizedPL / portfolio.totalCost) : "—"}</div>
            </div>
            <div className="stat">
              <div className="label">Renda líquida projetada</div>
              <div className="value good">{money2(portfolio.monthlyNetIncome)}<span style={{ fontSize: "0.8rem" }}>/mês</span></div>
              <div className="sub">real, líquida de IR (estimativa)</div>
            </div>
          </div>

          {/* Posições */}
          <h3>Posições</h3>
          <table>
            <thead>
              <tr>
                <th>Ativo</th>
                <th className="num">Qtd.</th>
                <th className="num">Preço médio</th>
                <th className="num">Preço atual</th>
                <th className="num">Valor</th>
                <th className="num">Peso</th>
                <th className="num">Renda/mês</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.positions.map((p) => (
                <tr key={p.ticker}>
                  <td>
                    <strong>{p.ticker}</strong>{" "}
                    {!p.inUniverse && <span className="badge gray">fora do universo</span>}
                    <div className="muted" style={{ fontSize: "0.72rem" }}>{p.name}</div>
                  </td>
                  <td className="num">{p.quantity.toLocaleString("pt-BR")}</td>
                  <td className="num">{money2(p.avgPrice)}</td>
                  <td className="num">{money2(p.currentPrice)}</td>
                  <td className="num">{money(p.marketValue)}</td>
                  <td className="num">{pct(p.weight, 1)}</td>
                  <td className="num">{money2(p.monthlyNetIncome)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Real x modelo */}
          <h3>Alocação real x carteira-modelo</h3>
          <div className="field" style={{ maxWidth: 260 }}>
            <label>Comparar com</label>
            <select value={targetModelId} onChange={(e) => setTargetModelId(e.target.value)}>
              {MODEL_PORTFOLIOS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <table>
            <thead>
              <tr>
                <th>Bloco (sleeve)</th>
                <th className="num">Real</th>
                <th className="num">Alvo</th>
                <th className="num">Ajuste sugerido</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((c) => (
                <tr key={c.sleeve}>
                  <td>{c.label}</td>
                  <td className="num">{pct(c.realWeight, 1)}</td>
                  <td className="num">{pct(c.targetWeight, 1)}</td>
                  <td className="num">
                    {Math.abs(c.delta) < 0.005 ? (
                      <span className="badge green">no alvo</span>
                    ) : (
                      <span className={`badge ${c.delta > 0 ? "amber" : "blue"}`}>
                        {c.delta > 0 ? "reduzir " : "aumentar "}{pct(Math.abs(c.delta), 1)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Lançamentos */}
          <h3>Lançamentos ({transactions.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Ativo</th>
                <th>Operação</th>
                <th className="num">Qtd.</th>
                <th className="num">Preço</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...transactions].sort((a, b) => b.date.localeCompare(a.date)).map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td>{t.ticker}</td>
                  <td>{t.type === "buy" ? "Compra" : "Venda"}</td>
                  <td className="num">{t.quantity.toLocaleString("pt-BR")}</td>
                  <td className="num">{money2(t.price)}</td>
                  <td className="num">
                    <button className="secondary" style={{ padding: "2px 8px", fontSize: "0.75rem" }} onClick={() => removeTransaction(t.id)}>remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Backup */}
      <div className="row" style={{ marginTop: 16 }}>
        <button className="secondary" onClick={exportJson} disabled={transactions.length === 0}>Exportar (.json)</button>
        <button className="secondary" onClick={() => fileInput.current?.click()}>Importar (.json)</button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) importJson(f); e.target.value = ""; }}
        />
      </div>
    </div>
  );
}
