import { getBotApiUrl, proxyError, readJsonResponse } from "../_lib/botApi";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const botApiUrl = getBotApiUrl();
    const res = await fetch(`${botApiUrl}/capabilities`, {
      cache: "no-store",
    });
    const data = await readJsonResponse(res);

    if (!res.ok) {
      return proxyError(data?.error || `Bot API error (${res.status})`, res.status);
    }

    return Response.json(data);
  } catch (error) {
    console.error("Protocols API error:", error);
    return proxyError(
      error?.message || "Bot API is unavailable. Check BOT_API_URL and bot service logs.",
    );
  }
}
