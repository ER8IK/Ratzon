// qvac_service/server.js
/**
 * QVAC HTTP сервер
 * 
 * Экспонирует LLM парсер и STT как REST API.
 * Python бот вызывает эти эндпоинты.
 * 
 * Запуск: node server.js
 * По умолчанию: http://localhost:3000
 */

import http from "http";
import { parseIntentWithLLM, initModel, cleanup } from "./intent_parser.js";
import { transcribeAudio, initSTT, cleanupSTT } from "./stt.js";

const PORT = process.env.QVAC_PORT || 3000;

// ── Router ────────────────────────────────────────────────────────────────────

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS для фронтенда
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // ── POST /parse ──────────────────────────────────────────────────────────
  if (req.method === "POST" && url.pathname === "/parse") {
    const body = await readBody(req);
    const { message } = JSON.parse(body);

    if (!message) {
      return jsonResponse(res, 400, { error: "message is required" });
    }

    const result = await parseIntentWithLLM(message);

    if (!result) {
      return jsonResponse(res, 200, {
        intent: "unknown",
        confidence: 0.0,
        error: "LLM parsing failed"
      });
    }

    return jsonResponse(res, 200, result);
  }

  // ── POST /transcribe ─────────────────────────────────────────────────────
  if (req.method === "POST" && url.pathname === "/transcribe") {
    const audioBuffer = await readBodyRaw(req);

    if (!audioBuffer.length) {
      return jsonResponse(res, 400, { error: "audio data is required" });
    }

    const text = await transcribeAudio(audioBuffer);

    if (!text) {
      return jsonResponse(res, 200, { text: null, error: "transcription failed" });
    }

    return jsonResponse(res, 200, { text });
  }

  // ── GET /health ──────────────────────────────────────────────────────────
  if (req.method === "GET" && url.pathname === "/health") {
    return jsonResponse(res, 200, {
      status: "ok",
      service: "ratzon-qvac",
      models: {
        llm: "loaded",
        stt: "loaded",
      }
    });
  }

  // ── 404 ──────────────────────────────────────────────────────────────────
  return jsonResponse(res, 404, { error: "Not found" });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function jsonResponse(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function readBodyRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", chunk => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

// ── Start ─────────────────────────────────────────────────────────────────────

const server = http.createServer(handleRequest);

// Загружаем модели при старте
console.log("Initializing QVAC models...");
await Promise.all([
  initModel(),
  initSTT(),
]);

server.listen(PORT, () => {
  console.log(`QVAC service running on http://localhost:${PORT}`);
  console.log("Endpoints:");
  console.log(`  POST /parse       - LLM intent parsing`);
  console.log(`  POST /transcribe  - Speech-to-text`);
  console.log(`  GET  /health      - Service health`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down QVAC service...");
  await cleanup();
  await cleanupSTT();
  server.close();
  process.exit(0);
});