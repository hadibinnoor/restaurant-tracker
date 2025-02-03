import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ClientLayout from './client-layout'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "theeta.in",
  description: "Track your favorite restaurants and dishes"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen`}>
        <ClientLayout>{children}</ClientLayout>
        <Toaster />
      </body>
    </html>
  )
}
