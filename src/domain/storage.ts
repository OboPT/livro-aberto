import {
  EMPTY_SITUATION,
  EXPENSE_CATEGORIES,
  type DebtItem,
  type ExpenseItem,
  type FinancialSituation,
  type IncomeItem,
  type InvestmentItem,
} from "./types";

type Row = Record<string, unknown>;

const isRow = (value: unknown): value is Row =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === "string";
/** NaN is allowed: it represents an empty amount field that validation flags. */
const isNumber = (value: unknown): value is number => typeof value === "number";

function rows<T>(value: unknown, parse: (row: Row) => T | null): T[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    const parsed = isRow(entry) ? parse(entry) : null;
    return parsed === null ? [] : [parsed];
  });
}

/** Rebuilds a situation from untrusted JSON, dropping anything malformed. */
export function sanitizeSituation(raw: unknown): FinancialSituation {
  if (!isRow(raw)) return EMPTY_SITUATION;
  return {
    incomes: rows<IncomeItem>(raw.incomes, (r) =>
      isString(r.id) && isString(r.label) && isNumber(r.monthly)
        ? { id: r.id, label: r.label, monthly: r.monthly }
        : null,
    ),
    expenses: rows<ExpenseItem>(raw.expenses, (r) =>
      isString(r.id) &&
      isString(r.label) &&
      isNumber(r.monthly) &&
      EXPENSE_CATEGORIES.includes(r.category as ExpenseItem["category"])
        ? {
            id: r.id,
            label: r.label,
            monthly: r.monthly,
            category: r.category as ExpenseItem["category"],
          }
        : null,
    ),
    debts: rows<DebtItem>(raw.debts, (r) =>
      isString(r.id) &&
      isString(r.label) &&
      (r.kind === "loan" || r.kind === "card") &&
      isNumber(r.balance) &&
      isNumber(r.apr) &&
      isNumber(r.monthlyPayment)
        ? {
            id: r.id,
            label: r.label,
            kind: r.kind,
            balance: r.balance,
            apr: r.apr,
            monthlyPayment: r.monthlyPayment,
          }
        : null,
    ),
    investments: rows<InvestmentItem>(raw.investments, (r) =>
      isString(r.id) && isString(r.label) && isNumber(r.value)
        ? { id: r.id, label: r.label, value: r.value }
        : null,
    ),
  };
}

/** NaN is not valid JSON, so it is stored as null and restored as NaN. */
export function serializeSituation(situation: FinancialSituation): string {
  return JSON.stringify(situation, (_, value) =>
    typeof value === "number" && Number.isNaN(value) ? null : value,
  );
}

export function parseStoredSituation(raw: string | null): FinancialSituation {
  if (raw === null) return EMPTY_SITUATION;
  try {
    const parsed: unknown = JSON.parse(raw, (_, value) => value);
    return sanitizeSituation(restoreNaN(parsed));
  } catch {
    return EMPTY_SITUATION;
  }
}

const NUMERIC_FIELDS = ["monthly", "balance", "apr", "monthlyPayment", "value"];

function restoreNaN(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(restoreNaN);
  if (isRow(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        entry === null && NUMERIC_FIELDS.includes(key)
          ? Number.NaN
          : restoreNaN(entry),
      ]),
    );
  }
  return value;
}
