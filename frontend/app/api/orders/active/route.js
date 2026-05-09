import { getBotApiUrl, proxyError, readJsonResponse } from "../../_lib/botApi";
import { getFallbackActiveOrder } from "../../_lib/localFallback";

export const dynamic = "force-dynamic";

export async function GET(request) {
  let clientId = "";
  try {
    const { searchParams } = new URL(request.url);
    clientId = searchParams.get("clientId") || "";

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
  } catch {
    return Response.json(getFallbackActiveOrder(clientId));
  }
}
