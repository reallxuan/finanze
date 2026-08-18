from domain.dezimal import Dezimal
from domain.mpf import MpfAllocationTarget


def map_allocation_targets(raw: list) -> list[MpfAllocationTarget]:
    return [
        MpfAllocationTarget(
            fund_cd=item["fund_cd"],
            fund_class=item.get("fund_class") or "",
            description_en=item.get("description_en") or "",
            description_zh=item.get("description_zh") or "",
            percentage=Dezimal(str(item["percentage"])),
        )
        for item in raw
    ]
