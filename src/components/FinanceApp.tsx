"use client";

import { useEffect, useMemo, useState } from "react";
import { diagnose } from "@/domain/diagnosis";
import {
  parseStoredSituation,
  serializeSituation,
} from "@/domain/storage";
import {
  EMPTY_SITUATION,
  EXPENSE_CATEGORIES,
  type DebtItem,
  type ExpenseItem,
  type FinancialSituation,
  type IncomeItem,
  type InvestmentItem,
} from "@/domain/types";
import { validate, type ValidationError } from "@/domain/validation";
import type { Locale } from "@/i18n/config";
import { createTranslator, type Translator } from "@/i18n/messages";
import { Diagnosis } from "./Diagnosis";
import { LanguageSwitcher } from "./LanguageSwitcher";

const STORAGE_KEY = "livro-aberto:situation:v1";

let counter = 0;
const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${counter++}`;

const toInput = (value: number): string => (Number.isNaN(value) ? "" : String(value));
const fromInput = (value: string): number => (value === "" ? Number.NaN : Number(value));

type RowProps = {
  id: string;
  errors: ValidationError[];
  t: Translator;
  onRemove: () => void;
  children: React.ReactNode;
};

function Row({ id, errors, t, onRemove, children }: RowProps) {
  return (
    <li className="row">
      <div className="fields">{children}</div>
      {errors.length > 0 && (
        <ul className="errors" id={`${id}-errors`}>
          {errors.map((error) => (
            <li key={`${error.field}-${error.code}`}>{t(`error.${error.code}`)}</li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onRemove}>
        {t("action.remove")}
      </button>
    </li>
  );
}

function Field({
  id,
  name,
  label,
  errors,
  children,
}: {
  id: string;
  name: ValidationError["field"];
  label: string;
  errors: ValidationError[];
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
}) {
  const invalid = errors.some((error) => error.field === name);
  const inputId = `${id}-${name}`;
  return (
    <label htmlFor={inputId}>
      <span>{label}</span>
      {children({
        id: inputId,
        "aria-invalid": invalid,
        "aria-describedby": invalid ? `${id}-errors` : undefined,
      })}
    </label>
  );
}

export function FinanceApp({ locale }: { locale: Locale }) {
  const t = useMemo(() => createTranslator(locale), [locale]);
  const [situation, setSituation] = useState<FinancialSituation>(EMPTY_SITUATION);
  const [loaded, setLoaded] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    try {
      setSituation(parseStoredSituation(window.localStorage.getItem(STORAGE_KEY)));
    } catch {
      setSituation(EMPTY_SITUATION);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, serializeSituation(situation));
    } catch {
      // Storage can be unavailable; the form still works for this session.
    }
  }, [situation, loaded]);

  const errors = useMemo(() => validate(situation), [situation]);
  const errorsFor = (id: string) => errors.filter((error) => error.itemId === id);

  const validSituation = useMemo<FinancialSituation>(() => {
    const invalidIds = new Set(errors.map((error) => error.itemId));
    const keep = <T extends { id: string }>(items: T[]) =>
      items.filter((item) => !invalidIds.has(item.id));
    return {
      incomes: keep(situation.incomes),
      expenses: keep(situation.expenses),
      debts: keep(situation.debts),
      investments: keep(situation.investments),
    };
  }, [situation, errors]);

  const result = useMemo(() => diagnose(validSituation), [validSituation]);
  const hasRows =
    situation.incomes.length +
      situation.expenses.length +
      situation.debts.length +
      situation.investments.length >
    0;

  const update = <K extends keyof FinancialSituation>(
    key: K,
    updater: (items: FinancialSituation[K]) => FinancialSituation[K],
  ) => setSituation((current) => ({ ...current, [key]: updater(current[key]) }));

  const patch = <K extends keyof FinancialSituation>(
    key: K,
    id: string,
    changes: Partial<FinancialSituation[K][number]>,
  ) =>
    update(key, (items) =>
      (items as Array<{ id: string }>).map((item) =>
        item.id === id ? { ...item, ...changes } : item,
      ) as FinancialSituation[K],
    );

  const remove = <K extends keyof FinancialSituation>(key: K, id: string) =>
    update(key, (items) =>
      (items as Array<{ id: string }>).filter(
        (item) => item.id !== id,
      ) as FinancialSituation[K],
    );

  const exportData = () => {
    const payload = JSON.stringify(
      { version: 1, exportedAt: new Date().toISOString(), situation },
      (_, value) => (typeof value === "number" && Number.isNaN(value) ? null : value),
      2,
    );
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "livro-aberto.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearAll = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setSituation(EMPTY_SITUATION);
    setConfirmClear(false);
  };

  return (
    <main>
      <header>
        <h1>{t("app.title")}</h1>
        <p>{t("app.subtitle")}</p>
        <p className="note">{t("app.privacy_notice")}</p>
        <LanguageSwitcher locale={locale} t={t} />
      </header>

      <form onSubmit={(event) => event.preventDefault()} noValidate>
        <section aria-labelledby="incomes-title" className="panel">
          <h2 id="incomes-title">{t("section.incomes.title")}</h2>
          <ul>
            {situation.incomes.map((item: IncomeItem) => {
              const rowErrors = errorsFor(item.id);
              return (
                <Row key={item.id} id={item.id} errors={rowErrors} t={t} onRemove={() => remove("incomes", item.id)}>
                  <Field id={item.id} name="label" label={t("field.label")} errors={rowErrors}>
                    {(props) => (
                      <input {...props} type="text" value={item.label} onChange={(e) => patch("incomes", item.id, { label: e.target.value })} />
                    )}
                  </Field>
                  <Field id={item.id} name="amount" label={t("field.monthly")} errors={rowErrors}>
                    {(props) => (
                      <input {...props} type="number" min="0" step="0.01" inputMode="decimal" value={toInput(item.monthly)} onChange={(e) => patch("incomes", item.id, { monthly: fromInput(e.target.value) })} />
                    )}
                  </Field>
                </Row>
              );
            })}
          </ul>
          <button type="button" onClick={() => update("incomes", (items) => [...items, { id: newId(), label: "", monthly: 0 }])}>
            {t("section.incomes.add")}
          </button>
        </section>

        <section aria-labelledby="expenses-title" className="panel">
          <h2 id="expenses-title">{t("section.expenses.title")}</h2>
          <ul>
            {situation.expenses.map((item: ExpenseItem) => {
              const rowErrors = errorsFor(item.id);
              return (
                <Row key={item.id} id={item.id} errors={rowErrors} t={t} onRemove={() => remove("expenses", item.id)}>
                  <Field id={item.id} name="label" label={t("field.label")} errors={rowErrors}>
                    {(props) => (
                      <input {...props} type="text" value={item.label} onChange={(e) => patch("expenses", item.id, { label: e.target.value })} />
                    )}
                  </Field>
                  <label htmlFor={`${item.id}-category`}>
                    <span>{t("field.category")}</span>
                    <select id={`${item.id}-category`} value={item.category} onChange={(e) => patch("expenses", item.id, { category: e.target.value as ExpenseItem["category"] })}>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {t(`category.${category}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Field id={item.id} name="amount" label={t("field.monthly")} errors={rowErrors}>
                    {(props) => (
                      <input {...props} type="number" min="0" step="0.01" inputMode="decimal" value={toInput(item.monthly)} onChange={(e) => patch("expenses", item.id, { monthly: fromInput(e.target.value) })} />
                    )}
                  </Field>
                </Row>
              );
            })}
          </ul>
          <button type="button" onClick={() => update("expenses", (items) => [...items, { id: newId(), label: "", category: "other", monthly: 0 }])}>
            {t("section.expenses.add")}
          </button>
        </section>

        <section aria-labelledby="debts-title" className="panel">
          <h2 id="debts-title">{t("section.debts.title")}</h2>
          <ul>
            {situation.debts.map((item: DebtItem) => {
              const rowErrors = errorsFor(item.id);
              return (
                <Row key={item.id} id={item.id} errors={rowErrors} t={t} onRemove={() => remove("debts", item.id)}>
                  <Field id={item.id} name="label" label={t("field.label")} errors={rowErrors}>
                    {(props) => (
                      <input {...props} type="text" value={item.label} onChange={(e) => patch("debts", item.id, { label: e.target.value })} />
                    )}
                  </Field>
                  <label htmlFor={`${item.id}-kind`}>
                    <span>{t("field.kind")}</span>
                    <select id={`${item.id}-kind`} value={item.kind} onChange={(e) => patch("debts", item.id, { kind: e.target.value as DebtItem["kind"] })}>
                      <option value="loan">{t("debt_kind.loan")}</option>
                      <option value="card">{t("debt_kind.card")}</option>
                    </select>
                  </label>
                  <Field id={item.id} name="amount" label={t("field.balance")} errors={rowErrors}>
                    {(props) => (
                      <input {...props} type="number" min="0" step="0.01" inputMode="decimal" value={toInput(item.balance)} onChange={(e) => patch("debts", item.id, { balance: fromInput(e.target.value) })} />
                    )}
                  </Field>
                  <Field id={item.id} name="apr" label={t("field.apr")} errors={rowErrors}>
                    {(props) => (
                      <input {...props} type="number" min="0" max="100" step="0.01" inputMode="decimal" value={toInput(item.apr)} onChange={(e) => patch("debts", item.id, { apr: fromInput(e.target.value) })} />
                    )}
                  </Field>
                  <label htmlFor={`${item.id}-payment`}>
                    <span>{t("field.monthly_payment")}</span>
                    <input id={`${item.id}-payment`} type="number" min="0" step="0.01" inputMode="decimal" value={toInput(item.monthlyPayment)} onChange={(e) => patch("debts", item.id, { monthlyPayment: fromInput(e.target.value) })} />
                  </label>
                </Row>
              );
            })}
          </ul>
          <button type="button" onClick={() => update("debts", (items) => [...items, { id: newId(), label: "", kind: "card", balance: 0, apr: 0, monthlyPayment: 0 }])}>
            {t("section.debts.add")}
          </button>
        </section>

        <section aria-labelledby="investments-title" className="panel">
          <h2 id="investments-title">{t("section.investments.title")}</h2>
          <ul>
            {situation.investments.map((item: InvestmentItem) => {
              const rowErrors = errorsFor(item.id);
              return (
                <Row key={item.id} id={item.id} errors={rowErrors} t={t} onRemove={() => remove("investments", item.id)}>
                  <Field id={item.id} name="label" label={t("field.label")} errors={rowErrors}>
                    {(props) => (
                      <input {...props} type="text" value={item.label} onChange={(e) => patch("investments", item.id, { label: e.target.value })} />
                    )}
                  </Field>
                  <Field id={item.id} name="amount" label={t("field.value")} errors={rowErrors}>
                    {(props) => (
                      <input {...props} type="number" min="0" step="0.01" inputMode="decimal" value={toInput(item.value)} onChange={(e) => patch("investments", item.id, { value: fromInput(e.target.value) })} />
                    )}
                  </Field>
                </Row>
              );
            })}
          </ul>
          <button type="button" onClick={() => update("investments", (items) => [...items, { id: newId(), label: "", value: 0 }])}>
            {t("section.investments.add")}
          </button>
        </section>
      </form>

      <Diagnosis
        result={result}
        hasRows={hasRows}
        hasInvalidRows={errors.length > 0}
        locale={locale}
        t={t}
      />

      <div className="actions">
        <button type="button" onClick={exportData}>
          {t("action.export")}
        </button>
        <button type="button" onClick={clearAll} onBlur={() => setConfirmClear(false)}>
          {confirmClear ? t("action.clear_confirm") : t("action.clear")}
        </button>
      </div>
    </main>
  );
}
