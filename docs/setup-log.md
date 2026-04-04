# courtside-jp セットアップログ

## プロジェクト概要

NBA日本語リアルタイムコメントアプリ。日本語NBAファンが試合を見ながらリアルタイムで盛り上がれるコミュニティ体験を提供する。

**リポジトリ名**: `courtside-jp`
**技術スタック**: Next.js (Vercel) / Supabase / Cloudflare Workers / X API / Reddit API

---

## ステップ進捗

### ✅ ステップ1: Next.jsプロジェクト初期化

- `create-next-app@16.2.2` で初期化
- TypeScript / ESLint / Tailwind CSS / App Router / Turbopack / src/ ディレクトリ構成
- パッケージマネージャー: npm
- import alias: `@/*`
- ビルド確認済み（`npm run build` 成功）

### ✅ ステップ2: CLAUDE.md 作成

- `CLAUDE.md` をプロジェクトルートに作成
- 技術スタック・ディレクトリ構成・コーディング原則・セキュリティ方針を記載

### ✅ ステップ3: フォルダ構成の設計（feature-based）

- `src/features/{game,comment,quote-card,auth}/` を作成（各feature内に `components/`, `hooks/`）
- `src/{components,hooks,lib,types,utils}/` を作成
- `src/lib/{supabase,x-api,reddit}/` を作成
- `supabase/migrations/` を作成
- 空ディレクトリには `.gitkeep` を配置

### ✅ ステップ4: `.env.local.example` の作成

- Supabase / X API / Reddit API / App URL の環境変数テンプレートを作成
- `.gitignore` に `!.env.local.example` を追加（テンプレートはコミット対象に）

### ✅ ステップ5: ESLint・TypeScript設定の強化（Zod インストール含む）

- `zod@4.3.6` インストール済み
- `tsconfig.json` に厳格オプション追加: `noUncheckedIndexedAccess`, `noImplicitReturns`, `noFallthroughCasesInSwitch`
- `eslint.config.mjs` にルール追加: `no-explicit-any: error`, `no-console: error`, `no-unused-vars: error`
- ビルド確認済み

### ✅ ステップ6: Supabase DB設計（スキーマ・マイグレーション）

- `supabase/migrations/20260404000000_initial_schema.sql` を作成
- テーブル: `profiles`, `games`, `comments`, `quote_cards`
- ENUM: `game_status` (scheduled/live/final), `quote_source` (x/reddit)
- インデックス: コメント・quote_cards の game_id+時系列、試合のstatus+日時
- `updated_at` 自動更新トリガー（profiles, games）
- RLS: 全テーブルに設定（読み取り全員可、書き込みは認証済みユーザー・サービスロールのみ）

### ⬜ ステップ7: GitHubリポジトリ作成・Vercel連携

---

## 設計原則（everything-claude-code より）

- **不変性優先**: オブジェクトは常に新規作成、直接変更しない
- **ファイルサイズ**: 200-400行、最大800行
- **ファイル構成**: 機能別（feature-based）で整理
- **関数サイズ**: 50行以内
- **ネスト深さ**: 最大4階層
- **型安全**: `any` 禁止、`unknown` で受けてZodでnarrow
- **バリデーション**: システム境界のみZodでスキーマバリデーション
- **ログ**: `console.log` 本番禁止
- **セキュリティ**: シークレットはコードに直書き禁止、環境変数で管理
- **パターン**: Repository Pattern / 統一API Responseフォーマット / Custom Hooks
