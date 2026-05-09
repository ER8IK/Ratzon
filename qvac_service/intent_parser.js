// qvac_service/intent_parser.js
/**
 * QVAC LLM Intent Parser
 * 
 * Использует локальный LLM (Llama 3.2 1B) для парсинга
 * естественно-языковых интентов пользователя.
 * 
 * Это core QVAC интеграция — локальный AI без облака.
 */

import {
  loadModel,
  LLAMA_3_2_1B_INST_Q4_0,
  completion,
  unloadModel,
} from "@qvac/sdk";

const SYSTEM_PROMPT = `You are an intent parser for Ratzon — a Solana DeFi bot.
Your job is to extract structured intent from user messages.

ALWAYS respond with valid JSON only. No explanations, no markdown, just JSON.

Supported intents: swap, price, balance, compare, rate, lend, borrow, stake, perp, yield, unknown

Known tokens: SOL, USDC, USDT, BTC, ETH, BONK, WIF, JUP, RAY, ORCA, mSOL, jitoSOL, PYTH, JTO, MNGO

Rules:
- "buy X" means swap SOL → X
- "sell X" means swap X → USDC  
- "exchange", "convert", "trade" = swap
- "how much is X", "X price", "cost of X" = price
- "my balance", "my wallet", "portfolio" = balance
- "X vs Y", "compare X and Y" = compare
- "rate X to Y", "how much X for Y" = rate
- "lend", "deposit", "supply" = lend, usually protocol "kamino"
- "borrow" = borrow, usually protocol "kamino"
- "stake", "unstake" = stake, usually protocol "jito-marinade"
- "long", "short", "perp" = perp, usually protocol "drift"
- "yield", "earn", "best apy" = yield, usually protocol "kamino"

Response format:
{
  "intent": "swap|price|balance|compare|rate|lend|borrow|stake|perp|yield|unknown",
  "amount": <number or null>,
  "input_token": "<TOKEN or null>",
  "output_token": "<TOKEN or null>",
  "token": "<TOKEN or null>",
  "token_a": "<TOKEN or null>",
  "token_b": "<TOKEN or null>",
  "protocol": "jupiter|kamino|drift|jito-marinade|null",
  "action": "<action or null>",
  "side": "long|short|null",
  "leverage": <number or null>,
  "confidence": <0.0-1.0>
}`;

let modelId = null;
let isLoading = false;

/**
 * Загружает LLM модель в память.
 * Вызывается один раз при старте сервиса.
 */
export async function initModel() {
  if (modelId) return modelId;
  if (isLoading) {
    // Ждём загрузки
    while (isLoading) await new Promise(r => setTimeout(r, 100));
    return modelId;
  }

  isLoading = true;
  console.log("Loading QVAC LLM model...");

  try {
    modelId = await loadModel({
      modelSrc: LLAMA_3_2_1B_INST_Q4_0,
      modelType: "llm",
      onProgress: (p) => {
        if (p.progress % 25 === 0) {
          console.log(`Model loading: ${p.progress}%`);
        }
      },
    });
    console.log("QVAC LLM model loaded successfully");
    return modelId;
  } finally {
    isLoading = false;
  }
}

/**
 * Парсит пользовательское сообщение через LLM.
 * 
 * @param {string} userMessage - Сообщение пользователя
 * @returns {Object} - Структурированный интент
 */
export async function parseIntentWithLLM(userMessage) {
  const id = await initModel();

  const history = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  let responseText = "";

  try {
    const result = completion({
      modelId: id,
      history,
      stream: true,
      maxTokens: 150,
      temperature: 0.1, // Низкая температура для точного JSON
    });

    for await (const token of result.tokenStream) {
      responseText += token;
    }

    // Извлекаем JSON из ответа
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON in LLM response:", responseText);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    console.log(`LLM parsed: ${userMessage} → ${JSON.stringify(parsed)}`);
    return parsed;

  } catch (error) {
    console.error("LLM parsing error:", error);
    return null;
  }
}

export async function cleanup() {
  if (modelId) {
    await unloadModel({ modelId });
    modelId = null;
    console.log("QVAC LLM model unloaded");
  }
}
