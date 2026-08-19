import json
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from application.ports.mpf_port import MpfPort
from domain.dezimal import Dezimal
from domain.mpf import (
    MpfAllocationTarget,
    MpfContribution,
    MpfContributionLineItem,
    MpfPortfolio,
)
from infrastructure.repository.db.client import DBClient


def _serialize_allocation(target_allocation: list[MpfAllocationTarget]) -> str:
    return json.dumps(
        [
            {
                "fund_cd": t.fund_cd,
                "fund_class": t.fund_class,
                "description_en": t.description_en,
                "description_zh": t.description_zh,
                "percentage": str(t.percentage),
            }
            for t in target_allocation
        ]
    )


def _deserialize_allocation(raw: str) -> list[MpfAllocationTarget]:
    entries = json.loads(raw) if raw else []
    return [
        MpfAllocationTarget(
            fund_cd=e["fund_cd"],
            fund_class=e.get("fund_class") or "",
            description_en=e.get("description_en") or "",
            description_zh=e.get("description_zh") or "",
            percentage=Dezimal(e["percentage"]),
        )
        for e in entries
    ]


def _map_portfolio_row(row) -> MpfPortfolio:
    return MpfPortfolio(
        id=UUID(row["id"]),
        entity_id=UUID(row["entity_id"]),
        entity_name=row["entity_name"] if "entity_name" in row.keys() else None,
        name=row["name"],
        scheme=row["scheme"],
        currency=row["currency"],
        target_allocation=_deserialize_allocation(row["target_allocation"]),
        created_at=datetime.fromisoformat(row["created_at"]),
    )


class MpfSQLRepository(MpfPort):
    def __init__(self, client: DBClient):
        self._db_client = client

    async def save_portfolio(self, portfolio: MpfPortfolio):
        async with self._db_client.tx() as cursor:
            await cursor.execute(
                """
                INSERT INTO mpf_portfolios (id, entity_id, name, scheme, currency, target_allocation, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(portfolio.id),
                    str(portfolio.entity_id),
                    portfolio.name,
                    portfolio.scheme,
                    portfolio.currency,
                    _serialize_allocation(portfolio.target_allocation),
                    portfolio.created_at.isoformat(),
                ),
            )

    async def update_portfolio(
        self, portfolio_id: UUID, name: str, target_allocation: list[MpfAllocationTarget]
    ):
        async with self._db_client.tx() as cursor:
            await cursor.execute(
                "UPDATE mpf_portfolios SET name = ?, target_allocation = ? WHERE id = ?",
                (name, _serialize_allocation(target_allocation), str(portfolio_id)),
            )

    async def delete_portfolio(self, portfolio_id: UUID):
        async with self._db_client.tx() as cursor:
            await cursor.execute(
                "DELETE FROM mpf_portfolios WHERE id = ?", (str(portfolio_id),)
            )

    async def get_portfolios(self) -> list[MpfPortfolio]:
        async with self._db_client.read() as cursor:
            await cursor.execute(
                """
                SELECT p.*, e.name AS entity_name
                FROM mpf_portfolios p
                    JOIN entities e ON p.entity_id = e.id
                ORDER BY p.created_at ASC
                """
            )
            return [_map_portfolio_row(row) for row in await cursor.fetchall()]

    async def get_portfolio_by_id(
        self, portfolio_id: UUID
    ) -> Optional[MpfPortfolio]:
        async with self._db_client.read() as cursor:
            await cursor.execute(
                """
                SELECT p.*, e.name AS entity_name
                FROM mpf_portfolios p
                    JOIN entities e ON p.entity_id = e.id
                WHERE p.id = ?
                """,
                (str(portfolio_id),),
            )
            row = await cursor.fetchone()
            return _map_portfolio_row(row) if row else None

    async def save_contribution(self, contribution: MpfContribution):
        async with self._db_client.tx() as cursor:
            await cursor.execute(
                """
                INSERT INTO mpf_contributions (id, portfolio_id, date, total_amount, currency, note, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    str(contribution.id),
                    str(contribution.portfolio_id),
                    contribution.date.isoformat(),
                    str(contribution.total_amount),
                    contribution.currency,
                    contribution.note,
                    datetime.now().isoformat(),
                ),
            )
            for item in contribution.line_items:
                await cursor.execute(
                    """
                    INSERT INTO mpf_contribution_items
                        (id, contribution_id, fund_cd, fund_class, description_en, description_zh,
                         percentage, amount, nav, units)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(uuid4()),
                        str(contribution.id),
                        item.fund_cd,
                        item.fund_class,
                        item.description_en,
                        item.description_zh,
                        str(item.percentage),
                        str(item.amount),
                        str(item.nav),
                        str(item.units),
                    ),
                )

    async def delete_contribution(self, contribution_id: UUID):
        async with self._db_client.tx() as cursor:
            await cursor.execute(
                "DELETE FROM mpf_contributions WHERE id = ?", (str(contribution_id),)
            )

    async def get_contributions(self, portfolio_id: UUID) -> list[MpfContribution]:
        async with self._db_client.read() as cursor:
            await cursor.execute(
                """
                SELECT * FROM mpf_contributions
                WHERE portfolio_id = ?
                ORDER BY date DESC
                """,
                (str(portfolio_id),),
            )
            contribution_rows = await cursor.fetchall()

            contributions = []
            for row in contribution_rows:
                await cursor.execute(
                    "SELECT * FROM mpf_contribution_items WHERE contribution_id = ?",
                    (row["id"],),
                )
                item_rows = await cursor.fetchall()
                line_items = [
                    MpfContributionLineItem(
                        fund_cd=item["fund_cd"],
                        fund_class=item["fund_class"] or "",
                        description_en=item["description_en"] or "",
                        description_zh=item["description_zh"] or "",
                        percentage=Dezimal(item["percentage"]),
                        amount=Dezimal(item["amount"]),
                        nav=Dezimal(item["nav"]),
                        units=Dezimal(item["units"]),
                    )
                    for item in item_rows
                ]
                contributions.append(
                    MpfContribution(
                        id=UUID(row["id"]),
                        portfolio_id=UUID(row["portfolio_id"]),
                        date=datetime.fromisoformat(row["date"]),
                        total_amount=Dezimal(row["total_amount"]),
                        currency=row["currency"],
                        note=row["note"],
                        line_items=line_items,
                    )
                )
            return contributions

    async def get_holdings_units(self, portfolio_id: UUID) -> dict[str, dict]:
        async with self._db_client.read() as cursor:
            await cursor.execute(
                """
                SELECT i.fund_cd, i.fund_class, i.description_en, i.description_zh, i.units
                FROM mpf_contribution_items i
                    JOIN mpf_contributions c ON i.contribution_id = c.id
                WHERE c.portfolio_id = ?
                """,
                (str(portfolio_id),),
            )
            rows = await cursor.fetchall()

        holdings: dict[str, dict] = {}
        for row in rows:
            fund_cd = row["fund_cd"]
            entry = holdings.setdefault(
                fund_cd,
                {
                    "fund_class": row["fund_class"] or "",
                    "description_en": row["description_en"] or "",
                    "description_zh": row["description_zh"] or "",
                    "units": Dezimal(0),
                },
            )
            entry["units"] = entry["units"] + Dezimal(row["units"])
        return holdings
