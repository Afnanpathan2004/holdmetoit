import type { Metadata } from "next";
import {
  Caveat,
  DM_Sans,
  Fraunces,
  JetBrains_Mono,
} from "next/font/google";

import "./globals.css";

const fontSerif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const fontScript = Caveat({
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HoldMeToIt",
  description:
    "Gamified study accountability and challenge management for Discord communities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${fontSerif.variable} ${fontSans.variable} ${fontMono.variable} ${fontScript.variable}`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
