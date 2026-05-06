"use client";

import { useState, useRef } from "react";

export default function IntentInput({ onSubmit, loading }) {
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey && text.trim()) {
      e.preventDefault();
      onSubmit(text.trim());
    }
  }

  async function toggleVoice() {
    if (recording) {
      mediaRef.current?.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const arrayBuf = await blob.arrayBuffer();

        // Отправляем на QVAC STT
        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: arrayBuf,
        });
        const data = await res.json();
        if (data.text) {
          setText(data.text);
          onSubmit(data.text);
        }
      };

      recorder.start();
      mediaRef.current = recorder;
      setRecording(true);
    } catch {
      alert("Microphone access denied.");
    }
  }

  return (
    <div className="relative">
      <div className="flex gap-2 bg-[#111] border border-[#222] rounded-xl p-2 focus-within:border-[#CC0000] transition-colors">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Try "Swap 1 SOL to USDC" or "Price of BONK"'
          rows={2}
          disabled={loading}
          className="flex-1 bg-transparent text-white placeholder-[#444] text-sm resize-none outline-none px-2 py-1"
        />

        <div className="flex flex-col gap-1 justify-end">
          {/* Voice button */}
          <button
            onClick={toggleVoice}
            title="Voice input (QVAC Whisper)"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              recording
                ? "bg-[#CC0000] animate-pulse"
                : "bg-[#1A1A1A] hover:bg-[#222] text-[#666] hover:text-white"
            }`}
          >
            🎤
          </button>

          {/* Submit button */}
          <button
            onClick={() => text.trim() && onSubmit(text.trim())}
            disabled={!text.trim() || loading}
            className="w-9 h-9 rounded-lg bg-[#CC0000] hover:bg-[#AA0000] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            {loading ? (
              <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-sm">→</span>
            )}
          </button>
        </div>
      </div>

      <p className="text-[#333] text-xs mt-1 px-2">
        Press Enter to submit · 🎤 for voice input (powered by QVAC Whisper)
      </p>
    </div>
  );
}