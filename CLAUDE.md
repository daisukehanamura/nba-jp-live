# CLAUDE.md - HOOPMIN

NBA日本語リアルタイムコメントアプリ。日本語NBAファンが試合を見ながらリアルタイムで盛り上がれるコミュニティ体験を提供する。

---

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロント | Next.js (App Router, Turbopack) / Tailwind CSS |
| DB・リアルタイム | Supabase (PostgreSQL + Realtime) |
| 音声通話 | LiveKit |
| デプロイ | Vercel（サーバーレス関数として動作） |
| パッケージマネージャー | npm |
| バリデーション | Zod |

---

## インフラの特性を理解する

このプロジェクトはVercelにデプロイされており、**Next.jsのasync Server ComponentはサーバーレスFunction（AWS Lambda互換）として動作する**。これはオンプレの常駐プロセスと根本的に異なる。

### サーバーレス特有の制約

- **コールドスタート**: リクエストのたびに関数が起動する場合がある
- **コネクションプール不可**: プロセスが毎回起動するため、DBコネクションを維持できない
- **Supabase接続はHTTPS**: `supabase-js` はPostgRESTへのHTTPリクエストで通信する。生のTCPではないためPgBouncerは効果なし
- **HTTPSオーバーヘッド**: Vercel↔Supabase間のTLS確立だけで20〜80ms発生する

### パフォーマンスの基本原則

**「リクエストが来てからデータを取りに行く」が遅さの根本。**

| アプローチ | 効果 |
|-----------|------|
| `unstable_cache` でサーバーサイドキャッシュ | Supabase/外部APIへの往復を削減 |
| `Promise.all` で並列fetch | 直列ウォーターフォールを防ぐ |
| Suspense + ストリーミング | TTFB改善・体感速度向上 |
| Cron + KV（将来）| リクエスト前にデータを用意しておく |

---

## キャッシュ戦略

### `unstable_cache` を使う場面
読み取り頻度が高く、多少の遅延が許容できるデータ。`next/cache` の `unstable_cache` でラップする。

```ts
// ✅ 試合データ: 30秒キャッシュ
export const getGamesByDate = unstable_cache(
  fetchGamesByDate,
  ['games-by-date'],
  { revalidate: 30, tags: ['games'] }
)

// ✅ コメント数: 60秒キャッシュ（一覧バッジは多少の遅延を許容）
export const getCommentCounts = unstable_cache(
  fetchCommentCounts,
  ['comment-counts'],
  { revalidate: 60, tags: ['comment-counts'] }
)
```

### 注意事項
- `unstable_cache` 内では **cookieなどリクエストスコープのものを使ってはいけない**。`createClient()`（cookie依存）ではなく `createAdminClient()` を使う
- **POSTリクエストはNext.jsのfetchキャッシュが効かない**。LiveKit等のPOST APIは `unstable_cache` でラップする
- `cache: 'no-store'` は本当にリアルタイム性が必要な場面のみ

### Suspense + ストリーミング
データが揃うまで全画面ブロックしない。ページシェルを即座に送信し、データはストリーミングで流す。

```tsx
// ✅ ページシェルを即返し、データ取得コンポーネントをSuspenseで囲む
export default async function GamesPage() {
  return (
    <main>
      <h1>NBA 試合</h1>
      <DateNav />
      <Suspense fallback={<GameListSkeleton />}>
        <GameList />  {/* ← ここでデータフェッチ */}
      </Suspense>
    </main>
  )
}
```

---

## ディレクトリ構成

```
src/
  app/                      # Next.js App Router（ルーティング・レイアウトのみ）
  features/
    game/                   # 試合機能
      components/           # UIコンポーネント
      hooks/                # クライアント側の状態管理
      repository.ts         # Supabaseへのデータアクセス（関数ベース）
      schema.ts             # Zodスキーマ + 型定義
    comment/                # コメント機能
    voice/                  # LiveKit音声通話
    auth/                   # 認証
  components/               # 共通UIコンポーネント・スケルトン
  lib/
    supabase/               # Supabaseクライアント（server/client/admin分離）
  types/                    # 共通型
  utils/                    # 純粋なユーティリティ関数
supabase/
  migrations/               # DBマイグレーション
```

