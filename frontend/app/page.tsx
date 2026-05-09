"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Loader2,
  Radio,
  Wallet,
  Zap,
} from "lucide-react";
import IntentInput from "@/components/IntentInput";
import ResultCard from "@/components/ResultCard";
import QuickActions from "@/components/QuickActions";
import ActivePaymentPanel from "@/components/ActivePaymentPanel";
import DriftPanel from "@/components/DriftPanel";
import SafetyCheckPanel, { SAMPLE_ADDRESSES } from "@/components/SafetyCheckPanel";

const DEFAULT_PROTOCOL_MODES = [
  { label: "Swap", value: "Jupiter", status: "Live", intent: "Swap 1 SOL to USDC" },
  { label: "Smart Swap", value: "SimpleSwap", status: "Guarded", intent: "Swap 50 USDT TRC20 to BTC" },
  { label: "Earn", value: "Kamino", status: "Guarded", intent: "Find best yield for USDC" },
  { label: "Trade", value: "Drift", status: "Guarded", intent: "Long SOL with 2x" },
];

const PROTOCOL_MODE_META: Record<string, { label: string; intent: string }> = {
  jupiter: { label: "Swap", intent: "Swap 1 SOL to USDC" },
  simpleswap: { label: "Smart Swap", intent: "Swap 50 USDT TRC20 to BTC" },
  kamino: { label: "Earn", intent: "Find best yield for USDC" },
  "jito-marinade": { label: "Stake", intent: "Stake 1 SOL" },
  drift: { label: "Trade", intent: "Long SOL with 2x" },
};

const RECENT_INTENTS_KEY = "ratzon:recent-intents";
const CLIENT_ID_KEY = "ratzon:client-id";
const ACTIVE_ORDER_CACHE_KEY = "ratzon:active-order";
const MAX_RECENT_INTENTS = 5;

function protocolModeFromCapability(capability: any) {
  if (!capability?.adapter_id || !capability?.label) return null;

  const meta = PROTOCOL_MODE_META[capability.adapter_id] || {
    label: capability.label,
    intent: `${String(capability.intents?.[0] || "swap")} with ${capability.label}`,
  };

  return {
    label: meta.label,
    value: capability.label,
    status: protocolStatusLabel(capability.status),
    intent: meta.intent,
  };
}

function protocolStatusLabel(status: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "live") return "Live";
  if (normalized === "active" || normalized === "guarded") return "Guarded";
  if (normalized === "planned") return "Mapped";
  return "Checked";
}

function statusBadgeClass(status: string) {
  if (status === "Live") {
    return "bg-[#0c2d22] text-[#70e1a6]";
  }
  if (status === "Guarded") {
    return "bg-[#152034] text-[#8ed9ff]";
  }
  return "bg-[#211b13] text-[#f0c75e]";
}

function getPhantomProvider() {
  if (typeof window === "undefined") return null;

  const browserWindow = window as typeof window & {
    phantom?: { solana?: any };
    solana?: any;
  };
  const providers = [
    browserWindow.phantom?.solana,
    browserWindow.solana,
  ].filter(Boolean);
  const phantomProvider = providers.find((provider) => provider?.isPhantom);
  if (phantomProvider) return phantomProvider;

  return (
    providers.find(
      (provider) =>
        typeof provider?.connect === "function" &&
        (typeof provider?.signAndSendTransaction === "function" ||
          typeof provider?.request === "function"),
    ) || null
  );
}

async function waitForPhantomProvider(timeoutMs = 10000) {
  const startedAt = Date.now();
  let provider = getPhantomProvider();

  while (!provider && Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    provider = getPhantomProvider();
  }

  return provider;
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;

  return (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent))
  );
}

function isTelegramWebView() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const browserWindow = window as typeof window & {
    Telegram?: { WebApp?: unknown };
  };
  const userAgent = navigator.userAgent;

  return Boolean(
    browserWindow.Telegram?.WebApp ||
      browserWindow.Telegram ||
      /Telegram|TelegramBot|TMA|TgWebView|TelegramWebView/i.test(userAgent),
  );
}

