from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from finanze.app_core import MobileAppCore
    from finanze.app_deferred import DeferredComponents


class LazyComponents:
    def __init__(self, core: "MobileAppCore", deferred: "DeferredComponents"):
        self._core = core
        self._deferred = deferred

    async def initialize(self):
        from domain.export import FileFormat
        from infrastructure.table.csv_file_table_adapter import CSVFileTableAdapter
        from infrastructure.table.table_rw_dispatcher import TableRWDispatcher
        from infrastructure.table.xlsx_file_table_adapter import XLSXFileTableAdapter
        from infrastructure.templating.templated_data_generator import (
            TemplatedDataGenerator,
        )
        from infrastructure.templating.templated_data_parser import TemplateDataParser
        from infrastructure.file_storage.mobile_file_storage import MobileFileStorage
        from infrastructure.cloud.backup.capacitor_backup_processor import (
            CapacitorBackupProcessorAdapter,
        )
        from infrastructure.repository.historic.historic_repository import (
            HistoricSQLRepository as HistoricRepository,
        )
        from infrastructure.repository.crypto.crypto_asset_repository import (
            CryptoAssetRegistryRepository,
        )
        from infrastructure.repository.templates.template_repository import (
            TemplateRepository,
        )
        from infrastructure.client.interests.ecb_client import ECBClient

        from application.use_cases.export_file import ExportFileImpl
        from application.use_cases.import_file import ImportFileImpl
        from application.use_cases.import_backup import ImportBackupImpl
        from application.use_cases.upload_backup import UploadBackupImpl
        from application.use_cases.update_settings import UpdateSettingsImpl
        from application.use_cases.save_commodities import SaveCommoditiesImpl
        from application.use_cases.save_periodic_flow import SavePeriodicFlowImpl
        from application.use_cases.update_periodic_flow import UpdatePeriodicFlowImpl
        from application.use_cases.delete_periodic_flow import DeletePeriodicFlowImpl
        from application.use_cases.save_pending_flow import SavePendingFlowImpl
        from application.use_cases.update_pending_flow import UpdatePendingFlowImpl
        from application.use_cases.delete_pending_flow import DeletePendingFlowImpl
        from application.use_cases.settle_pending_flow import SettlePendingFlowImpl
        from application.use_cases.create_real_estate import CreateRealEstateImpl
        from application.use_cases.update_real_estate import UpdateRealEstateImpl
        from application.use_cases.delete_real_estate import DeleteRealEstateImpl
        from application.use_cases.calculate_loan import CalculateLoanImpl
        from application.use_cases.calculate_savings import CalculateSavingsImpl
        from application.use_cases.get_euribor_rates import GetEuriborRatesImpl
        from application.use_cases.forecast import ForecastImpl
        from application.use_cases.update_contributions import UpdateContributionsImpl
        from application.use_cases.update_position import UpdatePositionImpl
        from application.use_cases.update_tracked_quotes import UpdateTrackedQuotesImpl
        from application.use_cases.manage_manual_entities import ManageManualEntitiesImpl
        from application.use_cases.manual_position_snapshot import (
            ManualPositionSnapshotWriter,
        )
        from application.use_cases.manual_historic_common import ManualHistoricWriter
        from application.use_cases.add_manual_transaction import (
            AddManualTransactionImpl,
        )
        from application.use_cases.update_manual_transaction import (
            UpdateManualTransactionImpl,
        )
        from application.use_cases.adjust_account_balance import (
            AdjustAccountBalanceImpl,
        )
        from application.use_cases.delete_manual_transaction import (
            DeleteManualTransactionImpl,
        )
        from application.use_cases.settle_manual_investment import (
            SettleManualInvestmentImpl,
        )
        from application.use_cases.partial_amortize_manual_investment import (
            PartialAmortizeManualInvestmentImpl,
        )
        from application.use_cases.unsettle_manual_investment import (
            UnsettleManualInvestmentImpl,
        )
        from application.use_cases.delete_manual_historic_entry import (
            DeleteManualHistoricEntryImpl,
        )
        from application.use_cases.get_historic import GetHistoricImpl
        from application.use_cases.get_instruments import GetInstrumentsImpl
        from application.use_cases.get_instrument_info import GetInstrumentInfoImpl
        from application.use_cases.get_instrument_history import (
            GetInstrumentHistoryImpl,
        )
        from application.use_cases.search_crypto_assets import SearchCryptoAssetsImpl
        from application.use_cases.get_crypto_asset_details import (
            GetCryptoAssetDetailsImpl,
        )
        from application.use_cases.get_templates import GetTemplatesImpl
        from application.use_cases.create_template import CreateTemplateImpl
        from application.use_cases.update_template import UpdateTemplateImpl
        from application.use_cases.delete_template import DeleteTemplateImpl
        from application.use_cases.get_template_fields import GetTemplateFieldsImpl
        from application.use_cases.save_backup_settings import SaveBackupSettingsImpl
        from application.use_cases.get_spending_summary import GetSpendingSummaryImpl
        from application.use_cases.get_account_ledger import GetAccountLedgerImpl
        from application.use_cases.get_mpf_fund_quotes import GetMpfFundQuotesImpl
        from application.use_cases.create_mpf_portfolio import (
            CreateMpfPortfolioImpl,
        )
        from application.use_cases.update_mpf_portfolio import (
            UpdateMpfPortfolioImpl,
        )
        from application.use_cases.delete_mpf_portfolio import (
            DeleteMpfPortfolioImpl,
        )
        from application.use_cases.get_mpf_portfolios import GetMpfPortfoliosImpl
        from application.use_cases.get_mpf_contributions import (
            GetMpfContributionsImpl,
        )
        from application.use_cases.record_mpf_contribution import (
            RecordMpfContributionImpl,
        )
        from application.use_cases.delete_mpf_contribution import (
            DeleteMpfContributionImpl,
        )
        from infrastructure.repository.mpf.mpf_repository import MpfSQLRepository
        from infrastructure.client.mpf.sun_life_mpf_client import SunLifeMpfClient

        d = self._deferred
        core = self._core
        db_client = core.db_client

        csv_tsv_adapter = CSVFileTableAdapter()
        table_rw_adapter = TableRWDispatcher(
            {
                FileFormat.CSV: csv_tsv_adapter,
                FileFormat.TSV: csv_tsv_adapter,
                FileFormat.XLSX: XLSXFileTableAdapter(),
            }
        )

        template_gen = TemplatedDataGenerator()
        template_parser = TemplateDataParser()

        file_storage = MobileFileStorage()
        backup_processor = CapacitorBackupProcessorAdapter()

        historic_repo = HistoricRepository(client=db_client)
        crypto_asset_repo = CryptoAssetRegistryRepository(client=db_client)
        temp_repo = TemplateRepository(client=db_client)

        self.import_file = ImportFileImpl(
            d.position_repo,
            d.tx_repo,
            table_rw_adapter,
            d.entity_repo,
            d.virtual_repo,
            temp_repo,
            template_parser,
            d.tx_handler,
        )
        self.export_file = ExportFileImpl(
            d.position_repo,
            d.auto_repo,
            d.tx_repo,
            historic_repo,
            d.entity_repo,
            temp_repo,
            template_gen,
            table_rw_adapter,
        )

        self.upload_backup = UploadBackupImpl(
            core.db_manager,
            d.backupable_ports,
            backup_processor,
            d.backup_repository,
            d.cloud_register,
            d.cloud_register,
        )
        self.import_backup = ImportBackupImpl(
            core.db_manager,
            d.backupable_ports,
            backup_processor,
            d.backup_repository,
            d.cloud_register,
            d.cloud_register,
        )

        self.update_settings = UpdateSettingsImpl(d.config_loader)

        self.save_commodities = SaveCommoditiesImpl(
            d.position_repo,
            d.ex_client,
            d.metal_client,
            d.last_fetches_repo,
            d.tx_handler,
        )

        self.save_periodic = SavePeriodicFlowImpl(d.period_repo)
        self.up_periodic = UpdatePeriodicFlowImpl(d.period_repo)
        self.del_periodic = DeletePeriodicFlowImpl(d.period_repo)
        self.save_pending = SavePendingFlowImpl(d.pending_repo)
        self.up_pending = UpdatePendingFlowImpl(d.pending_repo)
        self.del_pending = DeletePendingFlowImpl(d.pending_repo)

        self.create_re = CreateRealEstateImpl(
            d.re_repo, d.period_repo, d.tx_handler, file_storage
        )
        self.up_re = UpdateRealEstateImpl(
            d.re_repo, d.period_repo, d.tx_handler, file_storage
        )
        self.del_re = DeleteRealEstateImpl(
            d.re_repo, d.period_repo, d.tx_handler, file_storage
        )

        self.calc_loan = CalculateLoanImpl(d.loan_calculator)
        self.calc_savings = CalculateSavingsImpl()
        self.get_euribor = GetEuriborRatesImpl(ECBClient())

        self.forecast = ForecastImpl(
            d.position_repo,
            d.auto_repo,
            d.period_repo,
            d.pending_repo,
            d.re_repo,
            d.entity_repo,
        )

        self.up_contrib = UpdateContributionsImpl(
            d.entity_repo, d.auto_repo, d.virtual_repo, d.tx_handler
        )
        manual_position_snapshot_writer = ManualPositionSnapshotWriter(
            d.position_repo,
            d.manual_repo,
            d.virtual_repo,
            d.re_repo,
            d.loan_calculator,
        )
        manual_historic_writer = ManualHistoricWriter(
            historic_repo,
            transaction_port=d.tx_repo,
            virtual_import_registry=d.virtual_repo,
        )
        self.up_pos = UpdatePositionImpl(
            d.entity_repo,
            d.position_repo,
            crypto_asset_repo,
            d.crypto_info,
            d.tx_handler,
            d.virtual_repo,
            manual_position_snapshot_writer,
            manual_historic_writer,
        )
        self.up_tracked = UpdateTrackedQuotesImpl(
            d.position_repo,
            d.manual_repo,
            d.inst_provider,
            d.ex_client,
            d.ex_storage,
            d.virtual_repo,
            manual_position_snapshot_writer,
            d.tracked_updates_repo,
            d.tx_handler,
        )
        self.manual_entities = ManageManualEntitiesImpl(
            d.entity_repo,
            d.position_repo,
            d.tx_repo,
            historic_repo,
            d.auto_repo,
        )
        self.settle_pending = SettlePendingFlowImpl(
            d.pending_repo,
            d.position_repo,
            manual_position_snapshot_writer,
            d.ex_client,
            d.tx_handler,
        )
        adjust_account_balance = AdjustAccountBalanceImpl(
            d.entity_repo,
            d.position_repo,
            d.virtual_repo,
            manual_position_snapshot_writer,
        )
        self.add_manual_tx = AddManualTransactionImpl(
            d.entity_repo,
            d.tx_repo,
            d.virtual_repo,
            d.tx_handler,
            historic_repo,
            adjust_account_balance,
        )
        self.up_manual_tx = UpdateManualTransactionImpl(
            d.entity_repo, d.tx_repo, d.virtual_repo, d.tx_handler, adjust_account_balance
        )
        self.del_manual_tx = DeleteManualTransactionImpl(
            d.tx_repo, d.virtual_repo, d.tx_handler, adjust_account_balance
        )
        self.settle_manual_inv = SettleManualInvestmentImpl(
            d.entity_repo,
            d.position_repo,
            d.tx_repo,
            historic_repo,
            d.virtual_repo,
            manual_position_snapshot_writer,
            d.tx_handler,
        )
        self.partial_amortize_manual_inv = PartialAmortizeManualInvestmentImpl(
            d.entity_repo,
            d.position_repo,
            d.tx_repo,
            historic_repo,
            d.virtual_repo,
            manual_position_snapshot_writer,
            d.tx_handler,
        )
        self.unsettle_manual_inv = UnsettleManualInvestmentImpl(
            historic_repo,
            d.position_repo,
            d.tx_repo,
            d.virtual_repo,
            manual_position_snapshot_writer,
            d.tx_handler,
        )
        self.delete_manual_historic = DeleteManualHistoricEntryImpl(
            historic_repo,
            d.tx_repo,
            d.virtual_repo,
            d.tx_handler,
        )

        self.get_historic = GetHistoricImpl(historic_repo, d.entity_repo)
        self.get_spending_summary = GetSpendingSummaryImpl(d.tx_repo, d.entity_repo)
        self.get_account_ledger = GetAccountLedgerImpl(
            entity_port=d.entity_repo,
            position_port=d.position_repo,
            transaction_port=d.tx_repo,
            virtual_import_registry=d.virtual_repo,
        )
        mpf_repo = MpfSQLRepository(client=db_client)
        sun_life_client = SunLifeMpfClient()
        self.get_mpf_fund_quotes = GetMpfFundQuotesImpl(sun_life_client)
        self.create_mpf_portfolio = CreateMpfPortfolioImpl(
            entity_port=d.entity_repo, mpf_port=mpf_repo
        )
        self.update_mpf_portfolio = UpdateMpfPortfolioImpl(mpf_port=mpf_repo)
        self.delete_mpf_portfolio = DeleteMpfPortfolioImpl(mpf_port=mpf_repo)
        self.get_mpf_portfolios = GetMpfPortfoliosImpl(
            mpf_port=mpf_repo, sun_life_mpf_client=sun_life_client
        )
        self.get_mpf_contributions = GetMpfContributionsImpl(mpf_port=mpf_repo)
        self.record_mpf_contribution = RecordMpfContributionImpl(
            mpf_port=mpf_repo, sun_life_mpf_client=sun_life_client
        )
        self.delete_mpf_contribution = DeleteMpfContributionImpl(mpf_port=mpf_repo)
        self.get_instruments = GetInstrumentsImpl(d.inst_provider)
        self.get_inst_info = GetInstrumentInfoImpl(d.inst_provider)
        self.get_inst_history = GetInstrumentHistoryImpl(d.inst_provider)
        self.search_crypto = SearchCryptoAssetsImpl(d.crypto_info)
        self.get_crypto_details = GetCryptoAssetDetailsImpl(
            d.crypto_info, d.entity_repo
        )

        self.get_tmpl = GetTemplatesImpl(temp_repo)
        self.create_tmpl = CreateTemplateImpl(temp_repo)
        self.up_tmpl = UpdateTemplateImpl(temp_repo)
        self.del_tmpl = DeleteTemplateImpl(temp_repo)
        self.get_tmpl_fields = GetTemplateFieldsImpl()

        self.save_bkp_settings = SaveBackupSettingsImpl(
            d.cloud_register, d.cloud_register
        )
