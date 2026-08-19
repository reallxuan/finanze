from domain.use_cases.add_manual_transaction import AddManualTransaction
from domain.use_cases.calculate_loan import CalculateLoan
from domain.use_cases.calculate_savings import CalculateSavings
from domain.use_cases.change_user_password import ChangeUserPassword
from domain.use_cases.create_real_estate import CreateRealEstate
from domain.use_cases.create_template import CreateTemplate
from domain.use_cases.delete_manual_transaction import DeleteManualTransaction
from domain.use_cases.delete_periodic_flow import DeletePeriodicFlow
from domain.use_cases.delete_real_estate import DeleteRealEstate
from domain.use_cases.delete_template import DeleteTemplate
from domain.use_cases.export_file import ExportFile
from domain.use_cases.export_sheets import ExportSheets
from domain.use_cases.forecast import Forecast
from domain.use_cases.get_available_entities import GetAvailableEntities
from domain.use_cases.get_backup_settings import GetBackupSettings
from domain.use_cases.get_backups import GetBackups
from domain.use_cases.get_cloud_auth import GetCloudAuth
from domain.use_cases.get_contributions import GetContributions
from domain.use_cases.get_crypto_asset_details import GetCryptoAssetDetails
from domain.use_cases.get_euribor_rates import GetEuriborRates
from domain.use_cases.get_exchange_rates import GetExchangeRates
from domain.use_cases.get_historic import GetHistoric
from domain.use_cases.get_networth_timeline import GetNetworthTimeline
from domain.use_cases.get_instrument_history import GetInstrumentHistory
from domain.use_cases.get_instrument_info import GetInstrumentInfo
from domain.use_cases.get_instruments import GetInstruments
from domain.use_cases.get_money_events import GetMoneyEvents
from domain.use_cases.partial_amortize_manual_investment import (
    PartialAmortizeManualInvestment,
)
from domain.use_cases.settle_manual_investment import SettleManualInvestment
from domain.use_cases.unsettle_manual_investment import (
    UnsettleManualInvestment,
)
from domain.use_cases.delete_manual_historic_entry import DeleteManualHistoricEntry
from domain.use_cases.query_pending_flows import QueryPendingFlows
from domain.use_cases.get_periodic_flows import GetPeriodicFlows
from domain.use_cases.get_position import GetPosition
from domain.use_cases.get_account_ledger import GetAccountLedger
from domain.use_cases.get_mpf_fund_quotes import GetMpfFundQuotes
from domain.use_cases.create_mpf_portfolio import CreateMpfPortfolio
from domain.use_cases.update_mpf_portfolio import UpdateMpfPortfolio
from domain.use_cases.delete_mpf_portfolio import DeleteMpfPortfolio
from domain.use_cases.get_mpf_portfolios import GetMpfPortfolios
from domain.use_cases.record_mpf_contribution import RecordMpfContribution
from domain.use_cases.delete_mpf_contribution import DeleteMpfContribution
from domain.use_cases.get_mpf_contributions import GetMpfContributions
from domain.use_cases.get_settings import GetSettings
from domain.use_cases.get_spending_summary import GetSpendingSummary
from domain.use_cases.get_status import GetStatus
from domain.use_cases.get_template_fields import GetTemplateFields
from domain.use_cases.get_templates import GetTemplates
from domain.use_cases.get_transactions import GetTransactions
from domain.use_cases.handle_cloud_auth import HandleCloudAuth
from domain.use_cases.import_backup import ImportBackup
from domain.use_cases.import_file import ImportFile
from domain.use_cases.import_sheets import ImportSheets
from domain.use_cases.list_real_estate import ListRealEstate
from domain.use_cases.register_user import RegisterUser
from domain.use_cases.save_backup_settings import SaveBackupSettings
from domain.use_cases.save_commodities import SaveCommodities
from domain.use_cases.save_pending_flow import SavePendingFlow
from domain.use_cases.update_pending_flow import UpdatePendingFlow
from domain.use_cases.delete_pending_flow import DeletePendingFlow
from domain.use_cases.settle_pending_flow import SettlePendingFlow
from domain.use_cases.save_periodic_flow import SavePeriodicFlow
from domain.use_cases.search_crypto_assets import SearchCryptoAssets
from domain.use_cases.update_contributions import UpdateContributions
from domain.use_cases.update_manual_transaction import UpdateManualTransaction
from domain.use_cases.update_periodic_flow import UpdatePeriodicFlow
from domain.use_cases.update_position import UpdatePosition
from domain.use_cases.update_real_estate import UpdateRealEstate
from domain.use_cases.update_settings import UpdateSettings
from domain.use_cases.update_template import UpdateTemplate
from domain.use_cases.update_tracked_quotes import UpdateTrackedQuotes
from domain.use_cases.update_tracked_loans import UpdateTrackedLoans
from domain.use_cases.upload_backup import UploadBackup
from domain.use_cases.user_login import UserLogin
from domain.use_cases.user_logout import UserLogout
from infrastructure.controller.config import QuartApp
from infrastructure.controller.routes.add_manual_transaction import (
    add_manual_transaction,
)
from infrastructure.controller.routes.calculate_loan import calculate_loan
from infrastructure.controller.routes.calculate_savings import calculate_savings
from infrastructure.controller.routes.change_user_password import change_user_password
from infrastructure.controller.routes.contributions import contributions
from infrastructure.controller.routes.create_real_estate import create_real_estate
from infrastructure.controller.routes.create_template import create_template
from infrastructure.controller.routes.delete_manual_transaction import (
    delete_manual_transaction,
)
from infrastructure.controller.routes.settle_manual_investment import (
    settle_manual_investment,
)
from infrastructure.controller.routes.partial_amortize_manual_investment import (
    partial_amortize_manual_investment,
)
from infrastructure.controller.routes.unsettle_manual_investment import (
    unsettle_manual_investment,
)
from infrastructure.controller.routes.delete_manual_historic_entry import (
    delete_manual_historic_entry,
)
from infrastructure.controller.routes.delete_periodic_flow import delete_periodic_flow
from infrastructure.controller.routes.delete_real_estate import delete_real_estate
from infrastructure.controller.routes.delete_template import delete_template
from infrastructure.controller.routes.exchange_rates import exchange_rates
from infrastructure.controller.routes.get_euribor_rates import get_euribor_rates
from infrastructure.controller.routes.export_file import export_file
from infrastructure.controller.routes.export_sheets import export_sheets
from infrastructure.controller.routes.forecast import forecast
from infrastructure.controller.routes.get_crypto_asset_details import (
    get_crypto_asset_details,
)
from infrastructure.controller.routes.get_available_sources import get_available_sources
from infrastructure.controller.routes.get_backup_settings import get_backup_settings
from infrastructure.controller.routes.get_backups import get_backups
from infrastructure.controller.routes.get_cloud_auth import get_cloud_auth
from infrastructure.controller.routes.get_money_events import get_money_events
from infrastructure.controller.routes.get_pending_flows import get_pending_flows
from infrastructure.controller.routes.get_periodic_flows import get_periodic_flows
from infrastructure.controller.routes.get_settings import get_settings
from infrastructure.controller.routes.get_status import status
from infrastructure.controller.routes.get_template_fields_route import (
    get_template_fields,
)
from infrastructure.controller.routes.get_templates import get_templates
from infrastructure.controller.routes.handle_cloud_auth import handle_cloud_auth
from infrastructure.controller.routes.historic import get_historic
from infrastructure.controller.routes.networth_timeline import networth_timeline
from infrastructure.controller.routes.import_backup import import_backup
from infrastructure.controller.routes.import_file import import_file_route
from infrastructure.controller.routes.import_sheets import import_sheets
from infrastructure.controller.routes.instrument_details import instrument_details
from infrastructure.controller.routes.instrument_history import instrument_history
from infrastructure.controller.routes.instruments import instruments
from infrastructure.controller.routes.list_real_estate import list_real_estate
from infrastructure.controller.routes.logout import logout
from infrastructure.controller.routes.manage_manual_entities import (
    create_manual_entity,
    delete_manual_entity,
    rename_manual_entity,
)
from infrastructure.controller.routes.oauth_callback import oauth_callback
from infrastructure.controller.routes.positions import positions
from infrastructure.controller.routes.register_user import register_user
from infrastructure.controller.routes.save_backup_settings import save_backup_settings
from infrastructure.controller.routes.save_commodities import save_commodities
from infrastructure.controller.routes.save_pending_flow import save_pending_flow
from infrastructure.controller.routes.update_pending_flow import update_pending_flow
from infrastructure.controller.routes.delete_pending_flow import delete_pending_flow
from infrastructure.controller.routes.settle_pending_flow import settle_pending_flow
from infrastructure.controller.routes.get_account_ledger import get_account_ledger
from infrastructure.controller.routes.get_mpf_fund_quotes import get_mpf_fund_quotes
from infrastructure.controller.routes.get_mpf_portfolios import get_mpf_portfolios
from infrastructure.controller.routes.create_mpf_portfolio import (
    create_mpf_portfolio,
)
from infrastructure.controller.routes.update_mpf_portfolio import (
    update_mpf_portfolio,
)
from infrastructure.controller.routes.delete_mpf_portfolio import (
    delete_mpf_portfolio,
)
from infrastructure.controller.routes.get_mpf_contributions import (
    get_mpf_contributions,
)
from infrastructure.controller.routes.record_mpf_contribution import (
    record_mpf_contribution,
)
from infrastructure.controller.routes.delete_mpf_contribution import (
    delete_mpf_contribution,
)
from infrastructure.controller.routes.save_periodic_flow import save_periodic_flow
from infrastructure.controller.routes.spending_summary import spending_summary
from infrastructure.controller.routes.transactions import transactions
from infrastructure.controller.routes.update_contributions import update_contributions
from infrastructure.controller.routes.update_manual_transaction import (
    update_manual_transaction,
)
from infrastructure.controller.routes.update_periodic_flow import update_periodic_flow
from infrastructure.controller.routes.update_position import update_position
from infrastructure.controller.routes.update_real_estate import update_real_estate
from infrastructure.controller.routes.update_settings import update_settings
from infrastructure.controller.routes.update_template import update_template
from infrastructure.controller.routes.update_tracked_quotes import update_tracked_quotes
from infrastructure.controller.routes.update_tracked_loans import update_tracked_loans
from infrastructure.controller.routes.upload_backup import upload_backup
from infrastructure.controller.routes.user_login import user_login
from infrastructure.controller.routes.search_crypto_assets import search_crypto_assets


