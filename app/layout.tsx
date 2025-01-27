import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthButton from "@/components/auth/auth-button";
import Link from "next/link";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "theeta.in",
  description: "Track your favorite restaurants and dishes"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="flex h-16 items-center justify-between border px-4">
          <Link href="/" className="text-lg font-semibold">
            theeta.in
          </Link>
          <AuthButton />
        </nav>
        <main className="flex-1 p-10">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
