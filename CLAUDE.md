# CLAUDE.md - courtside-jp

NBA日本語リアルタイムコメントアプリ。日本語NBAファンが試合を見ながらリアルタイムで盛り上がれるコミュニティ体験を提供する。

---

## 技術スタック

- **フロント**: Next.js 16 (App Router, Turbopack) / Tailwind CSS
- **DB・リアルタイム**: Supabase (PostgreSQL + Realtime)
- **中間ロジック**: Cloudflare Workers（必要に応じて）
- **外部データ**: X API（著名アカウント引用）、Reddit API（r/nba引用）
- **デプロイ**: Vercel
- **パッケージマネージャー**: npm
- **バリデーション**: Zod

---

## アーキテクチャ方針

DDDの考え方（関心の分離・ドメインロジックの明確化）を取り入れるが、**過剰な抽象化はしない**。読みやすさと実用性を優先する。

### 基本的な考え方
- ビジネスロジックをUIから分離する
- データアクセスを1箇所に集約する（Repository Pattern）
- 型とZodスキーマでドメインの境界を明確にする
- **抽象化レイヤーを増やすのは、本当に必要になってから**

### NG例（過剰なDDD）
- ユースケースクラスが `execute()` を1つ呼ぶだけのラッパーになる
- インターフェースの実装が1つしかないのにインターフェースを定義する
- 値オブジェクトがただのstring wrapperになる

---

## ディレクトリ構成

```
src/
  app/                      # Next.js App Router（ルーティング・レイアウトのみ）
  features/
    game/                   # 試合機能
      components/           # UIコンポーネント
      hooks/                # データフェッチ・状態管理
      repository.ts         # Supabaseへのデータアクセス
      schema.ts             # Zodスキーマ + 型定義
      types.ts              # feature固有の型
    comment/                # コメント機能
      components/
      hooks/
      repository.ts
      schema.ts
      types.ts
    quote-card/             # X/Reddit引用カード
      components/
      hooks/
      repository.ts
      schema.ts
      types.ts
    auth/                   # 認証
      components/
      hooks/
      repository.ts
      schema.ts
      types.ts
  components/               # 共通UIコンポーネント
  hooks/                    # 共通カスタムフック
  lib/
    supabase/               # Supabaseクライアント（server/client分離）
    x-api/                  # X APIクライアント
    reddit/                 # Reddit APIクライアント
  types/                    # 共通型（ApiResponse等）
  utils/                    # 純粋なユーティリティ関数
docs/                       # セットアップログ・設計ドキュメント
supabase/
  migrations/               # DBマイグレーション
```

### 複雑度が増したら分割する
feature内のロジックが複雑になった場合は以下のように分割することを検討する（最初から作らない）：

```
features/comment/
  components/
  hooks/
  repository.ts
  schema.ts
  types.ts
  actions.ts    # ← Server Actionsが増えたら追加
  utils.ts      # ← feature固有のユーティリティが増えたら追加
```

---

## 保守性原則

### SOLID原則
- **S (単一責任)**: 1つのクラス・関数は1つの責務のみ持つ
- **O (開放閉鎖)**: 拡張に対してオープン、修正に対してクローズ
- **L (リスコフ置換)**: インターフェースの実装は置き換え可能に保つ
- **I (インターフェース分離)**: 使わないメソッドに依存させない
- **D (依存性逆転)**: 上位層は下位層の具象ではなくインターフェースに依存する

### コーディング原則
- ファイルサイズ: 200-400行を目安、最大800行
- 関数サイズ: 50行以内
- ネスト深さ: 最大4階層
- 不変性優先: オブジェクトは常に新規作成、直接変更しない
- 早期リターン: ネストを深くせず、早期リターンで条件処理をフラットにする
- `console.log` 本番禁止

### 関心の分離
- `app/` にはルーティングとレイアウトのみ。ビジネスロジックを書かない
- ビジネスロジックはDomain層・Application層に閉じ込める
- コンポーネントはUIの描画のみに集中する
- データフェッチはカスタムフック（`use*.ts`）に切り出す

### 命名規則
- エンティティ: `PascalCase`（例: `Game`, `Comment`）
- ユースケース: `動詞 + 名詞`（例: `GetLiveGames`, `PostComment`）
- リポジトリインターフェース: `I` プレフィックス（例: `IGameRepository`）
- リポジトリ実装: `Supabase` プレフィックス（例: `SupabaseGameRepository`）
- フック: `use` プレフィックス（例: `useComments`）
- コンポーネント: `PascalCase`（例: `CommentList`）
- ユーティリティ関数: `camelCase`

---

## TypeScript

- `any` 禁止。信頼できない外部入力には `unknown` を使い、Zodでnarrow
- `interface` は拡張可能なオブジェクト形状に使用、`type` はユニオン・ユーティリティ型に使用
- Reactコンポーネントのpropsは `React.FC` を使わず named interface で型定義
- エクスポートされる関数・共通ユーティリティには引数・戻り値の型を明示
- 配列インデックスアクセスの結果は `T | undefined` として扱う（`noUncheckedIndexedAccess`）

---

## バリデーション

- システム境界（ユーザー入力・外部API レスポンス）のみZodでスキーマバリデーション
- 内部コード間では信頼して型を使う
- 各featureの `domain/` にZodスキーマを定義し、型推論で型を生成する

```ts
// 例: features/comment/domain/Comment.ts
import { z } from 'zod'

export const CommentSchema = z.object({
  id: z.string().uuid(),
  gameId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string().min(1).max(200),
  createdAt: z.string().datetime(),
})

export type Comment = z.infer<typeof CommentSchema>
```

