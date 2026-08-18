from uuid import UUID

from application.ports.mpf_port import MpfPort
from domain.exception.exceptions import MpfPortfolioNotFound
from domain.mpf import MpfContribution
from domain.use_cases.get_mpf_contributions import GetMpfContributions


class GetMpfContributionsImpl(GetMpfContributions):
    def __init__(self, mpf_port: MpfPort):
        self._mpf_port = mpf_port

    async def execute(self, portfolio_id: UUID) -> list[MpfContribution]:
        portfolio = await self._mpf_port.get_portfolio_by_id(portfolio_id)
        if portfolio is None:
            raise MpfPortfolioNotFound(portfolio_id)
        return await self._mpf_port.get_contributions(portfolio_id)
