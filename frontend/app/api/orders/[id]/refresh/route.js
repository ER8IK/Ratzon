import { getBotApiUrl, proxyError, readJsonResponse } from "../../../_lib/botApi";

export async function POST(_request, { params }) {
  try {
    const id = params?.id;
    if (!id) {
      return Response.json({ error: "order id is required" }, { status: 400 });
    }

    const botApiUrl = getBotApiUrl();
    const res = await fetch(`${botApiUrl}/orders/${encodeURIComponent(id)}/refresh`, {
      method: "POST",
      cache: "no-store",
    });
    const data = await readJsonResponse(res);

    if (!res.ok) {
      return proxyError(data?.error || `Bot API error (${res.status})`, res.status);
    }

    return Response.json(data);
  } catch (error) {
    console.error("Refresh order API error:", error);
    return proxyError(
      error?.message || "Bot API is unavailable. Check BOT_API_URL and bot service logs.",
    );
  }
}
