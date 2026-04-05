import Link from 'next/link'
import { SignUpForm } from '@/features/auth/components/SignUpForm'

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4 py-12">
      {/* ブランドロゴ */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">🏀</div>
        <h1 className="text-2xl font-black text-white tracking-tight">HOOPMIN</h1>
        <p className="text-gray-400 text-sm mt-1">日本の NBA 民コミュニティ</p>
      </div>

      {/* フォームカード */}
      <div className="w-full max-w-sm bg-[#161b22] border border-gray-800 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white mb-1">無料登録</h2>
        <p className="text-xs text-gray-500 mb-5">コメント・予測・スタンプが使えます</p>
        <SignUpForm />
        <p className="mt-5 text-sm text-center text-gray-500">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/auth/login" className="text-orange-400 hover:text-orange-300 font-medium">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  )
}
