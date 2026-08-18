from application.ports.entity_port import EntityPort
from application.ports.transaction_port import TransactionPort
from domain.dezimal import Dezimal
from domain.transactions import (
    CategorySpend,
    CurrencyAmount,
    MonthlySpend,
    SpendingSummaryRequest,
    SpendingSummaryResult,
)
from domain.use_cases.get_spending_summary import GetSpendingSummary


class GetSpendingSummaryImpl(GetSpendingSummary):
    def __init__(self, transaction_port: TransactionPort, entity_port: EntityPort):
        self._transaction_port = transaction_port
        self._entity_port = entity_port

    async def execute(self, query: SpendingSummaryRequest) -> SpendingSummaryResult:
        excluded_entities = [
            e.id for e in await self._entity_port.get_disabled_entities()
        ]

        rows = await self._transaction_port.get_account_tx_summary_rows(
            from_date=query.from_date,
            to_date=query.to_date,
            excluded_entities=excluded_entities,
        )

        by_category: dict[tuple[str, str], Dezimal] = {}
        by_month: dict[tuple[str, str], dict[str, Dezimal]] = {}
        total_expense: dict[str, Dezimal] = {}
        total_income: dict[str, Dezimal] = {}

        for row in rows:
            amount: Dezimal = row["amount"]
            currency: str = row["currency"]
            tx_type: str = row["type"]
            category = row["category"]
            month = row["month"]

            if tx_type == "EXPENSE":
                total_expense[currency] = total_expense.get(currency, Dezimal(0)) + amount
                if category:
                    key = (category, currency)
                    by_category[key] = by_category.get(key, Dezimal(0)) + amount
            elif tx_type == "INCOME":
                total_income[currency] = total_income.get(currency, Dezimal(0)) + amount

            month_key = (month, currency)
            month_entry = by_month.setdefault(
                month_key, {"expense": Dezimal(0), "income": Dezimal(0)}
            )
            if tx_type == "EXPENSE":
                month_entry["expense"] += amount
            elif tx_type == "INCOME":
                month_entry["income"] += amount

        return SpendingSummaryResult(
            by_category=[
                CategorySpend(category=category, amount=amount, currency=currency)
                for (category, currency), amount in sorted(by_category.items())
            ],
            by_month=[
                MonthlySpend(
                    month=month,
                    expense=totals["expense"],
                    income=totals["income"],
                    currency=currency,
                )
                for (month, currency), totals in sorted(by_month.items())
            ],
            total_expense=[
                CurrencyAmount(amount=amount, currency=currency)
                for currency, amount in sorted(total_expense.items())
            ],
            total_income=[
                CurrencyAmount(amount=amount, currency=currency)
                for currency, amount in sorted(total_income.items())
            ],
        )
