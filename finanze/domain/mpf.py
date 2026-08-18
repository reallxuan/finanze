from datetime import date, datetime
from typing import Optional
from uuid import UUID

from domain.dezimal import Dezimal
from pydantic.dataclasses import dataclass


@dataclass(kw_only=True)
class MpfFundQuote:
    fund_cd: str
    fund_class: str
    description_en: str
    description_zh: str
    category: str
    nav: Dezimal
    valuation_date: date


@dataclass(kw_only=True)
class MpfAllocationTarget:
    fund_cd: str
    fund_class: str
    description_en: str
    description_zh: str
    percentage: Dezimal


@dataclass(kw_only=True)
class MpfPortfolio:
    id: UUID
    entity_id: UUID
    entity_name: Optional[str] = None
    name: str
    scheme: str
    currency: str
    target_allocation: list[MpfAllocationTarget]
    created_at: datetime


@dataclass(kw_only=True)
class MpfContributionLineItem:
    fund_cd: str
    fund_class: str
    description_en: str
    description_zh: str
    percentage: Dezimal
    amount: Dezimal
    nav: Dezimal
    units: Dezimal


@dataclass(kw_only=True)
class MpfContribution:
    id: UUID
    portfolio_id: UUID
    date: datetime
    total_amount: Dezimal
    currency: str
    note: Optional[str] = None
    line_items: list[MpfContributionLineItem]


@dataclass(kw_only=True)
class MpfHoldingFund:
    fund_cd: str
    fund_class: str
    description_en: str
    description_zh: str
    units: Dezimal
    nav: Dezimal
    market_value: Dezimal


@dataclass(kw_only=True)
class MpfPortfolioSummary:
    portfolio: MpfPortfolio
    holdings: list[MpfHoldingFund]
    total_contributed: Dezimal
    total_market_value: Dezimal


@dataclass(kw_only=True)
class CreateMpfPortfolioRequest:
    entity_id: UUID
    name: str
    scheme: str
    currency: str
    target_allocation: list[MpfAllocationTarget]


@dataclass(kw_only=True)
class UpdateMpfPortfolioRequest:
    id: UUID
    name: str
    target_allocation: list[MpfAllocationTarget]


@dataclass(kw_only=True)
class RecordMpfContributionRequest:
    portfolio_id: UUID
    date: datetime
    total_amount: Dezimal
    note: Optional[str] = None
