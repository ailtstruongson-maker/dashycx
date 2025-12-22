
export const PERSONAL_DEDUCTION = 11000000;
export const DEPENDENT_DEDUCTION = 4400000;

export const TAX_BRACKETS = [
  { level: 1, max: 5000000, rate: 0.05 },
  { level: 2, max: 10000000, rate: 0.10 },
  { level: 3, max: 18000000, rate: 0.15 },
  { level: 4, max: 32000000, rate: 0.20 },
  { level: 5, max: 52000000, rate: 0.25 },
  { level: 6, max: 80000000, rate: 0.30 },
  { level: 7, max: Infinity, rate: 0.35 },
];

/**
 * Tính thuế lũy tiến từng phần dựa trên thu nhập tính thuế
 */
export function calculateProgressiveTax(assessableIncome: number): number {
  if (assessableIncome <= 0) return 0;

  let tax = 0;
  let remainingIncome = assessableIncome;

  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    const bracket = TAX_BRACKETS[i];
    const prevMax = i > 0 ? TAX_BRACKETS[i - 1].max : 0;
    const bracketSize = bracket.max - prevMax;

    if (remainingIncome > 0) {
      const incomeInBracket = Math.min(remainingIncome, bracketSize);
      tax += incomeInBracket * bracket.rate;
      remainingIncome -= incomeInBracket;
    } else {
      break;
    }
  }
  return tax;
}
