import type { Metadata } from "next";
import "./globals.css";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "CrackIt",
  description: "CrackIt - Real-time peer-to-peer digital study rooms and interactive focus tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable, fraunces.variable, jetbrainsMono.variable)}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
