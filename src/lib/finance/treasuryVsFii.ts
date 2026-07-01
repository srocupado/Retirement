/**
 * Tesouro-agora-e-migra × FII-direto.
 *
 * A pergunta prática: "os FIIs pagam 8–9% e o Tesouro pré/Selic rende 12–13% —
 * não vale acumular no Tesouro agora e migrar pro FII depois?"
 *
 * O erro de leitura é comparar o 12–13% NOMINAL e BRUTO do Tesouro com o
 * dividend yield 8–9% ISENTO e LÍQUIDO do FII. Este módulo põe os dois na mesma
 * régua (real, líquida) e expõe o trade-off que decide:
 *
 *   • Ficar no Tesouro trava um juro real alto, mas com IR de 15% (diferido, pago
 *     na migração) e sobre o ganho NOMINAL — ou seja, tributando a inflação.
 *   • Ir direto pro FII abre mão desse juro, mas CAPTURA a reprecificação das
 *     cotas: o FII paga pouco HOJE justamente porque a Selic está alta e a cota
 *     está barata. Quando o juro cai — exatamente o gatilho que faria você querer
 *     migrar — a cota reprecifica pra cima. Quem esperou no Tesouro migra caro.
 *
 * O duelo real, portanto, é: juro real alto do Tesouro na janela de espera ×
 * ganho de reprecificação do FII na mesma janela.
 */

import { projectAccumulation } from "./accumulation";

/** Valor futuro real de um ativo ISENTO (IR zero): saldo + aportes compostos à taxa real. */
function exemptFutureValue(currentSavings: number, monthlyContribution: number, realRate: number, years: number): number {
  // Isento ⇒ netReal = grossReal, e a inflação é irrelevante (não há base tributável).
  return projectAccumulation({ currentSavings, monthlyContribution, realRate, inflation: 0, years, taxRate: 0 }).grossReal;
}

export interface TreasuryVsFiiInputs {
  /** Saldo já acumulado (R$ de hoje). */
  currentSavings: number;
  /** Aporte mensal (R$ de hoje), idêntico nos dois caminhos. */
  monthlyContribution: number;
  /** Horizonte total de acumulação, em anos (N). */
  years: number;
  /** Ano em que o caminho "Tesouro" migra o acumulado para FII (M, 0 ≤ M ≤ N). */
  migrateYear: number;
  /** Inflação anual (π) — base do IR nominal do Tesouro. */
  inflation: number;
  /** Taxa REAL anual travada no Tesouro pré/Selic/IPCA+ hoje (ex.: 0,08 = Selic ~13% com π ~4,5%). */
  treasuryRealRate: number;
  /** IR do Tesouro no resgate/migração, sobre o ganho nominal (ex.: 0,15). */
  treasuryTax: number;
  /** Retorno REAL total do FII em regime normal: dividendo isento + valorização real da cota, líquido de fricção. */
  fiiTotalReal: number;
  /**
   * Reprecificação ONE-TIME da cota de FII esperada ao longo da janela de espera
   * (ex.: 0,15 = +15% real de valorização conforme o juro normaliza). Capturada
   * pelo caminho FII-direto; perdida por quem esperou no Tesouro.
   */
  reRating: number;
}

export interface TreasuryVsFiiResult {
  /** Patrimônio real líquido (R$ de hoje) do caminho "FII direto". */
  fiiDirectNetReal: number;
  /** Patrimônio real líquido (R$ de hoje) do caminho "Tesouro e migra". */
  treasuryThenFiiNetReal: number;
  /** Diferença FII-direto − Tesouro-e-migra (positivo ⇒ FII direto ganha). */
  advantage: number;
  /** Vencedor com as premissas atuais. */
  winner: "fiiDirect" | "treasuryThenFii" | "tie";
  /** Acumulado real no ano da migração, no caminho Tesouro (já líquido do IR pago ao migrar). */
  treasuryPotAtMigration: number;
  /** Retorno real anual efetivo do FII na janela de espera (inclui a reprecificação diluída). */
  fiiWaitWindowReal: number;
}

/**
 * Projeta os dois caminhos e diz quem ganha. Trabalha sempre em R$ reais de hoje.
 *
 * FII-direto: a reprecificação one-time entra como um retorno extra anualizado na
 * janela [0, M] — assim os aportes mais recentes participam menos dela, o que é
 * mais honesto do que aplicar +X% ao pote inteiro. Depois de M, o FII rende só o
 * `fiiTotalReal` de regime (a reprecificação já aconteceu).
 *
 * Tesouro-e-migra: acumula no Tesouro até M com IR diferido (pago na migração,
 * sobre o ganho nominal), e daí em diante compõe no FII ao `fiiTotalReal`.
 */
export function compareTreasuryVsFii(input: TreasuryVsFiiInputs): TreasuryVsFiiResult {
  const { currentSavings, monthlyContribution, years, migrateYear, inflation, treasuryRealRate, treasuryTax, fiiTotalReal, reRating } = input;
  const M = Math.max(0, Math.min(migrateYear, years));
  const rest = years - M;

  // Reprecificação diluída na janela de espera: (1+reRating) distribuído em M anos.
  const reRatingAnnual = M > 0 ? Math.pow(1 + reRating, 1 / M) - 1 : 0;
  const fiiWaitWindowReal = fiiTotalReal + reRatingAnnual;

  // --- Caminho A: FII direto (isento em toda a trajetória) ---
  const fiiPotAtM = exemptFutureValue(currentSavings, monthlyContribution, fiiWaitWindowReal, M);
  const fiiDirectNetReal = exemptFutureValue(fiiPotAtM, monthlyContribution, fiiTotalReal, rest);

  // --- Caminho B: Tesouro até M (IR diferido na migração), depois FII ---
  const treasuryPhase = projectAccumulation({
    currentSavings,
    monthlyContribution,
    realRate: treasuryRealRate,
    inflation,
    years: M,
    taxRate: treasuryTax,
  });
  const treasuryPotAtMigration = treasuryPhase.netReal; // já líquido do IR pago ao migrar
  const treasuryThenFiiNetReal = exemptFutureValue(treasuryPotAtMigration, monthlyContribution, fiiTotalReal, rest);

  const advantage = fiiDirectNetReal - treasuryThenFiiNetReal;
  // Empate: diferença < 0,1% do menor patrimônio (ruído de premissas).
  const tol = 0.001 * Math.min(fiiDirectNetReal, treasuryThenFiiNetReal);
  const winner = Math.abs(advantage) <= tol ? "tie" : advantage > 0 ? "fiiDirect" : "treasuryThenFii";

  return { fiiDirectNetReal, treasuryThenFiiNetReal, advantage, winner, treasuryPotAtMigration, fiiWaitWindowReal };
}

/**
 * Reprecificação de equilíbrio: quanto o FII precisa valorizar (one-time, real) na
 * janela de espera para EMPATAR com o caminho Tesouro-e-migra, mantendo o resto.
 * Abaixo dela, esperar no Tesouro vence; acima, ir direto pro FII vence.
 * Retorna null se nem +200% empata (Tesouro domina no horizonte dado).
 */
export function breakevenReRating(input: Omit<TreasuryVsFiiInputs, "reRating">): number | null {
  const f = (rr: number) => compareTreasuryVsFii({ ...input, reRating: rr }).advantage;
  if (f(0) >= 0) return 0; // FII já ganha sem nenhuma reprecificação
  let lo = 0, hi = 2;
  if (f(hi) < 0) return null; // nem +200% empata
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