---

## パターン

### Repository Pattern
- データアクセスは `IXxxRepository` インターフェースで抽象化
- 実装は `SupabaseXxxRepository` に閉じ込める
- Application層はインターフェースのみに依存する（テスト時にモック可能）

```ts
// インターフェース例
export interface ICommentRepository {
  findByGameId(gameId: string): Promise<Comment[]>
  create(input: CreateCommentInput): Promise<Comment>
  deleteById(id: string): Promise<void>
}
```

### API Response フォーマット統一
すべての API Route は以下の形式で返す：

```ts
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  meta?: { total: number; limit: number; offset: number }
}
```

### Custom Hooks
- データフェッチ・副作用はカスタムフックに切り出す
- フックは単一責務を守る（1フック = 1つの関心事）

---

## セキュリティ

### 認証・認可
- 認証は Supabase Auth で行う
- すべての API Route で `auth.getUser()` によるセッション検証を行う
- 認証が必要なルートは middleware でガードする

### Supabase RLS
- **全テーブルに RLS を必ず有効化する**
- ポリシーは最小権限の原則で設定する
- `service_role` キーはサーバーサイドのみで使用し、クライアントに露出させない
- `anon` キーで読み取れるデータの範囲を常に意識する

### 入力バリデーション
- すべてのユーザー入力はZodでバリデーションする
- API Route の `request.json()` は必ずZodでパースする
- SQLインジェクション対策: Supabase クライアントのパラメータバインディングのみ使用（生クエリ禁止）

### シークレット管理
- APIキー・トークンはコードに直書き禁止、環境変数で管理
- `NEXT_PUBLIC_` プレフィックスはブラウザに公開される。秘密情報に使わない
- `SUPABASE_SERVICE_ROLE_KEY` はサーバーサイドのみ（API Route / Server Actions）

### その他
- エラーメッセージに内部情報（スタックトレース・DB構造）を含めない
- レートリミットをすべての API Route に設定する
- CSRF: Next.js App Router の Server Actions は自動で保護される。API Route は Origin ヘッダーを検証する

---

## Supabase

- マイグレーションファイルは `supabase/migrations/` に配置
- RLSは全テーブルに必ず設定する
- リアルタイム購読は `supabase.channel()` を使用
- クライアントは `src/lib/supabase/` に集約（server用・client用を分けて管理）

---

## 環境変数

`.env.local.example` を参照。シークレットは `.env.local` に記述し、絶対にコミットしない。

---

## UIデザイン原則

### テキストカラー階層（厳守）

白・薄グレー背景上では以下を守る。**`text-gray-400` 以上に薄いものを本文・ラベルに使ってはならない。**

| 用途 | クラス | 使用例 |
|---|---|---|
| メインテキスト | `text-gray-900` | 見出し・本文・名前 |
| サブテキスト | `text-gray-600` | ラベル・説明文・メタ情報 |
| 補足テキスト | `text-gray-400` | タイムスタンプ・プレースホルダー・カウンター |
| フォームラベル | `text-gray-700` | label要素 |
| 使用禁止（本文に） | `text-gray-300` 以下 | disabled状態のみ許可 |

### NG例
```tsx
// ❌ ラベルにgray-400は薄すぎる
<label className="text-gray-400">表示名</label>

// ✅ ラベルはgray-600以上
<label className="text-gray-600 font-medium">表示名</label>

// ❌ 本文にgray-300は読めない
<p className="text-gray-300">@username</p>

// ✅
<p className="text-gray-500">@username</p>
```

### ダークヘッダー上では
- メインテキスト: `text-white`
- サブテキスト: `text-gray-300`

---

## TDD（テスト駆動開発）

### 基本サイクル
1. **Red**: 失敗するテストを先に書く
2. **Green**: テストを通す最小限の実装をする
3. **Refactor**: テストが通ったままコードを整理する

### テスト戦略

| テスト種別 | 対象 | ツール |
|---|---|---|
| Unit | Domain層（エンティティ・値オブジェクト・ユースケース） | Vitest |
| Integration | Repository実装・API Route | Vitest + Supabase local |
| E2E | 主要ユーザーフロー | Playwright |

### テスト優先度
1. **Domain層を最優先でテストする**: ビジネスルールが正しいことが最重要
2. **Application層（ユースケース）**: リポジトリをモックしてユースケースを検証
3. **Infrastructure層**: Supabase localを使いリポジトリ実装を検証
4. **Presentation層**: 複雑なロジックを持つコンポーネントのみ

### テストファイル配置
テストファイルはテスト対象ファイルと同階層に `*.test.ts` として置く：

```
features/comment/domain/Comment.ts
features/comment/domain/Comment.test.ts
features/comment/application/PostComment.ts
features/comment/application/PostComment.test.ts
```

### モック方針
- Domain層のテストは外部依存ゼロで書く（モック不要）
- Application層のテストはリポジトリインターフェースをモックする
- Infrastructure層のテストは実際のSupabase local DBを使う（モック禁止）

### 新機能の実装手順
1. ユースケースのテストを書く（Red）
2. ドメインエンティティを実装する
3. ユースケースを実装してテストを通す（Green）
4. リファクタリング（Refactor）
5. Infrastructure・Presentation層を実装する

---

## 注意事項

- AWSなどのIaaSは使わない。マネージドサービスで完結させる
- フェーズ1から数千〜数万人規模（フェーズ2）を見据えた設計を行う
- 運用コストは最小に抑える
- 過度な抽象化・早すぎる最適化をしない。現在の要件に必要な最小限の複雑さで実装する
