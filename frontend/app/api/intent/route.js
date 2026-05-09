// frontend/src/app/api/intent/route.js
/**
 * API route — прокси между фронтендом и Python ботом.
 * Фронтенд → Next.js API → Python бот → Jupiter → Response
 */

import { getBotApiUrl, proxyError, readJsonResponse } from "../_lib/botApi";
import { fallbackIntent } from "../_lib/demoFallback";

export async function POST(request) {
  let message = "";
  try {
    const body = await request.json();
    message = body?.message || "";

    if (!message) {
      return Response.json({ error: "message required" }, { status: 400 });
    }

    const botApiUrl = getBotApiUrl();

    // Прокси к Python боту
    const res = await fetch(`${botApiUrl}/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      cache: "no-store",
    });

    const data = await readJsonResponse(res);

    if (!res.ok) {
      return proxyError(data?.error || `Bot API error (${res.status})`, res.status);
    }

    return Response.json(data);

  } catch {
    return Response.json(fallbackIntent(message));
  }
}
