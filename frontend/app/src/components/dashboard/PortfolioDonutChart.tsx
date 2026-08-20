import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useI18n } from "@/i18n"
import {
  formatCurrency,
  formatPercentage,
  formatCompactCurrency,
} from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { useTheme } from "@/context/ThemeContext"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/Popover"
import { Button } from "@/components/ui/Button"
import {
  getPieSliceColorForAssetType,
  getIconForAssetType,
} from "@/utils/dashboardUtils"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import {
  Info,
  ChevronUp,
  SlidersHorizontal,
  HandCoins,
  CreditCard,
  Home,
  ChartPie,
  Hash,
  Landmark,
  Eye,
  EyeOff,
} from "lucide-react"
import { Switch } from "@/components/ui/Switch"
import { Sensitive } from "@/components/ui/Sensitive"
import { DataDisplayMode } from "@/types"
import { useDataDisplayMode } from "@/context/DataDisplayModeContext"

type DistributionItem = {
  type: string
  value: number
  percentage: number
}

type DashboardOptions = {
  includePending: boolean
  includeLoans: boolean
  includeCardExpenses: boolean
  includeRealEstate: boolean
  includeResidences: boolean
  includeMpf: boolean
  compactNumbers: boolean
}

interface PortfolioDonutChartProps {
  totalValue: number
  investedAmount: number
  gainPercentage: number
  currency: string
  assetDistribution: DistributionItem[]
  forecastMode?: boolean
  dashboardOptions: DashboardOptions
  setDashboardOptions: React.Dispatch<React.SetStateAction<DashboardOptions>>
  className?: string
}

const VISIBLE_ITEMS = 6

