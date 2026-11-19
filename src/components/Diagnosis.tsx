import type { Diagnosis as DiagnosisResult } from "@/domain/diagnosis";
import { EXPENSE_CATEGORIES } from "@/domain/types";
import type { Locale } from "@/i18n/config";
import { formatCurrency, formatPercent } from "@/i18n/format";
import type { Translator } from "@/i18n/messages";

export function Diagnosis({
  result,
  hasRows,
  hasInvalidRows,
  locale,
  t,
}: {
  result: DiagnosisResult;
  hasRows: boolean;
  hasInvalidRows: boolean;
  locale: Locale;
  t: Translator;
}) {
  const money = (value: number) => formatCurrency(locale, value);
  const percent = (value: number | null) =>
    value === null ? t("diagnosis.not_available") : formatPercent(locale, value);

  const metrics: Array<[string, string]> = [
    ["income", money(result.totalIncome)],
    ["expenses", money(result.totalExpenses)],
    ["debt_payments", money(result.totalDebtPayments)],
    ["surplus", money(result.surplus)],
    ["savings_rate", percent(result.savingsRate)],
    ["debt_service", percent(result.debtServiceRatio)],
    ["debt_balance", money(result.totalDebtBalance)],
    ["investments", money(result.totalInvestments)],
    ["monthly_interest", money(result.estimatedMonthlyInterest)],
  ];

  return (
    <section aria-labelledby="diagnosis-title" className="panel">
      <h2 id="diagnosis-title">{t("diagnosis.title")}</h2>
      <p className="note">{t("diagnosis.review_note")}</p>
      {hasInvalidRows && <p role="status">{t("diagnosis.has_errors")}</p>}
      {!hasRows ? (
        <p>{t("diagnosis.empty")}</p>
      ) : (
        <>
          <dl className="metrics">
            {metrics.map(([key, value]) => (
              <div key={key}>
                <dt>{t(`diagnosis.metric.${key}`)}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>

          <h3>{t("diagnosis.flags_title")}</h3>
          {result.flags.length === 0 ? (
            <p>{t("diagnosis.no_flags")}</p>
          ) : (
            <ul>
              {result.flags.map((flag) => (
                <li key={flag}>{t(`diagnosis.flag.${flag}`)}</li>
              ))}
            </ul>
          )}

          {Object.keys(result.expensesByCategory).length > 0 && (
            <>
              <h3>{t("diagnosis.categories_title")}</h3>
              <ul>
                {EXPENSE_CATEGORIES.filter(
                  (category) => result.expensesByCategory[category] !== undefined,
                ).map((category) => (
                  <li key={category}>
                    {t(`category.${category}`)}:{" "}
                    {money(result.expensesByCategory[category] ?? 0)}
                  </li>
                ))}
              </ul>
            </>
          )}

          {result.debtsByApr.length > 0 && (
            <>
              <h3>{t("diagnosis.debts_title")}</h3>
              <ol>
                {result.debtsByApr.map((debt) => (
                  <li key={debt.id}>
                    {debt.label} ({t(`debt_kind.${debt.kind}`)}):{" "}
                    {formatPercent(locale, debt.apr / 100)} ·{" "}
                    {money(debt.monthlyInterest)}
                  </li>
                ))}
              </ol>
            </>
          )}
        </>
      )}
      <p className="note">{t("diagnosis.disclaimer")}</p>
    </section>
  );
}
