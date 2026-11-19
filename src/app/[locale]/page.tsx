import { notFound } from "next/navigation";
import { FinanceApp } from "@/components/FinanceApp";
import { isLocale } from "@/i18n/config";

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <FinanceApp locale={locale} />;
}
