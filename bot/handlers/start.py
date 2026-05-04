# bot/handlers/start.py
"""
/start, /help, /demo, /status команды.
День 1: красивый онбординг + авто-демо для судей.
"""

import asyncio
import logging

from aiogram import Router
from aiogram.types import Message
from aiogram.filters import Command

from bot.intents.parser import intent_parser
from bot.services.dispatcher import intent_dispatcher

router = Router()
logger = logging.getLogger(__name__)


WELCOME_MESSAGE = """
🔴 <b>Welcome to Ratzon</b>

<i>The Intent Execution Layer for Solana.</i>

You don't need to know how DeFi works.
Just say what you want — Ratzon handles the rest.

━━━━━━━━━━━━━━━━━━━━━━━━
<b>Try these right now:</b>

💱 <code>Swap 1 SOL to USDC</code>
💱 <code>Swap 100 USDC to BONK</code>
💲 <code>Price of SOL</code>
💲 <code>Price of BONK</code>
💼 <code>My balance</code>
━━━━━━━━━━━━━━━━━━━━━━━━

Type anything in plain English 👇
""".strip()

HELP_MESSAGE = """
🔴 <b>Ratzon — Command Reference</b>

━━━━━━━━━━━━━━━━━━━━━━━━
<b>Swap tokens:</b>
<code>Swap 1 SOL to USDC</code>
<code>Swap 100 USDC to BONK</code>
<code>Convert 0.5 ETH to SOL</code>
<code>Buy 1000 JUP with SOL</code>
<code>Sell 2 SOL</code>

<b>Check prices:</b>
<code>Price of BONK</code>
<code>How much is SOL</code>
<code>SOL price</code>
<code>Rate SOL to USDC</code>

<b>Portfolio:</b>
<code>My balance</code>
<code>Show my wallet</code>

━━━━━━━━━━━━━━━━━━━━━━━━
<b>Commands:</b>
/demo — see Ratzon in action
/status — system status
/help — this message

━━━━━━━━━━━━━━━━━━━━━━━━
<b>Supported tokens:</b>
SOL · USDC · USDT · BONK · WIF
JUP · RAY · ORCA · mSOL · jitoSOL
BTC · ETH · PYTH · JTO · MNGO

Powered by Jupiter Aggregator 🪐
""".strip()


@router.message(Command("start"))
async def cmd_start(message: Message):
    name = message.from_user.first_name or "there"
    await message.answer(
        f"👋 Hey <b>{name}</b>!\n\n" + WELCOME_MESSAGE,
        parse_mode="HTML",
    )


@router.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(HELP_MESSAGE, parse_mode="HTML")


@router.message(Command("status"))
async def cmd_status(message: Message):
    await message.answer(
        "🟢 <b>System Status</b>\n\n"
        "• Intent Parser:   <b>Online</b>\n"
        "• Jupiter API:     <b>Online</b>\n"
        "• Risk Engine:     <b>Online</b>\n"
        "• Execution:       <b>Demo Mode</b>\n\n"
        "<i>Ratzon v0.2.0 — Intent Layer for Solana</i>",
        parse_mode="HTML",
    )


@router.message(Command("demo"))
async def cmd_demo(message: Message):
    """
    Автоматически демонстрирует 3 сценария судьям.
    """
    await message.answer(
        "🎬 <b>Ratzon Demo</b>\n\n"
        "Watch how Ratzon handles different intents...",
        parse_mode="HTML",
    )
    await asyncio.sleep(1.5)

    demo_intents = [
        ("💱 Intent #1: Standard swap", "Swap 1 SOL to USDC"),
        ("🎰 Intent #2: Meme token (risk warning)", "Swap 100 USDC to BONK"),
        ("💲 Intent #3: Price check", "Price of SOL"),
    ]

    for label, text in demo_intents:
        await message.answer(
            f"{label}\n\n"
            f"<i>User says:</i> <code>{text}</code>",
            parse_mode="HTML",
        )
        await asyncio.sleep(0.8)
        await message.bot.send_chat_action(message.chat.id, "typing")
        await asyncio.sleep(1.2)

        intent = intent_parser.parse(text)
        result = await intent_dispatcher.dispatch(intent)

        await message.answer(
            result.text,
            parse_mode="HTML",
            disable_web_page_preview=True,
        )
        await asyncio.sleep(2)

    await message.answer(
        "━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "✅ <b>Demo complete!</b>\n\n"
        "Now try it yourself — just type any swap or price request.\n\n"
        "<code>Swap 1 SOL to USDC</code>",
        parse_mode="HTML",
    )