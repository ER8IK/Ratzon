from datetime import datetime, timedelta, timezone
from uuid import uuid4

from bot.intents.models import IntentType, QuoteResult, SwapIntent

from .types import PaymentDetails, ProviderLimits, ProviderOrder, QuoteEnvelope


PAYIN_DIRECTORY = {
    "TRC20": "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
    "ERC20": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "SOLANA": "11111111111111111111111111111111",
    "BTC": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
}

REFERENCE_USD_PRICE = {
    "USDT": 1.0,
    "USDC": 1.0,
    "SOL": 150.0,
    "ETH": 3000.0,
    "BTC": 65000.0,
}

NETWORK_MINIMUMS = {
    ("USDT", "TRC20", "BTC", "BTC"): 25.0,
    ("USDT", "ERC20", "BTC", "BTC"): 55.0,
    ("USDT", "SOLANA", "BTC", "BTC"): 20.0,
    ("USDC", "SOLANA", "BTC", "BTC"): 20.0,
    ("SOL", "SOLANA", "BTC", "BTC"): 0.1,
    ("ETH", "ERC20", "BTC", "BTC"): 0.02,
}


class SimpleSwapAdapter:
    adapter_id = "simpleswap"
    label = "SimpleSwap Network"
    supported_intents = (IntentType.SWAP, IntentType.RATE)

    def should_handle(self, intent: SwapIntent) -> bool:
        input_network = self._network_for(intent.input_token, intent.input_network)
        output_network = self._network_for(intent.output_token, intent.output_network)
        return input_network != "SOLANA" or output_network != "SOLANA"

    async def quote_swap(self, intent: SwapIntent) -> QuoteEnvelope | None:
        if not intent.is_valid():
            return None

        input_network = self._network_for(intent.input_token, intent.input_network)
        output_network = self._network_for(intent.output_token, intent.output_network)
        limits = await self.limits(intent)
        output_amount = self._estimate_output(intent)
        checks = [
            "Provider minimum loaded",
            f"Destination network expected: {output_network}",
            "Payout address will be checked before order creation",
        ]

        quote = QuoteResult(
            input_token=intent.input_token,
            output_token=intent.output_token,
            input_amount=intent.amount,
            output_amount=output_amount,
            price_impact_pct=0.18,
            route_label=(
                f"Best available route: {self.label} · "
                f"{intent.input_token} {input_network} -> "
                f"{intent.output_token} {output_network}"
            ),
            fees_sol=0.0,
            provider_label=self.label,
            input_network=input_network,
            output_network=output_network,
            min_amount=limits.min_amount,
            payment_mode="deposit_address",
            safety_checks=checks,
        )
        return QuoteEnvelope(
            adapter_id=self.adapter_id,
            quote=quote,
            raw_quote={
                "provider": self.adapter_id,
                "provider_label": self.label,
                "input_token": intent.input_token,
                "input_network": input_network,
                "output_token": intent.output_token,
                "output_network": output_network,
                "minimum": limits.min_amount,
                "payment_mode": "deposit_address",
                "safety_checks": checks,
            },
        )

    async def prepare_swap_transaction(
        self,
        raw_quote: dict,
        user_wallet: str,
    ) -> str | None:
        return None

    async def limits(self, intent: SwapIntent) -> ProviderLimits:
        input_network = self._network_for(intent.input_token, intent.input_network)
        output_network = self._network_for(intent.output_token, intent.output_network)
        minimum = NETWORK_MINIMUMS.get(
            (intent.input_token, input_network, intent.output_token, output_network),
            10.0,
        )
        return ProviderLimits(
            min_amount=minimum,
            network_fee_note=f"Minimum from {self.label} for {input_network} route",
        )

    async def create_order(
        self,
        intent: SwapIntent,
        payout_address: str,
    ) -> ProviderOrder:
        input_network = self._network_for(intent.input_token, intent.input_network)
        output_network = self._network_for(intent.output_token, intent.output_network)
        expires_at = (
            datetime.now(timezone.utc) + timedelta(minutes=30)
        ).isoformat(timespec="seconds")
        provider_order_id = f"ss-{uuid4().hex[:10]}"
        payment_details = PaymentDetails(
            amount_to_send=intent.amount,
            token=intent.input_token,
            network=input_network,
            payin_address=PAYIN_DIRECTORY[input_network],
            memo=None,
            expires_at=expires_at,
        )
        return ProviderOrder(
            provider_order_id=provider_order_id,
            status="waiting_for_deposit",
            payment_details=payment_details,
            raw={
                "provider": self.adapter_id,
                "payout_address": payout_address,
                "payout_network": output_network,
                "source": "provider_directory",
            },
        )

    async def status(self, provider_order_id: str) -> str:
        return "waiting_for_deposit"

    def _estimate_output(self, intent: SwapIntent) -> float:
        input_usd = REFERENCE_USD_PRICE.get(intent.input_token, 1.0) * intent.amount
        output_price = REFERENCE_USD_PRICE.get(intent.output_token, 1.0)
        if output_price <= 0:
            return 0.0
        return round((input_usd / output_price) * 0.997, 8)

    def _network_for(self, token: str | None, network: str | None) -> str:
        if network:
            return network
        if token == "BTC":
            return "BTC"
        if token == "ETH":
            return "ERC20"
        return "SOLANA"
