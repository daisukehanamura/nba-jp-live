# nba-jp-live (courtside-jp)

NBA を日本語でリアルタイムに実況・観戦できるコミュニティアプリ。
試合のライブスコアを見ながらコメントで盛り上がり、勝敗予想でポイントを競えます。

🔗 https://nba-jp-live-app-dell.vercel.app

## 主な機能

- **試合一覧・ライブスコア** — balldontlie API から取得した試合を日付ごとに表示。スコア・クォーター・残り時間を5分ごとに更新
- **リアルタイムコメント** — Supabase Realtime で試合ごとのコメントを即時配信。ゲストは閲覧のみ
- **ボイスルーム** — LiveKit を使った試合ごとの音声通話
- **勝敗予想 & ポイント** — 投票数と勝率・点差からオッズを算出（1.1〜10.0倍）。的中で「オッズ × 100pt」を獲得、ハーフタイムで締め切り
- **ランキング** — 獲得ポイントの上位ユーザーを表示
- **アカウント** — Supabase Auth（メール+パスワード）、プロフィール編集、X へのシェア
- **PWA** — ホーム画面へのインストールに対応

## 技術スタック

| 領域 | 採用技術 |
|---|---|
| フロントエンド | Next.js 16 (App Router) / React 19 / Tailwind CSS 4 / TypeScript |
| DB・認証・リアルタイム | Supabase (PostgreSQL + Auth + Realtime + RLS) |
| 音声 | LiveKit |
| NBA データ | balldontlie API / ESPN CDN（チームロゴ） |
| バリデーション | Zod |
| テスト | Vitest |
| ホスティング・定期実行 | Vercel / Vercel Cron / cron-job.org |

## セットアップ

```bash
git clone https://github.com/daisukehanamura/nba-jp-live.git
cd nba-jp-live
npm install
cp .env.local.example .env.local  # 値を設定する
npm run dev
```

http://localhost:3000 を開くと `/games` にリダイレクトされます。

### 環境変数

| 変数名 | 取得元 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API |
| `BALLDONTLIE_API_KEY` | balldontlie.io > Dashboard |
| `CRON_SECRET` | 自分で生成（Cron エンドポイントの Bearer 認証に使用） |
| `NEXT_PUBLIC_LIVEKIT_URL` / `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | LiveKit Cloud |
| `X_API_BEARER_TOKEN` / `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | X / Reddit の引用カード用（任意） |
| `NEXT_PUBLIC_APP_URL` | ローカルは `http://localhost:3000` |

DB スキーマは `supabase/migrations/` を Supabase プロジェクトに適用してください。

## スクリプト

```bash
npm run dev     # 開発サーバー
npm run build   # 本番ビルド
npm run start   # 本番サーバー
npm run lint    # ESLint
npm run test    # Vitest
```

## 定期実行ジョブ

| ジョブ | エンドポイント | スケジュール | 実行元 |
|---|---|---|---|
| スケジュール同期（2週間分） | `/api/cron/sync-games` | `0 6 * * *` | Vercel Cron |
| ライブスコア更新 | `/api/cron/sync-live` | `*/5 * * * *` | cron-job.org |
| 予想ポイント精算 | `/api/cron/settle-predictions` | `0 * * * *` | cron-job.org |

いずれも `Authorization: Bearer {CRON_SECRET}` が必要です。

## ディレクトリ構成

```
src/
  app/            # ルーティング・API Route（ロジックは持たない）
  features/       # 機能単位（game / comment / prediction / voice / auth）
    components/   # UI
    hooks/        # データフェッチ・状態管理
    repository.ts # Supabase へのデータアクセス
    schema.ts     # Zod スキーマ + 型
  components/     # 共通 UI
  lib/            # supabase / balldontlie / x-api / reddit クライアント
  utils/          # 純粋なユーティリティ
supabase/migrations/
docs/             # 設計ドキュメント・学習メモ
```

設計方針・コーディング規約は [CLAUDE.md](./CLAUDE.md)、外部サービスの詳細は [docs/external-services.md](./docs/external-services.md) を参照してください。
