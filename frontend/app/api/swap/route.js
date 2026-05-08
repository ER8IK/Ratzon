const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:8080";

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, wallet } = body;

    if (!message || !wallet) {
      return Response.json({ error: "message and wallet are required" }, { status: 400 });
    }

    const res = await fetch(`${BOT_API_URL}/swap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, wallet }),
    });

    if (!res.ok) {
      const data = await res.json();
      return Response.json({ error: data?.error || "Failed to prepare swap" }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("Swap API error:", error);
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }
}
