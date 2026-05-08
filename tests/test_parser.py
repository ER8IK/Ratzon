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


if __name__ == "__main__":
    test_swap_regex_parsing()
    print("OK")
