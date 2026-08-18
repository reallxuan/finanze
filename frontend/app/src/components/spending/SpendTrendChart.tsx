import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Card } from "@/components/ui/Card"
import { TrendingUp } from "lucide-react"
import { useI18n } from "@/i18n"
import { formatCompactCurrency, formatCurrency } from "@/lib/formatters"
import { Sensitive } from "@/components/ui/Sensitive"

interface SpendTrendChartProps {
  data: { month: string; expense: number; income: number }[]
  locale: string
  currency: string
}

const EXPENSE_COLOR = "hsl(var(--destructive))"
const INCOME_COLOR = "#22c55e"

function CustomTooltip({ active, payload, label, locale, currency }: any) {
  if (!active || !payload || !payload.length) return null
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p
          key={entry.dataKey}
          className="text-sm"
          style={{ color: entry.color }}
        >
          {entry.name}:{" "}
          <Sensitive>{formatCurrency(entry.value, locale, currency)}</Sensitive>
        </p>
      ))}
    </div>
  )
}

export function SpendTrendChart({
  data,
  locale,
  currency,
}: SpendTrendChartProps) {
  const { t } = useI18n()

  const chartData = useMemo(
    () =>
      [...data]
        .sort((a, b) => a.month.localeCompare(b.month))
        .map(item => ({
          month: item.month,
          [t.spendingAnalysis.summary.expense]: item.expense,
          [t.spendingAnalysis.summary.income]: item.income,
        })),
    [data, t],
  )

  const hasData = data.some(item => item.expense > 0 || item.income > 0)

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="text-primary" />
        {t.spendingAnalysis.trendChart.title}
      </h3>
      {!hasData ? (
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400 text-sm">
          {t.spendingAnalysis.trendChart.empty}
        </div>
      ) : (
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
              />
              <XAxis
                dataKey="month"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={value =>
                  formatCompactCurrency(value, locale, currency)
                }
              />
              <Tooltip
                content={<CustomTooltip locale={locale} currency={currency} />}
              />
              <Legend />
              <Bar
                dataKey={t.spendingAnalysis.summary.expense}
                fill={EXPENSE_COLOR}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey={t.spendingAnalysis.summary.income}
                fill={INCOME_COLOR}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
