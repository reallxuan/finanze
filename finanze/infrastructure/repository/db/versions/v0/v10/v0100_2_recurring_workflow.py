from domain.data_init import DatasourceInitContext
from infrastructure.repository.db.client import DBCursor
from infrastructure.repository.db.query_mixin import QueryMixin
from infrastructure.repository.db.upgrader import DBVersionMigration

DDL = """
      ALTER TABLE periodic_flows ADD COLUMN source_account_id CHAR(36);
      ALTER TABLE periodic_flows ADD COLUMN destination_account_id CHAR(36);
      ALTER TABLE periodic_flows ADD COLUMN business_day_rule VARCHAR(32) NOT NULL DEFAULT 'NONE';
      ALTER TABLE periodic_flows ADD COLUMN confirmation_mode VARCHAR(16) NOT NULL DEFAULT 'PENDING';

      ALTER TABLE pending_flows ADD COLUMN source_account_id CHAR(36);
      ALTER TABLE pending_flows ADD COLUMN destination_account_id CHAR(36);
      ALTER TABLE pending_flows ADD COLUMN periodic_flow_id CHAR(36);
      ALTER TABLE pending_flows ADD COLUMN scheduled_date DATE;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_pending_periodic_date
          ON pending_flows (periodic_flow_id, scheduled_date)
          WHERE periodic_flow_id IS NOT NULL AND scheduled_date IS NOT NULL;
      """


class V01002RecurringWorkflow(DBVersionMigration, QueryMixin):
    @property
    def name(self):
        return "v0.10.0:2_recurring_workflow"

    async def upgrade(self, cursor: DBCursor, context: DatasourceInitContext):
        for statement in self.parse_block(DDL):
            await cursor.execute(statement)
