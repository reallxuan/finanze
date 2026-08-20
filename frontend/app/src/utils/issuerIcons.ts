const KNOWN_ISSUER_ICONS: Record<string, string> = {
  Allianz: "allianz",
  Amundi: "amundi",
  Andbank: "andbank",
  Apollo: "apollo",
  Ark: "ark",
  AXA: "axa",
  BBVA: "bbva",
  Bitwise: "bitwise",
  BlackRock: "blackrock",
  "BNP Paribas": "bnpparibas",
  Caser: "caser",
  CBNK: "cbnk",
  Crescenta: "crescenta",
  DWS: "dws",
  EQT: "eqt",
  Fidelity: "fidelity",
  "First Trust": "firsttrust",
  "Franklin Templeton": "franklintempleton",
  Generali: "generali",
  "Global X": "globalx",
  Goldman: "goldman",
  HANetf: "hanetf",
  HSBC: "hsbc",
  ING: "ing",
  Invesco: "invesco",
  "JP Morgan": "jpmorgan",
  "Legal & General": "legalgeneral",
  "Morgan Stanley": "morganstanley",
  MyInvestor: "myinvestor",
  PIMCO: "pimco",
  Robeco: "robeco",
  "State Street": "statestreet",
  UBS: "ubs",
  VanEck: "vaneck",
  Vanguard: "vanguard",
  Vontobel: "vontobel",
  WisdomTree: "wisdomtree",
  Xtrackers: "xtrackers",
}

export function getIssuerIconPath(
  issuer: string | null | undefined,
): string | null {
  if (!issuer) return null
  const iconName = KNOWN_ISSUER_ICONS[issuer]
  if (!iconName) return null
  return `icons/issuers/${iconName}.png`
}

// Deliberately still defaults to the upstream finanze.me icon CDN — see the
// "Ticker icons" note in README.md for why this one wasn't self-hosted.
const TICKER_ICON_BASE_URL =
  (import.meta.env.VITE_TICKER_ICON_BASE_URL as string | undefined) ||
  "https://static.finanze.me/icons/ticker"

export function getTickerIconUrl(token: string | null | undefined): string | null {
  const trimmed = token?.trim()
  if (!trimmed) return null
  return `${TICKER_ICON_BASE_URL}/${encodeURIComponent(trimmed)}.png`
}
