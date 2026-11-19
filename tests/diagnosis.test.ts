import { describe, expect, it } from "vitest";
import { diagnose } from "@/domain/diagnosis";
import { EMPTY_SITUATION, type FinancialSituation } from "@/domain/types";
import { validate } from "@/domain/validation";

const base: FinancialSituation = {
  incomes: [
    { id: "i1", label: "A", monthly: 2000 },
    { id: "i2", label: "B", monthly: 1000 },
  ],
  expenses: [
    { id: "e1", label: "Rent", category: "housing", monthly: 1200 },
    { id: "e2", label: "Groceries", category: "food", monthly: 400 },
    { id: "e3", label: "Restaurants", category: "food", monthly: 200 },
  ],
  debts: [
    { id: "d1", label: "Card", kind: "card", balance: 1000, apr: 20, monthlyPayment: 100 },
    { id: "d2", label: "Loan", kind: "loan", balance: 10000, apr: 5, monthlyPayment: 200 },
  ],
  investments: [],
};

describe("diagnose", () => {
  it("computes totals, surplus and rates", () => {
    const result = diagnose(base);
    expect(result.totalIncome).toBe(3000);
    expect(result.totalExpenses).toBe(1800);
    expect(result.totalDebtPayments).toBe(300);
    expect(result.surplus).toBe(900);
    expect(result.savingsRate).toBeCloseTo(0.3);
    expect(result.debtServiceRatio).toBeCloseTo(0.1);
  });

  it("groups expenses by category", () => {
    expect(diagnose(base).expensesByCategory).toEqual({ housing: 1200, food: 600 });
  });

  it("ranks debts by APR, highest first, and estimates interest", () => {
    const result = diagnose(base);
    expect(result.debtsByApr.map((d) => d.id)).toEqual(["d1", "d2"]);
    expect(result.debtsByApr[0].monthlyInterest).toBeCloseTo(16.6667, 3);
    expect(result.estimatedMonthlyInterest).toBeCloseTo(58.3333, 3);
  });

  it("flags high APR debt and missing investments", () => {
    expect(diagnose(base).flags).toEqual(["high_apr_debt", "no_investments"]);
  });

  it("flags a negative surplus without also flagging a low savings rate", () => {
    const flags = diagnose({
      ...base,
      incomes: [{ id: "i1", label: "A", monthly: 1000 }],
    }).flags;
    expect(flags).toContain("negative_surplus");
    expect(flags).not.toContain("low_savings_rate");
  });

  it("flags a low savings rate below 10%", () => {
    const flags = diagnose({
      incomes: [{ id: "i1", label: "A", monthly: 1000 }],
      expenses: [{ id: "e1", label: "X", category: "other", monthly: 950 }],
      debts: [],
      investments: [{ id: "v1", label: "Fund", value: 100 }],
    }).flags;
    expect(flags).toEqual(["low_savings_rate"]);
  });

  it("flags debt service above 35% but not at exactly 35%", () => {
    const withPayment = (monthlyPayment: number) =>
      diagnose({
        incomes: [{ id: "i1", label: "A", monthly: 1000 }],
        expenses: [],
        debts: [{ id: "d", label: "L", kind: "loan", balance: 100, apr: 1, monthlyPayment }],
        investments: [{ id: "v1", label: "Fund", value: 1 }],
      }).flags;
    expect(withPayment(350)).not.toContain("high_debt_service");
    expect(withPayment(351)).toContain("high_debt_service");
  });

  it("uses a lower APR limit for loans than for cards", () => {
    const debt = (kind: "card" | "loan", apr: number) =>
      diagnose({
        ...EMPTY_SITUATION,
        debts: [{ id: "d", label: "D", kind, balance: 500, apr, monthlyPayment: 0 }],
      }).flags;
    expect(debt("loan", 10)).toContain("high_apr_debt");
    expect(debt("card", 10)).not.toContain("high_apr_debt");
    expect(debt("card", 15)).toContain("high_apr_debt");
  });

  it("does not flag high APR on a paid-off debt", () => {
    const flags = diagnose({
      ...EMPTY_SITUATION,
      debts: [{ id: "d", label: "D", kind: "card", balance: 0, apr: 25, monthlyPayment: 0 }],
    }).flags;
    expect(flags).not.toContain("high_apr_debt");
  });

  it("handles an empty situation without dividing by zero", () => {
    const result = diagnose(EMPTY_SITUATION);
    expect(result.savingsRate).toBeNull();
    expect(result.debtServiceRatio).toBeNull();
    expect(result.surplus).toBe(0);
    expect(result.flags).toEqual(["no_income", "no_investments"]);
  });
});

describe("validate", () => {
  it("accepts a valid situation", () => {
    expect(validate(base)).toEqual([]);
  });

  it("rejects empty labels, negative and non-finite amounts", () => {
    const errors = validate({
      ...EMPTY_SITUATION,
      incomes: [
        { id: "a", label: "  ", monthly: 10 },
        { id: "b", label: "ok", monthly: -1 },
        { id: "c", label: "ok", monthly: Number.NaN },
      ],
    });
    expect(errors).toEqual([
      { itemId: "a", field: "label", code: "label_required" },
      { itemId: "b", field: "amount", code: "amount_invalid" },
      { itemId: "c", field: "amount", code: "amount_invalid" },
    ]);
  });

  it("rejects an APR outside 0 to 100", () => {
    const errors = validate({
      ...EMPTY_SITUATION,
      debts: [{ id: "d", label: "D", kind: "card", balance: 1, apr: 101, monthlyPayment: 1 }],
    });
    expect(errors).toEqual([{ itemId: "d", field: "apr", code: "apr_invalid" }]);
  });
});
