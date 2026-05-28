import { projectAccumulation, type AccumulationInputs } from "./accumulation";
import { annualToMonthly } from "./rates";

type SolverInputs = Omit<AccumulationInputs, "monthlyContribution">;

/**
 * Aporte mensal necessário para que o valor futuro LÍQUIDO em termos reais
 * atinja `targetNetReal`. Como `netReal` é monotônico crescente no aporte,
 * usa bisseção (fonte da verdade) — robusta mesmo com o acoplamento nominal↔real
 * introduzido pelo IR diferido.
 */
export function requiredContribution(
  targetNetReal: number,
  input: SolverInputs,
  tolerance = 1,
  maxIterations = 200,
): number {
  const netRealFor = (c: number) =>
    projectAccumulation({ ...input, monthlyContribution: c }).netReal;

  // Se o saldo atual já atinge a meta, nenhum aporte é necessário.
  if (netRealFor(0) >= targetNetReal) return 0;

  let lo = 0;
  let hi = 1000;
  // Expande o teto até ultrapassar a meta.
  while (netRealFor(hi) < targetNetReal && hi < 1e12) hi *= 2;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (lo + hi) / 2;
    const value = netRealFor(mid);
    if (Math.abs(value - targetNetReal) <= tolerance) return mid;
    if (value < targetNetReal) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * Aproximação de forma fechada (ignora o detalhe de tributar só o ganho nominal,
 * aplicando um haircut de imposto efetivo). Serve como verificação cruzada da
 * bisseção em testes — não como fonte da verdade.
 */
export function requiredContributionClosedForm(
  targetGrossReal: number,
  input: SolverInputs,
): number {
  const m = annualToMonthly(input.realRate);
  const n = Math.round(input.years * 12);
  const fromSavings = input.currentSavings * Math.pow(1 + m, n);
  const annuityFactor = m === 0 ? n : (Math.pow(1 + m, n) - 1) / m;
  return Math.max(0, (targetGrossReal - fromSavings) / annuityFactor);
}
