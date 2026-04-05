import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import { Header } from '@/components/Header'
import { HeaderGuard } from '@/components/HeaderGuard'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const viewport: Viewport = {
  themeColor: '#f97316',
}

export const metadata: Metadata = {
  title: 'HOOPMIN - 日本のNBA民コミュニティ',
  description: 'NBAをリアルタイムで語り合う日本語コミュニティ。スコア速報・勝利予測・絵文字スタンプで盛り上がろう。',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'HOOPMIN',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} h-full dark`}>
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100 antialiased">
        <HeaderGuard>
          <Header />
        </HeaderGuard>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  )
}
