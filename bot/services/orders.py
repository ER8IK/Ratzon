from dataclasses import dataclass, field
from datetime import datetime, timezone
from uuid import uuid4

from bot.intents.models import SwapIntent
from bot.protocols import protocol_router
from bot.protocols.types import PaymentDetails, ProviderOrder, QuoteEnvelope
from bot.safety import AddressSafetyReport, address_safety


TERMINAL_STATUSES = {"completed", "cancelled", "expired", "failed"}


@dataclass
class SmartOrder:
    order_id: str
    client_id: str
    provider: str
    provider_label: str
    provider_order_id: str
    status: str
    intent: SwapIntent
    payout_address: str
    payout_network: str
    address_report: AddressSafetyReport
    payment_details: PaymentDetails
    quote: dict
    created_at: str
    updated_at: str
    history: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {
            "order_id": self.order_id,
            "client_id": self.client_id,
            "provider": self.provider,
            "provider_label": self.provider_label,
            "provider_order_id": self.provider_order_id,
            "status": self.status,
            "intent": {
                "amount": self.intent.amount,
                "input_token": self.intent.input_token,
                "output_token": self.intent.output_token,
                "input_network": self.intent.input_network,
                "output_network": self.intent.output_network,
                "raw_text": self.intent.raw_text,
            },
            "payout_address": self.payout_address,
            "payout_network": self.payout_network,
            "address_report": self.address_report.as_dict(),
            "payment_details": self.payment_details.as_dict(),
            "quote": self.quote,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "history": self.history,
        }


class SmartOrderStore:
    def __init__(self):
        self._orders: dict[str, SmartOrder] = {}
        self._active_by_client: dict[str, str] = {}

    async def create(
        self,
        client_id: str,
        intent: SwapIntent,
        envelope: QuoteEnvelope,
        payout_address: str,
    ) -> SmartOrder:
        expected_network = envelope.quote.output_network
        report = address_safety.check(
            payout_address,
            expected_network=expected_network,
        )
        if not report.compatible:
            raise ValueError(report.message)

        if envelope.quote.min_amount is not None and intent.amount < envelope.quote.min_amount:
            raise ValueError(
                f"Amount is below provider minimum: {envelope.quote.min_amount:g} {intent.input_token}"
            )

        provider_order: ProviderOrder = await protocol_router.create_provider_order(
            intent=intent,
            payout_address=payout_address,
            adapter_id=envelope.adapter_id,
        )
        now = self._now()
        order_id = f"rz-{uuid4().hex[:10]}"
        order = SmartOrder(
            order_id=order_id,
            client_id=client_id,
            provider=envelope.adapter_id,
            provider_label=envelope.quote.provider_label,
            provider_order_id=provider_order.provider_order_id,
            status=provider_order.status,
            intent=intent,
            payout_address=payout_address,
            payout_network=expected_network,
            address_report=report,
            payment_details=provider_order.payment_details,
            quote={
                "output_amount": envelope.quote.output_amount,
                "output_token": envelope.quote.output_token,
                "route_label": envelope.quote.route_label,
                "min_amount": envelope.quote.min_amount,
                "payment_mode": envelope.quote.payment_mode,
            },
            created_at=now,
            updated_at=now,
            history=[
                "Route selected",
                "Payout address safety check passed",
                "Payment details issued",
            ],
        )
        self._orders[order.order_id] = order
        self._active_by_client[client_id] = order.order_id
        return order

    def get(self, order_id: str) -> SmartOrder | None:
        return self._orders.get(order_id)

    def active_for(self, client_id: str) -> SmartOrder | None:
        order_id = self._active_by_client.get(client_id)
        if not order_id:
            return None
        order = self._orders.get(order_id)
        if not order or order.status in TERMINAL_STATUSES:
            return None
        return order

    async def refresh(self, order_id: str) -> SmartOrder | None:
        order = self._orders.get(order_id)
        if not order:
            return None

        order.status = await protocol_router.provider_status(
            order.provider_order_id,
            adapter_id=order.provider,
        )
        order.updated_at = self._now()
        order.history.append("Status refreshed")
        return order

    def _now(self) -> str:
        return datetime.now(timezone.utc).isoformat(timespec="seconds")


smart_order_store = SmartOrderStore()
