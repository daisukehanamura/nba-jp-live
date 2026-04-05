import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Header } from '@/components/Header'
import { HeaderGuard } from '@/components/HeaderGuard'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'HOOPMIN - 日本のNBA民コミュニティ',
  description: 'NBAをリアルタイムで語り合う日本語コミュニティ。スコア速報・勝利予測・絵文字スタンプで盛り上がろう。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 antialiased">
        <HeaderGuard>
          <Header />
        </HeaderGuard>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  )
}
