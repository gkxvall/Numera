import type { Metadata } from "next";
import { Lilita_One, Nunito } from "next/font/google";
import "./globals.css";

const displayFont = Lilita_One({
  variable: "--font-display",
  weight: "400",
  subsets: ["latin"],
});

const sansFont = Nunito({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Numera",
  description:
    "Numera is a fast multiplayer number survival game. Take turns, choose your move, avoid the secret number, and become the last player standing.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${displayFont.variable} ${sansFont.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
