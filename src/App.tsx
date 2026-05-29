import { useEffect, useMemo, useState } from "react";
import { DEFAULT_SCENARIO, type Scenario } from "./types";
import {
  requiredNestEgg,
  projectAccumulation,
  requiredContribution,
  achievableIncome,
} from "./lib/finance";
import {
  loadAssets,
  loadRates,
  type AssetSnapshot,
  type MarketRates,
  type DataMode,
} from "./lib/marketData";
import { screenAll, topByFamily, type ScreenResult } from "./lib/screener";
import { projectAllModels, composeAllModels, MODEL_PORTFOLIOS, type Transaction } from "./lib/portfolio";
import { runAdvisor, DEFAULT_MODEL, type AdvisorContext, type AdvisorOutput } from "./lib/advisor";

import { PlannerForm } from "./components/PlannerForm";
import { ResultsPanel, type Computed } from "./components/ResultsPanel";
import { IncomeVsTargetChart } from "./components/IncomeVsTargetChart";
import { PortfolioCompare } from "./components/PortfolioCompare";
import { HoldingsTracker } from "./components/HoldingsTracker";
import { ScreenerTable } from "./components/ScreenerTable";
import { RatesWidget } from "./components/RatesWidget";
import { ApiKeySettings } from "./components/ApiKeySettings";
import { AdvisorPanel } from "./components/AdvisorPanel";

const ls = {
  get: (k: string, d = "") => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } },
  del: (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};

