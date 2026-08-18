export interface MpfFundQuote {
  fund_cd: string
  fund_class: string
  description_en: string
  description_zh: string
  category: string
  nav: number
  valuation_date: string
}

export interface MpfAllocationTarget {
  fund_cd: string
  fund_class: string
  description_en: string
  description_zh: string
  percentage: number
}

export interface MpfPortfolio {
  id: string
  entity_id: string
  entity_name?: string
  name: string
  scheme: string
  currency: string
  target_allocation: MpfAllocationTarget[]
  created_at: string
}

export interface MpfContributionLineItem {
  fund_cd: string
  fund_class: string
  description_en: string
  description_zh: string
  percentage: number
  amount: number
  nav: number
  units: number
}

export interface MpfContribution {
  id: string
  portfolio_id: string
  date: string
  total_amount: number
  currency: string
  note?: string
  line_items: MpfContributionLineItem[]
}

export interface MpfHoldingFund {
  fund_cd: string
  fund_class: string
  description_en: string
  description_zh: string
  units: number
  nav: number
  market_value: number
}

export interface MpfPortfolioSummary {
  portfolio: MpfPortfolio
  holdings: MpfHoldingFund[]
  total_contributed: number
  total_market_value: number
}

export interface CreateMpfPortfolioPayload {
  entity_id: string
  name: string
  scheme: string
  currency: string
  target_allocation: MpfAllocationTarget[]
}

export interface UpdateMpfPortfolioPayload {
  name: string
  target_allocation: MpfAllocationTarget[]
}

export interface RecordMpfContributionPayload {
  date: string
  total_amount: number
  note?: string
}
