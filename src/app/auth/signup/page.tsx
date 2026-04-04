import Link from 'next/link'
import { SignUpForm } from '@/features/auth/components/SignUpForm'

export default function SignUpPage() {
  return (
    <main className="min-h-[calc(100vh-3rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-3xl mb-2">🏀</p>
          <h1 className="text-2xl font-bold">アカウント作成</h1>
          <p className="text-sm text-gray-600 mt-1">日本語NBAコミュニティに参加する</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <SignUpForm />
        </div>
        <p className="mt-4 text-sm text-center text-gray-600">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/auth/login" className="text-blue-500 hover:underline font-medium">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  )
}
