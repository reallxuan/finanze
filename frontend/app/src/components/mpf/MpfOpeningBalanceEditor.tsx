import { useI18n } from "@/i18n"
import { DecimalInput } from "@/components/ui/DecimalInput"
import { getCurrencySymbol } from "@/lib/utils"

interface OpeningBalanceFund {
  fund_cd: string
  fund_class: string
  description_en: string
  description_zh: string
}

export interface MpfOpeningBalanceRow {
  amount: number | null
  units: number | null
}

export interface MpfOpeningBalanceLineItem {
  fund_cd: string
  amount: number
  units: number
}

/**
 * Turns editor rows into API line items, or reports which
 * `t.mpf.openingBalance.*` message the caller should show. Shared so the
 * validation rule lives next to the editor that produces the rows.
 */
export type MpfOpeningBalanceResult =
  | { ok: true; lineItems: MpfOpeningBalanceLineItem[] }
  | { ok: false; errorKey: "amountRequired" | "unitsRequired" }

export function buildMpfOpeningBalanceLineItems(
  rows: Record<string, MpfOpeningBalanceRow>,
): MpfOpeningBalanceResult {
  const lineItems = Object.entries(rows)
    .filter(([, row]) => row.amount != null || row.units != null)
    .map(([fund_cd, row]) => ({
      fund_cd,
      amount: row.amount ?? 0,
      units: row.units ?? 0,
    }))

  if (lineItems.length === 0) return { ok: false, errorKey: "amountRequired" }
  if (lineItems.some(item => item.amount <= 0 || item.units <= 0)) {
    return { ok: false, errorKey: "unitsRequired" }
  }
  return { ok: true, lineItems }
}

interface MpfOpeningBalanceEditorProps {
  funds: OpeningBalanceFund[]
  value: Record<string, MpfOpeningBalanceRow>
  onChange: (next: Record<string, MpfOpeningBalanceRow>) => void
  currency: string
  locale: string
}

export function MpfOpeningBalanceEditor({
  funds,
  value,
  onChange,
  currency,
  locale,
}: MpfOpeningBalanceEditorProps) {
  const { t } = useI18n()

  const updateRow = (fundCd: string, patch: Partial<MpfOpeningBalanceRow>) => {
    const current = value[fundCd] ?? { amount: null, units: null }
    onChange({ ...value, [fundCd]: { ...current, ...patch } })
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {t.mpf.openingBalance.description}
      </p>
      {funds.map(fund => {
        const row = value[fund.fund_cd] ?? { amount: null, units: null }
        const avgPrice =
          row.amount && row.units ? row.amount / row.units : null
        return (
          <div
            key={fund.fund_cd}
            className="space-y-2 rounded-md border border-border p-2.5"
          >
            <p className="truncate text-sm font-medium">
              {locale.startsWith("zh")
                ? fund.description_zh
                : fund.description_en}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  {t.mpf.openingBalance.amountLabel}
                </label>
                <DecimalInput
                  value={row.amount}
                  onValueChange={v => updateRow(fund.fund_cd, { amount: v })}
                  prefix={getCurrencySymbol(currency)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">
                  {t.mpf.openingBalance.unitsLabel}
                </label>
                <DecimalInput
                  value={row.units}
                  onValueChange={v => updateRow(fund.fund_cd, { units: v })}
                  placeholder="0.00"
                />
              </div>
            </div>
            {avgPrice != null && (
              <p className="text-xs text-muted-foreground">
                {t.mpf.openingBalance.avgPriceLabel}:{" "}
                {avgPrice.toFixed(4)}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
