import React from "react"
import type { Metadata } from 'next'
import { Noto_Sans_JP, Noto_Serif_JP } from 'next/font/google'

import './globals.css'

const _notoSans = Noto_Sans_JP({ subsets: ['latin'], variable: '--font-noto-sans' })
const _notoSerif = Noto_Serif_JP({ subsets: ['latin'], variable: '--font-noto-serif' })

export const metadata: Metadata = {
  title: 'JUNKAN - 信頼の循環インフラ',
  description: '地方創生・観光をテーマにした完全招待制クローズドメディア',
}

import { Toaster } from "@/components/ui/toaster"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${_notoSans.variable} ${_notoSerif.variable} font-sans antialiased text-[#1B3022]`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
