// frontend/src/app/api/intent/route.js
/**
 * API route — прокси между фронтендом и Python ботом.
 * Фронтенд → Next.js API → Python бот → Jupiter → Response
 */

const BOT_API_URL = process.env.BOT_API_URL || "http://localhost:8080";

export async function POST(request) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return Response.json({ error: "message required" }, { status: 400 });
    }

    // Прокси к Python боту
    const res = await fetch(`${BOT_API_URL}/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      throw new Error(`Bot API error: ${res.status}`);
    }

    const data = await res.json();
    return Response.json(data);

  } catch (error) {
    console.error("Intent API error:", error);
    return Response.json(
      { error: "Service unavailable" },
      { status: 503 }
    );
  }
}