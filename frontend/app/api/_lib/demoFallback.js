const NETWORK_LABELS = {
  ERC20: "Ethereum / ERC20",
  TRC20: "TRON / TRC20",
  SOLANA: "Solana",
  BTC: "Bitcoin",
  INVALID: "Invalid",
};

const DEMO_PAYIN = {
  TRC20: "TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE",
  ERC20: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  SOLANA: "11111111111111111111111111111111",
  BTC: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
};

const PRICE = {
  USDT: 1,
  USDC: 1,
  SOL: 150,
  ETH: 3000,
  BTC: 65000,
};

export function fallbackProtocols() {
  return {
    protocols: [
      {
        adapter_id: "jupiter",
        label: "Jupiter",
        status: "live",
        intents: ["swap", "rate"],
        description: "Swap routing and token rates across Solana DEX liquidity.",
      },
      {
        adapter_id: "simpleswap",
        label: "SimpleSwap Network",
        status: "demo",
        intents: ["swap", "rate"],
        description: "Cross-chain smart route preview with payment details and address safety.",
      },
      {
        adapter_id: "drift",
        label: "Drift",
        status: "preview",
        intents: ["perp"],
        description: "Read-only Drift / Solana DeFi preview.",
      },
      {
        adapter_id: "kamino",
        label: "Kamino",
        status: "preview",
        intents: ["lend", "borrow", "yield"],
        description: "Future lend, borrow, and vault strategy intents.",
      },
    ],
  };
}

export function fallbackIntent(message) {
  const text = String(message || "").trim();
  const swap = parseSwap(text);

  if (swap) {
    return buildSwapResponse(text, swap);
  }

  if (/drift|long|short|perp|deposit|earn/i.test(text)) {
    return {
      text:
        "🧭 Drift / Solana DeFi preview\n\nAction recognized. Market data is read-only in demo mode; execution is gated behind safety checks.",
      intent: {
        type: /long|short|perp/i.test(text) ? "perp" : "yield",
        confidence: 0.82,
        amount: null,
        input_token: null,
        output_token: null,
        input_network: null,
        output_network: null,
        token: "SOL",
        protocol: "drift",
        action: "preview",
        side: /short/i.test(text) ? "short" : /long/i.test(text) ? "long" : null,
        leverage: /2x/i.test(text) ? 2 : null,
      },
      quote: null,
      risk: null,
      protocol: { adapter_id: "drift" },
    };
  }

  return {
    text:
      "🤔 Intent not recognized\n\nTry: swap 50 usdt trc20 to btc, check a BTC address, or long SOL with 2x.",
    intent: { type: "unknown", confidence: 0, amount: null },
    quote: null,
    risk: null,
    protocol: null,
  };
}

export function checkAddress(address, expectedNetwork) {
  const normalized = String(address || "").trim();
  const expected = normalizeNetwork(expectedNetwork);
  const detected = detectNetwork(normalized);
  const valid = detected !== "INVALID";
  const compatible = Boolean(valid && (!expected || detected === expected));
  const warnings = [];

  if (!valid) {
    warnings.push("Address is not recognized as Ethereum, Solana, Bitcoin, or TRON.");
  } else if (expected && detected !== expected) {
    warnings.push(
      `Wrong network: this is ${NETWORK_LABELS[detected]}, but this route expects ${NETWORK_LABELS[expected]}.`,
    );
    warnings.push("Do not send funds until the destination network matches the route.");
  }

  return {
    address: normalized,
    detected_network: detected,
    detected_label: NETWORK_LABELS[detected],
    valid,
    expected_network: expected,
    compatible,
    warnings,
    message: compatible
      ? `Safety check passed: ${NETWORK_LABELS[detected]} address.`
      : valid
        ? `Detected ${NETWORK_LABELS[detected]} address.`
        : "Invalid or unsupported address.",
  };
}

export function createFallbackOrder({ clientId, message, payoutAddress }) {
  const intentResponse = fallbackIntent(message);
  const quote = intentResponse.quote;
  if (!quote || quote.payment_mode !== "deposit_address") {
    throw new Error("Create a cross-chain Smart Swap first.");
  }

  const report = checkAddress(payoutAddress, quote.output_network);
  if (!report.compatible) {
    throw new Error(report.message);
  }

  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 60 * 1000);
  const order = {
    order_id: `rz-demo-${Math.random().toString(16).slice(2, 10)}`,
    client_id: clientId,
    provider: "simpleswap",
    provider_label: "SimpleSwap Network",
    provider_order_id: `ss-demo-${Math.random().toString(16).slice(2, 10)}`,
    status: "waiting_for_deposit",
    intent: intentResponse.intent,
    payout_address: payoutAddress,
    payout_network: quote.output_network,
    address_report: report,
    payment_details: {
      amount_to_send: intentResponse.intent.amount,
      token: intentResponse.intent.input_token,
      network: quote.input_network,
      payin_address: DEMO_PAYIN[quote.input_network] || DEMO_PAYIN.TRC20,
      memo: null,
      expires_at: expires.toISOString(),
    },
    quote: {
      output_amount: quote.output_amount,
      output_token: quote.output_token,
      route_label: quote.route_label,
      min_amount: quote.min_amount,
      payment_mode: quote.payment_mode,
    },
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    history: [
      "Route selected",
      "Payout address safety check passed",
      "Payment details issued",
    ],
  };

  store().set(clientId, order);
  return { order };
}

export function getFallbackActiveOrder(clientId) {
  return { order: store().get(clientId) || null };
}

export function refreshFallbackOrder(clientIdOrOrderId) {
  const orders = store();
  const order =
    orders.get(clientIdOrOrderId) ||
    Array.from(orders.values()).find((item) => item.order_id === clientIdOrOrderId);

  if (!order) return { order: null };

  order.updated_at = new Date().toISOString();
  order.history = [...(order.history || []), "Status refreshed"];
  return { order };
}

