# bot/handlers/intent_handler.py
"""
Главный aiogram handler.
День 4: добавлена обработка голосовых сообщений через QVAC Whisper.
"""

import logging
import io

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.context import FSMContext

from bot.intents.parser import intent_parser
from bot.intents.llm_parser import llm_parser
from bot.intents.models import IntentType, SwapIntent
from bot.services.dispatcher import intent_dispatcher, DispatchResult
from bot.services.formatter import format_mock_execute_result

logger = logging.getLogger(__name__)
router = Router()


# ── Text messages ─────────────────────────────────────────────────────────────

@router.message(F.text & ~F.text.startswith("/"))
async def handle_intent(message: Message, state: FSMContext):
    user_text = message.text.strip()
    user_id = message.from_user.id
    logger.info(f"User {user_id}: {user_text!r}")

    await message.bot.send_chat_action(message.chat.id, "typing")

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
    quote_data = data.get("pending_quote")

    if not intent_data or not quote_data:
        await callback.message.edit_text(
            "⚠️ Session expired. Please send your swap request again."
        )
        return

    intent = _deserialize_intent(intent_data)
    quote = _deserialize_quote(quote_data)

    mock_result = format_mock_execute_result(intent, quote)
    await callback.message.edit_text(
        mock_result, parse_mode="HTML", disable_web_page_preview=True,
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