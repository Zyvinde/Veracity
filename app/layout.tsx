import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, IBM_Plex_Mono, Noto_Sans_Arabic, Noto_Sans_Devanagari, Manrope, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n/context";
import { ToastProvider } from "@/components/Toast";

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

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: "Veracity (Private Beta) — Pre-Operative Assessment & Clinical Decision Support",
  description: "Private Beta clinical decision support platform for perioperative risk assessment, anesthesia triage, and surgical delay prevention under DHA § 3060(a) guidelines.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cg transform='rotate(-30 12 12)'%3E%3Ccircle cx='7.3' cy='3.2' r='1.45'/%3E%3Crect x='5.5' y='4.7' width='3.6' height='14.6' rx='1.8'/%3E%3Crect x='14.9' y='4.7' width='3.6' height='14.6' rx='1.8'/%3E%3Ccircle cx='16.7' cy='20.8' r='1.45'/%3E%3C/g%3E%3C/svg%3E",
  },
  openGraph: {
    title: "Veracity (Private Beta) — Pre-Operative Assessment & Clinical Decision Support",
    description: "Private Beta clinical decision support platform for perioperative assessment, anesthesia clearance workflows, and surgical safety defense.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en" dir="ltr" suppressHydrationWarning className={`scroll-smooth ${inter.variable} ${manrope.variable} ${playfairDisplay.variable} ${ibmPlexMono.variable} ${notoArabic.variable} ${notoDevanagari.variable} ${jakarta.variable}`}>
      <head>
        {/* Theme init: default is cream+green light; .dark only if user opted in */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('veracity-theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.googleapis.com https://db.onlinewebfonts.com https://*.onlinewebfonts.com; font-src 'self' https://fonts.gstatic.com https://*.gstatic.com https://db.onlinewebfonts.com https://*.onlinewebfonts.com data:; img-src 'self' data: https:; media-src 'self' https://d8j0ntlcm91z4.cloudfront.net https://*.cloudfront.net data: blob:; connect-src 'self' https:;" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://db.onlinewebfonts.com/c/ca3d10781128664daddf89bf2e2d1305?family=Graphik+LCG+Regular+Regular" rel="stylesheet" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#0a0a0a] text-white font-sans antialiased selection:bg-white/20 dark:bg-[#0A0B0E] dark:text-slate-200 dark:selection:bg-[#10B981] dark:selection:text-[#06281C]">
        <I18nProvider>
          <ToastProvider>
            <div id="app-root">
              {children}
            </div>
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
