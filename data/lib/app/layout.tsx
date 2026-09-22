import type { Metadata } from "next";
import { Neucha } from "next/font/google";
import "./globals.css";

const neucha = Neucha({ weight: "400", subsets: ["cyrillic", "latin"] });

export const metadata: Metadata = {
  title: "Филинград · вышивальные квесты для сычика",
  description: "Каждый день — новая встреча и новое задание для вышивальщицы",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className={neucha.className}>{children}</body>
    </html>
  );
}
