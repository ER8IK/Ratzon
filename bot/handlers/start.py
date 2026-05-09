# bot/handlers/start.py
"""
/start, /help, /tour, /status commands.
"""

import asyncio
import logging

from aiogram import Router
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo
from aiogram.filters import Command

from bot.config import get_config
from bot.intents.parser import intent_parser
from bot.services.dispatcher import intent_dispatcher

router = Router()
logger = logging.getLogger(__name__)


WELCOME_MESSAGE = """
🔴 <b>Welcome to Ratzon</b>

<i>Safer crypto routes from plain language.</i>

What to do first:
1. Type a request in this chat or open the app.
2. Review the route, minimum amount, network, and risk notes.
3. For Smart Swap payments, check the payout address before sending funds.

━━━━━━━━━━━━━━━━━━━━━━━━
<b>Try one:</b>

💱 <code>Swap 1 SOL to USDC</code> — Solana swap
🧠 <code>Swap 50 USDT TRC20 to BTC</code> — guarded Smart Swap
💲 <code>Price of SOL</code> — market check
📈 <code>Long SOL with 2x</code> — DeFi route preview
━━━━━━━━━━━━━━━━━━━━━━━━

The app keeps Safety Check and Active Payment recovery in one place.
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
/tour — guided safety flow
/status — system status
/help — this message

<b>WebApp tools:</b>
Safety Check · Active Payment · Smart Swap

━━━━━━━━━━━━━━━━━━━━━━━━
<b>Supported tokens:</b>
SOL · USDC · USDT · BONK · WIF
JUP · RAY · ORCA · mSOL · jitoSOL
BTC · ETH · PYTH · JTO · MNGO

Powered by Jupiter, QVAC, and Ratzon safety routing.
""".strip()


@router.message(Command("start"))
async def cmd_start(message: Message):
    name = message.from_user.first_name or "there"
    await message.answer(
        f"👋 Hey <b>{name}</b>!\n\n" + WELCOME_MESSAGE,
        parse_mode="HTML",
        reply_markup=_web_app_keyboard(),
    )


@router.message(Command("help"))
async def cmd_help(message: Message):
    await message.answer(HELP_MESSAGE, parse_mode="HTML")


@router.message(Command("status"))
async def cmd_status(message: Message):
    cfg = get_config()
    web_app_status = "Configured" if cfg.web_app_url else "Not configured"
    await message.answer(
        "🟢 <b>System Status</b>\n\n"
        "• Intent Parser:   <b>Online</b>\n"
        "• Jupiter API:     <b>Online</b>\n"
        "• Risk Engine:     <b>Online</b>\n"
        "• QVAC Intent:     <b>Integrated</b>\n"
        f"• Web App:         <b>{web_app_status}</b>\n"
        "• Execution:       <b>User-approved wallet signing</b>\n\n"
        "<i>Ratzon v0.2.0 — Intent Layer for Solana</i>",
        parse_mode="HTML",
    )


@router.message(Command("tour"))
async def cmd_tour(message: Message):
    """
    Guided route walkthrough.
    """
    await message.answer(
        "🧭 <b>Ratzon Guided Flow</b>\n\n"
        "Watch how Ratzon turns intent into guarded execution steps.",
        parse_mode="HTML",
    )
    await asyncio.sleep(1.5)

    walkthrough_intents = [
        ("💱 Route #1: Wallet-controlled swap", "Swap 1 SOL to USDC"),
        ("🧠 Route #2: Cross-chain Smart Swap", "Swap 50 USDT TRC20 to BTC"),
        ("🛡 Route #3: Price + risk context", "Price of SOL"),
    ]

    for label, text in walkthrough_intents:
        await message.answer(
            f"{label}\n\n"
            f"<i>User says:</i> <code>{text}</code>",
            parse_mode="HTML",
        )
        await asyncio.sleep(0.8)
        await message.bot.send_chat_action(message.chat.id, "typing")
        await asyncio.sleep(1.2)

        intent = intent_parser.parse_sync(text)
        result = await intent_dispatcher.dispatch(intent)

        await message.answer(
            result.text,
            parse_mode="HTML",
            disable_web_page_preview=True,
        )
        await asyncio.sleep(2)

    await message.answer(
        "━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "✅ <b>Guided flow complete.</b>\n\n"
        "Now type any swap, price, safety, or DeFi route request.\n\n"
        "<code>Swap 1 SOL to USDC</code>",
        parse_mode="HTML",
    )


def _web_app_keyboard() -> InlineKeyboardMarkup | None:
    web_app_url = get_config().web_app_url
    if not web_app_url:
        return None

    return InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="Open Ratzon App",
            web_app=WebAppInfo(url=web_app_url),
        ),
    ]])
