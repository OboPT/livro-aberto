import { describe, expect, it } from "vitest";
import {
  parseStoredSituation,
  sanitizeSituation,
  serializeSituation,
} from "@/domain/storage";
import { EMPTY_SITUATION, type FinancialSituation } from "@/domain/types";

const sample: FinancialSituation = {
  incomes: [{ id: "i", label: "Job", monthly: 1500 }],
  expenses: [{ id: "e", label: "Rent", category: "housing", monthly: 600 }],
  debts: [{ id: "d", label: "Card", kind: "card", balance: 300, apr: 19.9, monthlyPayment: 50 }],
  investments: [{ id: "v", label: "Fund", value: 1000 }],
};

describe("storage", () => {
  it("round-trips a situation", () => {
    expect(parseStoredSituation(serializeSituation(sample))).toEqual(sample);
  });

  it("keeps an empty amount (NaN) across a round trip", () => {
    const withEmpty: FinancialSituation = {
      ...EMPTY_SITUATION,
      incomes: [{ id: "i", label: "Job", monthly: Number.NaN }],
    };
    const restored = parseStoredSituation(serializeSituation(withEmpty));
    expect(Number.isNaN(restored.incomes[0].monthly)).toBe(true);
  });

  it("returns an empty situation for null or broken JSON", () => {
    expect(parseStoredSituation(null)).toEqual(EMPTY_SITUATION);
    expect(parseStoredSituation("{not json")).toEqual(EMPTY_SITUATION);
    expect(sanitizeSituation("text")).toEqual(EMPTY_SITUATION);
    expect(sanitizeSituation(null)).toEqual(EMPTY_SITUATION);
  });

  it("drops malformed rows and keeps valid ones", () => {
    const result = sanitizeSituation({
      incomes: [
        { id: "ok", label: "A", monthly: 1 },
        { id: 5, label: "bad id", monthly: 1 },
        "not an object",
      ],
      expenses: [{ id: "e", label: "X", category: "nope", monthly: 1 }],
      debts: [{ id: "d", label: "D", kind: "other", balance: 1, apr: 1, monthlyPayment: 1 }],
      investments: "not an array",
    });
    expect(result.incomes).toEqual([{ id: "ok", label: "A", monthly: 1 }]);
    expect(result.expenses).toEqual([]);
    expect(result.debts).toEqual([]);
    expect(result.investments).toEqual([]);
  });
});
