import type { Metadata, Viewport } from "next";
import { Cinzel, Gilda_Display, Jost, Montserrat } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--fonte-cinzel", display: "swap" });
const gilda = Gilda_Display({ subsets: ["latin"], weight: "400", variable: "--fonte-gilda", display: "swap" });
const jost = Jost({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--fonte-jost", display: "swap" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--fonte-montserrat", display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://catalogobeyondruby.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Beyond Ruby · Semijoias", template: "%s · Beyond Ruby" },
  description: "Semijoias delicadas: anéis, brincos, colares e pulseiras. Pix ou cartão, envio para todo o Brasil e entrega na Grande BH.",
  openGraph: { type: "website", locale: "pt_BR", siteName: "Beyond Ruby" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#3b010f", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${gilda.variable} ${jost.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  );
}
