from uuid import uuid4

from application.ports.mpf_port import MpfPort
from domain.dezimal import Dezimal
from domain.exception.exceptions import MpfPortfolioNotFound
from domain.mpf import (
    MpfContribution,
    MpfContributionLineItem,
    RecordMpfOpeningBalanceRequest,
)
from domain.use_cases.record_mpf_opening_balance import RecordMpfOpeningBalance


class RecordMpfOpeningBalanceImpl(RecordMpfOpeningBalance):
    def __init__(self, mpf_port: MpfPort):
        self._mpf_port = mpf_port

    async def execute(
        self, request: RecordMpfOpeningBalanceRequest
    ) -> MpfContribution:
        portfolio = await self._mpf_port.get_portfolio_by_id(request.portfolio_id)
        if portfolio is None:
            raise MpfPortfolioNotFound(request.portfolio_id)

        if not request.line_items:
            raise ValueError("At least one fund is required")

        targets_by_fund = {t.fund_cd: t for t in portfolio.target_allocation}
        missing = [
            item.fund_cd
            for item in request.line_items
            if item.fund_cd not in targets_by_fund
        ]
        if missing:
            raise ValueError(
                "Unknown fund(s) for this portfolio: " + ", ".join(missing)
            )

        for item in request.line_items:
            if item.amount <= 0:
                raise ValueError("Amount must be positive")
            if item.units <= 0:
                raise ValueError("Units must be positive")

        total_amount = sum((item.amount for item in request.line_items), Dezimal(0))

        line_items = []
        for item in request.line_items:
            target = targets_by_fund[item.fund_cd]
            line_items.append(
                MpfContributionLineItem(
                    fund_cd=target.fund_cd,
                    fund_class=target.fund_class,
                    description_en=target.description_en,
                    description_zh=target.description_zh,
                    percentage=item.amount * Dezimal(100) / total_amount,
                    amount=item.amount,
                    nav=item.amount / item.units,
                    units=item.units,
                )
            )

        contribution = MpfContribution(
            id=uuid4(),
            portfolio_id=request.portfolio_id,
            date=request.date,
            total_amount=total_amount,
            currency=portfolio.currency,
            note=request.note,
            line_items=line_items,
            is_opening_balance=True,
        )
        await self._mpf_port.save_contribution(contribution)
        return contribution
