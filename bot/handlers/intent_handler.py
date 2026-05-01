# bot/handlers/intent_handler.py
"""
Главный aiogram handler.
Принимает любое текстовое сообщение → парсит → диспетчеризирует.
"""

import logging

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.context import FSMContext
import json

from bot.intents.parser import intent_parser
from bot.intents.models import IntentType, SwapIntent
from bot.services.dispatcher import intent_dispatcher, DispatchResult
from bot.services.formatter import format_mock_execute_result

logger = logging.getLogger(__name__)
router = Router()


@router.message(F.text & ~F.text.startswith("/"))
async def handle_intent(message: Message, state: FSMContext):
    """
    Основной handler: обрабатывает любое свободное текстовое сообщение.
    """
    user_text = message.text.strip()
    user_id = message.from_user.id

    logger.info(f"User {user_id}: {user_text!r}")

    # Показываем "печатает..." пока обрабатываем
    await message.bot.send_chat_action(message.chat.id, "typing")

    # 1. Парсим интент
    intent = intent_parser.parse(user_text)
    logger.info(f"Parsed intent: type={intent.intent_type}, confidence={intent.confidence:.2f}")

    # 2. Диспетчеризируем (запросы к Jupiter, риск-оценка)
    result: DispatchResult = await intent_dispatcher.dispatch(intent)

    # 3. Формируем клавиатуру если нужна кнопка подтверждения
    keyboard = None
    if result.show_confirm_button and result.quote is not None:
        # Сохраняем состояние для callback
        await state.update_data(
            pending_intent=_serialize_intent(result.intent),
            pending_quote=_serialize_quote(result.quote),
        )
        keyboard = _confirm_keyboard()

    # 4. Отправляем ответ
    await message.answer(
        result.text,
        parse_mode="HTML",
        reply_markup=keyboard,
        disable_web_page_preview=True,
    )


@router.callback_query(F.data == "confirm_swap")
async def handle_confirm_swap(callback: CallbackQuery, state: FSMContext):
    """
    Обработчик кнопки "✅ Confirm Swap".
    В MVP — показывает мок-транзакцию.
    """
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

    # Показываем мок-результат исполнения
    mock_result = format_mock_execute_result(intent, quote)

    await callback.message.edit_text(
        mock_result,
        parse_mode="HTML",
        disable_web_page_preview=True,
    )

    # Очищаем состояние
    await state.clear()


@router.callback_query(F.data == "cancel_swap")
async def handle_cancel_swap(callback: CallbackQuery, state: FSMContext):
    """Кнопка отмены."""
    await callback.answer("Cancelled")
    await callback.message.edit_text(
        "❌ Swap cancelled.\n\nSend a new intent whenever you're ready.",
        parse_mode="HTML",
    )
    await state.clear()


# ─── Утилиты ─────────────────────────────────────────────────────────────────

def _confirm_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Confirm Swap", callback_data="confirm_swap"),
            InlineKeyboardButton(text="❌ Cancel", callback_data="cancel_swap"),
        ]
    ])


def _serialize_intent(intent: SwapIntent) -> dict:
    """Сериализуем интент в dict для хранения в FSM state."""
    return {
        "raw_text": intent.raw_text,
        "amount": intent.amount,
        "input_token": intent.input_token,
        "output_token": intent.output_token,
        "slippage_bps": intent.slippage_bps,
    }


def _deserialize_intent(data: dict) -> SwapIntent:
    from bot.intents.models import IntentType
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