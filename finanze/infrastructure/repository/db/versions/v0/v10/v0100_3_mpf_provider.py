from domain.data_init import DatasourceInitContext
from infrastructure.repository.db.client import DBCursor
from infrastructure.repository.db.query_mixin import QueryMixin
from infrastructure.repository.db.upgrader import DBVersionMigration

# Compatibility shim: some devices ran an earlier, uncommitted build that
# applied a migration with this name. That build's code was never merged and
# no longer exists, and nothing in the current codebase depends on its
# schema changes (MPF tracking here uses the separate mpf_* tables from
# v0100_4_mpf_tables instead), so this is a safe no-op kept only so the
# upgrader recognizes the name as already applied on those devices.


class V01003MpfProvider(DBVersionMigration, QueryMixin):
    @property
    def name(self) -> str:
        return "v0.10.0:3_mpf_provider"

    async def upgrade(self, cursor: DBCursor, context: DatasourceInitContext):
        pass
