from uuid import UUID

from application.ports.mpf_port import MpfPort
from domain.exception.exceptions import MpfPortfolioNotFound
from domain.use_cases.delete_mpf_portfolio import DeleteMpfPortfolio


class DeleteMpfPortfolioImpl(DeleteMpfPortfolio):
    def __init__(self, mpf_port: MpfPort):
        self._mpf_port = mpf_port

    async def execute(self, portfolio_id: UUID):
        existing = await self._mpf_port.get_portfolio_by_id(portfolio_id)
        if existing is None:
            raise MpfPortfolioNotFound(portfolio_id)
        await self._mpf_port.delete_portfolio(portfolio_id)
