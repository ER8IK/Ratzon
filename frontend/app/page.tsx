"use client";

import { useState } from "react";
import IntentInput from "@/components/IntentInput";
import ResultCard from "@/components/ResultCard";
import QuickActions from "@/components/QuickActions";

export default function Home() {
  const [lastQuery, setLastQuery] = useState("");
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [phantomUrl, setPhantomUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(text: string) {
    setLastQuery(text);
    setLoading(true);
    setError(null);
    setResult(null);
    setConfirmError(null);
    setPhantomUrl(null);

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

  async function handleConfirm() {
    if (!lastQuery || !wallet) return;

    setConfirmError(null);
    setConfirmLoading(true);
    setPhantomUrl(null);

    try {
      const res = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: lastQuery, wallet }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Failed to prepare swap");
      }

      const data = await res.json();
      if (!data.phantom_url) {
        throw new Error("Phantom URL not returned");
      }

      setPhantomUrl(data.phantom_url);
      window.open(data.phantom_url, "_blank");
    } catch (e: any) {
      setConfirmError(e?.message || "Could not prepare Phantom transaction.");
    } finally {
      setConfirmLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-[#111] px-6 py-5 backdrop-blur-xl bg-black/40">
        <div className="max-w-5xl mx-auto flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-3xl bg-gradient-to-br from-[#E33E3E] to-[#881919] flex items-center justify-center text-white font-black text-lg">
              R
            </div>
            <div>
              <p className="text-base font-semibold tracking-[0.2em]">RATZON</p>
              <p className="text-xs text-[#888] uppercase">Solana intent execution</p>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-2 text-xs text-[#666]">
            <span className="rounded-full border border-[#222] bg-[#0D0D0D] px-3 py-1">Dark mode ready</span>
            <span className="rounded-full border border-[#222] bg-[#0D0D0D] px-3 py-1">Best execution</span>
            <span className="rounded-full border border-[#222] bg-[#0D0D0D] px-3 py-1">Wallet-aware</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-[0.3em] text-[#FF5555]">
                Best execution engine
              </p>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Swap on Solana with smart route selection and one-click Phantom execution.
              </h1>
              <p className="max-w-2xl text-[#888] text-base leading-7">
                Ratzon turns plain English swaps into a high-quality Solana route — with route scoring, adaptive slippage, and wallet-aware transaction preparation.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Route Quality", value: "Score, impact, fees", icon: "🚦" },
                { label: "Adaptive Slippage", value: "Smart swap tolerance", icon: "⚙️" },
                { label: "Wallet-aware", value: "Your address, your route", icon: "🔑" },
                { label: "One-click Phantom", value: "Instant tx load", icon: "👻" },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-[#222] bg-[#0F0F0F] p-5">
                  <p className="text-2xl">{item.icon}</p>
                  <p className="mt-3 text-sm text-[#888]">{item.label}</p>
                  <p className="mt-2 font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-[#222] bg-[#0C0C0C] p-6 shadow-[0_0_35px_rgba(0,0,0,0.18)]">
              <p className="text-sm text-[#666] uppercase tracking-[0.25em] mb-4">Try it now</p>
              <IntentInput onSubmit={handleSubmit} loading={loading} />
              <div className="mt-5 text-sm text-[#777]">
                <p>Use a clear swap phrase like <span className="text-white">Swap 1 SOL to USDC</span> or <span className="text-white">convert 100 USDC to BONK</span>.</p>
              </div>
            </div>

            <div className="hidden md:block rounded-[28px] border border-[#222] bg-[#0F0F0F] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[#888] mb-4">Quick prompts</p>
              <QuickActions onSelect={handleSubmit} />
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-3xl border border-[#551111] bg-[#150909] p-4 text-sm text-[#FF9999]">
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="rounded-[28px] border border-[#222] bg-[#0F0F0F] p-12 text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#CC0000] border-t-transparent" />
            <p className="text-[#888]">Searching best route and preparing quote...</p>
          </div>
        )}

        {result && (
          <ResultCard
            result={result}
            wallet={wallet}
            onWalletChange={setWallet}
            onConfirm={handleConfirm}
            confirmLoading={confirmLoading}
            confirmError={confirmError}
            phantomUrl={phantomUrl}
            onReset={() => {
              setResult(null);
              setWallet("");
              setPhantomUrl(null);
              setConfirmError(null);
            }}
          />
        )}
      </div>
    </main>
  );
}
