import type { Metadata, Viewport } from "next";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://gemini-quiz.vercel.app"),
  title: {
    default: "Gemini Quiz Mate - AI 기반 인터랙티브 퀴즈 플랫폼",
    template: "%s | Gemini Quiz Mate",
  },
  description: "AI 기반 실시간 인터랙티브 퀴즈 게임 플랫폼. 슈퍼 마리오, 배틀 아레나, 히어로 시험, 티니핑 월드 등 다양한 게임 모드로 학생들의 학습 참여를 극대화하세요.",
  keywords: [
    "퀴즈 게임",
    "교육 게임",
    "실시간 퀴즈",
    "인터랙티브 학습",
    "AI 교육",
    "Gemini",
    "교사용 도구",
    "학습 플랫폼",
    "게이미피케이션",
    "슈퍼 마리오 퀴즈",
    "티니핑",
    "원펀맨"
  ],
  authors: [{ name: "Gemini Quiz Mate Team" }],
  creator: "Gemini Quiz Mate",
  publisher: "Gemini Quiz Mate",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "Gemini Quiz Mate",
    title: "Gemini Quiz Mate - AI 기반 인터랙티브 퀴즈 플랫폼",
    description: "AI 기반 실시간 인터랙티브 퀴즈 게임 플랫폼. 다양한 게임 모드로 학생들의 학습 참여를 극대화하세요.",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Gemini Quiz Mate Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gemini Quiz Mate - AI 기반 인터랙티브 퀴즈 플랫폼",
    description: "AI 기반 실시간 인터랙티브 퀴즈 게임 플랫폼",
    images: ["/icon.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
  category: "education",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
