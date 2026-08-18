import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react"
import enTranslations from "./locales/en.json"
import zhTranslationsRaw from "./locales/zh.json"

export type Locale = "en-US" | "zh-CN"
export type Translations = typeof enTranslations

const mergeTranslations = (base: unknown, override: unknown): unknown => {
  if (
    base &&
    override &&
    typeof base === "object" &&
    typeof override === "object" &&
    !Array.isArray(base) &&
    !Array.isArray(override)
  ) {
    const baseRecord = base as Record<string, unknown>
    const overrideRecord = override as Record<string, unknown>
    const keys = new Set([
      ...Object.keys(baseRecord),
      ...Object.keys(overrideRecord),
    ])
    return Object.fromEntries(
      Array.from(keys).map(key => [
        key,
        mergeTranslations(baseRecord[key], overrideRecord[key]),
      ]),
    )
  }
  return override === undefined ? base : override
}

const translations: Record<Locale, Translations> = {
  "en-US": enTranslations,
  "zh-CN": mergeTranslations(
    enTranslations,
    zhTranslationsRaw,
  ) as Translations,
}

const VALID_LOCALES: Locale[] = ["en-US", "zh-CN"]

interface I18nContextType {
  locale: Locale
  t: Translations
  changeLocale: (newLocale: Locale) => void
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en-US")
  const [t, setT] = useState<Translations>(translations[locale])

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    setT(translations[newLocale])
    localStorage.setItem("locale", newLocale)
  }

  useEffect(() => {
    const savedLocale = localStorage.getItem("locale") as Locale
    if (savedLocale && VALID_LOCALES.includes(savedLocale)) {
      setLocale(savedLocale)
      setT(translations[savedLocale])
    }
  }, [])

  return (
    <I18nContext.Provider value={{ locale, t, changeLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}