export function PortfolioDonutChart({
  totalValue,
  investedAmount,
  gainPercentage,
  currency,
  assetDistribution,
  forecastMode = false,
  dashboardOptions,
  setDashboardOptions,
  className,
}: PortfolioDonutChartProps) {
  const { t, locale } = useI18n()
  const { resolvedTheme } = useTheme()
  const { mode: dataDisplayMode, setMode: setDataDisplayMode } =
    useDataDisplayMode()
  const isPrivate = dataDisplayMode === DataDisplayMode.PRIVATE
  const navigate = useNavigate()
  const [legendExpanded, setLegendExpanded] = useState(false)
  const [isOptionsOpen, setIsOptionsOpen] = useState(false)
  const isDarkMode = resolvedTheme === "dark"

  const currentDistribution = useMemo(() => {
    return [...assetDistribution].sort((a, b) => {
      const aNeg = a.value < 0 ? 0 : 1
      const bNeg = b.value < 0 ? 0 : 1
      if (aNeg !== bNeg) return aNeg - bNeg
      if (aNeg === 0) return a.value - b.value
      return b.value - a.value
    })
  }, [assetDistribution])

  const visibleItems = useMemo(() => {
    if (legendExpanded || currentDistribution.length <= VISIBLE_ITEMS) {
      return currentDistribution
    }
    return currentDistribution.slice(0, VISIBLE_ITEMS - 1)
  }, [currentDistribution, legendExpanded])

  const overflowItems = useMemo(() => {
    if (legendExpanded || currentDistribution.length <= VISIBLE_ITEMS) {
      return []
    }
    return currentDistribution.slice(VISIBLE_ITEMS - 1)
  }, [currentDistribution, legendExpanded])

  const overflowTotal = useMemo(() => {
    return overflowItems.reduce((sum, item) => sum + item.value, 0)
  }, [overflowItems])

  const getInvestmentRoute = (assetType: string) => {
    if (assetType === "MARKET_FORECAST" && !__CONNECTIONS__) {
      return null
    }

    const routeMap: Record<string, string> = {
      STOCK_ETF: "/investments/stocks-etfs",
      FUND: "/investments/funds",
      DEPOSIT: "/investments/deposits",
      FACTORING: "/investments/factoring",
      REAL_ESTATE_CF: "/investments/real-estate-cf",
      CRYPTO: "/investments/crypto",
      MARKET_FORECAST: "/investments/market-forecast",
      COMMODITY: "/investments/commodities",
      PENDING_FLOWS: "/management/pending",
      CASH: "/banking",
      REAL_ESTATE: "/real-estate",
      MPF: "/mpf",
    }
    return routeMap[assetType] || null
  }

  const handleLegendItemClick = (item: DistributionItem) => {
    const route = getInvestmentRoute(item.type)
    if (route) navigate(route)
  }

  const handlePieClick = (data: unknown) => {
    if (!data || typeof data !== "object") {
      return
    }

    const candidate = data as { payload?: unknown; type?: unknown }
    const item =
      candidate.payload && typeof candidate.payload === "object"
        ? (candidate.payload as { type?: unknown })
        : candidate
    const assetType = typeof item.type === "string" ? item.type : null
    if (!assetType) return

    const route = getInvestmentRoute(assetType)
    if (route) navigate(route)
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            {getIconForAssetType(data.type)}
            <p className="font-medium text-sm text-popover-foreground">
              {(t.enums?.productType as any)?.[data.type] ?? data.type}
            </p>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              <span className="font-medium text-popover-foreground">
                <Sensitive>
                  {formatCurrency(data.value, locale, currency)}
                </Sensitive>
              </span>
            </p>
            <p>
              <Sensitive>{data.percentage}%</Sensitive>
            </p>
          </div>
        </div>
      )
    }
    return null
  }

  const renderLegendItem = (item: DistributionItem, index: number) => {
    const hasRoute = getInvestmentRoute(item.type) !== null
    const label = (t.enums?.productType as any)?.[item.type] ?? item.type

    const isLongLabel = label && label.length > 8
    const iconSize = isLongLabel ? "w-3.5 h-3.5" : "w-4 h-4"
    const iconClass = isLongLabel ? "h-3.5 w-3.5" : "h-4 w-4"

    return (
      <button
        key={`legend-${index}`}
        onClick={() => handleLegendItemClick(item)}
        disabled={!hasRoute}
        className={cn(
          "relative flex flex-col items-center justify-center p-2 rounded-lg bg-muted/50 min-w-0 transition-colors overflow-hidden",
          hasRoute && "hover:bg-muted cursor-pointer",
        )}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`flex-shrink-0 ${iconSize}`}>
            {getIconForAssetType(item.type, iconClass)}
          </span>
          <span
            className={cn(
              "font-medium max-w-[90px] whitespace-normal break-words leading-tight",
              isLongLabel ? "text-[10px]" : "text-xs",
            )}
          >
            {label}
          </span>
        </div>
        <span
          className={cn(
            "text-xs font-semibold",
            item.value < 0 && "text-red-400",
          )}
        >
          <Sensitive>
            {isPrivate
              ? formatCurrency(item.value, locale, currency)
              : formatCompactCurrency(item.value, locale, currency)}
          </Sensitive>
        </span>
      </button>
    )
  }

  const renderOverflowBox = () => {
    if (overflowItems.length === 0) return null

    const displayIcons = overflowItems.slice(0, 3)

    const renderOverflowIcon = (item: DistributionItem, idx: number) => {
      const marginStyle = {
        marginLeft: idx > 0 ? "-2.5px" : 0,
        zIndex: 4 - idx,
        ...(isDarkMode && { filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }),
      }

      return (
        <span
          key={idx}
          className="relative flex-shrink-0 w-5 h-5 flex items-center justify-center"
          style={marginStyle}
        >
          {getIconForAssetType(item.type, "h-4 w-4")}
        </span>
      )
    }

    return (
      <button
        onClick={() => setLegendExpanded(true)}
        className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/50 min-w-0 hover:bg-muted cursor-pointer transition-colors"
      >
        <div className="flex items-center mb-1">
          {displayIcons.map((item, idx) => renderOverflowIcon(item, idx))}
          {overflowItems.length > 3 && (
            <span
              className="relative text-[10px] text-muted-foreground bg-muted rounded-full w-5 h-5 flex items-center justify-center"
              style={{
                marginLeft: "-1px",
                zIndex: 0,
                ...(isDarkMode && {
                  filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.4))",
                }),
              }}
            >
              +{overflowItems.length - 3}
            </span>
          )}
        </div>
        <span className="text-xs font-semibold">
          <Sensitive>
            {isPrivate
              ? formatCurrency(overflowTotal, locale, currency)
              : formatCompactCurrency(overflowTotal, locale, currency)}
          </Sensitive>
        </span>
      </button>
    )
  }

  return (
    <div className={cn("space-y-4 w-full", className)}>
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-3">
          <ChartPie className="h-5 w-5 text-primary" />
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              setDataDisplayMode(
                isPrivate ? DataDisplayMode.NONE : DataDisplayMode.PRIVATE,
              )
            }
          >
            {isPrivate ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOptionsOpen(prev => !prev)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <AnimatePresence>
              {isOptionsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="absolute right-0 mt-2 w-80 rounded-md shadow-md bg-popover z-[99999] border p-4 text-popover-foreground"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm flex items-center gap-2">
                        <HandCoins className="h-4 w-4 text-muted-foreground" />
                        {t.dashboard.includePendingMoney}
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-72 text-xs text-muted-foreground"
                            side="left"
                          >
                            {t.dashboard.includePendingMoneyInfo}
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Switch
                        disabled={forecastMode}
                        checked={
                          forecastMode ? false : dashboardOptions.includePending
                        }
                        onCheckedChange={val =>
                          setDashboardOptions(prev => ({
                            ...prev,
                            includePending: Boolean(val),
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                        {t.dashboard.includeLoans}
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-72 text-xs text-muted-foreground"
                            side="left"
                          >
                            {t.dashboard.includeLoansInfo}
                          </PopoverContent>
                        </Popover>
                      </div>
                      <Switch
                        checked={dashboardOptions.includeLoans}
                        onCheckedChange={val =>
                          setDashboardOptions(prev => ({
                            ...prev,
                            includeLoans: Boolean(val),
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        {t.dashboard.includeCardExpenses}
                      </div>
                      <Switch
                        checked={dashboardOptions.includeCardExpenses}
                        onCheckedChange={val =>
                          setDashboardOptions(prev => ({
                            ...prev,
                            includeCardExpenses: Boolean(val),
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm flex items-center gap-2">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          {t.dashboard.includeRealEstateEquity}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-72 text-xs text-muted-foreground"
                              side="left"
                            >
                              {t.dashboard.includeRealEstateEquityInfo}
                            </PopoverContent>
                          </Popover>
                        </div>
                        <Switch
                          checked={dashboardOptions.includeRealEstate}
                          onCheckedChange={val =>
                            setDashboardOptions(prev => ({
                              ...prev,
                              includeRealEstate: Boolean(val),
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between pl-6">
                        <div className="text-sm text-muted-foreground">
                          {t.dashboard.includeResidences}
                        </div>
                        <Switch
                          checked={dashboardOptions.includeResidences}
                          onCheckedChange={val =>
                            setDashboardOptions(prev => ({
                              ...prev,
                              includeResidences: Boolean(val),
                            }))
                          }
                          disabled={!dashboardOptions.includeRealEstate}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm flex items-center gap-2">
                        <Landmark className="h-4 w-4 text-muted-foreground" />
                        {t.dashboard.includeMpf}
                      </div>
                      <Switch
                        checked={dashboardOptions.includeMpf}
                        onCheckedChange={val =>
                          setDashboardOptions(prev => ({
                            ...prev,
                            includeMpf: Boolean(val),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        {t.dashboard.compactNumbers}
                      </div>
                      <Switch
                        checked={dashboardOptions.compactNumbers}
                        onCheckedChange={val =>
                          setDashboardOptions(prev => ({
                            ...prev,
                            compactNumbers: Boolean(val),
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-sm flex items-center gap-2">
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                        {t.dashboard.privateMode}
                      </div>
                      <Switch
                        checked={dataDisplayMode === DataDisplayMode.PRIVATE}
                        onCheckedChange={val =>
                          setDataDisplayMode(
                            val
                              ? DataDisplayMode.PRIVATE
                              : DataDisplayMode.NONE,
                          )
                        }
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {isOptionsOpen && (
              <div
                className="fixed inset-0 z-[99998]"
                onClick={() => setIsOptionsOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center items-center">
        <div className="w-full xl:flex-1 flex justify-center">
          <div className="relative w-full max-w-[280px] xl:max-w-[240px] 2xl:max-w-[280px] aspect-square flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius="80%"
                  outerRadius="100%"
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="type"
                  isAnimationActive={false}
                  stroke="hsl(var(--background))"
                  strokeWidth={1}
                  paddingAngle={1}
                  onClick={handlePieClick}
                >
                  {currentDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getPieSliceColorForAssetType(entry.type)}
                      style={{ outline: "none" }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomTooltip />}
                  wrapperStyle={{ zIndex: 50 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
              <span className="text-xs text-muted-foreground mb-0.5">
                {t.dashboard.totalValue}
              </span>
              <span
                className={cn(
                  "font-light",
                  dashboardOptions.compactNumbers && !isPrivate && "text-4xl",
                )}
                style={
                  dashboardOptions.compactNumbers && !isPrivate
                    ? undefined
                    : { fontSize: "1.7rem" }
                }
              >
                <Sensitive>
                  {dashboardOptions.compactNumbers && !isPrivate
                    ? formatCompactCurrency(totalValue, locale, currency)
                    : formatCurrency(totalValue, locale, currency)}
                </Sensitive>
              </span>
              {gainPercentage !== 0 && (
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      gainPercentage > 0
                        ? "text-green-500"
                        : gainPercentage < 0
                          ? "text-red-500"
                          : "text-muted-foreground",
                    )}
                  >
                    <Sensitive>
                      {gainPercentage > 0 ? "+" : ""}
                      {formatPercentage(gainPercentage, locale)}
                    </Sensitive>
                  </span>
                  {investedAmount > 0 && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground transition-colors pointer-events-auto">
                          <Info className="h-3.5 w-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-3" align="center">
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              {t.dashboard.totalValue}:{" "}
                            </span>
                            <span className="font-semibold">
                              <Sensitive>
                                {formatCurrency(totalValue, locale, currency)}
                              </Sensitive>
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              {t.dashboard.investedAmount}:{" "}
                            </span>
                            <span className="font-semibold">
                              <Sensitive>
                                {formatCurrency(
                                  investedAmount,
                                  locale,
                                  currency,
                                )}
                              </Sensitive>
                            </span>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              )}
              {gainPercentage === 0 && investedAmount > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors pointer-events-auto">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="center">
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        {t.dashboard.investedAmount}:{" "}
                      </span>
                      <span className="font-semibold">
                        <Sensitive>
                          {formatCurrency(investedAmount, locale, currency)}
                        </Sensitive>
                      </span>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </div>

        <div className="w-full mt-4 xl:mt-0 xl:w-auto xl:flex-1 xl:pl-6 xl:max-w-[520px] xl:self-center">
          <div className="grid grid-cols-3 min-[500px]:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-3 gap-2 xl:justify-end">
            {visibleItems.map((item, index) => renderLegendItem(item, index))}
            {!legendExpanded && renderOverflowBox()}
          </div>
          {legendExpanded && currentDistribution.length > VISIBLE_ITEMS && (
            <button
              onClick={() => setLegendExpanded(false)}
              className="flex items-center justify-center gap-1 w-full mt-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              {t.common.showLess}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
