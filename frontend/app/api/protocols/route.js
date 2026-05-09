import { getBotApiUrl, proxyError, readJsonResponse } from "../_lib/botApi";
import { fallbackProtocols } from "../_lib/localFallback";

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
  } catch {
    return Response.json(fallbackProtocols());
  }
}