async def register_routes(
    app: QuartApp,
    user_login_uc: UserLogin,
    register_user_uc: RegisterUser,
    change_user_password_uc: ChangeUserPassword,
    get_available_entities_uc: GetAvailableEntities,
    manage_manual_entities_uc,
    export_sheets_uc: ExportSheets,
    export_file_uc: ExportFile,
    import_sheets_uc: ImportSheets,
    import_file_uc: ImportFile,
    get_status_uc: GetStatus,
    user_logout_uc: UserLogout,
    get_settings_uc: GetSettings,
    update_settings_uc: UpdateSettings,
    get_position_uc: GetPosition,
    get_contributions_uc: GetContributions,
    get_historic_uc: GetHistoric,
    get_networth_timeline_uc: GetNetworthTimeline,
    get_transactions_uc: GetTransactions,
    get_spending_summary_uc: GetSpendingSummary,
    get_account_ledger_uc: GetAccountLedger,
    get_mpf_fund_quotes_uc: GetMpfFundQuotes,
    get_mpf_portfolios_uc: GetMpfPortfolios,
    create_mpf_portfolio_uc: CreateMpfPortfolio,
    update_mpf_portfolio_uc: UpdateMpfPortfolio,
    delete_mpf_portfolio_uc: DeleteMpfPortfolio,
    get_mpf_contributions_uc: GetMpfContributions,
    record_mpf_contribution_uc: RecordMpfContribution,
    delete_mpf_contribution_uc: DeleteMpfContribution,
    get_exchange_rates_uc: GetExchangeRates,
    get_money_events_uc: GetMoneyEvents,
    save_commodities_uc: SaveCommodities,
    save_periodic_flow_uc: SavePeriodicFlow,
    update_periodic_flow_uc: UpdatePeriodicFlow,
    delete_periodic_flow_uc: DeletePeriodicFlow,
    get_periodic_flows_uc: GetPeriodicFlows,
    save_pending_flow_uc: SavePendingFlow,
    update_pending_flow_uc: UpdatePendingFlow,
    delete_pending_flow_uc: DeletePendingFlow,
    settle_pending_flow_uc: SettlePendingFlow,
    query_pending_flows_uc: QueryPendingFlows,
    create_real_estate_uc: CreateRealEstate,
    update_real_estate_uc: UpdateRealEstate,
    delete_real_estate_uc: DeleteRealEstate,
    list_real_estate_uc: ListRealEstate,
    calculate_loan_uc: CalculateLoan,
    calculate_savings_uc: CalculateSavings,
    forecast_uc: Forecast,
    update_contributions_uc: UpdateContributions,
    update_position_uc: UpdatePosition,
    add_manual_transaction_uc: AddManualTransaction,
    settle_manual_investment_uc: SettleManualInvestment,
    partial_amortize_manual_investment_uc: PartialAmortizeManualInvestment,
    unsettle_manual_investment_uc: UnsettleManualInvestment,
    delete_manual_historic_entry_uc: DeleteManualHistoricEntry,
    update_manual_transaction_uc: UpdateManualTransaction,
    delete_manual_transaction_uc: DeleteManualTransaction,
    get_instruments_uc: GetInstruments,
    get_instrument_info_uc: GetInstrumentInfo,
    get_instrument_history_uc: GetInstrumentHistory,
    update_tracked_quotes_uc: UpdateTrackedQuotes,
    update_tracked_loans_uc: UpdateTrackedLoans,
    search_crypto_assets_uc: SearchCryptoAssets,
    get_crypto_asset_details_uc: GetCryptoAssetDetails,
    create_template_uc: CreateTemplate,
    update_template_uc: UpdateTemplate,
    delete_template_uc: DeleteTemplate,
    get_templates_uc: GetTemplates,
    get_template_fields_uc: GetTemplateFields,
    upload_backup_uc: UploadBackup,
    import_backup_uc: ImportBackup,
    get_backups_uc: GetBackups,
    handle_cloud_auth_uc: HandleCloudAuth,
    get_cloud_auth_uc: GetCloudAuth,
    get_backup_settings_uc: GetBackupSettings,
    save_backup_settings_uc: SaveBackupSettings,
    get_euribor_rates_uc: GetEuriborRates,
):
    @app.route("/api/v1/login", methods=["POST"])
    async def user_login_route():
        return await user_login(user_login_uc)

    @app.route("/api/v1/signup", methods=["POST"])
    async def register_user_route():
        return await register_user(register_user_uc)

    @app.route("/api/v1/change-password", methods=["POST"])
    async def change_user_password_route():
        return await change_user_password(change_user_password_uc)

    @app.route("/api/v1/status", methods=["GET"])
    async def get_status_route():
        return await status(get_status_uc)

    @app.route("/api/v1/logout", methods=["POST"])
    async def logout_route():
        return await logout(user_logout_uc)

    @app.route("/api/v1/settings", methods=["GET"])
    async def settings_route():
        return await get_settings(get_settings_uc)

    @app.route("/api/v1/settings", methods=["POST"])
    async def update_settings_route():
        return await update_settings(update_settings_uc)

    @app.route("/api/v1/entities", methods=["GET"])
    async def get_available_source_route():
        return await get_available_sources(get_available_entities_uc)

    @app.route("/api/v1/entities", methods=["POST"])
    async def create_manual_entity_route():
        return await create_manual_entity(manage_manual_entities_uc)

    @app.route("/api/v1/entities/<entity_id>", methods=["PATCH"])
    async def rename_manual_entity_route(entity_id: str):
        return await rename_manual_entity(manage_manual_entities_uc, entity_id)

    @app.route("/api/v1/entities/<entity_id>", methods=["DELETE"])
    async def delete_manual_entity_route(entity_id: str):
        return await delete_manual_entity(manage_manual_entities_uc, entity_id)

    @app.route("/api/v1/data/import/sheets", methods=["POST"])
    async def import_sheets_route():
        return await import_sheets(import_sheets_uc)

    @app.route("/api/v1/data/import/file", methods=["POST"])
    async def import_file_endpoint():
        return await import_file_route(import_file_uc)

    @app.route("/api/v1/data/export/sheets", methods=["POST"])
    async def export_sheets_route():
        return await export_sheets(export_sheets_uc)

    @app.route("/api/v1/data/export/file", methods=["POST"])
    async def export_file_route():
        return await export_file(export_file_uc)

    @app.route("/api/v1/positions", methods=["GET"])
    async def positions_route():
        return await positions(get_position_uc)

    @app.route("/api/v1/contributions", methods=["GET"])
    async def contributions_route():
        return await contributions(get_contributions_uc)

    @app.route("/api/v1/transactions", methods=["GET"])
    async def transactions_route():
        return await transactions(get_transactions_uc)

    @app.route("/api/v1/transactions/spending-summary", methods=["GET"])
    async def spending_summary_route():
        return await spending_summary(get_spending_summary_uc)

    @app.route("/api/v1/accounts/ledger", methods=["GET"])
    async def get_account_ledger_route():
        return await get_account_ledger(get_account_ledger_uc)

    @app.route("/api/v1/mpf/fund-quotes", methods=["GET"])
    async def get_mpf_fund_quotes_route():
        return await get_mpf_fund_quotes(get_mpf_fund_quotes_uc)

    @app.route("/api/v1/mpf/portfolios", methods=["GET"])
    async def get_mpf_portfolios_route():
        return await get_mpf_portfolios(get_mpf_portfolios_uc)

    @app.route("/api/v1/mpf/portfolios", methods=["POST"])
    async def create_mpf_portfolio_route():
        return await create_mpf_portfolio(create_mpf_portfolio_uc)

    @app.route("/api/v1/mpf/portfolios/<portfolio_id>", methods=["PUT"])
    async def update_mpf_portfolio_route(portfolio_id: str):
        return await update_mpf_portfolio(update_mpf_portfolio_uc, portfolio_id)

    @app.route("/api/v1/mpf/portfolios/<portfolio_id>", methods=["DELETE"])
    async def delete_mpf_portfolio_route(portfolio_id: str):
        return await delete_mpf_portfolio(delete_mpf_portfolio_uc, portfolio_id)

    @app.route(
        "/api/v1/mpf/portfolios/<portfolio_id>/contributions", methods=["GET"]
    )
    async def get_mpf_contributions_route(portfolio_id: str):
        return await get_mpf_contributions(get_mpf_contributions_uc, portfolio_id)

    @app.route(
        "/api/v1/mpf/portfolios/<portfolio_id>/contributions", methods=["POST"]
    )
    async def record_mpf_contribution_route(portfolio_id: str):
        return await record_mpf_contribution(
            record_mpf_contribution_uc, portfolio_id
        )

    @app.route("/api/v1/mpf/contributions/<contribution_id>", methods=["DELETE"])
    async def delete_mpf_contribution_route(contribution_id: str):
        return await delete_mpf_contribution(
            delete_mpf_contribution_uc, contribution_id
        )

    @app.route("/api/v1/exchange-rates", methods=["GET"])
    async def exchange_rates_route():
        return await exchange_rates(get_exchange_rates_uc)

    @app.route("/api/v1/events", methods=["GET"])
    async def get_money_events_route():
        return await get_money_events(get_money_events_uc)

    @app.route("/api/v1/commodities", methods=["POST"])
    async def save_commodities_route():
        return await save_commodities(save_commodities_uc)

    @app.route("/api/v1/flows/periodic", methods=["POST"])
    async def save_periodic_flow_route():
        return await save_periodic_flow(save_periodic_flow_uc)

    @app.route("/api/v1/flows/periodic", methods=["PUT"])
    async def update_periodic_flow_route():
        return await update_periodic_flow(update_periodic_flow_uc)

    @app.route("/api/v1/flows/periodic/<flow_id>", methods=["DELETE"])
    async def delete_periodic_flow_route(flow_id: str):
        return await delete_periodic_flow(delete_periodic_flow_uc, flow_id)

    @app.route("/api/v1/flows/periodic", methods=["GET"])
    async def get_periodic_flows_route():
        return await get_periodic_flows(get_periodic_flows_uc)

    @app.route("/api/v1/flows/pending", methods=["POST"])
    async def save_pending_flow_route():
        return await save_pending_flow(save_pending_flow_uc)

    @app.route("/api/v1/flows/pending", methods=["PUT"])
    async def update_pending_flow_route():
        return await update_pending_flow(update_pending_flow_uc)

    @app.route("/api/v1/flows/pending/settle", methods=["POST"])
    async def settle_pending_flow_route():
        return await settle_pending_flow(settle_pending_flow_uc)

    @app.route("/api/v1/flows/pending/<flow_id>", methods=["DELETE"])
    async def delete_pending_flow_route(flow_id: str):
        return await delete_pending_flow(delete_pending_flow_uc, flow_id)

    @app.route("/api/v1/flows/pending", methods=["GET"])
    async def get_pending_flows_route():
        return await get_pending_flows(query_pending_flows_uc)

    @app.route("/api/v1/real-estate", methods=["GET"])
    async def list_real_estate_route():
        return await list_real_estate(list_real_estate_uc)

    @app.route("/api/v1/real-estate", methods=["POST"])
    async def create_real_estate_route():
        return await create_real_estate(create_real_estate_uc)

    @app.route("/api/v1/real-estate", methods=["PUT"])
    async def update_real_estate_route():
        return await update_real_estate(update_real_estate_uc)

    @app.route("/api/v1/real-estate/<real_estate_id>", methods=["DELETE"])
    async def delete_real_estate_route(real_estate_id: str):
        return await delete_real_estate(delete_real_estate_uc, real_estate_id)

    @app.route("/api/v1/calculation/loan", methods=["POST"])
    async def calculate_loan_route():
        return await calculate_loan(calculate_loan_uc)

    @app.route("/api/v1/forecast", methods=["POST"])
    async def forecast_route():
        return await forecast(forecast_uc)

    @app.route("/api/v1/data/manual/contributions", methods=["POST"])
    async def update_contributions_route():
        return await update_contributions(update_contributions_uc)

    @app.route("/api/v1/data/manual/positions", methods=["POST"])
    async def update_position_route():
        return await update_position(update_position_uc)

    @app.route("/api/v1/data/manual/transactions", methods=["POST"])
    async def add_manual_transaction_route():
        return await add_manual_transaction(add_manual_transaction_uc)

    @app.route("/api/v1/data/manual/transactions/<tx_id>", methods=["PUT"])
    async def update_manual_transaction_route(tx_id: str):
        return await update_manual_transaction(update_manual_transaction_uc, tx_id)

    @app.route("/api/v1/data/manual/transactions/<tx_id>", methods=["DELETE"])
    async def delete_manual_transaction_route(tx_id: str):
        return await delete_manual_transaction(delete_manual_transaction_uc, tx_id)

    @app.route("/api/v1/data/manual/investments/settle", methods=["POST"])
    async def settle_manual_investment_route():
        return await settle_manual_investment(settle_manual_investment_uc)

    @app.route("/api/v1/data/manual/investments/amortize", methods=["POST"])
    async def partial_amortize_manual_investment_route():
        return await partial_amortize_manual_investment(
            partial_amortize_manual_investment_uc
        )

    @app.route("/api/v1/historic/<entry_id>/unsettle", methods=["POST"])
    async def unsettle_manual_investment_route(entry_id: str):
        return await unsettle_manual_investment(unsettle_manual_investment_uc, entry_id)

    @app.route("/api/v1/historic/<entry_id>", methods=["DELETE"])
    async def delete_manual_historic_entry_route(entry_id: str):
        return await delete_manual_historic_entry(
            delete_manual_historic_entry_uc, entry_id
        )

    @app.route("/api/v1/historic", methods=["GET"])
    async def get_historic_route():
        return await get_historic(get_historic_uc)

    @app.route("/api/v1/networth-timeline", methods=["GET"])
    async def networth_timeline_route():
        return await networth_timeline(get_networth_timeline_uc)

    @app.route("/api/v1/assets/instruments", methods=["GET"])
    async def instruments_route():
        return await instruments(get_instruments_uc)

    @app.route("/api/v1/assets/instruments/details", methods=["GET"])
    async def instrument_details_route():
        return await instrument_details(get_instrument_info_uc)

    @app.route("/api/v1/assets/instruments/history", methods=["GET"])
    async def instrument_history_route():
        return await instrument_history(get_instrument_history_uc)

    @app.route("/api/v1/assets/crypto", methods=["GET"])
    async def crypto_assets_route():
        return await search_crypto_assets(search_crypto_assets_uc)

    @app.route("/api/v1/assets/crypto/<asset_id>", methods=["GET"])
    async def crypto_asset_details_route(asset_id: str):
        return await get_crypto_asset_details(get_crypto_asset_details_uc, asset_id)

    @app.route("/api/v1/data/manual/positions/update-quotes", methods=["POST"])
    async def update_tracked_quotes_route():
        return await update_tracked_quotes(update_tracked_quotes_uc)

    @app.route("/api/v1/data/manual/positions/update-loans", methods=["POST"])
    async def update_tracked_loans_route():
        return await update_tracked_loans(update_tracked_loans_uc)

    @app.route("/api/v1/templates", methods=["GET"])
    async def get_templates_route():
        return await get_templates(get_templates_uc)

    @app.route("/api/v1/templates", methods=["POST"])
    async def create_template_route():
        return await create_template(create_template_uc)

    @app.route("/api/v1/templates", methods=["PUT"])
    async def update_template_route():
        return await update_template(update_template_uc)

    @app.route("/api/v1/templates/<template_id>", methods=["DELETE"])
    async def delete_template_route(template_id: str):
        return await delete_template(delete_template_uc, template_id)

    @app.route("/api/v1/templates/fields", methods=["GET"])
    async def get_template_fields_route():
        return await get_template_fields(get_template_fields_uc)

    @app.route("/api/v1/calculations/savings", methods=["POST"])
    async def calculate_savings_route():
        return await calculate_savings(calculate_savings_uc)

    @app.route("/api/v1/cloud/backup/upload", methods=["POST"])
    async def upload_backup_route():
        return await upload_backup(upload_backup_uc)

    @app.route("/api/v1/cloud/backup/import", methods=["POST"])
    async def import_backup_route():
        return await import_backup(import_backup_uc)

    @app.route("/api/v1/cloud/backup", methods=["GET"])
    async def get_backups_route():
        return await get_backups(get_backups_uc)

    @app.route("/api/v1/cloud/auth", methods=["POST"])
    async def handle_cloud_auth_route():
        return await handle_cloud_auth(handle_cloud_auth_uc)

    @app.route("/api/v1/cloud/auth", methods=["GET"])
    async def get_cloud_auth_route():
        return await get_cloud_auth(get_cloud_auth_uc)

    @app.route("/api/v1/cloud/backup/settings", methods=["GET"])
    async def get_backup_settings_route():
        return await get_backup_settings(get_backup_settings_uc)

    @app.route("/api/v1/cloud/backup/settings", methods=["POST"])
    async def save_backup_settings_route():
        return await save_backup_settings(save_backup_settings_uc)

    @app.route("/api/v1/rates/euribor", methods=["GET"])
    async def get_euribor_rates_route():
        return await get_euribor_rates(get_euribor_rates_uc)

    @app.route("/oauth/callback", methods=["GET"])
    async def oauth_callback_route():
        return await oauth_callback()
