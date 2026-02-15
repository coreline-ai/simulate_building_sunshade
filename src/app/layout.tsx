import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "건물 일조 시뮬레이터",
  description: "시간, 계절, 방위각, 건물 배치에 따른 일조 상태를 3D로 시각화하는 시뮬레이터",
  keywords: ["일조", "태양", "시뮬레이터", "건물 배치", "Three.js", "Next.js"],
  authors: [{ name: "simulate_building_sunshade" }],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
  openGraph: {
    title: "건물 일조 시뮬레이터",
    description: "3D 기반 건물 일조 시뮬레이션",
    url: "http://localhost:3000",
    siteName: "Sunshade Simulator",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "건물 일조 시뮬레이터",
    description: "3D 기반 건물 일조 시뮬레이션",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
