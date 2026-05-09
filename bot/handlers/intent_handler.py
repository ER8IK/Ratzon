# bot/handlers/intent_handler.py
"""
Главный aiogram handler.
День 4: добавлена обработка голосовых сообщений через QVAC Whisper.
"""

import logging
import io
import re
from urllib.parse import urlencode

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.context import FSMContext

from bot.config import get_config
from bot.intents.parser import intent_parser
from bot.intents.llm_parser import llm_parser
from bot.intents.models import IntentType, SwapIntent
from bot.protocols import protocol_router
from bot.services.dispatcher import intent_dispatcher, DispatchResult
from bot.services.formatter import format_mock_execute_result

logger = logging.getLogger(__name__)
router = Router()


# ── Text messages ─────────────────────────────────────────────────────────────

@router.message(F.text & F.state == "waiting_for_wallet")
async def handle_wallet_entry(message: Message, state: FSMContext):
    user_text = message.text.strip()
    await _process_wallet_entry(message, state, user_text)


async def _process_wallet_entry(message: Message, state: FSMContext, wallet_address: str):
    user_id = message.from_user.id
    logger.info(f"User {user_id}: wallet entry received")

    await message.bot.send_chat_action(message.chat.id, "typing")

    data = await state.get_data()
    if not data.get("pending_intent") or not data.get("pending_quote_raw"):
        await message.answer(
            "⚠️ No pending swap found. Send your swap request again.",
            parse_mode="HTML",
        )
        await state.clear()
        return

    if not _is_valid_wallet(wallet_address):
        await message.answer(
            "❌ Invalid wallet address. Please send a valid Solana wallet address.",
            parse_mode="HTML",
        )
        return

    await state.update_data(user_wallet=wallet_address)

    await message.answer(
        "✅ Wallet address saved. Now click <b>Confirm Swap</b> in the previous message to continue.",
        parse_mode="HTML",
        reply_markup=_confirm_keyboard(),
    )


@router.message(F.text & ~F.text.startswith("/"))
async def handle_intent(message: Message, state: FSMContext):
    user_text = message.text.strip()
    user_id = message.from_user.id
    logger.info(f"User {user_id}: {user_text!r}")

    await message.bot.send_chat_action(message.chat.id, "typing")

    current_state = await state.get_state()
    if current_state == "waiting_for_wallet":
        logger.info(f"User {user_id}: handling wallet entry in state {current_state}")
        await _process_wallet_entry(message, state, user_text)
        return

    # Гибридный парсер: regex → QVAC LLM если нужно
    intent = await intent_parser.parse(user_text)
    logger.info(
        f"Parsed intent: type={intent.intent_type}, "
        f"confidence={intent.confidence:.2f}"
    )

    result: DispatchResult = await intent_dispatcher.dispatch(intent)

    keyboard = None
    if result.show_confirm_button and result.quote is not None:
        await state.update_data(
            pending_intent=_serialize_intent(result.intent),
            pending_quote=_serialize_quote(result.quote),
            pending_quote_raw=result.quote_raw,
            pending_adapter_id=result.adapter_id,
        )
        keyboard = _confirm_keyboard()

    await message.answer(
        result.text,
        parse_mode="HTML",
        reply_markup=keyboard,
        disable_web_page_preview=True,
    )


# ── Voice messages (QVAC STT) ─────────────────────────────────────────────────

@router.message(F.voice)
async def handle_voice(message: Message, state: FSMContext):
    """
    Обрабатывает голосовые сообщения через QVAC Whisper STT.
    Пользователь говорит → Whisper → текст → парсер → результат.
    """
    user_id = message.from_user.id
    logger.info(f"User {user_id}: voice message ({message.voice.duration}s)")

    await message.bot.send_chat_action(message.chat.id, "typing")

    # Проверяем доступность QVAC
    qvac_ok = await llm_parser.is_available()

    if not qvac_ok:
        await message.answer(
            "🎤 <b>Voice input</b>\n\n"
            "Voice recognition is not available right now.\n"
            "Please type your request instead.\n\n"
            "Example: <code>Swap 1 SOL to USDC</code>",
            parse_mode="HTML",
        )
        return

    # Скачиваем аудио из Telegram
    voice_file = await message.bot.get_file(message.voice.file_id)
    audio_bytes = await message.bot.download_file(voice_file.file_path)

    if isinstance(audio_bytes, io.BytesIO):
        audio_bytes = audio_bytes.read()

    # Транскрибируем через QVAC Whisper
    await message.answer("🎤 <i>Listening...</i>", parse_mode="HTML")

    transcribed = await llm_parser.transcribe(audio_bytes)

    if not transcribed:
        await message.answer(
            "❌ Couldn't understand the audio. Please try again or type your request.",
            parse_mode="HTML",
        )
        return

    # Показываем что распознали
    await message.answer(
        f"🎤 <b>Heard:</b> <i>\"{transcribed}\"</i>",
        parse_mode="HTML",
    )

    # Обрабатываем как текстовый интент
    intent = await intent_parser.parse(transcribed)
    result = await intent_dispatcher.dispatch(intent)

    keyboard = None
    if result.show_confirm_button and result.quote is not None:
        await state.update_data(
            pending_intent=_serialize_intent(result.intent),
            pending_quote=_serialize_quote(result.quote),
            pending_quote_raw=result.quote_raw,
            pending_adapter_id=result.adapter_id,
        )
        keyboard = _confirm_keyboard()

    await message.answer(
        result.text,
        parse_mode="HTML",
        reply_markup=keyboard,
        disable_web_page_preview=True,
    )


