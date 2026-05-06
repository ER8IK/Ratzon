// frontend/src/app/api/transcribe/route.js
/**
 * STT API route — принимает аудио, отправляет в QVAC Whisper.
 */

const QVAC_URL = process.env.QVAC_URL || "http://localhost:3000";

export async function POST(request) {
  try {
    const audioBuffer = await request.arrayBuffer();

    const res = await fetch(`${QVAC_URL}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: audioBuffer,
    });

    if (!res.ok) {
      return Response.json({ text: null, error: "STT failed" }, { status: 200 });
    }

    const data = await res.json();
    return Response.json(data);

  } catch (error) {
    console.error("Transcribe API error:", error);
    return Response.json({ text: null, error: "Service unavailable" }, { status: 200 });
  }
}