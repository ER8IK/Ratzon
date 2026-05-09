# bot/intents/patterns.py
import re

TOKEN_ALIASES: dict[str, str] = {
    "sol": "SOL", "solana": "SOL",
    "usdc": "USDC", "usd coin": "USDC", "usd-c": "USDC",
    "usdt": "USDT", "tether": "USDT",
    "btc": "BTC", "bitcoin": "BTC", "wbtc": "BTC",
    "eth": "ETH", "ethereum": "ETH", "weth": "ETH",
    "bonk": "BONK",
    "wif": "WIF", "dogwifhat": "WIF",
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

NETWORK_ALIASES: dict[str, str] = {
    "sol": "SOLANA",
    "solana": "SOLANA",
    "spl": "SOLANA",
    "erc20": "ERC20",
    "ethereum": "ERC20",
    "eth": "ERC20",
    "trc20": "TRC20",
    "tron": "TRC20",
    "btc": "BTC",
    "bitcoin": "BTC",
    "native": "BTC",
}

SWAP_KEYWORDS = [
    "swap", "exchange", "trade", "convert", "buy", "sell",
    "обменять", "обмен", "своп", "купить", "продать", "конвертировать",
]
SEND_KEYWORDS = [
    "send", "transfer", "pay", "wire",
    "отправить", "перевести", "перевод",
]
BALANCE_KEYWORDS = [
    "balance", "portfolio", "holdings", "wallet",
    "баланс", "кошелёк", "сколько у меня",
]
PRICE_KEYWORDS = [
    "price", "cost", "worth", "value", "how much is",
    "цена", "курс", "стоимость", "сколько стоит",
]
RATE_KEYWORDS = [
    "rate", "how much", "how many",
    "сколько нужно",
]
COMPARE_KEYWORDS = [
    "compare", "vs", "versus", "against",
    "сравни", "против",
]
STAKE_KEYWORDS = [
    "stake", "staking", "deposit", "liquid stake",
    "стейк", "стейкинг",
]

AMOUNT_PATTERN = re.compile(r'\b(\d+(?:[.,]\d+)?)\b')
SWAP_PATTERN = re.compile(
    r'(?:swap|exchange|trade|convert|buy|sell|обменять|своп|купить|продать)'
    r'\s+(\d+(?:[.,]\d+)?)\s+(\w+)\s+(?:to|for|into|на|в|→|->)\s+(\w+)',
    re.IGNORECASE
)
SEND_PATTERN = re.compile(
    r'(?:send|transfer|pay|отправить|перевести)'
    r'\s+(\d+(?:[.,]\d+)?)\s+(\w+)\s+(?:to|на|для)\s+(\S+)',
    re.IGNORECASE
)


def normalize_token(raw: str) -> str | None:
    return TOKEN_ALIASES.get(raw.strip().lower())

def normalize_network(raw: str) -> str | None:
    return NETWORK_ALIASES.get(raw.strip().lower())

def is_known_token(symbol: str) -> bool:
    return symbol in TOKEN_ALIASES.values()
