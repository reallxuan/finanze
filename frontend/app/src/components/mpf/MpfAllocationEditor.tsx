import { Plus, Trash2 } from "lucide-react"
import { useI18n } from "@/i18n"
import { Button } from "@/components/ui/Button"
import { DecimalInput } from "@/components/ui/DecimalInput"
import { cn } from "@/lib/utils"
import type { MpfAllocationTarget, MpfFundQuote } from "@/types/mpf"

interface MpfAllocationEditorProps {
  availableFunds: MpfFundQuote[]
  value: MpfAllocationTarget[]
  onChange: (next: MpfAllocationTarget[]) => void
  locale: string
}

function fundLabel(fund: MpfFundQuote, locale: string) {
  const description =
    locale.startsWith("zh") && fund.description_zh
      ? fund.description_zh
      : fund.description_en
  return `${description} (${fund.fund_cd})`
}

export function MpfAllocationEditor({
  availableFunds,
  value,
  onChange,
  locale,
}: MpfAllocationEditorProps) {
  const { t } = useI18n()

  const total = value.reduce((sum, target) => sum + (target.percentage || 0), 0)
  const isValid = Math.abs(total - 100) < 0.01

  const usedFundCds = new Set(value.map(target => target.fund_cd))
  const remainingFunds = availableFunds.filter(
    fund => !usedFundCds.has(fund.fund_cd),
  )

  const addRow = () => {
    const next = remainingFunds[0]
    if (!next) return
    onChange([
      ...value,
      {
        fund_cd: next.fund_cd,
        fund_class: next.fund_class,
        description_en: next.description_en,
        description_zh: next.description_zh,
        percentage: 0,
      },
    ])
  }

  const updateRow = (index: number, patch: Partial<MpfAllocationTarget>) => {
    const next = [...value]
    next[index] = { ...next[index], ...patch }
    onChange(next)
  }

  const setFund = (index: number, fundCd: string) => {
    const fund = availableFunds.find(f => f.fund_cd === fundCd)
    if (!fund) return
    updateRow(index, {
      fund_cd: fund.fund_cd,
      fund_class: fund.fund_class,
      description_en: fund.description_en,
      description_zh: fund.description_zh,
    })
  }

  const removeRow = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {value.map((target, index) => (
        <div key={index} className="flex items-center gap-2">
          <select
            value={target.fund_cd}
            onChange={event => setFund(index, event.target.value)}
            className="h-10 flex-1 min-w-0 rounded-md border border-input bg-background px-2 text-sm truncate"
          >
            <option value={target.fund_cd}>
              {fundLabel(
                availableFunds.find(f => f.fund_cd === target.fund_cd) ?? {
                  fund_cd: target.fund_cd,
                  fund_class: target.fund_class,
                  description_en: target.description_en,
                  description_zh: target.description_zh,
                  category: "",
                  nav: 0,
                  valuation_date: "",
                },
                locale,
              )}
            </option>
            {remainingFunds.map(fund => (
              <option key={fund.fund_cd} value={fund.fund_cd}>
                {fundLabel(fund, locale)}
              </option>
            ))}
          </select>
          <div className="w-24 flex items-center gap-1">
            <DecimalInput
              value={target.percentage}
              onValueChange={v => updateRow(index, { percentage: v ?? 0 })}
              suffix="%"
              className="text-right"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeRow(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
        disabled={remainingFunds.length === 0}
      >
        <Plus className="mr-2 h-4 w-4" />
        {t.mpf.allocation.addFund}
      </Button>

      <p
        className={cn(
          "text-xs",
          isValid
            ? "text-muted-foreground"
            : "text-red-600 dark:text-red-400 font-medium",
        )}
      >
        {t.mpf.allocation.total}: {total.toFixed(2)}%
        {!isValid && ` (${t.mpf.allocation.mustSumTo100})`}
      </p>
    </div>
  )
}
