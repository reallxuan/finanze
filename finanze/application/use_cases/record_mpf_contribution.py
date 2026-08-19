from uuid import uuid4

from application.ports.mpf_port import MpfPort
from domain.dezimal import Dezimal
from domain.exception.exceptions import MpfPortfolioNotFound
from domain.mpf import (
    MpfContribution,
    MpfContributionLineItem,
    RecordMpfContributionRequest,
)
from domain.use_cases.record_mpf_contribution import RecordMpfContribution
from infrastructure.client.mpf.sun_life_mpf_client import SunLifeMpfClient


class RecordMpfContributionImpl(RecordMpfContribution):
    def __init__(self, mpf_port: MpfPort, sun_life_mpf_client: SunLifeMpfClient):
        self._mpf_port = mpf_port
        self._client = sun_life_mpf_client

    async def execute(
        self, request: RecordMpfContributionRequest
    ) -> MpfContribution:
        portfolio = await self._mpf_port.get_portfolio_by_id(request.portfolio_id)
        if portfolio is None:
            raise MpfPortfolioNotFound(request.portfolio_id)

        if request.total_amount <= 0:
            raise ValueError("Contribution amount must be positive")

        quotes = await self._client.get_latest_prices(portfolio.scheme)
        quotes_by_fund = {q.fund_cd: q for q in quotes}

        missing = [
            target.fund_cd
            for target in portfolio.target_allocation
            if target.fund_cd not in quotes_by_fund
        ]
        if missing:
            raise ValueError(
                "Unable to fetch current NAV for fund(s): "
                + ", ".join(missing)
                + ". Please try again later."
            )

        line_items = []
        for target in portfolio.target_allocation:
            quote = quotes_by_fund[target.fund_cd]
            amount = request.total_amount * target.percentage / Dezimal(100)
            units = amount / quote.nav
            line_items.append(
                MpfContributionLineItem(
                    fund_cd=target.fund_cd,
                    fund_class=target.fund_class,
                    description_en=target.description_en,
                    description_zh=target.description_zh,
                    percentage=target.percentage,
                    amount=amount,
                    nav=quote.nav,
                    units=units,
                )
            )

        contribution = MpfContribution(
            id=uuid4(),
            portfolio_id=request.portfolio_id,
            date=request.date,
            total_amount=request.total_amount,
            currency=portfolio.currency,
            note=request.note,
            line_items=line_items,
        )
        await self._mpf_port.save_contribution(contribution)
        return contribution
