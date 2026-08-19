import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { format } from "date-fns"
import { X } from "lucide-react"
import { EntitySelector } from "@/components/EntitySelector"
import { useI18n } from "@/i18n"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { DecimalInput } from "@/components/ui/DecimalInput"
import { Label } from "@/components/ui/Label"
import { DatePicker } from "@/components/ui/DatePicker"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs"
import { getCurrencySymbol, cn } from "@/lib/utils"
import { getCategoryIcon } from "@/utils/dashboardUtils"
import { DataSource, EntityType } from "@/types"
import { ProductType, type Account } from "@/types/position"
import { TxType, type ManualAccountTransactionPayload } from "@/types/transactions"
import { SpendCategory, SPEND_CATEGORIES } from "@/constants/categories"
import { useAppContext } from "@/context/AppContext"
import { useFinancialData } from "@/context/FinancialDataContext"
import { createManualTransaction } from "@/services/api"

type QuickAddKind = "expense" | "income" | "transfer"

const KIND_TO_TYPE: Record<QuickAddKind, TxType> = {
  expense: TxType.EXPENSE,
  income: TxType.INCOME,
  transfer: TxType.TRANSFER_OUT,
}

const generateQuickTxRef = () => {
  const timestamp = format(new Date(), "yyyyMMddHHmmss")
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `Q-${timestamp}-${random}`
}

