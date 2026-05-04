# bot/solana/jupiter_price.py
import logging
from typing import Optional
import aiohttp

from .tokens import get_mint

logger = logging.getLogger(__name__)

JUPITER_PRICE_URL = "https://api.jup.ag/price/v2"


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

            # ✅ FIX: correct params format for v2
            params = [("ids", mint)]

            async with session.get(JUPITER_PRICE_URL, params=params) as resp:
                if resp.status != 200:
                    logger.error(f"Jupiter Price API error: {resp.status}")
                    return None

                data = await resp.json()

                logger.info(f"Jupiter RAW response for {symbol}: {data}")

                if not data or not data.get("data"):
                    logger.warning(f"Empty Jupiter response: {data}")
                    return None

                return self._parse_price(data, symbol, mint)

        except aiohttp.ClientError as e:
            logger.error(f"Jupiter Price API connection error: {e}")
            return None

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
            
            # ✅ ИСПРАВЛЕНИЕ: Jupiter v2 ждет ids через запятую: id1,id2,id3
            ids_param = ",".join(mints_map.values())
            params = {"ids": ids_param}

            async with session.get(JUPITER_PRICE_URL, params=params) as resp:
                if resp.status != 200:
                    error_text = await resp.text()
                    logger.error(f"Jupiter API error {resp.status}: {error_text}")
                    return {}
                
                data = await resp.json()
                logger.info(f"Jupiter Multiple RAW response: {data}")

            result = {}
            for symbol, mint in mints_map.items():
                # Передаем распарсенные данные в существующий метод
                result[symbol] = self._parse_price(data, symbol, mint)
            
            return result

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


# Синглтон
jupiter_price_client = JupiterPriceClient()
