import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'Courtside JP - NBAリアルタイムコメント',
  description: '日本語NBAファンのリアルタイムコミュニティ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900 antialiased">
        <header className="sticky top-0 z-10 bg-gray-900 border-b border-gray-800">
          <div className="max-w-3xl mx-auto px-4 h-12 flex items-center justify-between">
            <a href="/games" className="font-bold text-base tracking-tight text-white flex items-center gap-2">
              🏀 <span>Courtside JP</span>
            </a>
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  )
}
