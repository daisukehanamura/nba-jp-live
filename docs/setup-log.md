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

### ⬜ ステップ2: CLAUDE.md 作成

### ⬜ ステップ3: フォルダ構成の設計（feature-based）

### ⬜ ステップ4: `.env.local.example` の作成

### ⬜ ステップ5: ESLint・TypeScript設定の強化（Zod インストール含む）

### ⬜ ステップ6: Supabase DB設計（スキーマ・マイグレーション）

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
