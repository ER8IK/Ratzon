import { getBotApiUrl, proxyError, readJsonResponse } from "../_lib/botApi";

export async function POST(request) {
  try {
    const body = await request.json();
    const { clientId, message, payoutAddress } = body;

    const botApiUrl = getBotApiUrl();
    const res = await fetch(`${botApiUrl}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        message,
        payout_address: payoutAddress,
      }),
      cache: "no-store",
    });
    const data = await readJsonResponse(res);

    if (!res.ok) {
      return proxyError(data?.error || `Bot API error (${res.status})`, res.status);
    }

    return Response.json(data);
  } catch (error) {
    console.error("Create order API error:", error);
    return proxyError(
      error?.message || "Bot API is unavailable. Check BOT_API_URL and bot service logs.",
    );
  }
}
