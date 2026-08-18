import { Plus } from "lucide-react"
import { useQuickAdd } from "@/context/QuickAddContext"
import { useI18n } from "@/i18n"
import { cn } from "@/lib/utils"

export function FloatingActionButton() {
  const { openQuickAdd } = useQuickAdd()
  const { t } = useI18n()

  return (
    <button
      type="button"
      onClick={openQuickAdd}
      aria-label={t.transactions.form.quickAdd.title}
      className={cn(
        "fixed z-40 right-4 flex items-center justify-center",
        "h-12 w-12 rounded-full shadow-lg",
        "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900",
        "hover:opacity-90 active:scale-95 transition-transform",
        "bottom-[calc(76px+max(12px,var(--safe-area-inset-bottom,0px)))]",
        "sm:bottom-[calc(80px+max(16px,var(--safe-area-inset-bottom,0px)))]",
      )}
    >
      <Plus className="h-6 w-6" />
    </button>
  )
}
