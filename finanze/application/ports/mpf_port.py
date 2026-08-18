import abc
from typing import Optional
from uuid import UUID

from domain.mpf import MpfContribution, MpfPortfolio


class MpfPort(metaclass=abc.ABCMeta):
    @abc.abstractmethod
    async def save_portfolio(self, portfolio: MpfPortfolio):
        raise NotImplementedError

    @abc.abstractmethod
    async def update_portfolio(
        self, portfolio_id: UUID, name: str, target_allocation
    ):
        raise NotImplementedError

    @abc.abstractmethod
    async def delete_portfolio(self, portfolio_id: UUID):
        raise NotImplementedError

    @abc.abstractmethod
    async def get_portfolios(self) -> list[MpfPortfolio]:
        raise NotImplementedError

    @abc.abstractmethod
    async def get_portfolio_by_id(
        self, portfolio_id: UUID
    ) -> Optional[MpfPortfolio]:
        raise NotImplementedError

    @abc.abstractmethod
    async def save_contribution(self, contribution: MpfContribution):
        raise NotImplementedError

    @abc.abstractmethod
    async def delete_contribution(self, contribution_id: UUID):
        raise NotImplementedError

    @abc.abstractmethod
    async def get_contributions(
        self, portfolio_id: UUID
    ) -> list[MpfContribution]:
        raise NotImplementedError

    @abc.abstractmethod
    async def get_holdings_units(self, portfolio_id: UUID) -> dict[str, dict]:
        """Returns {fund_cd: {"fund_class", "description_en", "description_zh", "units": Dezimal}}
        aggregated across all contributions for the portfolio."""
        raise NotImplementedError
