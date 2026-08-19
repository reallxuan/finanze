import { useMemo, useState } from "react"
import { Pencil, Plus, RefreshCw, Trash2 } from "lucide-react"
import { useAppContext } from "@/context/AppContext"
import { useFinancialData } from "@/context/FinancialDataContext"
import { useQuoteRefresh } from "@/hooks/useQuoteRefresh"
import { useI18n } from "@/i18n"
import {
  createManualEntity,
  deleteManualEntity,
  renameManualEntity,
} from "@/services/api"
import { EntityOrigin } from "@/types"
import { formatCurrency } from "@/lib/formatters"
import { getEntityDistribution } from "@/utils/financialDataUtils"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"

export default function ManualEntitiesPage() {
  const { t, locale } = useI18n()
  const {
    entities,
    settings,
    exchangeRates,
    fetchEntities,
    showToast,
    quoteRefreshStatus,
    lastQuoteUpdatedAt,
  } = useAppContext()
  const { positionsData, refreshData } = useFinancialData()
  const { refreshQuotes, isRefreshing } = useQuoteRefresh(refreshData)
  const [name, setName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const manualEntities = useMemo(
    () => (entities ?? []).filter(entity => entity.origin === EntityOrigin.MANUAL),
    [entities],
  )
  const distribution = useMemo(
    () =>
      getEntityDistribution(
        positionsData,
        settings.general.defaultCurrency,
        exchangeRates,
      ),
    [positionsData, settings.general.defaultCurrency, exchangeRates],
  )

  const positionCount = (entityId: string) => {
    const positions = positionsData?.positions?.[entityId] ?? []
    return positions.reduce((total, position) => {
      return (
        total +
        Object.values(position.products ?? {}).reduce((count, product: any) => {
          return count + (Array.isArray(product?.entries) ? product.entries.length : 0)
        }, 0)
      )
    }, 0)
  }

  const errorMessage = (error: any) => {
    const code = error?.code ?? error?.data?.code
    if (code === "ENTITY_NOT_EMPTY") {
      return t.manualEntities.notEmpty
    }
    if (code === "ENTITY_NAME_EXISTS") {
      return t.manualEntities.nameExists
    }
    return t.manualEntities.operationFailed
  }

  const addEntity = async () => {
    const normalized = name.trim()
    if (!normalized) return
    setIsSaving(true)
    try {
      await createManualEntity(normalized)
      setName("")
      await fetchEntities()
      showToast(t.manualEntities.created, "success")
    } catch (error) {
      showToast(errorMessage(error), "error")
    } finally {
      setIsSaving(false)
    }
  }

  const saveRename = async () => {
    if (!editingId || !editingName.trim()) return
    setIsSaving(true)
    try {
      await renameManualEntity(editingId, editingName.trim())
      setEditingId(null)
      await fetchEntities()
      showToast(t.manualEntities.renamed, "success")
    } catch (error) {
      showToast(errorMessage(error), "error")
    } finally {
      setIsSaving(false)
    }
  }

  const removeEntity = async (entityId: string) => {
    if (!window.confirm(t.manualEntities.deleteConfirm)) return
    setIsSaving(true)
    try {
      await deleteManualEntity(entityId)
      await fetchEntities()
      showToast(t.manualEntities.deleted, "success")
    } catch (error) {
      showToast(errorMessage(error), "error")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">{t.manualEntities.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t.manualEntities.description}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t.manualEntities.quoteStatus}: {quoteRefreshStatus === "refreshing" ? t.manualEntities.refreshing : quoteRefreshStatus === "error" ? t.manualEntities.refreshFailed : quoteRefreshStatus === "throttled" ? t.manualEntities.coolingDown : t.manualEntities.ready}
            {lastQuoteUpdatedAt ? ` · ${t.manualEntities.lastSuccessfulUpdate}: ${new Date(lastQuoteUpdatedAt).toLocaleString(locale)}` : ""}
          </p>
        </div>
        <Button variant="outline" onClick={refreshQuotes} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          {t.manualEntities.refreshQuotes}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.manualEntities.addTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={name}
            onChange={event => setName(event.target.value)}
            onKeyDown={event => {
              if (event.key === "Enter") void addEntity()
            }}
            placeholder={t.manualEntities.placeholder}
            maxLength={100}
          />
          <Button onClick={() => void addEntity()} disabled={isSaving || !name.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            {t.manualEntities.create}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {manualEntities.map(entity => {
          const value = distribution.find(item => item.id === entity.id)?.value ?? 0
          const count = positionCount(entity.id)
          const editing = editingId === entity.id
          return (
            <Card key={entity.id}>
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <div className="min-w-0 flex-1">
                  {editing ? (
                    <Input
                      value={editingName}
                      onChange={event => setEditingName(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === "Enter") void saveRename()
                      }}
                      autoFocus
                    />
                  ) : (
                    <h2 className="truncate text-lg font-semibold">{entity.name}</h2>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {count} {count === 1 ? t.manualEntities.position : t.manualEntities.positions} · {formatCurrency(value, locale, settings.general.defaultCurrency)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {editing ? (
                    <>
                      <Button size="sm" onClick={() => void saveRename()} disabled={isSaving}>
                        {t.manualEntities.save}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        {t.manualEntities.cancel}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={t.manualEntities.rename}
                        onClick={() => {
                          setEditingId(entity.id)
                          setEditingName(entity.name)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={t.manualEntities.delete}
                        onClick={() => void removeEntity(entity.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {manualEntities.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t.manualEntities.empty}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
