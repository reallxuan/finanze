import { useMemo } from "react"
import { InvestmentDistributionChart } from "@/components/InvestmentDistributionChart"
import { useI18n } from "@/i18n"
import { getCategoryColor } from "@/utils/dashboardUtils"

interface CategorySpendChartProps {
  data: { category: string; amount: number }[]
  locale: string
  currency: string
}

const COLOR_HEX: Record<string, string> = {
  "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100": "#f59e0b",
  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100": "#3b82f6",
  "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100": "#ec4899",
  "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100": "#14b8a6",
  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100":
    "#a855f7",
  "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100": "#f43f5e",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100":
    "#6366f1",
  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100":
    "#eab308",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100": "#06b6d4",
  "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100": "#9ca3af",
}

export function CategorySpendChart({
  data,
  locale,
  currency,
}: CategorySpendChartProps) {
  const { t } = useI18n()

  const chartData = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.amount, 0)
    return data
      .filter(item => item.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .map(item => ({
        name:
          (t.enums.category as Record<string, string>)[item.category] ||
          item.category,
        value: item.amount,
        color: COLOR_HEX[getCategoryColor(item.category)] || "#9ca3af",
        percentage: total > 0 ? (item.amount / total) * 100 : 0,
        currency,
      }))
  }, [data, t, currency])

  return (
    <InvestmentDistributionChart
      data={chartData}
      title={t.spendingAnalysis.categoryChart.title}
      locale={locale}
      currency={currency}
    />
  )
}
