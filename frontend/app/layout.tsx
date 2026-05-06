// frontend/src/app/layout.jsx
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Ratzon — Intent Layer for Solana",
  description: "Say what you want. Ratzon executes it on Solana.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}