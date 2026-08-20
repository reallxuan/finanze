import { useState } from "react"
import { format } from "date-fns"
import { useI18n } from "@/i18n"
import { useAppContext } from "@/context/AppContext"
import { CardContent, CardFooter } from "@/components/ui/Card"
import { MpfDialogShell } from "@/components/mpf/MpfDialogShell"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { DecimalInput } from "@/components/ui/DecimalInput"
import { Label } from "@/components/ui/Label"
import { DatePicker } from "@/components/ui/DatePicker"
import { getCurrencySymbol } from "@/lib/utils"
import { recordMpfContribution } from "@/services/api"
import type { MpfPortfolio } from "@/types/mpf"

interface RecordMpfContributionDialogProps {
  isOpen: boolean
  portfolio: MpfPortfolio | null
  onClose: () => void
  onRecorded: () => void
}

export function RecordMpfContributionDialog({
  isOpen,
  portfolio,
  onClose,
  onRecorded,
}: RecordMpfContributionDialogProps) {
  const { t } = useI18n()
  const { showToast } = useAppContext()

  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [amount, setAmount] = useState<number | null>(null)
  const [note, setNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setDate(format(new Date(), "yyyy-MM-dd"))
    setAmount(null)
    setNote("")
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
    if (amount == null || amount <= 0) {
      setError(t.transactions.form.errors.positive)
      return
    }

    setIsSubmitting(true)
    try {
      await recordMpfContribution(portfolio.id, {
        date: new Date(date).toISOString(),
        total_amount: amount,
        note: note.trim() || undefined,
      })
      showToast(t.mpf.contribution.success, "success")
      resetForm()
      onRecorded()
      onClose()
    } catch (err: any) {
      console.error("Error recording MPF contribution:", err)
      const message = err?.data?.message || t.mpf.contribution.error
      setError(message)
      showToast(t.mpf.contribution.error, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!portfolio) return null

  return (
    <MpfDialogShell
      isOpen={isOpen}
      title={t.mpf.contribution.title}
      onClose={handleClose}
      closeDisabled={isSubmitting}
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <CardContent className="space-y-4 flex-1 overflow-y-auto">
          <p className="text-sm text-muted-foreground">{portfolio.name}</p>

          <div className="space-y-1.5">
            <Label>{t.mpf.contribution.amountLabel}</Label>
            <DecimalInput
              value={amount}
              onValueChange={setAmount}
              prefix={getCurrencySymbol(portfolio.currency)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t.mpf.contribution.dateLabel}</Label>
            <DatePicker value={date} onChange={setDate} />
          </div>

          <div className="space-y-1.5">
            <Label>{t.transactions.form.quickAdd.noteLabel}</Label>
            <Input
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder={t.transactions.form.quickAdd.notePlaceholder}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t.mpf.contribution.allocationPreviewLabel}</Label>
            <div className="rounded-md border border-border p-2 space-y-1">
              {portfolio.target_allocation.map(target => (
                <div
                  key={target.fund_cd}
                  className="flex justify-between text-xs"
                >
                  <span className="truncate">{target.description_en}</span>
                  <span className="shrink-0 ml-2">{target.percentage}%</span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
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
            {t.mpf.contribution.submit}
          </Button>
        </CardFooter>
      </form>
    </MpfDialogShell>
  )
}
