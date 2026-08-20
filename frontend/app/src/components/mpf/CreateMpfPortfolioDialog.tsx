import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
import { MpfAllocationEditor } from "@/components/mpf/MpfAllocationEditor"
import {
  MpfOpeningBalanceEditor,
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

    if (hasExistingBalance) {
      setShowOpeningBalanceStep(true)
      return
    }

    setIsSubmitting(true)
    try {
      await createMpfPortfolio({
        entity_id: entityId,
        name: name.trim(),
        scheme: DEFAULT_SCHEME,
        currency,
        target_allocation: allocation,
      })
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

  const handleSubmitWithOpeningBalance = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const lineItems = Object.entries(openingBalanceRows)
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
      const portfolio = await createMpfPortfolio({
        entity_id: entityId,
        name: name.trim(),
        scheme: DEFAULT_SCHEME,
        currency,
        target_allocation: allocation,
      })
      try {
        await recordMpfOpeningBalance(portfolio.id, {
          date: new Date().toISOString(),
          line_items: lineItems,
        })
      } catch (err) {
        console.error("Error recording MPF opening balance:", err)
        showToast(t.mpf.openingBalance.error, "error")
        resetForm()
        onCreated()
        onClose()
        return
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
            className="w-full max-w-lg"
          >
            <Card className="max-h-[calc(100vh-5rem)] flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <CardTitle className="text-xl">{t.mpf.create.title}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
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
                  onSubmit={handleSubmitWithOpeningBalance}
                  className="flex flex-1 flex-col overflow-hidden"
                >
                  <CardContent className="space-y-4 flex-1 overflow-y-auto">
                    <MpfOpeningBalanceEditor
                      funds={allocation}
                      value={openingBalanceRows}
                      onChange={setOpeningBalanceRows}
                      currency={currency}
                      locale={locale}
                    />

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

                  <div className="flex items-start gap-2">
                    <input
                      id="mpf-has-existing-balance"
                      type="checkbox"
                      className="mt-0.5"
                      checked={hasExistingBalance}
                      onChange={event =>
                        setHasExistingBalance(event.target.checked)
                      }
                    />
                    <label
                      htmlFor="mpf-has-existing-balance"
                      className="text-sm text-muted-foreground"
                    >
                      {t.mpf.create.hasExistingBalanceLabel}
                    </label>
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
                  <Button type="submit" disabled={isSubmitting || loadingFunds}>
                    {hasExistingBalance
                      ? t.mpf.create.nextStep
                      : t.mpf.create.submit}
                  </Button>
                </CardFooter>
              </form>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
