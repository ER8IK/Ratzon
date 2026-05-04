# bot/main.py
"""
Точка входа бота.
Запускает aiogram polling.
"""

import asyncio
import logging
import sys
# bot/main.py — самые первые строки файла
from dotenv import load_dotenv
load_dotenv()  # загружает .env автоматически

from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage

from bot.config import get_config
from bot.handlers import start, intent_handler
from bot.solana.jupiter import jupiter_client
from bot.solana.jupiter_price import jupiter_price_client


def setup_logging(level: str = "INFO"):
    logging.basicConfig(
        level=getattr(logging, level.upper(), logging.INFO),
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%H:%M:%S",
        stream=sys.stdout,
    )
    # Убираем излишний шум от aiohttp
    logging.getLogger("aiohttp").setLevel(logging.WARNING)


async def main():
    cfg = get_config()
    setup_logging(cfg.log_level)

    logger = logging.getLogger(__name__)
    logger.info("Starting Intent Layer for Solana bot...")

    # Инициализируем Bot и Dispatcher
    from aiogram.client.default import DefaultBotProperties
    bot = Bot(token=cfg.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    dp = Dispatcher(storage=MemoryStorage())

    # Регистрируем роутеры
    dp.include_router(start.router)
    dp.include_router(intent_handler.router)

    logger.info("Bot configured, starting polling...")

    try:
        await dp.start_polling(bot, skip_updates=True)
    finally:
        await jupiter_client.close()
        await jupiter_price_client.close()
        await bot.session.close()
        logger.info("Bot stopped.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nBot stopped by user.")