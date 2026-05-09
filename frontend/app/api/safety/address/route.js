import { getBotApiUrl, proxyError, readJsonResponse } from "../../_lib/botApi";

export async function POST(request) {
  try {
    const body = await request.json();
    const { address, expectedNetwork } = body;

    const botApiUrl = getBotApiUrl();
    const res = await fetch(`${botApiUrl}/safety/address`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        expected_network: expectedNetwork,
      }),
      cache: "no-store",
    });
    const data = await readJsonResponse(res);

    if (!res.ok) {
      return proxyError(data?.error || `Bot API error (${res.status})`, res.status);
    }

    return Response.json(data);
  } catch (error) {
    console.error("Address safety API error:", error);
    return proxyError(
      error?.message || "Bot API is unavailable. Check BOT_API_URL and bot service logs.",
    );
  }
}
