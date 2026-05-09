import { getBotApiUrl, proxyError, readJsonResponse } from "../_lib/botApi";
import { createFallbackOrder } from "../_lib/localFallback";

export async function POST(request) {
  let clientId = "";
  let message = "";
  let payoutAddress = "";
  try {
    const body = await request.json();
    clientId = body?.clientId || "";
    message = body?.message || "";
    payoutAddress = body?.payoutAddress || "";

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
  } catch {
    try {
      return Response.json(createFallbackOrder({ clientId, message, payoutAddress }));
    } catch (fallbackError) {
      return proxyError(fallbackError?.message || "Could not create guarded order.", 400);
    }
  }
}
