// frontend/src/app/layout.jsx
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";

export const metadata = {
  title: "Ratzon — Intent Layer for Solana",
  description: "Say what you want. Ratzon executes it on Solana.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
