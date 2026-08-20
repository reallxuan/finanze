import { useEffect, useState } from "react"
import { ArrowLeft, Landmark, Pencil, Plus, Trash2, X } from "lucide-react"
import { useI18n } from "@/i18n"
import { useAppContext } from "@/context/AppContext"
import { Button } from "@/components/ui/Button"
import { Card, CardContent } from "@/components/ui/Card"
import { LoadingSpinner } from "@/components/ui/LoadingSpinner"
import { Sensitive } from "@/components/ui/Sensitive"
import { formatCurrency } from "@/lib/formatters"
import {
  getMpfFundQuotes,
  getMpfContributions,
  updateMpfPortfolio,
  deleteMpfPortfolio,
  deleteMpfContribution,
} from "@/services/api"
import { useFinancialData } from "@/context/FinancialDataContext"
import type {
  MpfContribution,
  MpfFundQuote,
  MpfPortfolioSummary,
} from "@/types/mpf"
import { CreateMpfPortfolioDialog } from "@/components/mpf/CreateMpfPortfolioDialog"
import { RecordMpfContributionDialog } from "@/components/mpf/RecordMpfContributionDialog"
import { RecordMpfOpeningBalanceDialog } from "@/components/mpf/RecordMpfOpeningBalanceDialog"
import { MpfAllocationEditor } from "@/components/mpf/MpfAllocationEditor"

