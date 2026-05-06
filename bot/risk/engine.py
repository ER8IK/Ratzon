# bot/risk/engine.py
"""
Главный риск-движок.
Запускает все правила, агрегирует оценку.
"""

import logging
from bot.intents.models import SwapIntent, QuoteResult, RiskReport
from .rules import ALL_RULES, RiskContext

logger = logging.getLogger(__name__)


class RiskEngine:
    """
    Оценивает риск транзакции.
    
    Запускает набор независимых правил и агрегирует результат.
    """

    def evaluate(
        self,
        intent: SwapIntent,
        quote: QuoteResult | None = None,
    ) -> RiskReport:
        """
        Оценивает риск намерения с учётом котировки.
        
        Args:
            intent: Распознанный swap-интент
            quote:  Результат запроса к Jupiter (может быть None)
            
        Returns:
            RiskReport с уровнем риска, предупреждениями и Score 0-100
        """
        ctx = RiskContext(intent=intent, quote=quote)
        report = RiskReport()

        for rule in ALL_RULES:
            try:
                findings = rule(ctx)
                for warning_msg, score_delta in findings:
                    report.add_warning(warning_msg, score_delta)
                    logger.debug(
                        f"Risk rule {rule.__name__}: +{score_delta} → {warning_msg}"
                    )
            except Exception as e:
                logger.error(f"Risk rule {rule.__name__} failed: {e}", exc_info=True)

        logger.info(
            f"Risk evaluation complete: score={report.score}, level={report.level}"
        )
        return report

    def quick_check(self, intent: SwapIntent) -> RiskReport:
        """
        Быстрая проверка без котировки (только по параметрам интента).
        Используется для предварительного предупреждения.
        """
        return self.evaluate(intent, quote=None)


# Глобальный синглтон
risk_engine = RiskEngine()