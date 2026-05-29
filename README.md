# Planejador de Aposentadoria · Renda Perpétua Real

Ferramenta **educacional** que responde: *quanto preciso acumular para viver de
renda — líquida de impostos e protegida da inflação — para sempre?* Além do
cálculo de perpetuidade, faz **análise/triagem de ativos** (FIIs, ações, ETFs,
cripto e renda fixa) e tem um **consultor de IA** opcional (Claude) que avalia o
cenário e sugere ajustes.

É uma **SPA 100% estática** (React + TypeScript, Vite), pensada para o **GitHub
Pages**. Não há backend: cálculo, triagem e carteiras rodam inteiramente no
navegador e funcionam **offline** com um dataset semente embarcado.

> ⚠️ **Não é recomendação nem consultoria de investimentos** (não registrada na
> CVM). O regime tributário é referente a **2026** — a MP 1303/2025 caducou em
> 08/10/2025 e não virou lei. Revise as premissas e consulte um profissional.

## O que ela faz

- **Perpetuidade real líquida:** patrimônio necessário, aporte necessário e
  renda atingível, usando o rendimento real líquido gastável
  `r ≈ i·(1−t) − π·t` (o termo `−π·t` é o "imposto da inflação").
- **Tributação 2026 por classe** (`src/lib/tax`): isentos (FII, LCI, LCA, CRI,
  CRA, debêntures incentivadas) × tributados; ETF de ações 17,5%; RendA+ piso
  10%; cripto com isenção de R$35k/mês — com testes que travam o regime.
- **Triagem de ativos** (`src/lib/screener`): curvas de preferência por família,
  score 0–100 e *flags* (yield-trap, alavancagem, TER alto, crédito sem FGC…).
- **Carteiras-modelo** (`src/lib/portfolio`): Conservador, Balanceado e Renda vs.
  o baseline 100% IPCA+, mostrando quanto capital cada uma exige; tetos rígidos
  (ex.: cripto) e projeção de renda líquida.
- **Consultor de IA** (`src/lib/advisor`): "traga sua própria chave" (BYO key) —
  a chave fica só no seu navegador; respostas com *grounding* (só cita ativos do
  screening) e disclaimer obrigatório.

## Rodando localmente

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # 41 testes (núcleo, tax, screener, portfolio, advisor)
npm run build     # bundle estático em dist/
```

## Deploy no GitHub Pages

1. Em **Settings → Pages**, defina **Source = GitHub Actions**.
2. Faça push para a branch padrão (`main`/`master`). O workflow
   `.github/workflows/deploy.yml` roda os testes, builda e publica.
3. O `base` do Vite é derivado do nome do repositório automaticamente
   (`/<repo>/`), então os caminhos funcionam na URL do Pages.

O `404.html` é uma cópia do `index.html` para que deep-links da SPA não quebrem.

## Dados de mercado

- **Offline/semente** (padrão): valores aproximados embarcados — funciona sem rede.
- **Ao vivo:** CDI/Selic/IPCA via **BCB SGS** (sem token); cotações de
  ações/FII/ETF/cripto via **brapi.dev** (cole seu token). Quando o CORS
  bloquear, a ferramenta cai no dataset semente. Tudo é cacheado por 24h.

## Estrutura

```
src/lib/
  finance/     perpetuidade, acumulação com IR diferido, solver de aporte
  tax/         regras 2026 por classe, fator de tributação (gross→net)
  marketData/  tipos, semente, provedores (BCB/brapi) e repositório com cache
  screener/    curvas, score e screens por família
  portfolio/   premissas, carteiras-modelo, tetos, projeção de renda, RendA+
  advisor/     cliente Anthropic no navegador, prompt, schema e grounding
src/components/  UI (formulário, resultados, gráfico, comparação, screener, IA)
```

## Aviso

Educacional. Premissas e o regime tributário (2026) devem ser revistos a cada
ano. Resultados dependem fortemente das premissas — especialmente da taxa real
de reinvestimento na aposentadoria (risco de reinvestimento).
