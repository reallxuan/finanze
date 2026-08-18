from uuid import UUID

from application.ports.mpf_port import MpfPort
from domain.use_cases.delete_mpf_contribution import DeleteMpfContribution


class DeleteMpfContributionImpl(DeleteMpfContribution):
    def __init__(self, mpf_port: MpfPort):
        self._mpf_port = mpf_port

    async def execute(self, contribution_id: UUID):
        await self._mpf_port.delete_contribution(contribution_id)
