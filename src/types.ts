/** Estado do planejador (entradas do usuário). */
export interface Scenario {
  targetMonthlyToday: number; // R$ de hoje
  yearsToRetirement: number;
  currentSavings: number;
  monthlyContribution: number;
  inflation: number; // π (decimal)
  realRate: number; // taxa real na acumulação (decimal)
  decumulationRealRate: number; // i_dec na fase de renda
  taxRate: number; // IR efetivo no resgate (decimal)
}

export const DEFAULT_SCENARIO: Scenario = {
  targetMonthlyToday: 11000,
  yearsToRetirement: 24, // 2026 → 2050
  currentSavings: 150000,
  monthlyContribution: 3000,
  inflation: 0.04,
  realRate: 0.065,
  decumulationRealRate: 0.06,
  taxRate: 0.15,
};
