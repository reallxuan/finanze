import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { ArrowDownCircle, ArrowUpCircle, PiggyBank } from "lucide-react"
import { useI18n } from "@/i18n"
import { useAppContext } from "@/context/AppContext"
import { getSpendingSummary } from "@/services/api"
import { SpendingSummaryResult } from "@/types/transactions"
import { Card, CardContent } from "@/components/ui/Card"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Sensitive } from "@/components/ui/Sensitive"
import { formatCurrency } from "@/lib/formatters"
import { convertCurrency } from "@/utils/financialDataUtils"
import { cn } from "@/lib/utils"
import { useSkipMountAnimation } from "@/lib/animations"
import { CategorySpendChart } from "@/components/spending/CategorySpendChart"
import { SpendTrendChart } from "@/components/spending/SpendTrendChart"

type PeriodKey = "1m" | "3m" | "6m" | "1y" | "all"
const PERIOD_KEYS: PeriodKey[] = ["1m", "3m", "6m", "1y", "all"]

function fromDateForPeriod(period: PeriodKey): string | undefined {
  if (period === "all") return undefined
  const from = new Date()
  switch (period) {
    case "1m":
      from.setMonth(from.getMonth() - 1)
      break
    case "3m":
      from.setMonth(from.getMonth() - 3)
      break
    case "6m":
      from.setMonth(from.getMonth() - 6)
      break
    case "1y":
      from.setFullYear(from.getFullYear() - 1)
      break
  }
  return from.toISOString()
}

export default function SpendingAnalysisPage() {
  const { t, locale } = useI18n()
  const { settings, exchangeRates } = useAppContext()
  const skipAnimations = useSkipMountAnimation(true)
  const defaultCurrency = settings.general.defaultCurrency

  const [period, setPeriod] = useState<PeriodKey>("6m")
  const [summary, setSummary] = useState<SpendingSummaryResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getSpendingSummary({ from_date: fromDateForPeriod(period) })
      .then(result => {
        if (!cancelled) setSummary(result)
      })
      .catch(() => {
        if (!cancelled) setError(t.common.unexpectedError)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [period, t.common.unexpectedError])

  const toDefault = (amount: number, currency: string) =>
    convertCurrency(amount, currency, defaultCurrency, exchangeRates)

  const totalExpense = useMemo(
    () =>
      (summary?.total_expense ?? []).reduce(
        (sum, item) => sum + toDefault(item.amount, item.currency),
        0,
      ),
    [summary, defaultCurrency, exchangeRates],
  )

  const totalIncome = useMemo(
    () =>
      (summary?.total_income ?? []).reduce(
        (sum, item) => sum + toDefault(item.amount, item.currency),
        0,
      ),
    [summary, defaultCurrency, exchangeRates],
  )

  const categoryData = useMemo(() => {
    const totals = new Map<string, number>()
    for (const item of summary?.by_category ?? []) {
      const converted = toDefault(item.amount, item.currency)
      totals.set(item.category, (totals.get(item.category) ?? 0) + converted)
    }
    return Array.from(totals.entries()).map(([category, amount]) => ({
      category,
      amount,
    }))
  }, [summary, defaultCurrency, exchangeRates])

  const monthlyData = useMemo(() => {
    const totals = new Map<string, { expense: number; income: number }>()
    for (const item of summary?.by_month ?? []) {
      const entry = totals.get(item.month) ?? { expense: 0, income: 0 }
      entry.expense += toDefault(item.expense, item.currency)
      entry.income += toDefault(item.income, item.currency)
      totals.set(item.month, entry)
    }
    return Array.from(totals.entries()).map(([month, values]) => ({
      month,
      ...values,
    }))
  }, [summary, defaultCurrency, exchangeRates])

  return (
    <motion.div
      className="space-y-6"
      initial={skipAnimations ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {t.spendingAnalysis.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t.spendingAnalysis.subtitle}
          </p>
        </div>
        <div className="inline-flex h-8 items-center overflow-hidden rounded-md border border-input">
          {PERIOD_KEYS.map((key, index) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={cn(
                "h-full px-3 text-xs font-medium transition-colors",
                index > 0 && "border-l border-input",
                period === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {t.spendingAnalysis.period[key]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Card className="p-6 text-center text-sm text-red-600 dark:text-red-400">
          {error}
        </Card>
      )}

      {loading && !summary ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-2 text-red-600 dark:text-red-400">
                  <ArrowUpCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t.spendingAnalysis.summary.expense}
                  </p>
                  <p className="text-lg font-semibold">
                    <Sensitive>
                      {formatCurrency(totalExpense, locale, defaultCurrency)}
                    </Sensitive>
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2 text-green-600 dark:text-green-400">
                  <ArrowDownCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t.spendingAnalysis.summary.income}
                  </p>
                  <p className="text-lg font-semibold">
                    <Sensitive>
                      {formatCurrency(totalIncome, locale, defaultCurrency)}
                    </Sensitive>
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center gap-3">
                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2 text-blue-600 dark:text-blue-400">
                  <PiggyBank className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t.spendingAnalysis.summary.net}
                  </p>
                  <p className="text-lg font-semibold">
                    <Sensitive>
                      {formatCurrency(
                        totalIncome - totalExpense,
                        locale,
                        defaultCurrency,
                      )}
                    </Sensitive>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategorySpendChart
              data={categoryData}
              locale={locale}
              currency={defaultCurrency}
            />
            <SpendTrendChart
              data={monthlyData}
              locale={locale}
              currency={defaultCurrency}
            />
          </div>
        </>
      )}
    </motion.div>
  )
}
