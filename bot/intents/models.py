# bot/intents/models.py
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class IntentType(str, Enum):
    SWAP = "swap"
    SEND = "send"
    BALANCE = "balance"
    PRICE = "price"
    STAKE = "stake"
    UNKNOWN = "unknown"


class RiskLevel(str, Enum):
    LOW = "🟢 Low"
    MEDIUM = "🟡 Medium"
    HIGH = "🔴 High"
    CRITICAL = "⛔ Critical"

from typing import Union

AnyIntent = Union["SwapIntent", "SendIntent", "BalanceIntent", "PriceIntent", "Intent"]

@dataclass
class Intent:
    """Базовый класс для всех интентов"""
    raw_text: str
    intent_type: IntentType = IntentType.UNKNOWN
    confidence: float = 0.0  # 0.0 - 1.0


@dataclass
class SwapIntent(Intent):
    """Интент: обмен токенов"""
    amount: Optional[float] = None
    input_token: Optional[str] = None
    output_token: Optional[str] = None
    slippage_bps: int = 50  # 0.5% по умолчанию

    def is_valid(self) -> bool:
        return all([
            self.amount is not None,
            self.input_token is not None,
            self.output_token is not None,
            self.amount > 0,
        ])


@dataclass
class SendIntent(Intent):
    """Интент: отправка токенов"""
    amount: Optional[float] = None
    token: Optional[str] = None
    recipient: Optional[str] = None

    def is_valid(self) -> bool:
        return all([
            self.amount is not None,
            self.token is not None,
            self.recipient is not None,
        ])


@dataclass
class BalanceIntent(Intent):
    """Интент: проверка баланса"""
    token: Optional[str] = None  # None = все токены


@dataclass
class PriceIntent(Intent):
    """Интент: цена токена"""
    token: Optional[str] = None
    vs_token: str = "USDC"


@dataclass
class RiskReport:
    """Результат риск-оценки"""
    level: RiskLevel = RiskLevel.LOW
    score: int = 0          # 0-100, выше = опаснее
    warnings: list = field(default_factory=list)
    details: str = ""

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
    """Результат запроса котировки"""
    input_token: str
    output_token: str
    input_amount: float
    output_amount: float
    price_impact_pct: float
    route_label: str
    fees_sol: float
    raw_response: dict = field(default_factory=dict)

    @property
    def price_impact_display(self) -> str:
        return f"{self.price_impact_pct:.4f}%"

    @property
    def exchange_rate(self) -> float:
        if self.input_amount == 0:
            return 0
        return self.output_amount / self.input_amount