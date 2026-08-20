import type { ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

interface MpfDialogShellProps {
  isOpen: boolean
  title: string
  onClose: () => void
  /** Blocks the close button while a submit is in flight. */
  closeDisabled?: boolean
  /** Tailwind max-width class for the dialog body. */
  maxWidthClassName?: string
  children: ReactNode
}

/**
 * Shared overlay/card chrome for the MPF dialogs, so animation timing, z-index,
 * scroll containment and the close affordance only exist in one place.
 */
export function MpfDialogShell({
  isOpen,
  title,
  onClose,
  closeDisabled = false,
  maxWidthClassName = "max-w-md",
  children,
}: MpfDialogShellProps) {
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
            className={`w-full ${maxWidthClassName}`}
          >
            <Card className="max-h-[calc(100vh-5rem)] flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <CardTitle className="text-xl">{title}</CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  disabled={closeDisabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              {children}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
