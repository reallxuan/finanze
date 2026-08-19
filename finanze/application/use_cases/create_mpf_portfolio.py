from datetime import datetime
from uuid import uuid4

from application.ports.entity_port import EntityPort
from application.ports.mpf_port import MpfPort
from domain.dezimal import Dezimal
from domain.exception.exceptions import EntityNotFound
from domain.mpf import CreateMpfPortfolioRequest, MpfPortfolio
from domain.use_cases.create_mpf_portfolio import CreateMpfPortfolio

ALLOCATION_TOLERANCE = Dezimal("0.01")


def _validate_allocation(target_allocation) -> None:
    if not target_allocation:
        raise ValueError("At least one fund allocation is required")
    total = sum((t.percentage for t in target_allocation), Dezimal(0))
    if abs(total - Dezimal(100)) > ALLOCATION_TOLERANCE:
        raise ValueError(
            f"Target allocation percentages must sum to 100, got {total}"
        )


class CreateMpfPortfolioImpl(CreateMpfPortfolio):
    def __init__(self, entity_port: EntityPort, mpf_port: MpfPort):
        self._entity_port = entity_port
        self._mpf_port = mpf_port

    async def execute(self, request: CreateMpfPortfolioRequest) -> MpfPortfolio:
        entity = await self._entity_port.get_by_id(request.entity_id)
        if entity is None:
            raise EntityNotFound(request.entity_id)

        _validate_allocation(request.target_allocation)

        portfolio = MpfPortfolio(
            id=uuid4(),
            entity_id=request.entity_id,
            entity_name=entity.name,
            name=request.name,
            scheme=request.scheme,
            currency=request.currency,
            target_allocation=request.target_allocation,
            created_at=datetime.now(),
        )
        await self._mpf_port.save_portfolio(portfolio)
        return portfolio
