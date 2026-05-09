from bot.intents.models import IntentType, QuoteResult, SwapIntent
from bot.risk.engine import risk_engine


def test_dynamic_minimum_warning():
    intent = SwapIntent(
        raw_text="swap 10 usdt trc20 to btc",
        intent_type=IntentType.SWAP,
        confidence=1.0,
        amount=10,
        input_token="USDT",
        output_token="BTC",
        input_network="TRC20",
        output_network="BTC",
    )
    quote = QuoteResult(
        input_token="USDT",
        output_token="BTC",
        input_amount=10,
        output_amount=0.00015,
        price_impact_pct=0.1,
        route_label="SimpleSwap",
        fees_sol=0,
        provider_label="SimpleSwap Network",
        input_network="TRC20",
        output_network="BTC",
        min_amount=25,
        payment_mode="deposit_address",
    )

    report = risk_engine.evaluate(intent, quote)

    assert report.score >= 50
    assert any("Below provider minimum" in warning for warning in report.warnings)


if __name__ == "__main__":
    test_dynamic_minimum_warning()
    print("OK")
