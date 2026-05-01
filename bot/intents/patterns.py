# bot/intents/patterns.py
"""
Паттерны для парсинга интентов.
Здесь хранятся все regex, синонимы токенов, ключевые слова.
"""

import re

# ─── Синонимы токенов ────────────────────────────────────────────────────────
# Нормализуем любой вариант написания → canonical symbol

TOKEN_ALIASES: dict[str, str] = {
    # SOL
    "sol": "SOL", "solana": "SOL",
    # USDC
    "usdc": "USDC", "usd coin": "USDC", "usd-c": "USDC",
    # USDT
    "usdt": "USDT", "tether": "USDT",
    # BTC wrapped
    "btc": "BTC", "bitcoin": "BTC", "wbtc": "BTC",
    # ETH wrapped
    "eth": "ETH", "ethereum": "ETH", "weth": "ETH",
    # Popular Solana tokens
    "bonk": "BONK", "wif": "WIF", "dogwifhat": "WIF",
    "jup": "JUP", "jupiter": "JUP",
    "ray": "RAY", "raydium": "RAY",
    "orca": "ORCA",
    "mngo": "MNGO", "mango": "MNGO",
    "jto": "JTO", "jito": "JTO",
    "pyth": "PYTH",
    "msol": "mSOL", "marinade sol": "mSOL",
    "jsol": "jitoSOL", "jitosol": "jitoSOL",
    "bsol": "bSOL",
}

# ─── Ключевые слова по типам действий ────────────────────────────────────────

SWAP_KEYWORDS = [
    "swap", "exchange", "trade", "convert", "buy", "sell",
    # русские
    "обменять", "обмен", "своп", "купить", "продать", "конвертировать",
]

SEND_KEYWORDS = [
    "send", "transfer", "pay", "wire",
    # русские
    "отправить", "перевести", "перевод",
]

BALANCE_KEYWORDS = [
    "balance", "portfolio", "holdings", "wallet", "how much",
    # русские
    "баланс", "кошелёк", "сколько у меня",
]

PRICE_KEYWORDS = [
    "price", "cost", "worth", "value", "rate", "how much is",
    # русские
    "цена", "курс", "стоимость", "сколько стоит",
]

STAKE_KEYWORDS = [
    "stake", "staking", "deposit", "liquid stake",
    # русские
    "стейк", "стейкинг", "застейкать",
]

# ─── Regex паттерны ───────────────────────────────────────────────────────────

# Захватывает число: "1", "1.5", "0.001", "100"
AMOUNT_PATTERN = re.compile(
    r'\b(\d+(?:[.,]\d+)?)\b'
)

# Вариант: "swap 1 SOL to USDC" или "swap SOL to USDC for 1"
SWAP_PATTERN = re.compile(
    r'(?:swap|exchange|trade|convert|buy|sell|обменять|своп|купить|продать)'
    r'\s+(\d+(?:[.,]\d+)?)\s+(\w+)\s+(?:to|for|into|на|в|→|->)\s+(\w+)',
    re.IGNORECASE
)

# "send 0.5 SOL to <address_or_name>"
SEND_PATTERN = re.compile(
    r'(?:send|transfer|pay|отправить|перевести)'
    r'\s+(\d+(?:[.,]\d+)?)\s+(\w+)\s+(?:to|на|для)\s+(\S+)',
    re.IGNORECASE
)

# "price of SOL" / "SOL price" / "сколько стоит SOL"
PRICE_PATTERN = re.compile(
    r'(?:price\s+of\s+|цена\s+|курс\s+|стоимость\s+|сколько\s+стоит\s+)?'
    r'(\w+)\s+(?:price|курс|цена)?',
    re.IGNORECASE
)


def normalize_token(raw: str) -> str | None:
    """
    Нормализует любой вариант токена → canonical symbol.
    Возвращает None если токен неизвестен.
    """
    key = raw.strip().lower()
    return TOKEN_ALIASES.get(key)


def is_known_token(symbol: str) -> bool:
    return symbol in TOKEN_ALIASES.values()