import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sajtpress CRM",
  description: "AI sales CRM for the Sajtpress platform.",
};

// Mobile-app feel: fill the display cutout so the bottom tab bar can respect the
// home-indicator safe area, and tint the browser chrome to match the surface.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f14" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // The CSP nonce set by middleware — passed to next-themes so its inline theme
  // script carries the nonce and isn't blocked by the script-src policy.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}>
        <ThemeProvider nonce={nonce}>{children}</ThemeProvider>
      </body>
    </html>
  );
}
