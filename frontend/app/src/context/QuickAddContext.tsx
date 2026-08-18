import { createContext, useCallback, useContext, useState } from "react"
import type { ReactNode } from "react"
import { QuickAddTransactionDialog } from "@/components/transactions/QuickAddTransactionDialog"

interface QuickAddContextValue {
  openQuickAdd: () => void
}

const QuickAddContext = createContext<QuickAddContextValue | undefined>(
  undefined,
)

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openQuickAdd = useCallback(() => setIsOpen(true), [])
  const closeQuickAdd = useCallback(() => setIsOpen(false), [])

  return (
    <QuickAddContext.Provider value={{ openQuickAdd }}>
      {children}
      <QuickAddTransactionDialog isOpen={isOpen} onClose={closeQuickAdd} />
    </QuickAddContext.Provider>
  )
}

export function useQuickAdd() {
  const context = useContext(QuickAddContext)
  if (!context) {
    throw new Error("useQuickAdd must be used within a QuickAddProvider")
  }
  return context
}
