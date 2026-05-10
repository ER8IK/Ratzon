const pptxgen = require("pptxgenjs");
const path = require("path");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "RATZON";
pptx.company = "RATZON";
pptx.subject = "RATZON pitch deck";
pptx.title = "RATZON Pitch Deck";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US",
};
pptx.defineLayout({ name: "RATZON_WIDE", width: 13.333, height: 7.5 });
pptx.layout = "RATZON_WIDE";
pptx.margin = 0;

const C = {
  bg: "030303",
  panel: "101012",
  panel2: "171719",
  text: "F7F2EE",
  muted: "B8B0AA",
  dim: "76706D",
  red: "D6382E",
  redDark: "8B1613",
  green: "49D17A",
  line: "7A211D",
  whiteLine: "333337",
};

const logo = path.join(__dirname, "../frontend/public/Ratzon_logo-removebg-preview.png");
const out = path.join(__dirname, "ratzon_pitch.pptx");

function addBg(slide, n, footerLeft) {
  slide.background = { color: C.bg };
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: C.bg },
    line: { color: C.bg },
  });
  for (let x = 0; x < 13.333; x += 0.75) {
    slide.addShape(pptx.ShapeType.line, {
      x,
      y: 0,
      w: 0,
      h: 7.5,
      line: { color: "111111", transparency: 20, width: 0.4 },
    });
  }
  for (let y = 0; y < 7.5; y += 0.75) {
    slide.addShape(pptx.ShapeType.line, {
      x: 0,
      y,
      w: 13.333,
      h: 0,
      line: { color: "111111", transparency: 20, width: 0.4 },
    });
  }
  slide.addShape(pptx.ShapeType.line, {
    x: 0,
    y: 6.58,
    w: 13.333,
    h: 0,
    line: { color: C.red, width: 1.4, transparency: 5 },
  });
  slide.addText(footerLeft, {
    x: 0.84,
    y: 6.95,
    w: 9.8,
    h: 0.25,
    fontFace: "Aptos",
    fontSize: 10.5,
    color: C.dim,
    bold: true,
    margin: 0,
  });
  slide.addText(String(n).padStart(2, "0"), {
    x: 12.0,
    y: 6.93,
    w: 0.5,
    h: 0.25,
    fontFace: "Aptos",
    fontSize: 11,
    color: C.text,
    bold: true,
    align: "right",
    margin: 0,
  });
}

function kicker(slide, text) {
  slide.addText(text.toUpperCase(), {
    x: 0.84,
    y: 0.52,
    w: 2.7,
    h: 0.24,
    fontFace: "Aptos",
    fontSize: 12.5,
    color: C.red,
    bold: true,
    margin: 0,
  });
}

function title(slide, text, opts = {}) {
  slide.addText(text, {
    x: opts.x ?? 0.84,
    y: opts.y ?? 0.92,
    w: opts.w ?? 9.6,
    h: opts.h ?? 1.15,
    fontFace: "Aptos Display",
    fontSize: opts.size ?? 34,
    color: C.text,
    bold: true,
    fit: "shrink",
    breakLine: false,
    margin: 0,
  });
}

function paragraph(slide, text, x, y, w, h, size = 18, color = C.muted, bold = true) {
  slide.addText(text, {
    x,
    y,
    w,
    h,
    fontFace: "Aptos",
    fontSize: size,
    color,
    bold,
    fit: "shrink",
    margin: 0,
    valign: "mid",
    breakLine: false,
  });
}

function panel(slide, x, y, w, h, opts = {}) {
  slide.addShape(pptx.ShapeType.rect, {
    x,
    y,
    w,
    h,
    fill: { color: opts.fill ?? C.panel, transparency: opts.transparency ?? 0 },
    line: { color: opts.line ?? C.whiteLine, width: opts.width ?? 1.1 },
  });
}

function addStep(slide, n, text, y) {
  slide.addText(String(n), {
    x: 0.98,
    y,
    w: 0.28,
    h: 0.24,
    fontSize: 15,
    color: C.red,
    bold: true,
    margin: 0,
  });
  slide.addText(text, {
    x: 1.33,
    y,
    w: 3.8,
    h: 0.24,
    fontSize: 15,
    color: C.text,
    bold: true,
    margin: 0,
  });
}

function addFooterLine(slide, text) {
  slide.addText(text, {
    x: 0.84,
    y: 6.14,
    w: 11.65,
    h: 0.32,
    fontFace: "Aptos Display",
    fontSize: 18,
    color: C.text,
    bold: true,
    align: "center",
    fit: "shrink",
    margin: 0,
  });
}