function buildSwapResponse(rawText, swap) {
  const crossChain = swap.input_network !== "SOLANA" || swap.output_network !== "SOLANA";
  const minAmount = crossChain ? minimumFor(swap) : 0;
  const outputAmount = estimateOutput(swap);
  const belowMinimum = crossChain && swap.amount < minAmount;
  const riskWarnings = belowMinimum
    ? [`🔴 Below provider minimum: send at least ${minAmount} ${swap.input_token}`]
    : crossChain
      ? [`✅ Provider minimum passed: ${minAmount} ${swap.input_token}`]
      : [];

  return {
    text: crossChain
      ? "🧠 Smart Route\n\nBest available route found. Safety checks passed before payment details."
      : "🔄 Intent recognized\n\nSolana route preview loaded.",
    intent: {
      type: "swap",
      confidence: 0.95,
      amount: swap.amount,
      input_token: swap.input_token,
      output_token: swap.output_token,
      input_network: swap.input_network,
      output_network: swap.output_network,
      token: null,
      protocol: null,
      action: null,
      side: null,
      leverage: null,
    },
    quote: {
      input_token: swap.input_token,
      output_token: swap.output_token,
      input_amount: swap.amount,
      output_amount: outputAmount,
      price_impact_pct: crossChain ? 0.18 : 0.04,
      route_label: crossChain
        ? `Best available route: SimpleSwap Network · ${swap.input_token} ${swap.input_network} -> ${swap.output_token} ${swap.output_network}`
        : `${swap.input_token} → [Jupiter] → ${swap.output_token}`,
      fees_sol: crossChain ? 0 : 0.000005,
      route_score: belowMinimum ? 35 : 94,
      provider_label: crossChain ? "SimpleSwap Network" : "Jupiter",
      input_network: swap.input_network,
      output_network: swap.output_network,
      min_amount: crossChain ? minAmount : null,
      payment_mode: crossChain ? "deposit_address" : "wallet_signature",
      safety_checks: crossChain
        ? [
            "Provider minimum loaded",
            `Destination network expected: ${swap.output_network}`,
            "Payout address will be checked before order creation",
          ]
        : ["Wallet signature required"],
    },
    risk: {
      level: belowMinimum ? "🔴 High" : "🟢 Low",
      score: belowMinimum ? 55 : 0,
      warnings: riskWarnings,
    },
    protocol: {
      adapter_id: crossChain ? "simpleswap" : "jupiter",
    },
    raw_text: rawText,
  };
}

function parseSwap(text) {
  const match = text.toLowerCase().match(
    /(?:swap|exchange|trade|convert)\s+(\d+(?:[.,]\d+)?)\s+(\w+)(?:\s+(erc20|trc20|tron|solana|spl|ethereum|bitcoin|btc))?\s+(?:to|for|into|->)\s+(\w+)(?:\s+(erc20|trc20|tron|solana|spl|ethereum|bitcoin|btc|native))?/,
  );
  if (!match) return null;

  const [, amount, inputRaw, inputNetworkRaw, outputRaw, outputNetworkRaw] = match;
  const inputToken = normalizeToken(inputRaw);
  const outputToken = normalizeToken(outputRaw);
  return {
    amount: Number(amount.replace(",", ".")),
    input_token: inputToken,
    output_token: outputToken,
    input_network: normalizeNetwork(inputNetworkRaw) || defaultNetwork(inputToken),
    output_network: normalizeNetwork(outputNetworkRaw) || defaultNetwork(outputToken),
  };
}

function normalizeToken(value) {
  const aliases = {
    tether: "USDT",
    usdt: "USDT",
    usdc: "USDC",
    sol: "SOL",
    solana: "SOL",
    btc: "BTC",
    bitcoin: "BTC",
    eth: "ETH",
    ethereum: "ETH",
  };
  return aliases[String(value || "").toLowerCase()] || String(value || "").toUpperCase();
}

function normalizeNetwork(value) {
  const aliases = {
    erc20: "ERC20",
    eth: "ERC20",
    ethereum: "ERC20",
    trc20: "TRC20",
    tron: "TRC20",
    sol: "SOLANA",
    spl: "SOLANA",
    solana: "SOLANA",
    btc: "BTC",
    bitcoin: "BTC",
    native: "BTC",
  };
  return aliases[String(value || "").toLowerCase()] || null;
}

function defaultNetwork(token) {
  if (token === "BTC") return "BTC";
  if (token === "ETH") return "ERC20";
  return "SOLANA";
}

function minimumFor(swap) {
  if (swap.input_token === "USDT" && swap.input_network === "TRC20" && swap.output_token === "BTC") {
    return 25;
  }
  if (swap.input_token === "USDT" && swap.input_network === "ERC20" && swap.output_token === "BTC") {
    return 55;
  }
  return 10;
}

function estimateOutput(swap) {
  const usd = (PRICE[swap.input_token] || 1) * swap.amount;
  const outputPrice = PRICE[swap.output_token] || 1;
  return Number(((usd / outputPrice) * 0.997).toFixed(8));
}

function detectNetwork(address) {
  if (!address) return "INVALID";
  if (/^0x[a-fA-F0-9]{40}$/.test(address)) return "ERC20";
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) return "TRC20";
  if (/^(bc1[0-9a-z]{25,90}|[13][1-9A-HJ-NP-Za-km-z]{25,34})$/.test(address)) return "BTC";
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return "SOLANA";
  return "INVALID";
}

function store() {
  if (!globalThis.__ratzonDemoOrders) {
    globalThis.__ratzonDemoOrders = new Map();
  }
  return globalThis.__ratzonDemoOrders;
}
