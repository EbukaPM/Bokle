import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Bokle — Community Services & Verification",
  description:
    "Bokle connects you with trusted, verified local providers for everyday help — and lets you dispatch a verified checker anywhere in Nigeria with Help Me Check Am.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#1A8C6F",
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('bokle-theme');
    var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="antialiased font-sans">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>
          <main id="main-content">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
