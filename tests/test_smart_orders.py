import asyncio

import pytest

from bot.intents.parser import intent_parser
from bot.protocols import protocol_router
from bot.services.orders import SmartOrderStore


def test_smart_order_rejects_wrong_network_address():
    async def run():
        intent = intent_parser.parse_sync("swap 50 usdt trc20 to btc")
        envelope = await protocol_router.quote_swap(intent)
        store = SmartOrderStore()

        with pytest.raises(ValueError, match="Ethereum"):
            await store.create(
                client_id="test-client",
                intent=intent,
                envelope=envelope,
                payout_address="0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
            )

    asyncio.run(run())


def test_smart_order_rejects_below_provider_minimum():
    async def run():
        intent = intent_parser.parse_sync("swap 10 usdt trc20 to btc")
        envelope = await protocol_router.quote_swap(intent)
        store = SmartOrderStore()

        with pytest.raises(ValueError, match="provider minimum"):
            await store.create(
                client_id="test-client",
                intent=intent,
                envelope=envelope,
                payout_address="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
            )

    asyncio.run(run())


def test_smart_order_recovery_and_refresh():
    async def run():
        intent = intent_parser.parse_sync("swap 50 usdt trc20 to btc")
        envelope = await protocol_router.quote_swap(intent)
        store = SmartOrderStore()

        order = await store.create(
            client_id="test-client",
            intent=intent,
            envelope=envelope,
            payout_address="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        )

        active = store.active_for("test-client")
        assert active is not None
        assert active.order_id == order.order_id
        assert active.payment_details.amount_to_send == 50
        assert active.payment_details.network == "TRC20"

        refreshed = await store.refresh(order.order_id)
        assert refreshed is not None
        assert refreshed.status == "waiting_for_deposit"
        assert "Status refreshed" in refreshed.history

    asyncio.run(run())
