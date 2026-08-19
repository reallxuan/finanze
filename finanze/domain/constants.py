from domain.dezimal import Dezimal

CAPITAL_GAINS_BASE_TAX = Dezimal(0.19)

# EUR is no longer offered as a selectable default currency, but stays here so
# rates keep being fetched for records persisted before the HKD/USD switch.
SUPPORTED_CURRENCIES = ["USD", "HKD", "EUR"]
