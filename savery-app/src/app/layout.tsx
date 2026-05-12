import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/ThemeContext";

export const metadata: Metadata = {
  title: "Savery — Financial Clarity Engine",
  description:
    "AI-native financial clarity that reveals the why behind every spend. Understand your spending. Master your future.",
  keywords: ["savery", "financial clarity", "spending insights", "AI finance", "expense tracking"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
