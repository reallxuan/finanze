from domain.data_init import DatasourceInitContext
from infrastructure.repository.db.client import DBCursor
from infrastructure.repository.db.query_mixin import QueryMixin
from infrastructure.repository.db.upgrader import DBVersionMigration

SQL = """
      CREATE TABLE mpf_portfolios
      (
          id                 CHAR(36) PRIMARY KEY,
          entity_id          CHAR(36)    NOT NULL REFERENCES entities (id) ON DELETE CASCADE ON UPDATE CASCADE,
          name               TEXT        NOT NULL,
          scheme             TEXT        NOT NULL,
          currency           VARCHAR(10) NOT NULL,
          target_allocation  TEXT        NOT NULL,
          created_at         DATETIME    NOT NULL
      );

      CREATE INDEX idx_mpf_portfolios_entity_id ON mpf_portfolios (entity_id);

      CREATE TABLE mpf_contributions
      (
          id            CHAR(36) PRIMARY KEY,
          portfolio_id  CHAR(36)    NOT NULL REFERENCES mpf_portfolios (id) ON DELETE CASCADE ON UPDATE CASCADE,
          date          DATETIME    NOT NULL,
          total_amount  TEXT        NOT NULL,
          currency      VARCHAR(10) NOT NULL,
          note          TEXT,
          created_at    DATETIME    NOT NULL
      );

      CREATE INDEX idx_mpf_contributions_portfolio_id ON mpf_contributions (portfolio_id);

      CREATE TABLE mpf_contribution_items
      (
          id               CHAR(36) PRIMARY KEY,
          contribution_id  CHAR(36) NOT NULL REFERENCES mpf_contributions (id) ON DELETE CASCADE ON UPDATE CASCADE,
          fund_cd          TEXT     NOT NULL,
          fund_class       TEXT,
          description_en   TEXT,
          description_zh   TEXT,
          percentage       TEXT     NOT NULL,
          amount           TEXT     NOT NULL,
          nav              TEXT     NOT NULL,
          units            TEXT     NOT NULL
      );

      CREATE INDEX idx_mpf_contribution_items_contribution_id ON mpf_contribution_items (contribution_id);
      """


class V01004MpfTables(DBVersionMigration, QueryMixin):
    @property
    def name(self):
        return "v0.10.0:4_mpf_tables"

    async def upgrade(self, cursor: DBCursor, context: DatasourceInitContext):
        statements = self.parse_block(SQL)
        for statement in statements:
            await cursor.execute(statement)
