# CLAUDE.md - courtside-jp

NBA日本語リアルタイムコメントアプリ。日本語NBAファンが試合を見ながらリアルタイムで盛り上がれるコミュニティ体験を提供する。

## 技術スタック

- **フロント**: Next.js 16 (App Router, Turbopack) / Tailwind CSS
- **DB・リアルタイム**: Supabase (PostgreSQL + Realtime)
- **中間ロジック**: Cloudflare Workers（必要に応じて）
- **外部データ**: X API（著名アカウント引用）、Reddit API（r/nba引用）
- **デプロイ**: Vercel
- **パッケージマネージャー**: npm

## ディレクトリ構成

```
src/
  app/           # Next.js App Router のページ・レイアウト
  features/      # 機能別モジュール（game/, comment/, quote-card/, auth/）
  components/    # 共通UIコンポーネント
  lib/           # 外部サービスのクライアント（supabase, x-api, reddit）
  hooks/         # 共通カスタムフック
  types/         # 共通型定義
  utils/         # 純粋なユーティリティ関数
docs/            # セットアップログ・設計ドキュメント
supabase/        # DBマイグレーション・シードファイル
```

各 `features/` ディレクトリの構成例：
```
features/game/
  components/   # このfeature専用のコンポーネント
  hooks/        # このfeature専用のカスタムフック
  repository.ts # データアクセス層（Repository Pattern）
  schema.ts     # Zodスキーマ
  types.ts      # 型定義
```

## コーディング原則

### 全般
- ファイルサイズ: 200-400行を目安、最大800行
- 関数サイズ: 50行以内
- ネスト深さ: 最大4階層
- 不変性優先: オブジェクトは常に新規作成、直接変更しない
- `console.log` 本番禁止

### TypeScript
- `any` 禁止。信頼できない外部入力には `unknown` を使い、Zodでnarrow
- `interface` は拡張可能なオブジェクト形状に使用、`type` はユニオン・ユーティリティ型に使用
- Reactコンポーネントのpropsは `React.FC` を使わず named interface で型定義
- エクスポートされる関数・共通ユーティリティには引数・戻り値の型を明示

### バリデーション
- システム境界（ユーザー入力・外部API）のみZodでスキーマバリデーション
- 内部コード間では信頼して型を使う

### パターン
- **Repository Pattern**: データアクセスは `repository.ts` に集約。`findAll`, `findById`, `create`, `update`, `delete` を標準インターフェースとして実装
- **API Responseフォーマット統一**: `{ success: boolean, data?: T, error?: string, meta?: { total, limit, offset } }`
- **Custom Hooks**: 再利用可能なロジックはカスタムフックに切り出す

### セキュリティ
- シークレット（APIキー・トークン）はコードに直書き禁止、環境変数で管理
- ユーザー入力は必ずZodでバリデーション（XSS・SQLインジェクション防止）
- Supabase Row Level Security (RLS) を全テーブルに設定
- レートリミットをAPI Routeに設定

## Supabase

- マイグレーションファイルは `supabase/migrations/` に配置
- RLSは全テーブルに必ず設定する
- リアルタイム購読は `supabase.channel()` を使用
- クライアントは `src/lib/supabase/` に集約

## 環境変数

`.env.local.example` を参照。シークレットは `.env.local` に記述し、絶対にコミットしない。

## 注意事項

- AWSなどのIaaSは使わない。マネージドサービスで完結させる
- フェーズ1から数千〜数万人規模（フェーズ2）を見据えた設計を行う
- 運用コストは最小に抑える
