import type { Metadata, Viewport } from "next";
import { Archivo, Courier_Prime } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { BRAND } from "@/lib/brand";
import { registryStats } from "@/lib/registry/load";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const courier = Courier_Prime({
  variable: "--font-courier",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${BRAND.name}: ${BRAND.tagline}`, template: `%s · ${BRAND.name}` },
  description: BRAND.description,
  icons: { icon: "/icon.svg" },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: { title: `${BRAND.name}: ${BRAND.tagline}`, description: BRAND.description, type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f6f2" },
    { media: "(prefers-color-scheme: dark)", color: "#141416" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const asOf = registryStats().map((s) => ({ country: s.country, date: s.as_of }));
  return (
    <html lang="en" className={`${archivo.variable} ${courier.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Nav />
        <main className="flex-1">{children}</main>
        <Footer asOf={asOf} />
      </body>
    </html>
  );
}
