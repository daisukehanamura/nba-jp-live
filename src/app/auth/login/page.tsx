import Link from 'next/link'
import { LoginForm } from '@/features/auth/components/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <h1 className="text-2xl font-bold mb-6 text-center">ログイン</h1>
        <LoginForm />
        <p className="mt-4 text-sm text-center text-gray-500">
          アカウントをお持ちでない方は{' '}
          <Link href="/auth/signup" className="text-blue-600 hover:underline">
            新規登録
          </Link>
        </p>
      </div>
    </main>
  )
}
