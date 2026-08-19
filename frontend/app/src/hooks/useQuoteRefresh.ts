import { useState } from "react"
import { useAppContext } from "@/context/AppContext"
import { useI18n } from "@/i18n"

export function useQuoteRefresh(refreshData: () => Promise<void>) {
  const { t } = useI18n()
  const { refreshTrackedQuotes, showToast } = useAppContext()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshQuotes = async () => {
    setIsRefreshing(true)
    try {
      const result = await refreshTrackedQuotes()
      await refreshData()
      showToast(
        result?.throttled
          ? t.manualEntities.refreshThrottled
          : t.manualEntities.refreshed,
        result?.throttled ? "info" : "success",
      )
    } catch {
      showToast(t.manualEntities.refreshError, "error")
    } finally {
      setIsRefreshing(false)
    }
  }

  return { refreshQuotes, isRefreshing }
}