interface QuickAddTransactionDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function QuickAddTransactionDialog({
  isOpen,
  onClose,
}: QuickAddTransactionDialogProps) {
  const { t, locale } = useI18n()
  const { entities, settings, exchangeRates, showToast } = useAppContext()
  const { positionsData, refreshData, invalidateTransactionsCache } =
    useFinancialData()

  const defaultCurrency = settings.general.defaultCurrency.toUpperCase()

  const [kind, setKind] = useState<QuickAddKind>("expense")
  const [entityId, setEntityId] = useState("")
  const [accountName, setAccountName] = useState("")
  const [amount, setAmount] = useState<number | null>(null)
  const [currency, setCurrency] = useState(defaultCurrency)
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"))
  const [note, setNote] = useState("")
  const [category, setCategory] = useState<SpendCategory | "">("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const accountEntities = useMemo(() => {
    return (entities ?? [])
      .filter(
        entity =>
          entity.type === EntityType.FINANCIAL_INSTITUTION ||
          entity.type === EntityType.CRYPTO_EXCHANGE,
      )
      .sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base" }))
  }, [entities, locale])

  const rawEntityAccounts = useMemo<Account[]>(() => {
    if (!entityId || !positionsData?.positions) return []
    const globalPositions = positionsData.positions[entityId] ?? []
    return globalPositions.flatMap(gp => {
      const container = gp.products?.[ProductType.ACCOUNT] as
        | { entries?: Account[] }
        | undefined
      return container?.entries ?? []
    })
  }, [entityId, positionsData])

  const entityAccounts = useMemo<Account[]>(
    () => rawEntityAccounts.filter(account => Boolean(account.name)),
    [rawEntityAccounts],
  )

  // Quick Add identifies accounts by name (the backend matches manual
  // transactions to an account by exact name), so accounts without a name
  // can't be targeted here even though they exist — distinguish that case
  // from "no accounts at all" so the message tells the user what to do.
  const hasUnnamedAccounts =
    rawEntityAccounts.length > 0 && entityAccounts.length === 0

  const handleEntityChange = (nextEntityId: string) => {
    setEntityId(nextEntityId)
    setAccountName("")
    if (nextEntityId && positionsData?.positions) {
      const globalPositions = positionsData.positions[nextEntityId] ?? []
      const accounts = globalPositions
        .flatMap(gp => {
          const container = gp.products?.[ProductType.ACCOUNT] as
            | { entries?: Account[] }
            | undefined
          return container?.entries ?? []
        })
        .filter(account => Boolean(account.name))
      if (accounts.length === 1) {
        setAccountName(accounts[0].name as string)
        setCurrency(accounts[0].currency.toUpperCase())
      }
    }
  }

  const handleAccountChange = (name: string) => {
    setAccountName(name)
    const account = entityAccounts.find(a => a.name === name)
    if (account) {
      setCurrency(account.currency.toUpperCase())
    }
  }

  const currencyOptions = useMemo(() => {
    const set = new Set<string>()
    set.add(defaultCurrency)
    Object.entries(exchangeRates || {}).forEach(([base, targets]) => {
      set.add(base.toUpperCase())
      Object.keys(targets).forEach(code => set.add(code.toUpperCase()))
    })
    return Array.from(set).sort()
  }, [defaultCurrency, exchangeRates])

  const resetForm = () => {
    setKind("expense")
    setEntityId("")
    setAccountName("")
    setAmount(null)
    setCurrency(defaultCurrency)
    setDate(format(new Date(), "yyyy-MM-dd"))
    setNote("")
    setCategory("")
    setErrors({})
  }

  const handleClose = () => {
    if (isSubmitting) return
    resetForm()
    onClose()
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!entityId) next.entityId = t.transactions.form.errors.required
    if (entityId && !accountName) {
      next.accountName = entityAccounts.length
        ? t.transactions.form.errors.required
        : hasUnnamedAccounts
          ? t.transactions.form.quickAdd.noNamedAccountsError
          : t.transactions.form.quickAdd.noAccountsError
    }
    if (amount == null || amount <= 0) {
      next.amount = t.transactions.form.errors.positive
    }
    if (kind !== "transfer" && !category) {
      next.category = t.transactions.form.quickAdd.categoryRequired
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!validate() || amount == null) return

    setIsSubmitting(true)
    try {
      const ref = generateQuickTxRef()
      const selectedCategory = kind === "transfer" ? undefined : category || undefined
      const fallbackName =
        kind !== "transfer" && selectedCategory
          ? t.enums.category[selectedCategory] || selectedCategory
          : t.transactions.form.quickAdd[`type${capitalize(kind)}` as
              | "typeExpense"
              | "typeIncome"
              | "typeTransfer"]

      const payload: ManualAccountTransactionPayload = {
        id: ref,
        ref,
        name: note.trim() || fallbackName,
        amount,
        currency,
        type: KIND_TO_TYPE[kind],
        date: new Date(date).toISOString(),
        entity_id: entityId,
        source: DataSource.MANUAL,
        product_type: ProductType.ACCOUNT,
        category: selectedCategory,
        account_name: accountName,
      }

      await createManualTransaction(payload)
      showToast(t.transactions.form.createSuccess, "success")
      invalidateTransactionsCache()
      await refreshData()
      resetForm()
      onClose()
    } catch (error) {
      console.error("Error creating quick transaction:", error)
      showToast(t.transactions.form.submitError, "error")
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
            className="w-full max-w-md"
          >
            <Card className="max-h-[calc(100vh-5rem)] flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <CardTitle className="text-xl">
                  {t.transactions.form.quickAdd.title}
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
                  <Tabs
                    value={kind}
                    onValueChange={value => setKind(value as QuickAddKind)}
                  >
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="expense">
                        {t.transactions.form.quickAdd.typeExpense}
                      </TabsTrigger>
                      <TabsTrigger value="income">
                        {t.transactions.form.quickAdd.typeIncome}
                      </TabsTrigger>
                      <TabsTrigger value="transfer">
                        {t.transactions.form.quickAdd.typeTransfer}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="space-y-1.5">
                    <Label>{t.transactions.form.quickAdd.amountLabel}</Label>
                    <div className="flex gap-2">
                      <DecimalInput
                        value={amount}
                        onValueChange={setAmount}
                        prefix={getCurrencySymbol(currency)}
                        placeholder="0.00"
                        className={cn(
                          "flex-1",
                          errors.amount && "border-red-500",
                        )}
                      />
                      <select
                        value={currency}
                        onChange={event => setCurrency(event.target.value)}
                        className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                      >
                        {currencyOptions.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.amount && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label>{t.transactions.form.quickAdd.institutionLabel}</Label>
                    <EntitySelector
                      entities={accountEntities}
                      selectedEntityIds={entityId ? [entityId] : []}
                      onSelectionChange={ids => handleEntityChange(ids[0] ?? "")}
                      singleSelect
                      placeholder={t.common.selectOptions}
                      className="max-w-none"
                    />
                    {errors.entityId && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {errors.entityId}
                      </p>
                    )}
                  </div>

                  {entityId && (
                    <div className="space-y-1.5">
                      <Label>{t.transactions.form.quickAdd.accountLabel}</Label>
                      {entityAccounts.length === 0 ? (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          {hasUnnamedAccounts
                            ? t.transactions.form.quickAdd.noNamedAccountsError
                            : t.transactions.form.quickAdd.noAccountsError}
                        </p>
                      ) : (
                        <select
                          value={accountName}
                          onChange={event => handleAccountChange(event.target.value)}
                          className={cn(
                            "h-10 w-full rounded-md border border-input bg-background px-2 text-sm",
                            errors.accountName && "border-red-500",
                          )}
                        >
                          <option value="" disabled>
                            {t.common.selectOptions}
                          </option>
                          {entityAccounts.map(account => (
                            <option key={account.id} value={account.name ?? ""}>
                              {account.name} ({account.currency})
                            </option>
                          ))}
                        </select>
                      )}
                      {errors.accountName && entityAccounts.length > 0 && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {errors.accountName}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label>{t.transactions.form.quickAdd.dateLabel}</Label>
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

                  {kind !== "transfer" && (
                    <div className="space-y-1.5">
                      <Label>{t.transactions.form.quickAdd.categoryLabel}</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {SPEND_CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setCategory(cat)}
                            className={cn(
                              "flex flex-col items-center justify-center gap-1 rounded-lg border p-2 text-xs transition-colors",
                              category === cat
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:bg-muted",
                            )}
                          >
                            {getCategoryIcon(cat, "h-4 w-4")}
                            <span className="truncate w-full text-center">
                              {t.enums.category[cat]}
                            </span>
                          </button>
                        ))}
                      </div>
                      {errors.category && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {errors.category}
                        </p>
                      )}
                    </div>
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
                    {t.transactions.form.quickAdd.submit}
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

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
