"use client";

import { useRef, useState } from "react";
import { Loader2, Mic, SendHorizontal } from "lucide-react";

export default function IntentInput({
  onSubmit,
  loading,
  label = "Tell Ratzon what you want",
  placeholder = 'Swap 50 USDT TRC20 to BTC',
}) {
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
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const arrayBuf = await blob.arrayBuffer();

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
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor="intent-input"
          className="text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]"
        >
          {label}
        </label>
        <span className="rounded-md border border-[#254235] bg-[#0c2118] px-2 py-1 text-xs font-semibold text-[#70e1a6]">
          Protected
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border border-[#2a3633] bg-[#060b0a] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors focus-within:border-[#70e1a6] focus-within:ring-4 focus-within:ring-[#70e1a6]/10">
        <textarea
          id="intent-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={4}
          disabled={loading}
          className="min-h-[126px] w-full resize-none bg-transparent px-4 py-4 text-base leading-6 text-[#f6f8f7] outline-none placeholder:text-[#637174] disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div className="flex items-center justify-between gap-3 border-t border-[#202a28] bg-[#09110f] px-3 py-3">
          <div className="flex min-w-0 items-center gap-2 text-xs font-medium text-[#9da8a9]">
            <span
              className={`h-2 w-2 flex-none rounded-full ${
                recording ? "bg-[#ff4a50]" : "bg-[#36d27f]"
              }`}
            />
            <span className="truncate">{recording ? "Listening" : "QVAC voice input"}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleVoice}
              type="button"
              aria-label={recording ? "Stop voice input" : "Start voice input"}
              title={recording ? "Stop voice input" : "Start voice input"}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                recording
                  ? "border-[#ff4a50] bg-[#e83a42] text-white"
                  : "border-[#2a3633] bg-[#101817] text-[#9da8a9] hover:border-[#62d5f6] hover:text-white"
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
              className="inline-flex h-10 min-w-[116px] items-center justify-center gap-2 rounded-lg bg-[#e83a42] px-3 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(232,58,66,0.22)] transition-colors hover:bg-[#ff4a50] disabled:cursor-not-allowed disabled:bg-[#273034] disabled:text-[#68777c]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Finding
                </>
              ) : (
                <>
                  <SendHorizontal className="h-4 w-4" />
                  Find route
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
