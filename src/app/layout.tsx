import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Header } from '@/components/Header'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Courtside JP - NBAリア��タイムコメント',
  description: '日本語NBAファンのリアルタイムコミュニティ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 antialiased">
        <Header />
        <div className="flex-1">{children}</div>
      </body>
    </html>
  )
}
