import type {
  DebtItem,
  ExpenseCategory,
  FinancialSituation,
} from "./types";

/**
 * Rule-of-thumb thresholds. They are coaching heuristics, not regulatory
 * limits, and are meant to be reviewed and adjusted by the coach.
 */
export const THRESHOLDS = {
  lowSavingsRate: 0.1,
  highDebtServiceRatio: 0.35,
  highAprCard: 15,
  highAprLoan: 10,
} as const;

export type FlagCode =
  | "no_income"
  | "negative_surplus"
  | "low_savings_rate"
  | "high_debt_service"
  | "high_apr_debt"
  | "no_investments";

export type RankedDebt = DebtItem & { monthlyInterest: number };

export type Diagnosis = {
  totalIncome: number;
  totalExpenses: number;
  totalDebtPayments: number;
  totalDebtBalance: number;
  totalInvestments: number;
  /** income - expenses - debt payments */
  surplus: number;
  /** surplus / income, or null when there is no income */
  savingsRate: number | null;
  /** debt payments / income, or null when there is no income */
  debtServiceRatio: number | null;
  expensesByCategory: Partial<Record<ExpenseCategory, number>>;
  /** Highest APR first */
  debtsByApr: RankedDebt[];
  estimatedMonthlyInterest: number;
  flags: FlagCode[];
};

const sum = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0);

export function monthlyInterest(debt: DebtItem): number {
  return (debt.balance * debt.apr) / 100 / 12;
}

export function isHighAprDebt(debt: DebtItem): boolean {
  const limit =
    debt.kind === "card" ? THRESHOLDS.highAprCard : THRESHOLDS.highAprLoan;
  return debt.balance > 0 && debt.apr >= limit;
}

export function diagnose(situation: FinancialSituation): Diagnosis {
  const totalIncome = sum(situation.incomes.map((i) => i.monthly));
  const totalExpenses = sum(situation.expenses.map((e) => e.monthly));
  const totalDebtPayments = sum(situation.debts.map((d) => d.monthlyPayment));
  const totalDebtBalance = sum(situation.debts.map((d) => d.balance));
  const totalInvestments = sum(situation.investments.map((i) => i.value));
  const surplus = totalIncome - totalExpenses - totalDebtPayments;
  const hasIncome = totalIncome > 0;
  const savingsRate = hasIncome ? surplus / totalIncome : null;
  const debtServiceRatio = hasIncome ? totalDebtPayments / totalIncome : null;

  const expensesByCategory: Partial<Record<ExpenseCategory, number>> = {};
  for (const expense of situation.expenses) {
    expensesByCategory[expense.category] =
      (expensesByCategory[expense.category] ?? 0) + expense.monthly;
  }

  const debtsByApr: RankedDebt[] = situation.debts
    .map((debt) => ({ ...debt, monthlyInterest: monthlyInterest(debt) }))
    .sort((a, b) => b.apr - a.apr);

  const flags: FlagCode[] = [];
  if (!hasIncome) flags.push("no_income");
  if (surplus < 0) flags.push("negative_surplus");
  if (
    savingsRate !== null &&
    surplus >= 0 &&
    savingsRate < THRESHOLDS.lowSavingsRate
  ) {
    flags.push("low_savings_rate");
  }
  if (
    debtServiceRatio !== null &&
    debtServiceRatio > THRESHOLDS.highDebtServiceRatio
  ) {
    flags.push("high_debt_service");
  }
  if (situation.debts.some(isHighAprDebt)) flags.push("high_apr_debt");
  if (totalInvestments <= 0) flags.push("no_investments");

  return {
    totalIncome,
    totalExpenses,
    totalDebtPayments,
    totalDebtBalance,
    totalInvestments,
    surplus,
    savingsRate,
    debtServiceRatio,
    expensesByCategory,
    debtsByApr,
    estimatedMonthlyInterest: sum(debtsByApr.map((d) => d.monthlyInterest)),
    flags,
  };
}
