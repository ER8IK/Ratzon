# bot/intents/models.py
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Union


class IntentType(str, Enum):
    SWAP    = "swap"
    SEND    = "send"
    BALANCE = "balance"
    PRICE   = "price"
    RATE    = "rate"
    COMPARE = "compare"
    STAKE   = "stake"
    UNKNOWN = "unknown"


class RiskLevel(str, Enum):
    LOW      = "🟢 Low"
    MEDIUM   = "🟡 Medium"
    HIGH     = "🔴 High"
    CRITICAL = "⛔ Critical"


@dataclass
class Intent:
    raw_text:    str
    intent_type: IntentType = IntentType.UNKNOWN
    confidence:  float = 0.0


@dataclass
class SwapIntent(Intent):
    amount:       Optional[float] = None
    input_token:  Optional[str]   = None
    output_token: Optional[str]   = None
    slippage_bps: int = 50

    def is_valid(self) -> bool:
        return all([
            self.amount is not None,
            self.input_token is not None,
            self.output_token is not None,
            self.amount > 0,
        ])


@dataclass
class SendIntent(Intent):
    amount:    Optional[float] = None
    token:     Optional[str]   = None
    recipient: Optional[str]   = None

    def is_valid(self) -> bool:
        return all([self.amount, self.token, self.recipient])


@dataclass
class BalanceIntent(Intent):
    token: Optional[str] = None


@dataclass
class PriceIntent(Intent):
    token:    Optional[str] = None
    vs_token: str = "USDC"


@dataclass
class RateIntent(Intent):
    amount:       Optional[float] = None
    input_token:  Optional[str]   = None
    output_token: Optional[str]   = None


@dataclass
class CompareIntent(Intent):
    token_a: Optional[str] = None
    token_b: Optional[str] = None


AnyIntent = Union[
    SwapIntent, SendIntent, BalanceIntent,
    PriceIntent, RateIntent, CompareIntent, Intent
]


@dataclass
class RiskReport:
    level:    RiskLevel = RiskLevel.LOW
    score:    int = 0
    warnings: list = field(default_factory=list)

    def add_warning(self, msg: str, score_delta: int = 10):
        self.warnings.append(msg)
        self.score = min(100, self.score + score_delta)
        self._update_level()

    def _update_level(self):
        if self.score >= 75:
            self.level = RiskLevel.CRITICAL
        elif self.score >= 50:
            self.level = RiskLevel.HIGH
        elif self.score >= 25:
            self.level = RiskLevel.MEDIUM
        else:
            self.level = RiskLevel.LOW


@dataclass
class QuoteResult:
    input_token:      str
    output_token:     str
    input_amount:     float
    output_amount:    float
    price_impact_pct: float
    route_label:      str
    fees_sol:         float

    @property
    def price_impact_display(self) -> str:
        return f"{self.price_impact_pct:.4f}%"

    @property
    def exchange_rate(self) -> float:
        if self.input_amount == 0:
            return 0
        return self.output_amount / self.input_amount