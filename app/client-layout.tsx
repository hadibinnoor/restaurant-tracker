'use client'

import AuthButton from "@/components/auth/auth-button";
import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isHomePage = typeof children === 'object' && 
    children !== null && 
    'type' in children && 
    typeof children.type === 'function' && 
    'name' in children.type && 
    children.type.name === 'Home';

  return (
    <div className={clsx(
      'min-h-screen bg-white antialiased flex flex-col',
      isHomePage ? 'p-0' : 'p-4'
    )}>
      {!isHomePage && (
        <nav className="flex h-16 items-center justify-between px-4 border-b border-gray-100">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/theet-logo.svg"
              alt="Theeta Logo"
              width={120}
              height={40}
              className="object-contain"
              priority
            />
          </Link>
          <AuthButton />
        </nav>
      )}
      <main className={clsx(
        "flex-1",
        !isHomePage && "mt-4"
      )}>
        {children}
      </main>
    </div>
  )
}
