# bot/solana/tokens.py
"""
Реестр токенов Solana с mint-адресами.
Используется для Jupiter API (принимает mint addresses, не символы).
"""

# Основные токены Solana mainnet
TOKEN_MINTS: dict[str, str] = {
    # Нативный SOL (обёрнутый для Jupiter)
    "SOL":      "So11111111111111111111111111111111111111112",
    
    # Стейблкоины
    "USDC":     "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    "USDT":     "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    "USDH":     "USDH1SM1ojwWUga67PGrgFWUHibbjqMvuMaDkRJTgkX",
    
    # Wrapped assets
    "BTC":      "9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E",
    "ETH":      "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    
    # Native Solana ecosystem
    "RAY":      "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    "ORCA":     "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE",
    "JUP":      "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
    "BONK":     "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
    "WIF":      "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
    "MNGO":     "MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac",
    "JTO":      "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
    "PYTH":     "HZ1JovNiVvGrk8oCx9RJhBHVKvVEbF6M5uHRMjFPo8LN",
    
    # Liquid staking
    "mSOL":     "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
    "jitoSOL":  "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
    "bSOL":     "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1",
}

# Мета-информация для риск-движка
TOKEN_METADATA: dict[str, dict] = {
    "SOL":     {"decimals": 9,  "trusted": True,  "stablecoin": False},
    "USDC":    {"decimals": 6,  "trusted": True,  "stablecoin": True},
    "USDT":    {"decimals": 6,  "trusted": True,  "stablecoin": True},
    "RAY":     {"decimals": 6,  "trusted": True,  "stablecoin": False},
    "ORCA":    {"decimals": 6,  "trusted": True,  "stablecoin": False},
    "JUP":     {"decimals": 6,  "trusted": True,  "stablecoin": False},
    "BONK":    {"decimals": 5,  "trusted": True,  "stablecoin": False},
    "WIF":     {"decimals": 6,  "trusted": True,  "stablecoin": False},
    "mSOL":    {"decimals": 9,  "trusted": True,  "stablecoin": False},
    "jitoSOL": {"decimals": 9,  "trusted": True,  "stablecoin": False},
    "BTC":     {"decimals": 6,  "trusted": True,  "stablecoin": False},
    "ETH":     {"decimals": 8,  "trusted": True,  "stablecoin": False},
}


def get_mint(symbol: str) -> str | None:
    """Возвращает mint address по символу токена."""
    return TOKEN_MINTS.get(symbol)


def get_decimals(symbol: str) -> int:
    """Возвращает количество decimals для токена."""
    meta = TOKEN_METADATA.get(symbol, {})
    return meta.get("decimals", 6)


def is_trusted(symbol: str) -> bool:
    """True если токен в нашем whitelist."""
    meta = TOKEN_METADATA.get(symbol, {})
    return meta.get("trusted", False)


def is_stablecoin(symbol: str) -> bool:
    meta = TOKEN_METADATA.get(symbol, {})
    return meta.get("stablecoin", False)


def to_lamports(amount: float, symbol: str) -> int:
    """Конвертирует человеческое количество → наименьшие единицы."""
    decimals = get_decimals(symbol)
    return int(amount * (10 ** decimals))


def from_lamports(amount: int, symbol: str) -> float:
    """Конвертирует наименьшие единицы → человеческое количество."""
    decimals = get_decimals(symbol)
    return amount / (10 ** decimals)