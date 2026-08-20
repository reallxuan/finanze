from domain.data_init import DatasourceInitContext
from infrastructure.repository.db.client import DBCursor
from infrastructure.repository.db.query_mixin import QueryMixin
from infrastructure.repository.db.upgrader import DBVersionMigration

SQL = """
      ALTER TABLE mpf_contributions
          ADD COLUMN is_opening_balance BOOLEAN NOT NULL DEFAULT 0;
      """


class V01005MpfOpeningBalance(DBVersionMigration, QueryMixin):
    @property
    def name(self):
        return "v0.10.0:5_mpf_opening_balance"

    async def upgrade(self, cursor: DBCursor, context: DatasourceInitContext):
        statements = self.parse_block(SQL)
        for statement in statements:
            await cursor.execute(statement)
