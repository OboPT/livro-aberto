export type IncomeItem = { id: string; label: string; monthly: number };

export type ExpenseCategory =
  | "housing"
  | "food"
  | "transport"
  | "utilities"
  | "leisure"
  | "health"
  | "other";

export type ExpenseItem = {
  id: string;
  label: string;
  category: ExpenseCategory;
  monthly: number;
};

export type DebtKind = "loan" | "card";

export type DebtItem = {
  id: string;
  label: string;
  kind: DebtKind;
  balance: number;
  /** Annual percentage rate, e.g. 18.5 means 18.5% */
  apr: number;
  monthlyPayment: number;
};

export type InvestmentItem = { id: string; label: string; value: number };

export type FinancialSituation = {
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  debts: DebtItem[];
  investments: InvestmentItem[];
};

export const EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  "housing",
  "food",
  "transport",
  "utilities",
  "leisure",
  "health",
  "other",
];

export const EMPTY_SITUATION: FinancialSituation = {
  incomes: [],
  expenses: [],
  debts: [],
  investments: [],
};
