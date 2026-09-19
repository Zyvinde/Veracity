import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, Instrument_Serif, IBM_Plex_Mono, Noto_Sans_Arabic, Noto_Sans_Devanagari, Noto_Sans_Malayalam, Manrope, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "../styles/veracity-tokens.css";
import { I18nProvider } from "@/lib/i18n/context";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-veracity-serif",
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-hindi",
  display: "swap",
});

const notoMalayalam = Noto_Sans_Malayalam({
  subsets: ["malayalam"],
  variable: "--font-malayalam",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "House Health [MVP PROTOTYPE] — Pre-Operative Assessment Demo, Not for Clinical Use",
  description: "MVP prototype for evaluation only. Non-diagnostic clinical decision support demo with mock data. Not a medical device. Not for diagnosis or autonomous clinical decisions.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cg transform='rotate(-30 12 12)'%3E%3Ccircle cx='7.3' cy='3.2' r='1.45'/%3E%3Crect x='5.5' y='4.7' width='3.6' height='14.6' rx='1.8'/%3E%3Crect x='14.9' y='4.7' width='3.6' height='14.6' rx='1.8'/%3E%3Ccircle cx='16.7' cy='20.8' r='1.45'/%3E%3C/g%3E%3C/svg%3E",
  },
  openGraph: {
    title: "House Health [MVP PROTOTYPE] — Evaluation Demo Only",
    description: "MVP prototype. Mock data. Not a medical device. For pilot evaluation discussions only — not for clinical use.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en" dir="ltr" suppressHydrationWarning className={`scroll-smooth ${inter.variable} ${manrope.variable} ${playfairDisplay.variable} ${instrumentSerif.variable} ${ibmPlexMono.variable} ${notoArabic.variable} ${notoDevanagari.variable} ${notoMalayalam.variable} ${jakarta.variable}`}>
      <head>
        {/* Theme init: default is cream+green light; .dark only if user opted in */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('veracity-theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.googleapis.com; font-src 'self' https://fonts.gstatic.com https://*.gstatic.com data:; img-src 'self' data: https:; media-src 'self' data: blob:; connect-src 'self' https:;" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen w-full max-w-full overflow-x-clip bg-[#0a0a0a] text-white font-sans antialiased selection:bg-white/20 dark:bg-[#0A0B0E] dark:text-slate-200 dark:selection:bg-[#10B981] dark:selection:text-[#06281C]">
        <I18nProvider>
          <div role="note" aria-label="MVP prototype notice" className="sticky top-0 z-[100] w-full bg-amber-400 px-3 py-2 text-center font-mono text-[11px] font-bold uppercase tracking-wider text-black">
            MVP Prototype — Demo with mock data only · Not a medical device · Not for clinical use
          </div>
          <div id="app-root" className="w-full max-w-full min-w-0 overflow-x-clip">
            {children}
          </div>
          <Toaster richColors theme="light" position="bottom-right" closeButton />
        </I18nProvider>
      </body>
    </html>
  );
}
