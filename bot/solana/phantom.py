# bot/solana/phantom.py
"""
Phantom Wallet deeplink генератор.

Позволяет открыть Phantom с готовой транзакцией
одним нажатием — без кастодиального хранения ключей.
"""

import base64
import urllib.parse


def build_phantom_deeplink(
    transaction_b64: str,
    redirect_url: str = "https://ratzon.vercel.app",
) -> str:
    """
    Строит deeplink для Phantom который открывает
    готовую транзакцию на подпись.

    Args:
        transaction_b64: base64 транзакция от Jupiter
        redirect_url: куда вернуть пользователя после подписи

    Returns:
        phantom://... deeplink
    """
    params = urllib.parse.urlencode({
        "transaction": transaction_b64,
        "redirect_link": redirect_url,
    })

    return f"https://phantom.app/ul/v1/signAndSendTransaction?{params}"


def build_solflare_deeplink(transaction_b64: str) -> str:
    """Альтернатива — Solflare кошелёк."""
    params = urllib.parse.urlencode({
        "transaction": transaction_b64,
        "network": "mainnet-beta",
    })
    return f"https://solflare.com/ul/v1/signAndSendTransaction?{params}"