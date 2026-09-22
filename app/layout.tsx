import type { Metadata } from "next"
import { Geist_Mono, Inter } from "next/font/google"

import { ThemeProvider } from "@/components/layout/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "HW Trans Fleet",
    template: "%s — HW Trans Fleet",
  },
  description: "Sistem Manajemen Armada & Keuangan PT Hadya Wiran Trans",
  icons: {
    icon: [
      {
        url: "/icon-light.png?v=2",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark.png?v=2",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [
      {
        url: "/icon-dark.png?v=2",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