export default function MpfPage() {
  const { t, locale } = useI18n()
  const { showToast } = useAppContext()

  // MPF summaries live in FinancialDataContext so the dashboard rollup and this
  // page share one fetch, and mutations here invalidate the dashboard's copy.
  const { mpfSummaries, ensureMpfSummaries, refreshMpfSummaries } =
    useFinancialData()
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [contributions, setContributions] = useState<MpfContribution[]>([])
  const [loadingContributions, setLoadingContributions] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isContributeOpen, setIsContributeOpen] = useState(false)
  const [isOpeningBalanceOpen, setIsOpeningBalanceOpen] = useState(false)
  const [isEditingAllocation, setIsEditingAllocation] = useState(false)
  const [editAllocation, setEditAllocation] = useState(
    [] as MpfPortfolioSummary["portfolio"]["target_allocation"],
  )
  const [funds, setFunds] = useState<MpfFundQuote[]>([])

  const loadPortfolios = async () => {
    setLoading(true)
    try {
      if (!(await refreshMpfSummaries())) {
        showToast(t.common.unexpectedError, "error")
      }
    } finally {
      setHasLoadedOnce(true)
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    ensureMpfSummaries().then(ok => {
      if (cancelled) return
      if (!ok) showToast(t.common.unexpectedError, "error")
      setHasLoadedOnce(true)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [ensureMpfSummaries])

  const summaries = hasLoadedOnce ? mpfSummaries : null
  const selected = summaries?.find(s => s.portfolio.id === selectedId) ?? null

  const loadContributions = async (portfolioId: string) => {
    setLoadingContributions(true)
    try {
      const result = await getMpfContributions(portfolioId)
      setContributions(result.contributions)
    } catch (error) {
      console.error("Error loading MPF contributions:", error)
    } finally {
      setLoadingContributions(false)
    }
  }

  const openPortfolio = (portfolioId: string) => {
    setSelectedId(portfolioId)
    setIsEditingAllocation(false)
    loadContributions(portfolioId)
  }

  const backToList = () => {
    setSelectedId(null)
    setContributions([])
    setIsEditingAllocation(false)
  }

  const startEditAllocation = () => {
    if (!selected) return
    setEditAllocation(selected.portfolio.target_allocation)
    setIsEditingAllocation(true)
    if (funds.length === 0) {
      getMpfFundQuotes(selected.portfolio.scheme)
        .then(result => setFunds(result.quotes))
        .catch(() => setFunds([]))
    }
  }

  const saveAllocation = async () => {
    if (!selected) return
    const total = editAllocation.reduce((sum, a) => sum + (a.percentage || 0), 0)
    if (editAllocation.length === 0 || Math.abs(total - 100) > 0.01) {
      showToast(t.mpf.allocation.mustSumTo100, "error")
      return
    }
    try {
      await updateMpfPortfolio(selected.portfolio.id, {
        name: selected.portfolio.name,
        target_allocation: editAllocation,
      })
      showToast(t.mpf.allocation.updateSuccess, "success")
      setIsEditingAllocation(false)
      await loadPortfolios()
    } catch (error) {
      console.error("Error updating MPF allocation:", error)
      showToast(t.mpf.allocation.updateError, "error")
    }
  }

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (!window.confirm(t.mpf.deletePortfolioConfirm)) return
    try {
      await deleteMpfPortfolio(portfolioId)
      showToast(t.mpf.deletePortfolioSuccess, "success")
      backToList()
      await loadPortfolios()
    } catch (error) {
      console.error("Error deleting MPF portfolio:", error)
      showToast(t.mpf.deletePortfolioError, "error")
    }
  }

  const handleDeleteContribution = async (contributionId: string) => {
    if (!window.confirm(t.mpf.contribution.deleteConfirm)) return
    try {
      await deleteMpfContribution(contributionId)
      showToast(t.mpf.contribution.deleteSuccess, "success")
      await loadPortfolios()
      if (selectedId) await loadContributions(selectedId)
    } catch (error) {
      console.error("Error deleting MPF contribution:", error)
      showToast(t.mpf.contribution.deleteError, "error")
    }
  }

  if (loading && !summaries) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner />
      </div>
    )
  }

  if (selected) {
    const gain =
      selected.total_market_value - selected.total_contributed

    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={backToList}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold flex-1 truncate">
            {selected.portfolio.name}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeletePortfolio(selected.portfolio.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">
                {t.mpf.detail.totalContributed}
              </p>
              <p className="text-lg font-semibold">
                <Sensitive>
                  {formatCurrency(
                    selected.total_contributed,
                    locale,
                    selected.portfolio.currency,
                  )}
                </Sensitive>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">
                {t.mpf.detail.marketValue}
              </p>
              <p className="text-lg font-semibold">
                <Sensitive>
                  {formatCurrency(
                    selected.total_market_value,
                    locale,
                    selected.portfolio.currency,
                  )}
                </Sensitive>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">
                {t.mpf.detail.gainLoss}
              </p>
              <p
                className={`text-lg font-semibold ${gain >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
              >
                <Sensitive>
                  {gain >= 0 ? "+" : ""}
                  {formatCurrency(gain, locale, selected.portfolio.currency)}
                </Sensitive>
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <h3 className="font-semibold">{t.mpf.detail.holdingsTitle}</h3>
            {selected.holdings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.mpf.detail.noHoldings}
              </p>
            ) : (
              <div className="space-y-2">
                {selected.holdings.map(holding => (
                  <div
                    key={holding.fund_cd}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {locale.startsWith("zh")
                          ? holding.description_zh
                          : holding.description_en}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {holding.units.toFixed(2)} {t.mpf.detail.units} ·{" "}
                        {t.mpf.detail.nav} {holding.nav.toFixed(4)}
                      </p>
                    </div>
                    <p className="shrink-0 font-medium">
                      <Sensitive>
                        {formatCurrency(
                          holding.market_value,
                          locale,
                          selected.portfolio.currency,
                        )}
                      </Sensitive>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{t.mpf.allocation.title}</h3>
              {!isEditingAllocation && (
                <Button variant="ghost" size="sm" onClick={startEditAllocation}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  {t.common.edit}
                </Button>
              )}
            </div>
            {isEditingAllocation ? (
              <div className="space-y-3">
                <MpfAllocationEditor
                  availableFunds={funds}
                  value={editAllocation}
                  onChange={setEditAllocation}
                  locale={locale}
                />
                <p className="text-xs text-muted-foreground">
                  {t.mpf.allocation.futureOnlyNote}
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingAllocation(false)}
                  >
                    {t.common.cancel}
                  </Button>
                  <Button size="sm" onClick={saveAllocation}>
                    {t.common.save}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {selected.portfolio.target_allocation.map(target => (
                  <div
                    key={target.fund_cd}
                    className="flex justify-between text-sm"
                  >
                    <span className="truncate">
                      {locale.startsWith("zh")
                        ? target.description_zh
                        : target.description_en}
                    </span>
                    <span className="shrink-0 ml-2 text-muted-foreground">
                      {target.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{t.mpf.contribution.history}</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpeningBalanceOpen(true)}
                >
                  {t.mpf.openingBalance.addButton}
                </Button>
                <Button size="sm" onClick={() => setIsContributeOpen(true)}>
                  <Plus className="mr-2 h-3.5 w-3.5" />
                  {t.mpf.contribution.recordButton}
                </Button>
              </div>
            </div>
            {loadingContributions ? (
              <LoadingSpinner />
            ) : contributions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.mpf.contribution.noHistory}
              </p>
            ) : (
              <div className="space-y-3">
                {contributions.map(contribution => (
                  <div
                    key={contribution.id}
                    className="rounded-md border border-border p-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {new Date(contribution.date).toLocaleDateString(
                              locale,
                            )}
                          </p>
                          {contribution.is_opening_balance && (
                            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {t.mpf.openingBalance.historyBadge}
                            </span>
                          )}
                        </div>
                        {contribution.note && (
                          <p className="text-xs text-muted-foreground">
                            {contribution.note}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          <Sensitive>
                            {formatCurrency(
                              contribution.total_amount,
                              locale,
                              contribution.currency,
                            )}
                          </Sensitive>
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDeleteContribution(contribution.id)
                          }
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 space-y-0.5">
                      {contribution.line_items.map(item => (
                        <div
                          key={item.fund_cd}
                          className="flex justify-between text-xs text-muted-foreground"
                        >
                          <span className="truncate">
                            {locale.startsWith("zh")
                              ? item.description_zh
                              : item.description_en}{" "}
                            ({item.percentage}%)
                          </span>
                          <span className="shrink-0 ml-2">
                            {item.units.toFixed(2)} {t.mpf.detail.units}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <RecordMpfContributionDialog
          isOpen={isContributeOpen}
          portfolio={selected.portfolio}
          onClose={() => setIsContributeOpen(false)}
          onRecorded={() => {
            loadPortfolios()
            if (selectedId) loadContributions(selectedId)
          }}
        />

        <RecordMpfOpeningBalanceDialog
          isOpen={isOpeningBalanceOpen}
          portfolio={selected.portfolio}
          onClose={() => setIsOpeningBalanceOpen(false)}
          onRecorded={() => {
            loadPortfolios()
            if (selectedId) loadContributions(selectedId)
          }}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.mpf.title}</h1>
          <p className="text-sm text-muted-foreground">{t.mpf.subtitle}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t.mpf.newPortfolio}
        </Button>
      </div>

      {!summaries || summaries.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center space-y-2">
            <Landmark className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t.mpf.empty}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {summaries.map(summary => {
            const gain =
              summary.total_market_value - summary.total_contributed
            return (
              <Card
                key={summary.portfolio.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => openPortfolio(summary.portfolio.id)}
              >
                <CardContent className="pt-6 space-y-2">
                  <div>
                    <h3 className="font-semibold truncate">
                      {summary.portfolio.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {summary.portfolio.entity_name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t.mpf.detail.marketValue}
                      </p>
                      <p className="font-semibold">
                        <Sensitive>
                          {formatCurrency(
                            summary.total_market_value,
                            locale,
                            summary.portfolio.currency,
                          )}
                        </Sensitive>
                      </p>
                    </div>
                    <p
                      className={`text-sm font-medium ${gain >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      <Sensitive>
                        {gain >= 0 ? "+" : ""}
                        {formatCurrency(
                          gain,
                          locale,
                          summary.portfolio.currency,
                        )}
                      </Sensitive>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <CreateMpfPortfolioDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={loadPortfolios}
      />
    </div>
  )
}
