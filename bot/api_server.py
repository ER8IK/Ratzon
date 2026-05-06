# bot/api_server.py
"""
HTTP API сервер для фронтенда.
Фронтенд → POST /intent → Python бот → Jupiter → JSON response

Запуск вместе с ботом:
  python -m bot.api_server
"""

import asyncio
import json
import logging
from aiohttp import web

from bot.intents.parser import intent_parser
from bot.services.dispatcher import intent_dispatcher

logger = logging.getLogger(__name__)


async def handle_intent(request: web.Request) -> web.Response:
    """POST /intent — парсит и обрабатывает интент."""
    try:
        body = await request.json()
        message = body.get("message", "").strip()

        if not message:
            return web.json_response(
                {"error": "message is required"}, status=400
            )

        # Парсим интент
        intent = await intent_parser.parse(message)

        # Диспетчеризируем
        result = await intent_dispatcher.dispatch(intent)

        # Сериализуем ответ
        response_data = {
            "text": result.text,
            "intent": {
                "type": intent.intent_type.value,
                "confidence": intent.confidence,
                "amount": getattr(intent, "amount", None),
                "input_token": getattr(intent, "input_token", None),
                "output_token": getattr(intent, "output_token", None),
            },
            "quote": None,
            "risk": None,
        }

        if result.quote:
            response_data["quote"] = {
                "input_token": result.quote.input_token,
                "output_token": result.quote.output_token,
                "input_amount": result.quote.input_amount,
                "output_amount": result.quote.output_amount,
                "price_impact_pct": result.quote.price_impact_pct,
                "route_label": result.quote.route_label,
                "fees_sol": result.quote.fees_sol,
            }

        if result.risk:
            response_data["risk"] = {
                "level": result.risk.level.value,
                "score": result.risk.score,
                "warnings": result.risk.warnings,
            }

        return web.json_response(response_data)

    except json.JSONDecodeError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    except Exception as e:
        logger.error(f"API error: {e}", exc_info=True)
        return web.json_response({"error": "internal error"}, status=500)


async def handle_health(request: web.Request) -> web.Response:
    return web.json_response({
        "status": "ok",
        "service": "ratzon-bot-api",
    })


def create_app() -> web.Application:
    app = web.Application()
    app.router.add_post("/intent", handle_intent)
    app.router.add_get("/health", handle_health)

    # CORS для фронтенда
    async def cors_middleware(request, handler):
        response = await handler(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type"
        return response

    app.middlewares.append(cors_middleware)
    return app


async def start_api_server(port: int = 8080):
    app = create_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port)
    await site.start()
    logger.info(f"Bot API server running on http://0.0.0.0:{port}")
    return runner