# ── Callbacks ─────────────────────────────────────────────────────────────────

@router.callback_query(F.data == "confirm_swap")
async def handle_confirm_swap(callback: CallbackQuery, state: FSMContext):
    await callback.answer()

    data = await state.get_data()
    intent_data = data.get("pending_intent")
    quote_raw = data.get("pending_quote_raw")
    adapter_id = data.get("pending_adapter_id")
    user_wallet = data.get("user_wallet")

    if not intent_data or not quote_raw:
        await callback.message.edit_text(
            "⚠️ Session expired. Send your swap request again."
        )
        return

    # Если кошелька нет — просим его ввести
    if not user_wallet:
        await callback.message.edit_text(
            "🔑 <b>Enter your wallet address to continue:</b>\n\n"
            "Send your Solana wallet address and I'll prepare the transaction.\n\n"
            "<i>Your funds stay in your wallet — Ratzon never holds your keys.</i>",
            parse_mode="HTML",
        )
        await state.set_state("waiting_for_wallet")
        return

    # Получаем swap транзакцию от выбранного protocol adapter.
    await callback.message.edit_text(
        "⏳ <b>Preparing transaction...</b>",
        parse_mode="HTML",
    )

    from bot.solana.phantom import build_phantom_browse_deeplink, build_solflare_deeplink

    tx_b64 = await protocol_router.prepare_swap_transaction(
        raw_quote=quote_raw,
        user_wallet=user_wallet,
        adapter_id=adapter_id,
    )

    if not tx_b64:
        await callback.message.edit_text(
            "❌ <b>Failed to prepare transaction.</b>\n\n"
            "Please try again.",
            parse_mode="HTML",
        )
        return

    intent = _deserialize_intent(intent_data)
    phantom_url = build_phantom_browse_deeplink(
        url=_web_app_intent_url(intent.raw_text),
        ref=get_config().web_app_url or "https://ratzon.vercel.app",
    )

    from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton
    keyboard = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="👻 Continue in Phantom Browser",
            url=phantom_url,
        ),
        InlineKeyboardButton(
            text="🌊 Open in Solflare",
            url=build_solflare_deeplink(tx_b64),
        ),
    ]])

    await callback.message.edit_text(
        f"✅ <b>Transaction Ready</b>\n\n"
        f"Swap <b>{intent.amount:g} {intent.input_token}</b> → "
        f"<b>{intent.output_token}</b>\n\n"
        f"Open Ratzon in Phantom Browser to connect, prepare, and approve from the wallet app.\n\n"
        f"<i>⚠️ Always verify the transaction details in your wallet before approving.</i>",
        parse_mode="HTML",
        reply_markup=keyboard,
    )

    await state.clear()


@router.callback_query(F.data == "cancel_swap")
async def handle_cancel_swap(callback: CallbackQuery, state: FSMContext):
    await callback.answer("Cancelled")
    await callback.message.edit_text(
        "❌ Swap cancelled.\n\nSend a new intent whenever you're ready.",
        parse_mode="HTML",
    )
    await state.clear()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _confirm_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(text="✅ Confirm Swap", callback_data="confirm_swap"),
        InlineKeyboardButton(text="❌ Cancel", callback_data="cancel_swap"),
    ]])


def _serialize_intent(intent) -> dict:
    return {
        "raw_text": intent.raw_text,
        "amount": intent.amount,
        "input_token": intent.input_token,
        "output_token": intent.output_token,
        "slippage_bps": getattr(intent, "slippage_bps", 50),
    }


def _is_valid_wallet(address: str) -> bool:
    # Простая проверка Solana адреса: base58 строка длиной 32-44 символа.
    return bool(re.fullmatch(r"[1-9A-HJ-NP-Za-km-z]{32,44}", address))


def _deserialize_intent(data: dict) -> SwapIntent:
    return SwapIntent(
        raw_text=data["raw_text"],
        intent_type=IntentType.SWAP,
        confidence=1.0,
        amount=data["amount"],
        input_token=data["input_token"],
        output_token=data["output_token"],
        slippage_bps=data.get("slippage_bps", 50),
    )


def _web_app_intent_url(raw_text: str) -> str:
    web_app_url = get_config().web_app_url or "https://ratzon.vercel.app"
    separator = "&" if "?" in web_app_url else "?"
    return f"{web_app_url}{separator}{urlencode({'intent': raw_text})}"


def _serialize_quote(quote) -> dict:
    return {
        "input_token": quote.input_token,
        "output_token": quote.output_token,
        "input_amount": quote.input_amount,
        "output_amount": quote.output_amount,
        "price_impact_pct": quote.price_impact_pct,
        "route_label": quote.route_label,
        "fees_sol": quote.fees_sol,
    }


def _deserialize_quote(data: dict):
    from bot.intents.models import QuoteResult
    return QuoteResult(**data)
