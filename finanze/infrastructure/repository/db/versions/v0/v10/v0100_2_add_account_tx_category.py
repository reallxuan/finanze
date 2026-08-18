from domain.data_init import DatasourceInitContext
from infrastructure.repository.db.client import DBCursor
from infrastructure.repository.db.query_mixin import QueryMixin
from infrastructure.repository.db.upgrader import DBVersionMigration

DDL = """
      ALTER TABLE account_transactions ADD category TEXT;
      """


class V01002AccountTxCategory(DBVersionMigration, QueryMixin):
    @property
    def name(self):
        return "v0.10.0:2_add_account_tx_category"

    async def upgrade(self, cursor: DBCursor, context: DatasourceInitContext):
        statements = self.parse_block(DDL)
        for statement in statements:
            await cursor.execute(statement)
