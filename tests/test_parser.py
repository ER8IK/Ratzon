from bot.intents.parser import intent_parser
from bot.intents.models import IntentType


def test_swap_regex_parsing():
    examples = [
        "Swap 3 SOL to USDC",
        "swap 1 sol to usdc",
        "convert 5 bonk to sol",
    ]

    for text in examples:
        intent = intent_parser.parse_sync(text)
        assert intent.intent_type == IntentType.SWAP, f"Expected SWAP for: {text}"
        assert intent.amount is not None and intent.amount > 0, f"Invalid amount for: {text}"
        assert intent.input_token is not None, f"Missing input_token for: {text}"
        assert intent.output_token is not None, f"Missing output_token for: {text}"


def test_swap_regex_parses_network():
    intent = intent_parser.parse_sync("swap 50 usdt trc20 to btc")

    assert intent.intent_type == IntentType.SWAP
    assert intent.amount == 50
    assert intent.input_token == "USDT"
    assert intent.input_network == "TRC20"
    assert intent.output_token == "BTC"
    assert intent.output_network == "BTC"


if __name__ == "__main__":
    test_swap_regex_parsing()
    test_swap_regex_parses_network()
    print("OK")
