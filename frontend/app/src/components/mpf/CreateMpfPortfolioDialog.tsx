import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { useI18n } from "@/i18n"
import { useAppContext } from "@/context/AppContext"
import { CardContent, CardFooter } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { Switch } from "@/components/ui/Switch"
import { DatePicker } from "@/components/ui/DatePicker"
import { MpfDialogShell } from "@/components/mpf/MpfDialogShell"
import { MpfAllocationEditor } from "@/components/mpf/MpfAllocationEditor"
import {
  MpfOpeningBalanceEditor,
  buildMpfOpeningBalanceLineItems,
  type MpfOpeningBalanceLineItem,
  type MpfOpeningBalanceRow,
} from "@/components/mpf/MpfOpeningBalanceEditor"
import { EntityType } from "@/types"
import {
  getMpfFundQuotes,
  createMpfPortfolio,
  createManualEntity,
  getEntities,
  recordMpfOpeningBalance,
} from "@/services/api"
import type { MpfAllocationTarget, MpfFundQuote } from "@/types/mpf"

interface CreateMpfPortfolioDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

const DEFAULT_SCHEME = "MPF"
const SUN_LIFE_ENTITY_NAME = "Sun Life"

export function CreateMpfPortfolioDialog({
  isOpen,
  onClose,
  onCreated,
}: CreateMpfPortfolioDialogProps) {
  const { t, locale } = useI18n()
  const { entities, showToast, fetchEntities } = useAppContext()

  const [name, setName] = useState("")
  const [entityId, setEntityId] = useState("")
  const [currency, setCurrency] = useState("HKD")
  const [allocation, setAllocation] = useState<MpfAllocationTarget[]>([])
  const [funds, setFunds] = useState<MpfFundQuote[]>([])
  const [loadingFunds, setLoadingFunds] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResolvingEntity, setIsResolvingEntity] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmedSunLife, setConfirmedSunLife] = useState(false)
  const [hasExistingBalance, setHasExistingBalance] = useState(false)
  const [showOpeningBalanceStep, setShowOpeningBalanceStep] = useState(false)
  const [openingBalanceDate, setOpeningBalanceDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd"),
  )
  const [openingBalanceRows, setOpeningBalanceRows] = useState<
    Record<string, MpfOpeningBalanceRow>
  >({})

  const institutionEntities = useMemo(
    () =>
      (entities ?? [])
        .filter(entity => entity.type === EntityType.FINANCIAL_INSTITUTION)
        .sort((a, b) => a.name.localeCompare(b.name, locale)),
    [entities, locale],
  )

  useEffect(() => {
    if (!isOpen) return
    setLoadingFunds(true)
    getMpfFundQuotes(DEFAULT_SCHEME)
      .then(result => setFunds(result.quotes))
      .catch(() => setFunds([]))
      .finally(() => setLoadingFunds(false))
  }, [isOpen])

  const resetForm = () => {
    setName("")
    setEntityId("")
    setCurrency("HKD")
    setAllocation([])
    setError(null)
    setConfirmedSunLife(false)
    setHasExistingBalance(false)
    setShowOpeningBalanceStep(false)
    setOpeningBalanceDate(format(new Date(), "yyyy-MM-dd"))
    setOpeningBalanceRows({})
  }

  const handleClose = () => {
    if (isSubmitting) return
    resetForm()
    onClose()
  }

  const handleDeclineSunLife = () => {
    resetForm()
    onClose()
  }

  const handleConfirmSunLife = async () => {
    setIsResolvingEntity(true)
    setError(null)
    try {
      const matches = (candidate: { name: string; type: EntityType }) =>
        candidate.type === EntityType.FINANCIAL_INSTITUTION &&
        candidate.name.trim().toLowerCase() ===
          SUN_LIFE_ENTITY_NAME.toLowerCase()

      let sunLifeEntity = institutionEntities.find(matches)

      if (!sunLifeEntity) {
        try {
          await createManualEntity(SUN_LIFE_ENTITY_NAME)
        } catch (err) {
          const code = (err as { data?: { code?: string } })?.data?.code
          if (code !== "ENTITY_NAME_EXISTS") throw err
        }
        const refreshed = await getEntities()
        sunLifeEntity = refreshed.entities.find(matches)
        await fetchEntities()
      }

      if (!sunLifeEntity) {
        throw new Error("Could not resolve Sun Life institution")
      }

      setEntityId(sunLifeEntity.id)
      setConfirmedSunLife(true)
    } catch (err) {
      console.error("Error resolving Sun Life institution:", err)
      showToast(t.mpf.create.error, "error")
    } finally {
      setIsResolvingEntity(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!entityId) {
      setError(t.mpf.create.entityRequired)
      return
    }
    if (!name.trim()) {
      setError(t.mpf.create.nameRequired)
      return
    }
    const total = allocation.reduce((sum, a) => sum + (a.percentage || 0), 0)
    if (allocation.length === 0 || Math.abs(total - 100) > 0.01) {
      setError(t.mpf.allocation.mustSumTo100)
      return
    }

    // Opening balance is captured on a second step, so the first submit only advances.
    if (hasExistingBalance && !showOpeningBalanceStep) {
      setShowOpeningBalanceStep(true)
      return
    }

    let lineItems: MpfOpeningBalanceLineItem[] | null = null
    if (hasExistingBalance) {
      const result = buildMpfOpeningBalanceLineItems(openingBalanceRows)
      if (!result.ok) {
        setError(t.mpf.openingBalance[result.errorKey])
        return
      }
      lineItems = result.lineItems
    }

    setIsSubmitting(true)
    try {
      const portfolio = await createMpfPortfolio({
        entity_id: entityId,
        name: name.trim(),
        scheme: DEFAULT_SCHEME,
        currency,
        target_allocation: allocation,
      })

      if (lineItems) {
        try {
          await recordMpfOpeningBalance(portfolio.id, {
            date: new Date(openingBalanceDate).toISOString(),
            line_items: lineItems,
          })
        } catch (err) {
          // The portfolio itself was created, so say that explicitly — otherwise
          // the user assumes nothing happened and creates a duplicate.
          console.error("Error recording MPF opening balance:", err)
          showToast(t.mpf.openingBalance.partialFailure, "error")
          resetForm()
          onCreated()
          onClose()
          return
        }
      }

      showToast(t.mpf.create.success, "success")
      resetForm()
      onCreated()
      onClose()
    } catch (err) {
      console.error("Error creating MPF portfolio:", err)
      showToast(t.mpf.create.error, "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MpfDialogShell
      isOpen={isOpen}
      title={t.mpf.create.title}
      onClose={handleClose}
      closeDisabled={isSubmitting}
      maxWidthClassName="max-w-lg"
    >
      {!confirmedSunLife ? (
        <>
          <CardContent className="space-y-4 flex-1 overflow-y-auto">
            <p className="text-sm text-muted-foreground">
              {t.mpf.create.confirmSunLifeMessage}
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleDeclineSunLife}
              disabled={isResolvingEntity}
            >
              {t.mpf.create.confirmSunLifeNo}
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSunLife}
              disabled={isResolvingEntity}
            >
              {t.mpf.create.confirmSunLifeYes}
            </Button>
          </CardFooter>
        </>
      ) : showOpeningBalanceStep ? (
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <CardContent className="space-y-4 flex-1 overflow-y-auto">
            <div className="space-y-1.5">
              <Label>{t.mpf.openingBalance.dateLabel}</Label>
              <DatePicker
                value={openingBalanceDate}
                onChange={setOpeningBalanceDate}
              />
            </div>

            <MpfOpeningBalanceEditor
              funds={allocation}
              value={openingBalanceRows}
              onChange={setOpeningBalanceRows}
              currency={currency}
              locale={locale}
            />

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowOpeningBalanceStep(false)}
              disabled={isSubmitting}
            >
              {t.common.back}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {t.mpf.create.submit}
            </Button>
          </CardFooter>
        </form>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <CardContent className="space-y-4 flex-1 overflow-y-auto">
            <div className="space-y-1.5">
              <Label>{t.mpf.create.entityLabel}</Label>
              <p className="text-sm">{SUN_LIFE_ENTITY_NAME}</p>
            </div>

            <div className="space-y-1.5">
              <Label>{t.mpf.create.nameLabel}</Label>
              <Input
                value={name}
                onChange={event => setName(event.target.value)}
                placeholder={t.mpf.create.namePlaceholder}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t.mpf.allocation.title}</Label>
              {loadingFunds ? (
                <p className="text-xs text-muted-foreground">
                  {t.common.loading}
                </p>
              ) : funds.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {t.mpf.allocation.noFundsAvailable}
                </p>
              ) : (
                <MpfAllocationEditor
                  availableFunds={funds}
                  value={allocation}
                  onChange={setAllocation}
                  locale={locale}
                />
              )}
            </div>

            <div className="flex items-start gap-3">
              <Switch
                id="mpf-has-existing-balance"
                checked={hasExistingBalance}
                onCheckedChange={setHasExistingBalance}
              />
              <Label
                htmlFor="mpf-has-existing-balance"
                className="text-sm font-normal text-muted-foreground"
              >
                {t.mpf.create.hasExistingBalanceLabel}
              </Label>
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
            <Button type="submit" disabled={isSubmitting || loadingFunds}>
              {hasExistingBalance
                ? t.mpf.create.nextStep
                : t.mpf.create.submit}
            </Button>
          </CardFooter>
        </form>
      )}
    </MpfDialogShell>
  )
}
