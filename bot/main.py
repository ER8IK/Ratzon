# bot/main.py
"""
Точка входа — запускает Telegram бот + HTTP API сервер параллельно.
"""

import asyncio
import logging
import sys
from dotenv import load_dotenv
load_dotenv()

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.fsm.storage.memory import MemoryStorage

from config import get_config
from bot.handlers import start, intent_handler
from bot.solana.jupiter import jupiter_client
from bot.solana.jupiter_price import jupiter_price_client
from bot.intents.llm_parser import llm_parser
from bot.api_server import start_api_server


def setup_logging(level: str = "INFO"):
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stdout,
    )
    logging.getLogger("aiohttp").setLevel(logging.WARNING)


async def main():
    cfg = get_config()
    setup_logging(cfg.log_level)
    logger = logging.getLogger(__name__)
    logger.info("Starting Ratzon...")

    # Telegram бот
    bot = Bot(
        token=cfg.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    dp = Dispatcher(storage=MemoryStorage())
    dp.include_router(start.router)
    dp.include_router(intent_handler.router)

    # HTTP API для фронтенда (порт 8080)
    api_runner = await start_api_server(port=8080)

    # Проверяем QVAC
    qvac_ok = await llm_parser.is_available()
    if qvac_ok:
        logger.info("QVAC LLM service: CONNECTED")
    else:
        logger.warning("QVAC LLM service: NOT AVAILABLE (using regex fallback)")

    logger.info("Bot + API server running. Starting polling...")

    try:
        await dp.start_polling(bot, skip_updates=True)
    finally:
        await jupiter_client.close()
        await jupiter_price_client.close()
        await llm_parser.close()
        await api_runner.cleanup()
        await bot.session.close()
        logger.info("Stopped.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nStopped.")