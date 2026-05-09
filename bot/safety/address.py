import re
from dataclasses import dataclass, field


NETWORK_LABELS = {
    "ERC20": "Ethereum / ERC20",
    "TRC20": "TRON / TRC20",
    "SOLANA": "Solana",
    "BTC": "Bitcoin",
    "INVALID": "Invalid",
}


@dataclass
class AddressSafetyReport:
    address: str
    detected_network: str
    detected_label: str
    valid: bool
    expected_network: str | None = None
    compatible: bool = False
    warnings: list[str] = field(default_factory=list)
    message: str = ""

    def as_dict(self) -> dict:
        return {
            "address": self.address,
            "detected_network": self.detected_network,
            "detected_label": self.detected_label,
            "valid": self.valid,
            "expected_network": self.expected_network,
            "compatible": self.compatible,
            "warnings": self.warnings,
            "message": self.message,
        }


class AddressSafety:
    def check(
        self,
        address: str,
        expected_network: str | None = None,
    ) -> AddressSafetyReport:
        normalized_address = (address or "").strip()
        expected = self.normalize_network(expected_network)
        detected = self.detect_network(normalized_address)
        valid = detected != "INVALID"
        compatible = bool(valid and (expected is None or detected == expected))
        warnings: list[str] = []

        if not valid:
            warnings.append(
                "Address is not recognized as Ethereum, Solana, Bitcoin, or TRON."
            )
        elif expected and detected != expected:
            warnings.append(
                f"Wrong network: this is {NETWORK_LABELS[detected]}, "
                f"but the selected route expects {NETWORK_LABELS[expected]}."
            )
            warnings.append(
                "Do not send funds until the destination network matches the route."
            )

        if compatible:
            message = f"Safety check passed: {NETWORK_LABELS[detected]} address."
        elif valid:
            message = f"Detected {NETWORK_LABELS[detected]} address."
        else:
            message = "Invalid or unsupported address."

        return AddressSafetyReport(
            address=normalized_address,
            detected_network=detected,
            detected_label=NETWORK_LABELS[detected],
            valid=valid,
            expected_network=expected,
            compatible=compatible,
            warnings=warnings,
            message=message,
        )

    def detect_network(self, address: str) -> str:
        if not address:
            return "INVALID"

        if re.fullmatch(r"0x[a-fA-F0-9]{40}", address):
            return "ERC20"

        if re.fullmatch(r"T[1-9A-HJ-NP-Za-km-z]{33}", address):
            return "TRC20"

        if re.fullmatch(r"(bc1[0-9a-z]{25,90}|[13][1-9A-HJ-NP-Za-km-z]{25,34})", address):
            return "BTC"

        if re.fullmatch(r"[1-9A-HJ-NP-Za-km-z]{32,44}", address):
            return "SOLANA"

        return "INVALID"

    def normalize_network(self, network: str | None) -> str | None:
        if not network:
            return None

        value = network.strip().upper().replace("-", "").replace("_", "")
        aliases = {
            "ETH": "ERC20",
            "ETHEREUM": "ERC20",
            "ERC": "ERC20",
            "ERC20": "ERC20",
            "TRON": "TRC20",
            "TRC": "TRC20",
            "TRC20": "TRC20",
            "SOL": "SOLANA",
            "SPL": "SOLANA",
            "SOLANA": "SOLANA",
            "BITCOIN": "BTC",
            "BTC": "BTC",
        }
        return aliases.get(value)


address_safety = AddressSafety()
