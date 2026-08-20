import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts"
import { ChartCandlestick, Minimize2 } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { useI18n } from "@/i18n"
import { useTheme } from "@/context/ThemeContext"
import { useModalBackHandler } from "@/hooks/useModalBackHandler"
import { getInstrumentHistory } from "@/services/api"
import { cn } from "@/lib/utils"
import type { InstrumentDataRequest, InstrumentHistoryRangeKey } from "@/types"

interface InstrumentPriceChartCardProps {
  request: InstrumentDataRequest
  displayName: string
  open: boolean
  onClose: () => void
}

const RANGE_KEYS: InstrumentHistoryRangeKey[] = [
  "1m",
  "3m",
  "6m",
  "1y",
  "5y",
  "max",
]

export default function InstrumentPriceChartCard({
  request,
  displayName,
  open,
  onClose,
}: InstrumentPriceChartCardProps) {
  const { t } = useI18n()
  const { resolvedTheme } = useTheme()
  const isDarkMode = resolvedTheme === "dark"
  useModalBackHandler(open, onClose)

  const [range, setRange] = useState<InstrumentHistoryRangeKey>("1y")
  const [isLoading, setIsLoading] = useState(false)
  const [noData, setNoData] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [candles, setCandles] = useState<
    { date: string; open: number; high: number; low: number; close: number }[]
  >([])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setIsLoading(true)
    setError(null)
    setNoData(false)

    getInstrumentHistory(request, range)
      .then(history => {
        if (cancelled) return
        setCandles(history.candles)
      })
      .catch((err: any) => {
        if (cancelled) return
        if (err?.status === 404) {
          setNoData(true)
        } else {
          setError(t.instrumentPriceChart.loadError)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, range, request.isin, request.ticker, request.name, request.type])

  useEffect(() => {
    if (!open || !containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: isDarkMode ? "#a1a1aa" : "#52525b",
      },
      grid: {
        vertLines: { color: isDarkMode ? "#27272a" : "#e4e4e7" },
        horzLines: { color: isDarkMode ? "#27272a" : "#e4e4e7" },
      },
      timeScale: { borderColor: isDarkMode ? "#3f3f46" : "#d4d4d8" },
      rightPriceScale: { borderColor: isDarkMode ? "#3f3f46" : "#d4d4d8" },
      autoSize: false,
    })

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#16a34a",
      downColor: "#dc2626",
      borderVisible: false,
      wickUpColor: "#16a34a",
      wickDownColor: "#dc2626",
    })

    chartRef.current = chart
    seriesRef.current = series

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [open, isDarkMode])

  useEffect(() => {
    if (!seriesRef.current) return
    seriesRef.current.setData(
      candles.map(c => ({
        time: c.date,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    )
    chartRef.current?.timeScale().fitContent()
  }, [candles])

  useEffect(() => {
    if (!open) return
    if (typeof ResizeObserver === "undefined") return
    const element = containerRef.current
    if (!element) return

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width && height) {
          chartRef.current?.resize(width, height)
        }
      }
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[18000] flex flex-col bg-background px-4 pb-4 pt-[max(1rem,var(--safe-area-inset-top,0px))] md:px-6 md:pb-6 md:pt-[max(1.5rem,var(--safe-area-inset-top,0px))]">
      <div className="mb-4 flex flex-row items-center justify-between gap-2">
        <h2 className="flex items-center text-xl font-bold">
          <ChartCandlestick className="mr-2 h-5 w-5 text-primary" />
          {displayName}
        </h2>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onClose}
          aria-label={t.instrumentPriceChart.collapse}
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-4 inline-flex h-7 w-max items-center overflow-hidden rounded-md border border-input">
        {RANGE_KEYS.map((key, index) => (
          <button
            key={key}
            type="button"
            onClick={() => setRange(key)}
            className={cn(
              "h-full px-2.5 text-xs font-medium transition-colors",
              index > 0 && "border-l border-input",
              range === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {t.instrumentPriceChart.ranges[key]}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {isLoading && candles.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-muted-foreground">
            <ChartCandlestick className="mb-3 h-10 w-10 text-primary/60" />
            <p>{error}</p>
          </div>
        ) : noData ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ChartCandlestick className="h-6 w-6" />
            </div>
            <p className="font-semibold">{t.instrumentPriceChart.noData}</p>
          </div>
        ) : (
          <div ref={containerRef} className="min-h-0 flex-1" />
        )}
      </div>
    </div>,
    document.body,
  )
}
