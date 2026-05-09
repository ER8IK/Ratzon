import { getBotApiUrl, proxyError, readJsonResponse } from "../../_lib/botApi";
import { checkAddress } from "../../_lib/demoFallback";

export async function POST(request) {
  let address = "";
  let expectedNetwork = null;
  try {
    const body = await request.json();
    address = body?.address || "";
    expectedNetwork = body?.expectedNetwork || null;

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
    return Response.json(checkAddress(address, expectedNetwork));
  }
}
