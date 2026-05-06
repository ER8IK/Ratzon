# bot/solana/jupiter_price.py
import logging
from typing import Optional
import aiohttp

from bot.intents.models import SwapIntent
from .jupiter import jupiter_client
from .tokens import get_mint

logger = logging.getLogger(__name__)

JUPITER_PRICE_URL = "https://api.jup.ag/price/v2"
JUPITER_PRICE_FALLBACK_OUTPUT = "USDC"


class JupiterPriceClient:

    def __init__(self):
        self._session: Optional[aiohttp.ClientSession] = None

    async def _get_session(self) -> aiohttp.ClientSession:
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=8)
            )
        return self._session

    async def close(self):
        if self._session and not self._session.closed:
            await self._session.close()

    async def get_price(self, symbol: str) -> Optional[dict]:
        mint = get_mint(symbol)

        if not mint:
            logger.warning(f"No mint for symbol: {symbol}")
            return None

        try:
            session = await self._get_session()

            # ✅ correct params format for v2
            params = [("ids", mint)]

            async with session.get(JUPITER_PRICE_URL, params=params) as resp:
                if resp.status == 404:
                    logger.warning(
                        f"Jupiter Price API returned 404 for {symbol}; falling back to quote endpoint"
                    )
                    return await self._fetch_price_via_quote(symbol)

                if resp.status != 200:
                    logger.error(f"Jupiter Price API error: {resp.status}")
                    return None

                data = await resp.json()

                logger.info(f"Jupiter RAW response for {symbol}: {data}")

                if not data or not data.get("data"):
                    logger.warning(f"Empty Jupiter response: {data}")
                    return await self._fetch_price_via_quote(symbol)

                return self._parse_price(data, symbol, mint)

        except aiohttp.ClientError as e:
            logger.error(f"Jupiter Price API connection error: {e}")
            return await self._fetch_price_via_quote(symbol)

        except Exception as e:
            logger.error(f"Unexpected error in price fetch: {e}", exc_info=True)
            return None

    async def get_prices(self, symbols: list[str]) -> dict[str, Optional[dict]]:
        mints_map = {}
        for s in symbols:
            m = get_mint(s)
            if m:
                mints_map[s] = m

        if not mints_map:
            return {}

        try:
            session = await self._get_session()
            
            # Jupiter v2 требует повторяющиеся параметры для множественных ids
            params = [("ids", mint) for mint in mints_map.values()]
            
            logger.debug(f"Jupiter API request params: {params}")

            async with session.get(JUPITER_PRICE_URL, params=params) as resp:
                if resp.status == 404:
                    logger.warning(
                        f"Jupiter Price API returned 404 for batch request; falling back to quote endpoint"
                    )
                    return await self._fetch_prices_via_quote(list(mints_map.keys()))

                if resp.status != 200:
                    error_text = await resp.text()
                    logger.error(f"Jupiter API error {resp.status}: {error_text}")
                    return {}
                
                data = await resp.json()

            logger.info(f"Jupiter Multiple RAW response: {data}")

            if not data or not data.get("data"):
                logger.warning(f"Empty Jupiter response for symbols {list(mints_map.keys())}: {data}")
                return await self._fetch_prices_via_quote(list(mints_map.keys()))

            result = {}
            for symbol, mint in mints_map.items():
                # Передаем распарсенные данные в существующий метод
                result[symbol] = self._parse_price(data, symbol, mint)
            
            logger.info(f"Parsed prices result: {result}")
            return result

        except aiohttp.ClientError as e:
            logger.error(f"Jupiter Price API connection error: {e}")
            return await self._fetch_prices_via_quote(list(mints_map.keys()))
        except Exception as e:
            logger.error(f"Error fetching multiple prices: {e}", exc_info=True)
            return {}

    def _parse_price(self, data: dict, symbol: str, mint: str) -> Optional[dict]:
        try:
            data_block = data.get("data", {})

            # 1. Прямой поиск по mint
            token_data = (
                data_block.get(mint)
                or data_block.get(symbol)
                or data_block.get(symbol.lower())
            )

            # 2. fallback по symbol
            if not token_data:
                token_data = data_block.get(symbol)

            # 3. fallback по lower symbol
            if not token_data:
                token_data = data_block.get(symbol.lower())

            if not token_data:
                logger.warning(f"No price data for {symbol} ({mint})")
                return None

            price = float(token_data.get("price", 0))

            return {
                "symbol": symbol,
                "price_usd": price,
                "mint": mint,
            }

        except Exception as e:
            logger.error(f"Error parsing price for {symbol}: {e}")
            return None

    async def _fetch_price_via_quote(self, symbol: str) -> Optional[dict]:
        """Fallback: use Jupiter quote API to estimate token price in USDC."""
        if symbol.upper() == JUPITER_PRICE_FALLBACK_OUTPUT:
            mint = get_mint(symbol)
            return {"symbol": symbol, "price_usd": 1.0, "mint": mint}

        swap_intent = SwapIntent(
            raw_text=f"price {symbol}",
            amount=1.0,
            input_token=symbol,
            output_token=JUPITER_PRICE_FALLBACK_OUTPUT,
            slippage_bps=50,
        )

        quote = await jupiter_client.get_quote(swap_intent)
        if quote is None:
            logger.warning(f"Quote fallback failed for {symbol}")
            return None

        mint = get_mint(symbol)
        return {
            "symbol": symbol,
            "price_usd": quote.output_amount,
            "mint": mint,
        }

    async def _fetch_prices_via_quote(self, symbols: list[str]) -> dict[str, Optional[dict]]:
        result: dict[str, Optional[dict]] = {}
        for symbol in symbols:
            result[symbol] = await self._fetch_price_via_quote(symbol)
        return result


# Синглтон
jupiter_price_client = JupiterPriceClient()