### Repository の書き方

クラスベースのRepository patternは使わない。**関数ベースで、必要ならキャッシュをラップする**だけでよい。

```ts
// ✅ シンプルな関数ベース
async function fetchGamesByDate(date: string): Promise<Game[]> { ... }

export const getGamesByDate = unstable_cache(fetchGamesByDate, [...], { revalidate: 30 })

// ❌ 過剰なクラス抽象化
class SupabaseGameRepository implements IGameRepository {
  async findByDate(date: string) { ... }
}
```

### 複雑度が上がったら追加するファイル
```
features/comment/
  actions.ts    # ← Server Actionsが増えたら
  utils.ts      # ← feature固有のユーティリティが増えたら
```

---

## コーディング原則

- ファイルサイズ: 200〜400行を目安、最大800行
- 関数サイズ: 50行以内
- ネスト深さ: 最大4階層
- 不変性優先: オブジェクトは直接変更せず新規作成
- 早期リターン: 条件処理はフラットに書く
- `console.log` 本番禁止
- **ループ・map内でのAPI呼び出し禁止**（N+1問題）

### 関心の分離
- `app/` にはルーティングとレイアウトのみ
- データフェッチは `repository.ts` に集約
- コンポーネントはUIの描画のみ

---

## TypeScript

- `any` 禁止。外部入力には `unknown` を使いZodでnarrow
- `interface` は拡張可能なオブジェクト形状に、`type` はユニオン・ユーティリティ型に
- Reactコンポーネントのpropsは `React.FC` を使わずnamed interfaceで定義
- エクスポートされる関数には引数・戻り値の型を明示
- 配列インデックスアクセスの結果は `T | undefined` として扱う

---

## バリデーション

システム境界（ユーザー入力・外部APIレスポンス）のみZodでバリデーション。内部コード間では型を信頼する。

```ts
// features/comment/schema.ts
export const CommentSchema = z.object({
  id: z.string().uuid(),
  gameId: z.string().uuid(),
  content: z.string().min(1).max(200),
  createdAt: z.string().datetime(),
})

export type Comment = z.infer<typeof CommentSchema>
```

---

## セキュリティ

### 認証・認可
- 認証は Supabase Auth で行う
- すべての API Route で `auth.getUser()` によるセッション検証
- 認証が必要なルートは middleware でガード

### Supabase RLS
- **全テーブルにRLSを必ず有効化する**
- `service_role` キーはサーバーサイドのみ。クライアントに露出させない
- `anon` キーで読み取れるデータの範囲を常に意識する

### その他
- `NEXT_PUBLIC_` プレフィックスはブラウザに公開される。秘密情報に使わない
- API Routeにはレートリミットを設定する
- エラーメッセージにスタックトレース・DB構造を含めない
- SQLインジェクション対策: 生クエリ禁止、Supabaseのパラメータバインディングのみ使用

---

## UIデザイン原則

### テキストカラー階層（厳守）

白・薄グレー背景上では以下を守る。**本文・ラベルに `text-gray-300` 以下を使ってはならない。**

| 用途 | クラス |
|------|--------|
| メインテキスト（見出し・名前） | `text-gray-900` |
| サブテキスト（説明・メタ情報） | `text-gray-600` |
| 補足テキスト（タイムスタンプ等） | `text-gray-400` |
| フォームラベル | `text-gray-700` |
| 使用禁止（disabled以外） | `text-gray-300` 以下 |

ダークヘッダー上: メイン `text-white` / サブ `text-gray-300`

---

## 注意事項

- IaaSは使わない。マネージドサービスで完結させる
- 運用コストは最小に抑える
- 過度な抽象化・早すぎる最適化をしない
