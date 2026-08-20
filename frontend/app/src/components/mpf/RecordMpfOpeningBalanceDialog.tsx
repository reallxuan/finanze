import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { X } from "lucide-react"
import { useI18n } from "@/i18n"
import { useAppContext } from "@/context/AppContext"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { DatePicker } from "@/components/ui/DatePicker"
import {
  MpfOpeningBalanceEditor,
  type MpfOpeningBalanceRow,
} from "@/components/mpf/MpfOpeningBalanceEditor"
import { recordMpfOpeningBalance } from "@/services/api"
import type { MpfPortfolio } from "@/types/mpf"

interface RecordMpfOpeningBalanceDialogProps {
  isOpen: boolean
  portfolio: MpfPortfolio | null
  onClose: () => void
  onRecorded: () => void
}

export function RecordMpfOpeningBalanceDialog({
  isOpen,
  portfolio,
  onClose,
  onRecorded,
}: RecordMpfOpeningBalanceDialogProps) {
  const { t, locale } = useI18n()
  const { showToast } = useAppContext()

  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [note, setNote] = useState("")
  const [rows, setRows] = useState<Record<string, MpfOpeningBalanceRow>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setDate(format(new Date(), "yyyy-MM-dd"))
    setNote("")
    setRows({})
    setError(null)
  }

  const handleClose = () => {
    if (isSubmitting) return
    resetForm()
    onClose()
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (!portfolio) return

    const lineItems = Object.entries(rows)
      .filter(([, row]) => row.amount != null || row.units != null)
      .map(([fund_cd, row]) => ({
        fund_cd,
        amount: row.amount ?? 0,
        units: row.units ?? 0,
      }))

    if (lineItems.length === 0) {
      setError(t.mpf.openingBalance.amountRequired)
      return
    }
    if (lineItems.some(item => item.amount <= 0 || item.units <= 0)) {
      setError(t.mpf.openingBalance.unitsRequired)
      return
    }

    setIsSubmitting(true)
    try {
      await recordMpfOpeningBalance(portfolio.id, {
        date: new Date(date).toISOString(),
        note: note.trim() || undefined,
        line_items: lineItems,
      })
      showToast(t.mpf.openingBalance.success, "success")
      resetForm()
      onRecorded()
      onClose()
    } catch (err: any) {
      console.error("Error recording MPF opening balance:", err)
      const message = err?.data?.message || t.mpf.openingBalance.error
      setError(message)
      showToast(t.mpf.openingBalance.error, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!portfolio) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center pt-10 px-4 pb-4 z-[18000]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-md"
          >
            <Card className="max-h-[calc(100vh-5rem)] flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <CardTitle className="text-xl">
                  {t.mpf.openingBalance.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <form
                onSubmit={handleSubmit}
                className="flex flex-1 flex-col overflow-hidden"
              >
                <CardContent className="space-y-4 flex-1 overflow-y-auto">
                  <p className="text-sm text-muted-foreground">
                    {portfolio.name}
                  </p>

                  <div className="space-y-1.5">
                    <Label>{t.mpf.openingBalance.dateLabel}</Label>
                    <DatePicker value={date} onChange={setDate} />
                  </div>

                  <MpfOpeningBalanceEditor
                    funds={portfolio.target_allocation}
                    value={rows}
                    onChange={setRows}
                    currency={portfolio.currency}
                    locale={locale}
                  />

                  <div className="space-y-1.5">
                    <Label>{t.transactions.form.quickAdd.noteLabel}</Label>
                    <Input
                      value={note}
                      onChange={event => setNote(event.target.value)}
                      placeholder={t.transactions.form.quickAdd.notePlaceholder}
                    />
                  </div>

                  {error && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-2 border-t pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    {t.common.cancel}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {t.mpf.openingBalance.submit}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
