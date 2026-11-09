"""Domain exceptions for rates repository queries."""


class RatesError(Exception):
    """Base exception for rates database operations."""

    pass


class ItemNotFoundError(RatesError):
    """Raised when an item or rate is not found in the database."""

    pass


class MissingRateDataError(RatesError):
    """Raised when an item rate has missing or unreviewed data (TODO(data))."""

    pass
