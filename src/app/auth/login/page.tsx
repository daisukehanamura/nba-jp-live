import Link from 'next/link'
import { LoginForm } from '@/features/auth/components/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4 py-12">
      {/* ブランドロゴ */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto mb-3">
          <img src="/icon-192.svg" alt="HOOPMIN" className="w-full h-full" />
        </div>
        <h1 className="text-2xl font-extrabold text-orange-400 tracking-widest">HOOPMIN</h1>
        <p className="text-gray-400 text-sm mt-1">日本の NBA 民コミュニティ</p>
      </div>

      {/* フォームカード */}
      <div className="w-full max-w-sm bg-[#161b22] border border-gray-800 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-5">ログイン</h2>
        <LoginForm />
        <p className="mt-5 text-sm text-center text-gray-500">
          アカウントをお持ちでない方は{' '}
          <Link href="/auth/signup" className="text-orange-400 hover:text-orange-300 font-medium">
            無料登録
          </Link>
        </p>
      </div>

      {/* 特典バッジ */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {['🔥 リアルタイムスコア', '💬 絵文字スタンプ', '🎯 勝利予測'].map((f) => (
          <span key={f} className="text-xs text-gray-500 bg-[#161b22] border border-gray-800 px-3 py-1.5 rounded-full">
            {f}
          </span>
        ))}
      </div>
    </main>
  )
}