{
  const s = pptx.addSlide();
  addBg(s, 1, "Superteam Georgia · Colosseum Frontier Hackathon · 2026");
  s.addImage({ path: logo, x: 5.7, y: 1.0, w: 1.95, h: 1.95 });
  s.addText("RATZON", {
    x: 3.45,
    y: 3.02,
    w: 6.42,
    h: 0.67,
    fontFace: "Aptos Display",
    fontSize: 44,
    color: C.text,
    bold: true,
    align: "center",
    margin: 0,
    charSpace: 2,
  });
  s.addText("Protected crypto execution from plain language", {
    x: 2.85,
    y: 3.78,
    w: 7.64,
    h: 0.42,
    fontFace: "Aptos",
    fontSize: 21,
    color: C.muted,
    bold: true,
    align: "center",
    margin: 0,
  });
  s.addText(
    [
      { text: "Type the intent.", options: { color: C.red } },
      { text: "\nRatzon routes, checks, and recovers it.", options: { color: C.text } },
    ],
    {
      x: 3.35,
      y: 4.42,
      w: 6.62,
      h: 0.72,
      fontFace: "Aptos Display",
      fontSize: 23,
      bold: true,
      align: "center",
      breakLine: false,
      margin: 0,
    }
  );
}

{
  const s = pptx.addSlide();
  addBg(s, 2, "RATZON · Problem");
  kicker(s, "Problem");
  title(s, "Crypto execution is still too manual.", { w: 6.25, h: 1.25, size: 30 });
  addStep(s, 1, "Choose the right app", 2.47);
  addStep(s, 2, "Connect wallet", 2.86);
  addStep(s, 3, "Select token and network", 3.25);
  addStep(s, 4, "Compare route and minimum", 3.64);
  addStep(s, 5, "Paste payout address", 4.03);
  addStep(s, 6, "Hope nothing is wrong", 4.42);
  panel(s, 8.35, 2.12, 3.25, 2.28, { fill: "130807", line: C.red, width: 1.8 });
  s.addText("6+", {
    x: 8.75,
    y: 2.38,
    w: 2.45,
    h: 0.8,
    fontFace: "Aptos Display",
    fontSize: 56,
    color: C.red,
    bold: true,
    align: "center",
    margin: 0,
  });
  paragraph(s, "steps for one simple swap", 8.72, 3.34, 2.5, 0.6, 19, C.text, true);
  addFooterLine(s, "The barrier is not liquidity. It is safe execution.");
}

{
  const s = pptx.addSlide();
  addBg(s, 3, "Demo moment · 30 seconds");
  kicker(s, "Solution");
  title(s, "One request becomes a guarded route.");
  panel(s, 0.84, 2.0, 4.35, 3.55);
  s.addText("BEFORE", {
    x: 1.16,
    y: 2.31,
    w: 2.2,
    h: 0.3,
    fontSize: 17,
    color: C.red,
    bold: true,
    margin: 0,
  });
  ["Choose app", "Select network", "Compare minimum", "Paste address", "Recover payment"].forEach((t, i) => {
    s.addText(`✓ ${t}`, {
      x: 1.16,
      y: 2.83 + i * 0.42,
      w: 3.2,
      h: 0.25,
      fontSize: 16,
      color: C.text,
      bold: true,
      margin: 0,
    });
  });
  panel(s, 5.55, 2.0, 6.94, 3.55);
  s.addText("AFTER", {
    x: 5.88,
    y: 2.31,
    w: 2.0,
    h: 0.3,
    fontSize: 17,
    color: C.red,
    bold: true,
    margin: 0,
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 8.8,
    y: 2.74,
    w: 2.8,
    h: 0.42,
    rectRadius: 0.06,
    fill: { color: C.red },
    line: { color: C.red },
  });
  s.addText("Swap 50 USDT TRC20 to BTC", {
    x: 8.94,
    y: 2.84,
    w: 2.52,
    h: 0.18,
    fontSize: 12,
    color: C.text,
    bold: true,
    margin: 0,
    align: "center",
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 6.0,
    y: 3.34,
    w: 3.75,
    h: 0.78,
    rectRadius: 0.06,
    fill: { color: C.panel2 },
    line: { color: C.whiteLine },
  });
  paragraph(s, "Smart route ready\nMinimum · BTC network check · Active Payment", 6.2, 3.49, 3.34, 0.42, 11.5, C.text, true);
  [C.red, C.green, "55D8D1", "8E59FF"].forEach((accent, i) => {
    const x = 6 + i * 1.35;
    panel(s, x, 4.45, 1.16, 0.63, { fill: "0E0E10" });
    s.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.42,
      y: 4.58,
      w: 0.32,
      h: 0.32,
      fill: { color: accent, transparency: 8 },
      line: { color: "FFFFFF", transparency: 80, width: 0.8 },
    });
    s.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.35,
      y: 4.94,
      w: 0.46,
      h: 0.04,
      rectRadius: 0.02,
      fill: { color: "FFFFFF", transparency: 78 },
      line: { color: "FFFFFF", transparency: 100 },
    });
  });
  addFooterLine(s, "Ratzon understands the intent, checks the network, and keeps payment details recoverable.");
}

