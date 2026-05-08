export function getBotApiUrl() {
  if (!process.env.BOT_API_URL && process.env.NODE_ENV === "production") {
    throw new Error("BOT_API_URL is not configured for this frontend service.");
  }

  const rawUrl = (process.env.BOT_API_URL || "http://localhost:8080").trim().replace(/\/+$/, "");
  const normalizedUrl = /^https?:\/\//i.test(rawUrl)
    ? rawUrl
    : `https://${rawUrl}`;

  try {
    const url = new URL(normalizedUrl);
    const trimmedPath = url.pathname.replace(/\/+$/, "").toLowerCase();
    if (trimmedPath === "/intent" || trimmedPath === "/swap") {
      url.pathname = "/";
    }
    return url.toString().replace(/\/+$/, "");
  } catch (error) {
    throw new Error(`BOT_API_URL is invalid: ${normalizedUrl}`);
  }
}

export async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}

export function proxyError(message, status = 503) {
  return Response.json({ error: message }, { status });
}