function decodeBase64Transaction(transaction: string) {
  const binary = window.atob(transaction);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function buildPhantomBrowseUrl(intent?: string, autoExecute = false) {
  const target = new URL(window.location.pathname || "/", window.location.origin);
  if (intent?.trim()) {
    target.searchParams.set("intent", intent.trim());
  }
  if (autoExecute) {
    target.searchParams.set("execute", "1");
  }
  const targetUrl = target.toString();
  const refUrl = window.location.origin;
  return `https://phantom.app/ul/browse/${encodeURIComponent(targetUrl)}?ref=${encodeURIComponent(refUrl)}`;
}

async function connectInjectedPhantom(provider: any) {
  const connection = await provider.connect();
  return (
    connection?.publicKey?.toString?.() || provider.publicKey?.toString?.()
  );
}

async function signWithInjectedPhantom(provider: any, transaction: string) {
  const { VersionedTransaction } = await import("@solana/web3.js");
  const versionedTransaction = VersionedTransaction.deserialize(
    decodeBase64Transaction(transaction),
  );
  const result = await provider.signAndSendTransaction(versionedTransaction);
  return (
    result?.signature ||
    result?.hash ||
    (typeof result === "string" ? result : null)
  );
}

function openWalletLink(url: string) {
  const browserWindow = window as typeof window & {
    Telegram?: {
      WebApp?: {
        openLink?: (url: string, options?: Record<string, unknown>) => void;
      };
    };
  };

  if (browserWindow.Telegram?.WebApp?.openLink) {
    browserWindow.Telegram.WebApp.openLink(url, { try_instant_view: false });
    return;
  }

  window.location.assign(url);
}

export default function Home() {
  const [lastQuery, setLastQuery] = useState("");
  const [recentIntents, setRecentIntents] = useState<string[]>([]);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [phantomUrl, setPhantomUrl] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingPhantomExecution, setPendingPhantomExecution] = useState(false);
  const [protocolModes, setProtocolModes] = useState(DEFAULT_PROTOCOL_MODES);
  const [clientId, setClientId] = useState("");
  const [safetyAddress, setSafetyAddress] = useState("");
  const [safetyExpectedNetwork, setSafetyExpectedNetwork] = useState("BTC");
  const [safetyReport, setSafetyReport] = useState<any | null>(null);
  const [safetyLoading, setSafetyLoading] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [activeOrderLoading, setActiveOrderLoading] = useState(false);
  const [activeOrderError, setActiveOrderError] = useState<string | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const toolsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(RECENT_INTENTS_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setRecentIntents(
          parsed
            .filter((item) => typeof item === "string" && item.trim())
            .slice(0, MAX_RECENT_INTENTS),
        );
      }
    } catch {
      setRecentIntents([]);
    }
  }, []);

  useEffect(() => {
    let id = "";
    try {
      const cachedOrder = window.localStorage.getItem(ACTIVE_ORDER_CACHE_KEY);
      if (cachedOrder) {
        setActiveOrder(JSON.parse(cachedOrder));
      }

      id = window.localStorage.getItem(CLIENT_ID_KEY) || "";
      if (!id) {
        id = typeof window.crypto?.randomUUID === "function"
          ? window.crypto.randomUUID()
          : `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        window.localStorage.setItem(CLIENT_ID_KEY, id);
      }
    } catch {
      id = `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    setClientId(id);
    loadActiveOrder(id);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProtocolModes() {
      try {
        const res = await fetch("/api/protocols", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok || !Array.isArray(data?.protocols)) return;

        const modes = data.protocols
          .map(protocolModeFromCapability)
          .filter(Boolean);
        if (active && modes.length) {
          setProtocolModes(modes);
        }
      } catch {
        if (active) {
          setProtocolModes(DEFAULT_PROTOCOL_MODES);
        }
      }
    }

    loadProtocolModes();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if ((!result && !error) || !resultRef.current) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    resultRef.current.scrollIntoView({
      block: "nearest",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [result, error]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const intent = params.get("intent");
    if (!intent?.trim()) return;

    const shouldExecute = params.get("execute") === "1";
    if (shouldExecute) {
      setPendingPhantomExecution(true);
    }

    handleSubmit(intent, { preservePendingExecution: shouldExecute });
    params.delete("intent");
    params.delete("execute");
    const nextQuery = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`,
    );
  }, []);

  function rememberIntent(text: string) {
    const normalized = text.trim();
    if (!normalized) return;

    setRecentIntents((current) => {
      const next = [
        normalized,
        ...current.filter((item) => item.toLowerCase() !== normalized.toLowerCase()),
      ].slice(0, MAX_RECENT_INTENTS);

      try {
        window.localStorage.setItem(RECENT_INTENTS_KEY, JSON.stringify(next));
      } catch {
        // localStorage can be blocked in some WebViews; the UI still works.
      }

      return next;
    });
  }

  function rememberActiveOrder(order: any | null) {
    setActiveOrder(order);
    try {
      if (order) {
        window.localStorage.setItem(ACTIVE_ORDER_CACHE_KEY, JSON.stringify(order));
      } else {
        window.localStorage.removeItem(ACTIVE_ORDER_CACHE_KEY);
      }
    } catch {
      // WebView storage can be unavailable; backend recovery still works.
    }
  }

  async function handleSubmit(
    text: string,
    options: { preservePendingExecution?: boolean } = {},
  ) {
    if (!options.preservePendingExecution) {
      setPendingPhantomExecution(false);
    }

    setLastQuery(text);
    rememberIntent(text);
    setLoading(true);
    setError(null);
    setResult(null);
    setConfirmError(null);
    setPhantomUrl(null);
    setTxSignature(null);
    setOrderError(null);
    setSafetyReport(null);

    try {
      const res = await fetch("/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      setResult(data);
      if (data?.quote?.output_network) {
        setSafetyExpectedNetwork(data.quote.output_network);
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function runAddressCheck(
    address = safetyAddress,
    expectedNetwork = result?.quote?.output_network || safetyExpectedNetwork,
  ) {
    setSafetyLoading(true);
    setOrderError(null);
    try {
      const res = await fetch("/api/safety/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, expectedNetwork }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || "Address check failed");
      }
      setSafetyReport(data);
      return data;
    } catch (e: any) {
      const message = e?.message || "Address check failed.";
      setSafetyReport({
        valid: false,
        compatible: false,
        detected_label: "Invalid",
        message,
        warnings: [message],
      });
      return null;
    } finally {
      setSafetyLoading(false);
    }
  }

  async function handleCreateOrder() {
    if (!lastQuery || !clientId) return;

    setOrderLoading(true);
    setOrderError(null);
    try {
      let report = safetyReport;
      if (!report?.compatible) {
        report = await runAddressCheck();
      }
      if (!report?.compatible) {
        throw new Error("Address network does not match this route.");
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          message: lastQuery,
          payoutAddress: safetyAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || "Could not create order");
      }
      rememberActiveOrder(data.order || null);
    } catch (e: any) {
      setOrderError(e?.message || "Could not create order.");
    } finally {
      setOrderLoading(false);
    }
  }

  async function loadActiveOrder(id = clientId) {
    if (!id) return;

    setActiveOrderLoading(true);
    setActiveOrderError(null);
    try {
      const res = await fetch(`/api/orders/active?clientId=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || "Could not load active order");
      }
      rememberActiveOrder(data.order || null);
    } catch (e: any) {
      setActiveOrderError(e?.message || "Could not load active order.");
    } finally {
      setActiveOrderLoading(false);
    }
  }

  async function refreshActiveOrder() {
    if (!activeOrder?.order_id) return;

    setActiveOrderLoading(true);
    setActiveOrderError(null);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(activeOrder.order_id)}/refresh`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || data?.error) {
        throw new Error(data?.error || "Could not refresh order");
      }
      rememberActiveOrder(data.order || null);
    } catch (e: any) {
      setActiveOrderError(e?.message || "Could not refresh order.");
    } finally {
      setActiveOrderLoading(false);
    }
  }

  function handleQuickAction(action: string) {
    if (action === "active-payment") {
      loadActiveOrder();
      scrollToTools();
      return;
    }
    if (action === "safety-check") {
      setSafetyExpectedNetwork("BTC");
      setSafetyAddress(SAMPLE_ADDRESSES.wrongErc20);
      setSafetyReport(null);
      scrollToTools();
      return;
    }
    if (action === "drift-route") {
      handleSubmit("Long SOL with 2x");
    }
  }

  function scrollToTools() {
    window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      toolsRef.current?.scrollIntoView({
        block: "start",
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  }

  async function handleConfirm(
    options: { allowMobileHandoff?: boolean; waitForProvider?: boolean } = {},
  ) {
    if (!lastQuery) return;

    const resumeInsideWallet = pendingPhantomExecution || options.waitForProvider;
    const allowMobileHandoff = options.allowMobileHandoff ?? !resumeInsideWallet;
    setConfirmError(null);
    setConfirmLoading(true);
    setPhantomUrl(null);
    setTxSignature(null);

    try {
      const provider = resumeInsideWallet
        ? await waitForPhantomProvider()
        : getPhantomProvider();
      const inTelegramWebView = isTelegramWebView();
      const mobileDevice = isMobileDevice();

      if (!provider && allowMobileHandoff && (mobileDevice || inTelegramWebView)) {
        setPendingPhantomExecution(false);
        setPhantomUrl(buildPhantomBrowseUrl(lastQuery, true));
        return;
      }

      if (!provider) {
        throw new Error(
          allowMobileHandoff
            ? "Phantom extension was not detected in this browser tab. Enable Phantom, refresh, and try again."
            : "Phantom provider was not detected. Open this screen in Phantom Browser, then tap Open Phantom transaction.",
        );
      }

      let walletForSwap = wallet.trim();
      if (provider) {
        walletForSwap = await connectInjectedPhantom(provider);
        if (walletForSwap) setWallet(walletForSwap);
      }

      if (!walletForSwap) {
        throw new Error(
          "Connect Phantom or enter a Solana wallet address before preparing the transaction.",
        );
      }

      const res = await fetch("/api/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: lastQuery,
          wallet: walletForSwap,
          appUrl: window.location.origin,
        }),
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

      if (provider && data.transaction) {
        const signature = await signWithInjectedPhantom(
          provider,
          data.transaction,
        );
        if (signature) {
          setTxSignature(signature);
          setPendingPhantomExecution(false);
          return;
        }
        throw new Error("Phantom did not return a transaction signature.");
      }

      if (mobileDevice && !inTelegramWebView) {
        window.location.assign(buildPhantomBrowseUrl(lastQuery, true));
        return;
      }

      return;
    } catch (e: any) {
      setPendingPhantomExecution(false);
      setConfirmError(e?.message || "Could not prepare Phantom transaction.");
    } finally {
      setConfirmLoading(false);
    }
  }

  const inWalletExecution = pendingPhantomExecution || Boolean(getPhantomProvider());
  const mobileWalletHandoff =
    !inWalletExecution && (isTelegramWebView() || isMobileDevice());

  return (
    <main className="min-h-screen bg-[#050706] text-[#f6f8f7]">
      <header className="sticky top-0 z-20 border-b border-[#1f2927] bg-[#050706]/90 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/Ratzon_logo-removebg-preview.png"
              alt="Ratzon logo"
              className="h-11 w-11 flex-none object-contain"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#f8fbf8]">
                Ratzon
              </p>
              <p className="truncate text-xs text-[#9da8a9]">
                Protected intent execution
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-xs text-[#c3cecb] sm:flex">
            <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#265744] bg-[#0b2118] px-3">
              <span className="h-2 w-2 rounded-full bg-[#36d27f]" />
              QVAC integrated
            </span>
            <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-[#3a3030] bg-[#171110] px-3">
              <Wallet className="h-3.5 w-3.5 text-[#62d5f6]" />
              Wallet-controlled
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,640px)_minmax(0,1fr)]">
          <div className="space-y-4">
            <section className="premium-panel p-5 shadow-[0_24px_90px_rgba(0,0,0,0.34)]">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#70e1a6]">
                    Start Here
                  </p>
                  <h1 className="mt-3 text-[1.9rem] font-semibold leading-[1.06] text-white sm:text-[2.35rem]">
                    Swap safely, check addresses, recover payments.
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#aebbb8]">
                    Start with a command like <span className="font-semibold text-white">Swap 50 USDT TRC20 to BTC</span>. Ratzon shows the route, checks the destination network, and keeps payment details recoverable.
                  </p>
                </div>
                <div className="rounded-lg border border-[#28463b] bg-[#081611] p-4">
                  <div className="flex items-center gap-3">
                    <Radio className="h-4 w-4 flex-none text-[#70e1a6]" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">QVAC integrated</p>
                      <p className="mt-1 text-xs leading-5 text-[#91a19d]">
                        Text and voice intents are parsed before routing.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 rounded-lg border border-[#1f6d4b] bg-[#0d2419] px-3 py-2 text-xs font-semibold text-[#70e1a6]">
                    Wrong-network protection is on
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <IntentInput
                  onSubmit={handleSubmit}
                  loading={loading}
                  label="1. Type a request"
                  placeholder="Swap 50 USDT TRC20 to BTC"
                />
              </div>
            </section>

            <section className="premium-panel p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]">
                    2. Choose a common action
                  </p>
                  <p className="mt-1 text-sm text-[#aab4b5]">
                    Use these if you do not want to type from scratch.
                  </p>
                </div>
                <Zap className="h-4 w-4 flex-none text-[#f0c75e]" />
              </div>
              <QuickActions
                recentIntents={recentIntents}
                onSelect={handleSubmit}
                onAction={handleQuickAction}
              />
            </section>
          </div>

          <section
            ref={resultRef}
            className="premium-panel min-h-[560px] shadow-[0_24px_90px_rgba(0,0,0,0.34)] xl:sticky xl:top-24 xl:self-start"
          >
            <div className="border-b border-[#202a28] px-4 py-5 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#93a0a1]">
                    Execution desk
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">
                    {error ? "Needs attention" : result ? "Route prepared" : loading ? "Finding route" : "Awaiting intent"}
                  </h2>
                </div>
                <span className="inline-flex h-8 items-center rounded-lg border border-[#293134] bg-[#101516] px-3 text-xs font-medium text-[#aab4b5]">
                  {error ? "Request failed" : result ? "Checks complete" : "Standing by"}
                </span>
              </div>
            </div>

            {error ? (
              <div className="p-4 sm:p-5">
                <div
                  role="alert"
                  className="rounded-lg border border-[#6b2428] bg-[#2a1013] p-4 text-sm leading-6 text-[#ffb8ba]"
                >
                  <div className="mb-2 flex items-center gap-2 font-semibold text-white">
                    <AlertTriangle className="h-4 w-4 text-[#ff6268]" />
                    Route request failed
                  </div>
                  <p>{error}</p>
                </div>
              </div>
            ) : loading ? (
              <RoutePlaceholder loading />
            ) : result ? (
              <ResultCard
                result={result}
                wallet={wallet}
                onWalletChange={setWallet}
                onConfirm={handleConfirm}
                confirmLoading={confirmLoading}
                confirmError={confirmError}
                phantomUrl={phantomUrl}
                txSignature={txSignature}
                mobileWalletHandoff={mobileWalletHandoff}
                walletExecutionReady={pendingPhantomExecution}
                onOpenWalletLink={openWalletLink}
                onReset={() => {
                  setResult(null);
                  setWallet("");
                  setPhantomUrl(null);
                  setTxSignature(null);
                  setConfirmError(null);
                  setOrderError(null);
                  setSafetyReport(null);
                }}
                safetyAddress={safetyAddress}
                onSafetyAddressChange={(value: string) => {
                  setSafetyAddress(value);
                  setSafetyReport(null);
                }}
                addressReport={safetyReport}
                addressChecking={safetyLoading}
                onCheckAddress={() => runAddressCheck()}
                onCreateOrder={handleCreateOrder}
                orderLoading={orderLoading}
                orderError={orderError}
                activeOrder={activeOrder}
              />
            ) : (
              <RoutePlaceholder />
            )}
          </section>
        </section>

        <section
          ref={toolsRef}
          className="mt-5 grid scroll-mt-24 gap-4 lg:grid-cols-2 2xl:grid-cols-4"
        >
          <ActivePaymentPanel
            order={activeOrder}
            loading={activeOrderLoading}
            error={activeOrderError}
            onView={() => loadActiveOrder()}
            onRefresh={refreshActiveOrder}
          />

          <SafetyCheckPanel
            expectedNetwork={safetyExpectedNetwork}
            onExpectedNetworkChange={(value: string) => {
              setSafetyExpectedNetwork(value);
              setSafetyReport(null);
            }}
            address={safetyAddress}
            onAddressChange={(value: string) => {
              setSafetyAddress(value);
              setSafetyReport(null);
            }}
            report={safetyReport}
            loading={safetyLoading}
            onCheck={() => runAddressCheck()}
          />

          <DriftPanel
            onCheckMarket={() => handleSubmit("Long SOL with 2x")}
          />

          <section className="rounded-lg border border-[#263033] bg-[#0c1110] p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]">
                Route engines
              </p>
              <Activity className="h-4 w-4 text-[#62d5f6]" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {protocolModes.map((mode) => (
                <button
                  key={mode.label}
                  type="button"
                  onClick={() => handleSubmit(mode.intent)}
                  className="min-h-20 rounded-lg border border-[#263033] bg-[#08100e] px-3 py-3 text-left transition-colors hover:border-[#62d5f6] hover:bg-[#101817] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff4a50]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-white">
                      {mode.label}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] ${statusBadgeClass(mode.status)}`}>
                      {mode.status}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-xs text-[#93a0a1]">
                    {mode.value}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

function RoutePlaceholder({
  loading = false,
}: {
  loading?: boolean;
}) {
  return (
    <div className="p-4 sm:p-5">
      <div className="route-map rounded-lg border border-[#222a2c] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#93a0a1]">
              {loading ? "Finding route" : "No route selected"}
            </p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {loading ? "Checking providers" : "Start with a request"}
            </p>
            {!loading ? (
              <p className="mt-2 max-w-md text-sm leading-6 text-[#aab4b5]">
                Type a request on the left. This desk will show the provider, minimum amount, network checks, and the next safe action.
              </p>
            ) : null}
          </div>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#ff4a50]" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-[#62d5f6]" />
          )}
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <div className="route-node">
            <span>{loading ? "IN" : "1"}</span>
          </div>
          <div className="h-px min-w-8 flex-1 bg-[#455255]" />
          <div className="route-node route-node-accent">
            <span>{loading ? "OK" : "2"}</span>
          </div>
          <div className="h-px min-w-8 flex-1 bg-[#455255]" />
          <div className="route-node">
            <span>{loading ? "OUT" : "3"}</span>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-2 text-center text-xs">
          {[
            ["Minimum", loading ? "..." : "--"],
            ["Address", loading ? "..." : "--"],
            ["Recovery", loading ? "..." : "--"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-3"
            >
              <p className="text-[#8d9a9f]">{label}</p>
              <p className="mt-1 font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {[
          ["1", "Intent parsed from text or voice"],
          ["2", "Provider and minimum shown"],
          ["3", "Wrong-network address blocked"],
          ["4", "Payment details recoverable"],
        ].map(([number, label], index) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-lg border border-[#222a2c] bg-[#0b1011] px-3 py-3"
          >
            <span
              className={`flex h-6 w-6 flex-none items-center justify-center rounded-md text-xs font-semibold ${
                loading && index === 1
                  ? "bg-[#ff4a50] text-white"
                  : "bg-[#151c1e] text-[#9da8a9]"
              }`}
            >
              {number}
            </span>
            <span className="text-sm text-[#c5ced0]">{label}</span>
          </div>
        ))}
      </div>

      {!loading ? (
        <div className="mt-4 rounded-lg border border-[#28463b] bg-[#081611] p-4">
          <p className="text-sm font-semibold text-white">What happens next</p>
          <p className="mt-2 text-sm leading-6 text-[#aab4b5]">
            Ratzon parses the intent, selects a route, then keeps the safety
            check and payment recovery visible before funds move.
          </p>
        </div>
      ) : null}
    </div>
  );
}
