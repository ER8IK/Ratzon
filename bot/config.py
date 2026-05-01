# bot/config.py
"""
Конфигурация проекта — всё берётся из переменных окружения.
"""

import os
from dataclasses import dataclass


@dataclass
class Config:
    # Обязательно
    bot_token: str

    # Опционально
    log_level: str = "INFO"
    jupiter_rpc_url: str = "https://quote-api.jup.ag/v6"
    
    # RPC для будущего использования (исполнение транзакций)
    solana_rpc_url: str = "https://api.mainnet-beta.solana.com"

    # Для демо-режима (мок кошелёк)
    demo_wallet: str = "Demo1111111111111111111111111111111111111111"

    @classmethod
    def from_env(cls) -> "Config":
        token = os.getenv("BOT_TOKEN")
        if not token:
            raise ValueError("BOT_TOKEN environment variable is required")

        return cls(
            bot_token=token,
            log_level=os.getenv("LOG_LEVEL", "INFO"),
            solana_rpc_url=os.getenv(
                "SOLANA_RPC_URL",
                "https://api.mainnet-beta.solana.com"
            ),
            demo_wallet=os.getenv(
                "DEMO_WALLET",
                "Demo1111111111111111111111111111111111111111"
            ),
        )


# Глобальный конфиг (инициализируется при старте)
config: Config | None = None


def get_config() -> Config:
    global config
    if config is None:
        config = Config.from_env()
    return config