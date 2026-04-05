'use client'

import { useEffect, useState } from 'react'

type Platform = 'ios' | 'android' | 'other'

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'other'
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
}

export function PWAInstallPrompt() {
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState<Platform>('other')
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => void } | null>(null)

  useEffect(() => {
    if (isStandalone()) return
    if (localStorage.getItem('pwa-prompt-dismissed')) return

    setPlatform(detectPlatform())
    setShow(true)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as Event & { prompt: () => void })
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('pwa-prompt-dismissed', '1')
    setShow(false)
  }

  async function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      dismiss()
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full sm:max-w-sm bg-gray-900 rounded-t-3xl sm:rounded-2xl p-6 flex flex-col gap-5 shadow-2xl border border-gray-700">
        {/* アイコン＋タイトル */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center text-3xl shadow-lg">
            🏀
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-lg">HOOPMINをインストール</p>
            <p className="text-gray-400 text-sm mt-0.5">ホーム画面から素早くアクセス</p>
          </div>
        </div>

        {/* 手順 */}
        {platform === 'ios' && (
          <div className="bg-gray-800 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-gray-300 text-xs font-semibold uppercase tracking-wide">追加の手順</p>
            <div className="flex items-start gap-3">
              <span className="text-orange-400 text-lg mt-0.5">①</span>
              <p className="text-gray-200 text-sm">下の <span className="text-orange-400 font-bold">共有ボタン</span>（□↑）をタップ</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-orange-400 text-lg mt-0.5">②</span>
              <p className="text-gray-200 text-sm">「<span className="text-orange-400 font-bold">ホーム画面に追加</span>」を選択</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-orange-400 text-lg mt-0.5">③</span>
              <p className="text-gray-200 text-sm">右上の「<span className="text-orange-400 font-bold">追加</span>」をタップ</p>
            </div>
          </div>
        )}

        {platform === 'android' && deferredPrompt && (
          <button
            onClick={install}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            ホーム画面に追加する
          </button>
        )}

        {(platform === 'other' || (platform === 'android' && !deferredPrompt)) && (
          <div className="bg-gray-800 rounded-xl p-4">
            <p className="text-gray-200 text-sm">ブラウザのメニューから「ホーム画面に追加」または「アプリをインストール」を選択してください。</p>
          </div>
        )}

        {/* 閉じる */}
        <button
          onClick={dismiss}
          className="text-gray-500 text-sm text-center hover:text-gray-300 transition-colors"
        >
          今はしない
        </button>
      </div>
    </div>
  )
}