export default function App() {
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const onChange = (patch: Partial<Scenario>) => setScenario((s) => ({ ...s, ...patch }));

  // ---- dados de mercado ----
  const [mode, setMode] = useState<DataMode>((ls.get("rp.mode", "manual") as DataMode) || "manual");
  const [brapiToken, setBrapiToken] = useState(ls.get("rp.brapiToken"));
  const [assets, setAssets] = useState<AssetSnapshot[]>([]);
  const [rates, setRates] = useState<MarketRates | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  async function refreshData() {
    setLoadingData(true);
    try {
      const [a, r] = await Promise.all([loadAssets(mode, brapiToken), loadRates(mode)]);
      setAssets(a);
      setRates(r);
    } finally {
      setLoadingData(false);
    }
  }
  useEffect(() => { refreshData(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { ls.set("rp.mode", mode); }, [mode]);
  useEffect(() => { ls.set("rp.brapiToken", brapiToken); }, [brapiToken]);

  // ---- cálculos financeiros ----
  const computed: Computed = useMemo(() => {
    const ne = requiredNestEgg(scenario.targetMonthlyToday, scenario.decumulationRealRate, scenario.inflation, scenario.taxRate, scenario.yearsToRetirement);
    const acc = projectAccumulation({
      currentSavings: scenario.currentSavings,
      monthlyContribution: scenario.monthlyContribution,
      realRate: scenario.realRate,
      inflation: scenario.inflation,
      years: scenario.yearsToRetirement,
      taxRate: scenario.taxRate,
    });
    const reqContrib = requiredContribution(ne.nestEggToday, {
      currentSavings: scenario.currentSavings,
      realRate: scenario.realRate,
      inflation: scenario.inflation,
      years: scenario.yearsToRetirement,
      taxRate: scenario.taxRate,
    });
    const inc = achievableIncome(acc.netReal, scenario.decumulationRealRate, scenario.inflation, scenario.taxRate, scenario.targetMonthlyToday);
    return {
      realNetYield: ne.realNetYield,
      feasible: ne.feasible,
      nestEggToday: ne.nestEggToday,
      nestEggNominal: ne.nestEggAtRetirementNominal,
      projectedNetReal: acc.netReal,
      requiredContribution: reqContrib,
      currentContribution: scenario.monthlyContribution,
      achievableMonthly: inc.monthlyReal,
      gap: inc.gap,
    };
  }, [scenario]);

  const trajectory = useMemo(() => {
    const pts = [];
    for (let y = 0; y <= scenario.yearsToRetirement; y++) {
      const acc = projectAccumulation({
        currentSavings: scenario.currentSavings,
        monthlyContribution: scenario.monthlyContribution,
        realRate: scenario.realRate,
        inflation: scenario.inflation,
        years: y,
        taxRate: scenario.taxRate,
      });
      pts.push({ year: y, netReal: acc.netReal });
    }
    return pts;
  }, [scenario]);

  // ---- screening + carteiras ----
  const screenResults: ScreenResult[] = useMemo(() => (assets.length ? screenAll(assets) : []), [assets]);
  const portfolios = useMemo(
    () => projectAllModels(scenario.targetMonthlyToday, computed.projectedNetReal, { inflation: scenario.inflation }),
    [scenario.targetMonthlyToday, scenario.inflation, computed.projectedNetReal],
  );
  const compositions = useMemo(() => composeAllModels(MODEL_PORTFOLIOS, screenResults), [screenResults]);

  // ---- minha carteira (lançamentos) ----
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try { return JSON.parse(ls.get("rp.holdings.v1", "[]")) as Transaction[]; } catch { return []; }
  });
  const [targetModelId, setTargetModelId] = useState(ls.get("rp.targetModel", "renda") || "renda");
  useEffect(() => { ls.set("rp.holdings.v1", JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { ls.set("rp.targetModel", targetModelId); }, [targetModelId]);

  // ---- consultor de IA ----
  const [apiKey, setApiKey] = useState(ls.get("rp.apiKey"));
  const [remember, setRemember] = useState(!!ls.get("rp.apiKey"));
  const [model, setModel] = useState(ls.get("rp.model", DEFAULT_MODEL) || DEFAULT_MODEL);
  const [advisorOut, setAdvisorOut] = useState<AdvisorOutput | null>(null);
  const [advisorErr, setAdvisorErr] = useState<string | null>(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);

  useEffect(() => { if (remember && apiKey) ls.set("rp.apiKey", apiKey); else ls.del("rp.apiKey"); }, [remember, apiKey]);
  useEffect(() => { ls.set("rp.model", model); }, [model]);

  async function runAdvisorClick() {
    setAdvisorErr(null);
    setAdvisorLoading(true);
    try {
      const top = (["fii", "acao", "rendaFixa", "etf", "cripto"] as const)
        .flatMap((f) => topByFamily(screenResults, f, 3))
        .map((r) => ({ ticker: r.ticker, name: r.name, family: r.family, composite: r.composite, flags: r.flags }));
      const ctx: AdvisorContext = {
        scenario: {
          targetMonthlyToday: scenario.targetMonthlyToday,
          yearsToRetirement: scenario.yearsToRetirement,
          currentSavings: scenario.currentSavings,
          monthlyContribution: scenario.monthlyContribution,
          inflation: scenario.inflation,
          realRate: scenario.realRate,
        },
        nestEgg: { today: computed.nestEggToday, feasible: computed.feasible, realNetYield: computed.realNetYield },
        contribution: { required: computed.requiredContribution, current: computed.currentContribution },
        portfolios,
        topAssets: top,
        rates: rates ?? { cdi: null, selic: null, ipca12m: scenario.inflation, asOf: "n/d", source: "n/d" },
      };
      const out = await runAdvisor(ctx, apiKey, model);
      setAdvisorOut(out);
    } catch (e) {
      setAdvisorErr(e instanceof Error ? e.message : String(e));
    } finally {
      setAdvisorLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <h1>Planejador de Aposentadoria · Renda Perpétua Real</h1>
        <p>Quanto você precisa para viver de renda — líquida de impostos e protegida da inflação — para sempre.</p>
      </header>

      <div className="grid cols-2 section">
        <PlannerForm scenario={scenario} onChange={onChange} />
        <RatesWidget rates={rates} mode={mode} onMode={setMode} brapiToken={brapiToken} onBrapiToken={setBrapiToken} onRefresh={refreshData} loading={loadingData} />
      </div>

      <div className="section"><ResultsPanel c={computed} /></div>
      <div className="section"><IncomeVsTargetChart data={trajectory} targetNestEgg={computed.nestEggToday} /></div>
      <div className="section"><PortfolioCompare projections={portfolios} compositions={compositions} target={scenario.targetMonthlyToday} /></div>
      <div className="section">
        <HoldingsTracker
          transactions={transactions}
          setTransactions={setTransactions}
          assets={assets}
          rates={rates}
          inflation={scenario.inflation}
          targetModelId={targetModelId}
          setTargetModelId={setTargetModelId}
        />
      </div>
      <div className="section"><ScreenerTable results={screenResults} assets={assets} /></div>

      <div className="grid cols-2 section">
        <ApiKeySettings apiKey={apiKey} onApiKey={setApiKey} model={model} onModel={setModel} remember={remember} onRemember={setRemember} />
        <AdvisorPanel canRun={!!apiKey} loading={advisorLoading} error={advisorErr} output={advisorOut} onRun={runAdvisorClick} />
      </div>

      <footer className="muted section" style={{ fontSize: "0.78rem", textAlign: "center" }}>
        Ferramenta educacional · regime tributário 2026 · código aberto. Os números são determinísticos; a IA apenas avalia.
      </footer>
    </div>
  );
}
