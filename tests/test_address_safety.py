from bot.safety.address import address_safety


def test_detects_wrong_erc20_for_btc_route():
    report = address_safety.check(
        "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
        expected_network="BTC",
    )

    assert report.valid
    assert report.detected_network == "ERC20"
    assert not report.compatible
    assert report.warnings


def test_accepts_btc_for_btc_route():
    report = address_safety.check(
        "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        expected_network="BTC",
    )

    assert report.valid
    assert report.detected_network == "BTC"
    assert report.compatible


def test_detects_tron():
    report = address_safety.check("TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE")

    assert report.valid
    assert report.detected_network == "TRC20"


if __name__ == "__main__":
    test_detects_wrong_erc20_for_btc_route()
    test_accepts_btc_for_btc_route()
    test_detects_tron()
    print("OK")
