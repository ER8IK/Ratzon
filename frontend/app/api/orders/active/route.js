import { getBotApiUrl, proxyError, readJsonResponse } from "../../_lib/botApi";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return Response.json({ error: "clientId is required" }, { status: 400 });
    }

    const botApiUrl = getBotApiUrl();
    const res = await fetch(
      `${botApiUrl}/orders/active?client_id=${encodeURIComponent(clientId)}`,
      { cache: "no-store" },
    );
    const data = await readJsonResponse(res);

    if (!res.ok) {
      return proxyError(data?.error || `Bot API error (${res.status})`, res.status);
    }

    return Response.json(data);
  } catch (error) {
    console.error("Active order API error:", error);
    return proxyError(
      error?.message || "Bot API is unavailable. Check BOT_API_URL and bot service logs.",
    );
  }
}
