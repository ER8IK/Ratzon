"use client";

import { useState, useRef } from "react";
import IntentInput from "@/components/IntentInput";
import ResultCard from "@/components/ResultCard";
import QuickActions from "@/components/QuickActions";

export default function Home() {
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(text: string) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white">
      {/* Header */}
      <header className="border-b border-[#1A1A1A] px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#CC0000] flex items-center justify-center text-sm font-bold">
            R
          </div>
          <span className="font-bold text-lg tracking-wider">RATZON</span>
          <span className="text-xs text-[#666] ml-auto">
            Intent Layer · Solana
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Hero */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            Say what you want.
          </h1>
          <p className="text-[#888] text-sm">
            Ratzon finds the best route and executes it on Solana.
          </p>
        </div>

        {/* Input */}
        <IntentInput onSubmit={handleSubmit} loading={loading} />

        {/* Quick actions */}
        {!result && !loading && (
          <QuickActions onSelect={handleSubmit} />
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-8 h-8 border-2 border-[#CC0000] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#666] text-sm">Finding best route...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-[#1A0000] border border-[#CC0000] rounded-lg p-4 text-sm text-[#FF6666]">
            ⚠️ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <ResultCard result={result} onReset={() => setResult(null)} />
        )}
      </div>
    </main>
  );
}