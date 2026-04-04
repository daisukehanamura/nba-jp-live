import Link from 'next/link'
import { SignUpForm } from '@/features/auth/components/SignUpForm'

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <h1 className="text-2xl font-bold mb-6 text-center">アカウント作成</h1>
        <SignUpForm />
        <p className="mt-4 text-sm text-center text-gray-500">
          すでにアカウントをお持ちの方は{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            ログイン
          </Link>
        </p>
      </div>
    </main>
  )
}