{
  const s = pptx.addSlide();
  addBg(s, 4, "Intent → QVAC/regex → router → risk/safety → approval");
  kicker(s, "How it works");
  title(s, "QVAC parses. Router decides. Safety guards.");
  const flow = [
    ["01", "Intent", "User says the desired outcome."],
    ["02", "QVAC", "LLM and voice input handle ambiguity."],
    ["03", "Route", "Jupiter finds the best path."],
    ["04", "Safety", "Risk, minimum and network checks."],
    ["05", "Recover", "Payment details stay visible."],
    ["06", "Approve", "User controls wallet or payment action."],
  ];
  flow.forEach(([num, head, body], i) => {
    const x = 0.84 + i * 2.02;
    panel(s, x, 2.12, 1.72, 1.78);
    s.addText(num, { x: x + 0.16, y: 2.32, w: 0.46, h: 0.2, fontSize: 10.5, color: C.red, bold: true, margin: 0 });
    s.addText(head, { x: x + 0.16, y: 2.78, w: 1.28, h: 0.32, fontSize: 17, color: C.text, bold: true, margin: 0, fit: "shrink" });
    s.addText(body, { x: x + 0.16, y: 3.24, w: 1.36, h: 0.38, fontSize: 9.5, color: C.muted, bold: true, margin: 0, fit: "shrink" });
    if (i < flow.length - 1) {
      s.addText("→", { x: x + 1.75, y: 2.67, w: 0.3, h: 0.34, fontSize: 20, color: C.red, bold: true, margin: 0 });
    }
  });
  const trust = [
    "Regex fast path plus QVAC fallback",
    "Jupiter live routes and guarded adapters",
    "Non-custodial, confirm-before-action flow",
  ];
  trust.forEach((t, i) => {
    const x = 0.84 + i * 4.05;
    s.addShape(pptx.ShapeType.line, { x, y: 4.78, w: 0, h: 0.58, line: { color: C.red, width: 2 } });
    paragraph(s, t, x + 0.16, 4.76, 3.35, 0.62, 14, C.muted, true);
  });
}

{
  const s = pptx.addSlide();
  addBg(s, 5, "Telegram first. Intent layer next.");
  kicker(s, "Product");
  title(s, "A protocol, not a bot.");
  paragraph(s, "Any interface can turn a user intent into a routed, checked crypto action through Ratzon.", 0.84, 1.62, 8.3, 0.45, 18, C.muted, true);
  const interfaces = ["Telegram", "Wallets", "dApps", "AI Agents"];
  interfaces.forEach((t, i) => {
    panel(s, 2.18 + i * 2.15, 2.35, 1.8, 0.58);
    paragraph(s, t, 2.18 + i * 2.15, 2.52, 1.8, 0.18, 14, C.text, true);
  });
  s.addText("↓", { x: 6.33, y: 3.08, w: 0.34, h: 0.26, fontSize: 21, color: C.red, bold: true, margin: 0 });
  panel(s, 4.05, 3.5, 5.22, 1.02, { fill: "170908", line: C.red, width: 2.3 });
  s.addText("RATZON INTENT LAYER", {
    x: 4.3,
    y: 3.75,
    w: 4.72,
    h: 0.26,
    fontSize: 20,
    color: C.text,
    bold: true,
    align: "center",
    margin: 0,
  });
  paragraph(s, "Parse · Route · Check · Recover", 4.55, 4.11, 4.2, 0.22, 13.5, C.muted, true);
  s.addText("↓", { x: 6.33, y: 4.68, w: 0.34, h: 0.26, fontSize: 21, color: C.red, bold: true, margin: 0 });
  ["Jupiter", "Smart Swap", "Drift", "Kamino", "Staking"].forEach((t, i) => {
    panel(s, 1.58 + i * 2.12, 5.12, 1.75, 0.5, { fill: "0E0E10" });
    paragraph(s, t, 1.58 + i * 2.12, 5.27, 1.75, 0.16, 11.5, C.muted, true);
  });
}

