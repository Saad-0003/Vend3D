import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CartDrawer } from "@/components/shared/cart-drawer";
import { OfflineNotice } from "@/components/system/offline-notice";
import { ThemeProvider } from "@/components/theme-provider";
import { SmoothScroll } from "@/components/smooth-scroll";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial display serif for the redesigned home page only (`.home-lux`
// consumes `--font-instrument`). Navbar / Footer / Testimonials keep Geist.
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "Vend3D — customize it in 3D",
    template: "%s · Vend3D",
  },
  description:
    "Browse blank products, customize color, material, decals and text in a live 3D viewer, then print them on demand.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} flex min-h-screen flex-col antialiased`}
      >
        <ThemeProvider>
          <SmoothScroll>
            <a
              href="#main"
              className="bg-glass text-foreground sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:rounded-full focus:px-4 focus:py-2"
            >
              Skip to content
            </a>
            <SiteHeader />
            <main id="main" className="flex-1">
              {children}
            </main>
            <SiteFooter />
            <Toaster position="bottom-center" />
            <CartDrawer />
            <OfflineNotice />
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
