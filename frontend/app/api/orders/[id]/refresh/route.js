import { getBotApiUrl, proxyError, readJsonResponse } from "../../../_lib/botApi";
import { refreshFallbackOrder } from "../../../_lib/demoFallback";

export async function POST(_request, { params }) {
  let id = "";
  try {
    id = params?.id || "";
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
    return Response.json(refreshFallbackOrder(id));
  }
}