{
  const s = pptx.addSlide();
  addBg(s, 6, "Start narrow. Become the execution layer.");
  kicker(s, "Wedge");
  title(s, "Start with painful, high-frequency routes.", { w: 10.55, h: 1.1, size: 30 });
  const metrics = [
    ["1", "Telegram-native\ncrypto users"],
    ["2", "Swaps and Smart Swap\npayments"],
    ["3", "Staking, lending,\nperps and agents"],
  ];
  metrics.forEach(([a, b], i) => {
    const x = 0.84 + i * 4.08;
    s.addShape(pptx.ShapeType.line, { x, y: 2.58, w: 3.15, h: 0, line: { color: C.red, width: 2 } });
    s.addText(a, { x, y: 2.9, w: 3.15, h: 0.55, fontSize: 34, color: C.red, bold: true, margin: 0 });
    s.addText(b, { x, y: 3.6, w: 3.1, h: 0.54, fontSize: 16, color: C.text, bold: true, margin: 0, fit: "shrink" });
  });
  panel(s, 0.84, 4.72, 5.54, 0.94);
  s.addText("First users", { x: 1.1, y: 4.96, w: 1.8, h: 0.22, fontSize: 16, color: C.red, bold: true, margin: 0 });
  paragraph(s, "Users who want a safe answer without opening five crypto apps.", 1.1, 5.3, 4.85, 0.22, 13, C.muted, true);
  panel(s, 6.95, 4.72, 5.54, 0.94);
  s.addText("Expansion", { x: 7.21, y: 4.96, w: 1.8, h: 0.22, fontSize: 16, color: C.red, bold: true, margin: 0 });
  paragraph(s, "Wallets, apps and agents plug into the same router and safety layer.", 7.21, 5.3, 4.85, 0.22, 13, C.muted, true);
}

{
  const s = pptx.addSlide();
  addBg(s, 7, "Superteam Georgia · Colosseum Frontier Hackathon");
  kicker(s, "Traction");
  title(s, "Already working. Not a concept.");
  const statuses = [
    ["✓", "Intent parser", "LIVE", C.green],
    ["✓", "QVAC parser + voice", "LIVE", C.green],
    ["✓", "Jupiter quotes", "LIVE", C.green],
    ["✓", "Risk engine", "LIVE", C.green],
    ["✓", "Address safety", "LIVE", C.green],
    ["✓", "Active Payment", "LIVE", C.green],
    ["→", "Beta users", "NEXT", C.red],
  ];
  statuses.forEach(([mark, text, tag, color], i) => {
    const y = 2.05 + i * 0.52;
    s.addText(mark, { x: 0.96, y, w: 0.22, h: 0.2, fontSize: 13.5, color, bold: true, margin: 0 });
    s.addText(text, { x: 1.31, y, w: 3.2, h: 0.22, fontSize: 15.5, color: C.text, bold: true, margin: 0 });
    s.addText(tag, { x: 4.72, y, w: 0.62, h: 0.2, fontSize: 9.5, color: C.red, bold: true, margin: 0, align: "right" });
    s.addShape(pptx.ShapeType.line, { x: 0.96, y: y + 0.38, w: 4.45, h: 0, line: { color: C.whiteLine, width: 0.7 } });
  });
  panel(s, 6.55, 2.08, 4.95, 1.38, { fill: "130807", line: C.red, width: 1.6 });
  s.addText("NEXT MILESTONE", { x: 6.87, y: 2.36, w: 2.4, h: 0.22, fontSize: 12, color: C.red, bold: true, margin: 0 });
  paragraph(s, "Harden wallet execution, add more DeFi actions, and onboard beta users.", 6.87, 2.76, 4.25, 0.42, 19, C.text, true);
  s.addImage({ path: logo, x: 6.67, y: 4.1, w: 0.78, h: 0.78 });
  s.addText("Built by Eric, solo engineer.", { x: 7.68, y: 4.16, w: 3.15, h: 0.22, fontSize: 15.5, color: C.text, bold: true, margin: 0 });
  paragraph(s, "Bot, WebApp, QVAC path, safety checks and recovery flow are working now.", 7.68, 4.52, 3.75, 0.42, 12.5, C.muted, true);
  addFooterLine(s, "Try it now: @Ratzon_bot");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  await pptx.writeFile({ fileName: out });
}
