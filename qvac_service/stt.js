// qvac_service/stt.js
/**
 * QVAC Speech-to-Text (Whisper)
 * 
 * Конвертирует голосовые сообщения из Telegram в текст.
 * Работает полностью локально — данные пользователя не покидают сервер.
 */

import {
  loadModel,
  transcribe,
  unloadModel,
  WHISPER_EN_TINY_Q0F16,
} from "@qvac/sdk";

let modelId = null;

export async function initSTT() {
  if (modelId) return modelId;

  console.log("Loading QVAC Whisper STT model...");
  modelId = await loadModel({
    modelSrc: WHISPER_EN_TINY_Q0F16,
    onProgress: (p) => console.log(`STT loading: ${p.progress}%`),
  });
  console.log("QVAC Whisper model loaded");
  return modelId;
}

/**
 * Транскрибирует аудио в текст.
 * 
 * @param {Buffer} audioBuffer - Аудио данные (WAV формат)
 * @returns {string} - Распознанный текст
 */
export async function transcribeAudio(audioBuffer) {
  const id = await initSTT();

  try {
    const result = await transcribe({
      modelId: id,
      audio: audioBuffer,
      language: "en", // Можно сделать auto-detect
    });

    const text = result.text?.trim() || "";
    console.log(`STT result: "${text}"`);
    return text;

  } catch (error) {
    console.error("STT error:", error);
    return null;
  }
}

export async function cleanupSTT() {
  if (modelId) {
    await unloadModel({ modelId });
    modelId = null;
  }
}