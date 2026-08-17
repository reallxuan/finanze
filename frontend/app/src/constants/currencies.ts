export const DEFAULT_MAIN_CURRENCY = "HKD"

export const MAIN_CURRENCY_OPTIONS = [
  { value: "HKD", label: "HKD - Hong Kong Dollar" },
  { value: "USD", label: "USD - US Dollar" },
] as const

export const normalizeMainCurrency = (value?: string | null) =>
  value?.toUpperCase() === "USD" ? "USD" : DEFAULT_MAIN_CURRENCY
