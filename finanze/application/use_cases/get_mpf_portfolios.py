from application.ports.mpf_port import MpfPort
from domain.dezimal import Dezimal
from domain.mpf import MpfHoldingFund, MpfPortfolioSummary
from domain.use_cases.get_mpf_portfolios import GetMpfPortfolios
from infrastructure.client.mpf.sun_life_mpf_client import SunLifeMpfClient


class GetMpfPortfoliosImpl(GetMpfPortfolios):
    def __init__(self, mpf_port: MpfPort, sun_life_mpf_client: SunLifeMpfClient):
        self._mpf_port = mpf_port
        self._client = sun_life_mpf_client

    async def execute(self) -> list[MpfPortfolioSummary]:
        portfolios = await self._mpf_port.get_portfolios()
        if not portfolios:
            return []

        schemes = {p.scheme for p in portfolios}
        quotes_by_scheme = {}
        for scheme in schemes:
            quotes = await self._client.get_latest_prices(scheme)
            quotes_by_scheme[scheme] = {q.fund_cd: q for q in quotes}

        summaries = []
        for portfolio in portfolios:
            holdings_units = await self._mpf_port.get_holdings_units(portfolio.id)
            quotes = quotes_by_scheme.get(portfolio.scheme, {})

            holdings = []
            total_market_value = Dezimal(0)
            for fund_cd, data in holdings_units.items():
                quote = quotes.get(fund_cd)
                nav = quote.nav if quote else Dezimal(0)
                market_value = data["units"] * nav
                total_market_value = total_market_value + market_value
                holdings.append(
                    MpfHoldingFund(
                        fund_cd=fund_cd,
                        fund_class=data["fund_class"],
                        description_en=data["description_en"],
                        description_zh=data["description_zh"],
                        units=data["units"],
                        nav=nav,
                        market_value=market_value,
                    )
                )

            contributions = await self._mpf_port.get_contributions(portfolio.id)
            total_contributed = sum(
                (c.total_amount for c in contributions), Dezimal(0)
            )

            summaries.append(
                MpfPortfolioSummary(
                    portfolio=portfolio,
                    holdings=holdings,
                    total_contributed=total_contributed,
                    total_market_value=total_market_value,
                )
            )
        return summaries
