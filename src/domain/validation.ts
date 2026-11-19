import type { FinancialSituation } from "./types";

export type ValidationErrorCode =
  | "label_required"
  | "amount_invalid"
  | "apr_invalid";

export type ValidationError = {
  itemId: string;
  field: "label" | "amount" | "apr";
  code: ValidationErrorCode;
};

const isValidAmount = (value: number): boolean =>
  Number.isFinite(value) && value >= 0;

export function validate(situation: FinancialSituation): ValidationError[] {
  const errors: ValidationError[] = [];
  const check = (id: string, label: string, amounts: number[]) => {
    if (label.trim() === "") {
      errors.push({ itemId: id, field: "label", code: "label_required" });
    }
    if (!amounts.every(isValidAmount)) {
      errors.push({ itemId: id, field: "amount", code: "amount_invalid" });
    }
  };

  for (const income of situation.incomes) {
    check(income.id, income.label, [income.monthly]);
  }
  for (const expense of situation.expenses) {
    check(expense.id, expense.label, [expense.monthly]);
  }
  for (const debt of situation.debts) {
    check(debt.id, debt.label, [debt.balance, debt.monthlyPayment]);
    if (!Number.isFinite(debt.apr) || debt.apr < 0 || debt.apr > 100) {
      errors.push({ itemId: debt.id, field: "apr", code: "apr_invalid" });
    }
  }
  for (const investment of situation.investments) {
    check(investment.id, investment.label, [investment.value]);
  }
  return errors;
}
