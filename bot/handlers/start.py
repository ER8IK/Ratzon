# bot/handlers/start.py
"""
/start, /help и базовые команды.
"""

from aiogram import Router
from aiogram.types import Message
from aiogram.filters import Command

from bot.services.formatter import format_help

router = Router()


@router.message(Command("start"))
async def cmd_start(message: Message):
    name = message.from_user.first_name or "there"
    await message.answer(
        f"👋 Hey {name}!\n\n"
        + format_help(),
        parse_mode="HTML",
    )


@router.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(format_help(), parse_mode="HTML")


@router.message(Command("demo"))
async def cmd_demo(message: Message):
    """Запускает демо-сценарий для хакатона."""
    demo_examples = [
        "Try these examples:",
        "",
        "1️⃣ <code>Swap 1 SOL to USDC</code>",
        "2️⃣ <code>Swap 100 USDC to BONK</code>",
        "3️⃣ <code>Buy 1000 JUP with SOL</code>",
        "4️⃣ <code>Price of BONK</code>",
        "5️⃣ <code>My balance</code>",
        "",
        "Just copy and send any of these! 👆"
    ]
    await message.answer("\n".join(demo_examples), parse_mode="HTML")


@router.message(Command("status"))
async def cmd_status(message: Message):
    """Показывает статус сервисов."""
    await message.answer(
        "🟢 <b>System Status</b>\n\n"
        "• Intent Parser: <b>Online</b>\n"
        "• Jupiter API: <b>Online</b>\n"
        "• Risk Engine: <b>Online</b>\n"
        "• Execution: <b>Demo Mode</b>\n\n"
        "<i>Intent Layer for Solana v0.1.0</i>",
        parse_mode="HTML",
    )