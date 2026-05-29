/**
 * Curvas de preferência que convertem uma métrica em sub-score 0–100.
 * Codificam a TESE (o que é "bom"), não apenas a posição relativa na amostra,
 * tornando a pontuação reprodutível e auditável.
 */

/** Triangular: pico (100) no ideal, decai linearmente até 0 em min/max. */
export function triangular(value: number, min: number, ideal: number, max: number): number {
  if (value <= min || value >= max) return 0;
  if (value === ideal) return 100;
  if (value < ideal) return ((value - min) / (ideal - min)) * 100;
  return ((max - value) / (max - ideal)) * 100;
}

/** Maior é melhor, saturando em `good`; abaixo de `floor` é 0. */
export function higherIsBetter(value: number, floor: number, good: number): number {
  if (value <= floor) return 0;
  if (value >= good) return 100;
  return ((value - floor) / (good - floor)) * 100;
}

/** Menor é melhor, saturando em `good`; acima de `cap` é 0. */
export function lowerIsBetter(value: number, good: number, cap: number): number {
  if (value <= good) return 100;
  if (value >= cap) return 0;
  return ((cap - value) / (cap - good)) * 100;
}

/** Já é uma proporção 0..1 (ex.: consistência) → 0..100. */
export function fraction(value: number): number {
  return Math.max(0, Math.min(1, value)) * 100;
}
