from application.ports.mpf_port import MpfPort
from domain.exception.exceptions import MpfPortfolioNotFound
from domain.mpf import UpdateMpfPortfolioRequest
from domain.use_cases.update_mpf_portfolio import UpdateMpfPortfolio

from application.use_cases.create_mpf_portfolio import _validate_allocation


class UpdateMpfPortfolioImpl(UpdateMpfPortfolio):
    def __init__(self, mpf_port: MpfPort):
        self._mpf_port = mpf_port

    async def execute(self, request: UpdateMpfPortfolioRequest):
        existing = await self._mpf_port.get_portfolio_by_id(request.id)
        if existing is None:
            raise MpfPortfolioNotFound(request.id)

        _validate_allocation(request.target_allocation)

        await self._mpf_port.update_portfolio(
            request.id, request.name, request.target_allocation
        )
