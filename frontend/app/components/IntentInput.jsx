"use client";

import { useState, useRef } from "react";
import { Loader2, Mic, SendHorizontal } from "lucide-react";

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

  function submitIntent() {
    const nextText = text.trim();
    if (!nextText || loading) return;
    onSubmit(nextText);
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
    <div className="space-y-2">
      <label
        htmlFor="intent-input"
        className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8d9a9f]"
      >
        Intent
      </label>
      <div className="overflow-hidden rounded-2xl border border-[#263237] bg-[#101619] shadow-inner transition-colors focus-within:border-[#ff4a50]">
        <textarea
          id="intent-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Try "Swap 1 SOL to USDC" or "Price of BONK"'
          rows={4}
          disabled={loading}
          className="min-h-[126px] w-full resize-none bg-transparent px-4 py-4 text-base leading-6 text-[#f4f7f5] outline-none placeholder:text-[#68777c] disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="flex items-center justify-between gap-3 border-t border-[#263237] bg-[#0b1012] px-3 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-[#9aa7ab]">
            <span
              className={`h-2 w-2 rounded-full ${
                recording ? "bg-[#ff4a50]" : "bg-[#36d27f]"
              }`}
            />
            {recording ? "Listening" : "Voice ready"}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoice}
              type="button"
              aria-label={recording ? "Stop voice input" : "Start voice input"}
              title={recording ? "Stop voice input" : "Start voice input"}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${
                recording
                  ? "border-[#ff4a50] bg-[#ff353b] text-white"
                  : "border-[#263237] bg-[#12191b] text-[#9aa7ab] hover:border-[#ff4a50] hover:text-white"
              }`}
            >
              <Mic className="h-4 w-4" />
            </button>

            <button
              onClick={submitIntent}
              type="button"
              aria-label="Submit intent"
              title="Submit intent"
              disabled={!text.trim() || loading}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff353b] text-white transition-colors hover:bg-[#ff4f55] disabled:cursor-not-allowed disabled:bg-[#273034] disabled:text-[#68777c]"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
