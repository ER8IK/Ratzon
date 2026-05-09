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
import re
from urllib.parse import urlparse
from aiohttp import web

from bot.intents.models import IntentType
from bot.intents.parser import intent_parser
from bot.protocols import protocol_router
from bot.safety import address_safety
from bot.services.dispatcher import intent_dispatcher
from bot.services.orders import smart_order_store
from bot.solana.phantom import (
    build_phantom_browse_deeplink,
)

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
                "input_network": getattr(intent, "input_network", None),
                "output_network": getattr(intent, "output_network", None),
                "token": getattr(intent, "token", None),
                "protocol": getattr(intent, "protocol", None),
                "action": getattr(intent, "action", None),
                "side": getattr(intent, "side", None),
                "leverage": getattr(intent, "leverage", None),
            },
            "quote": None,
            "risk": None,
            "protocol": {
                "adapter_id": result.adapter_id,
            } if result.adapter_id else None,
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
                "route_score": _compute_route_quality(result.risk, result.quote),
                "provider_label": result.quote.provider_label,
                "input_network": result.quote.input_network,
                "output_network": result.quote.output_network,
                "min_amount": result.quote.min_amount,
                "payment_mode": result.quote.payment_mode,
                "safety_checks": result.quote.safety_checks,
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


async def handle_capabilities(request: web.Request) -> web.Response:
    return web.json_response({
        "protocols": [
            {
                "adapter_id": capability.adapter_id,
                "label": capability.label,
                "status": capability.status,
                "intents": [
                    intent_type.value for intent_type in capability.intents
                ],
                "description": capability.description,
            }
            for capability in protocol_router.capabilities()
        ],
    })


async def handle_address_safety(request: web.Request) -> web.Response:
    try:
        body = await request.json()
        address = body.get("address", "")
        expected_network = body.get("expected_network")

        report = address_safety.check(address, expected_network=expected_network)
        return web.json_response(report.as_dict())

    except json.JSONDecodeError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    except Exception as e:
        logger.error(f"Address safety API error: {e}", exc_info=True)
        return web.json_response({"error": "internal error"}, status=500)


async def handle_create_order(request: web.Request) -> web.Response:
    try:
        body = await request.json()
        client_id = body.get("client_id", "").strip()
        message = body.get("message", "").strip()
        payout_address = body.get("payout_address", "").strip()

        if not client_id:
            return web.json_response({"error": "client_id is required"}, status=400)
        if not message:
            return web.json_response({"error": "message is required"}, status=400)
        if not payout_address:
            return web.json_response({"error": "payout_address is required"}, status=400)

        intent = await intent_parser.parse(message)
        if intent.intent_type != IntentType.SWAP:
            return web.json_response(
                {"error": "Only swap intents can create smart payment orders"},
                status=400,
            )

        envelope = await protocol_router.quote_swap(intent)
        if envelope is None:
            return web.json_response({"error": "No route found"}, status=502)
        if envelope.quote.payment_mode != "deposit_address":
            return web.json_response(
                {"error": "This route signs in-wallet and does not use payment details"},
                status=400,
            )

        order = await smart_order_store.create(
            client_id=client_id,
            intent=intent,
            envelope=envelope,
            payout_address=payout_address,
        )
        return web.json_response({"order": order.as_dict()})

    except ValueError as e:
        return web.json_response({"error": str(e)}, status=400)
    except json.JSONDecodeError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    except Exception as e:
        logger.error(f"Create order API error: {e}", exc_info=True)
        return web.json_response({"error": "internal error"}, status=500)


async def handle_active_order(request: web.Request) -> web.Response:
    client_id = request.query.get("client_id", "").strip()
    if not client_id:
        return web.json_response({"error": "client_id is required"}, status=400)

    order = smart_order_store.active_for(client_id)
    return web.json_response({"order": order.as_dict() if order else None})


async def handle_get_order(request: web.Request) -> web.Response:
    order_id = request.match_info["order_id"]
    order = smart_order_store.get(order_id)
    if not order:
        return web.json_response({"error": "order not found"}, status=404)
    return web.json_response({"order": order.as_dict()})


async def handle_refresh_order(request: web.Request) -> web.Response:
    order_id = request.match_info["order_id"]
    order = await smart_order_store.refresh(order_id)
    if not order:
        return web.json_response({"error": "order not found"}, status=404)
    return web.json_response({"order": order.as_dict()})


async def handle_swap(request: web.Request) -> web.Response:
    try:
        body = await request.json()
        message = body.get("message", "").strip()
        wallet = body.get("wallet", "").strip()
        app_url = _safe_public_url(body.get("app_url"))

        if not message:
            return web.json_response(
                {"error": "message is required"}, status=400
            )

        if not wallet or not _is_valid_wallet(wallet):
            return web.json_response(
                {"error": "valid Solana wallet address is required"}, status=400
            )

        intent = await intent_parser.parse(message)
        if intent.intent_type != IntentType.SWAP:
            return web.json_response(
                {"error": "Only swap intents can be confirmed"}, status=400
            )

        envelope = await protocol_router.quote_swap(intent)
        if envelope is None:
            return web.json_response(
                {"error": "Failed to find a valid quote"}, status=502
            )

        tx_b64 = await protocol_router.prepare_swap_transaction(
            raw_quote=envelope.raw_quote,
            user_wallet=wallet,
            adapter_id=envelope.adapter_id,
        )

        if not tx_b64:
            return web.json_response(
                {"error": "Failed to prepare transaction"}, status=502
            )

        phantom_browse_url = build_phantom_browse_deeplink(
            url=app_url,
            ref=app_url,
        )

        return web.json_response({
            "transaction": tx_b64,
            "phantom_url": phantom_browse_url,
            "phantom_browse_url": phantom_browse_url,
        })

    except json.JSONDecodeError:
        return web.json_response({"error": "invalid JSON"}, status=400)
    except Exception as e:
        logger.error(f"Swap API error: {e}", exc_info=True)
        return web.json_response({"error": "internal error"}, status=500)


def _is_valid_wallet(address: str) -> bool:
    return bool(re.fullmatch(r"[1-9A-HJ-NP-Za-km-z]{32,44}", address))


def _safe_public_url(value: str | None) -> str:
    if not isinstance(value, str) or not value.strip():
        return "https://ratzon.vercel.app"

    parsed = urlparse(value.strip())
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return "https://ratzon.vercel.app"

    return f"{parsed.scheme}://{parsed.netloc}"


def _compute_route_quality(risk, quote) -> int | None:
    if not risk or not quote:
        return None

    quality = 100
    quality -= min(risk.score, 80)
    quality -= min(quote.price_impact_pct, 20) * 2
    quality -= min(quote.fees_sol * 1000, 15)
    return max(0, round(quality))


def create_app() -> web.Application:
    app = web.Application()
    app.router.add_post("/intent", handle_intent)
    app.router.add_post("/swap", handle_swap)
    app.router.add_post("/safety/address", handle_address_safety)
    app.router.add_post("/orders", handle_create_order)
    app.router.add_get("/orders/active", handle_active_order)
    app.router.add_get("/orders/{order_id}", handle_get_order)
    app.router.add_post("/orders/{order_id}/refresh", handle_refresh_order)
    app.router.add_get("/capabilities", handle_capabilities)
    app.router.add_get("/health", handle_health)

    # CORS для фронтенда
    @web.middleware
    async def cors_middleware(request, handler):
        if request.method == "OPTIONS":
            response = web.Response()
        else:
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
