import Link from 'next/link'
import { LoginForm } from '@/features/auth/components/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-3xl mb-2">🏀</p>
          <h1 className="text-2xl font-bold">ログイン</h1>
          <p className="text-sm text-gray-600 mt-1">Courtside JP へようこそ</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <LoginForm />
        </div>
        <p className="mt-4 text-sm text-center text-gray-600">
          アカウントをお持ちでない方は{' '}
          <Link href="/auth/signup" className="text-blue-500 hover:underline font-medium">
            新規登録
          </Link>
        </p>
      </div>
    </main>
  )
}
