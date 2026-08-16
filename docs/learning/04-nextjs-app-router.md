# 4. Next.js App Router 編（Java経験者向け）

Next.js は「Reactでサーバーサイドレンダリングするためのフレームワーク」。
Spring Boot に相当するポジションだが、**サーバーとクライアントが1つのコードベースに同居する**点が根本的に違う。

このリポジトリは **Next.js 16 / React 19** を使っている。

---

## 0. Spring MVC との対応

```
[Spring Boot]                         [Next.js App Router]

Filter                                 middleware.ts
  ↓                                      ↓
@Controller                            page.tsx（Server Component）
  ↓                                      ↓
@Service / @Repository                 repository.ts
  ↓                                      ↓
Thymeleaf テンプレート                   JSX（サーバーでHTML化）
  ↓                                      ↓
ブラウザ（jQuery等で別途JS）             ブラウザ（'use client' のコンポーネントが起動）
```

最大の違いは最後の行。**Thymeleafのテンプレートとフロントのjsが別言語・別ファイルだったものが、
同じ言語・同じコンポーネントツリーの中で連続している**。

---

## 1. ファイルベースルーティング

`src/app/` 以下のディレクトリ構造がそのままURLになる。

```
src/app/
  layout.tsx                 → 全ページ共通の外枠
  page.tsx                   → /
  games/
    page.tsx                 → /games
    loading.tsx              → /games のローディングUI
    [id]/
      page.tsx               → /games/{id}   （動的ルート）
  auth/
    login/page.tsx           → /auth/login
    callback/route.ts        → /auth/callback（HTTPハンドラ）
  api/
    comments/route.ts        → /api/comments
    cron/sync-live/route.ts  → /api/cron/sync-live
```

| ファイル名 | 役割 | Spring での対応 |
|---|---|---|
| `page.tsx` | ページ本体（HTMLを返す） | `@Controller` + テンプレート |
| `route.ts` | HTTPハンドラ（JSONを返す） | `@RestController` |
| `layout.tsx` | 共通の外枠（ネスト可能） | 共通テンプレート／デコレータ |
| `loading.tsx` | 読み込み中のUI | （なし） |
| `middleware.ts` | 全リクエストの前処理 | `Filter` |

**予約されたファイル名しかルーティングに関与しない。** `components/` などを同じ階層に置いてもURLにはならない
（ただしこのリポジトリはCLAUDE.mdの方針でコンポーネントを `features/` に置いている）。

### 動的ルートと Promise 化された params

```tsx
// src/app/games/[id]/page.tsx
interface GamePageProps {
  params: Promise<{ id: string }>       // ← Promise であることに注目
}

export default async function GamePage({ params }: GamePageProps) {
  const { id } = await params
```

```tsx
// src/app/games/page.tsx
interface GamesPageProps {
  searchParams: Promise<{ date?: string }>
}

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const { date } = await searchParams
```

`[id]` は Spring の `@PathVariable`、`searchParams` は `@RequestParam` に相当。
**Next.js 15以降、`params` と `searchParams` は `Promise` になっている**ので `await` が必要。
（ストリーミングを可能にするための変更。古い記事のコードをコピーすると型エラーになる）

### `Link` によるクライアント遷移

```tsx
// src/features/game/components/DateNav.tsx
<Link href={`/games?date=${prevDate}`} prefetch={true}>← {formatDisplay(prevDate)}</Link>
```

`<a>` タグと違い**ページ全体をリロードしない**（SPA的な遷移）。
`prefetch` でリンク先を先読みしておける。日付ナビのように「次に押される可能性が高い」箇所で効く。

---

## 2. Server Component と Client Component（最重要）

App Router のコンポーネントは2種類ある。**デフォルトはServer Component**。

### Server Component（デフォルト）

```tsx
// src/features/game/components/GameList.tsx — 'use client' が無い = サーバー
export async function GameList({ currentDate, isToday }: GameListProps) {
  const games = await getGamesByDate(currentDate)      // DBを直接叩ける
  const [commentCounts, voiceCounts] = await Promise.all([...])
  return <>...</>
}
```

- **サーバー上でだけ実行され、ブラウザにはHTMLだけが届く**
- `async` にして `await` でDBアクセスできる
- 環境変数の秘密（`SUPABASE_SERVICE_ROLE_KEY`）を触ってよい
- **このコンポーネントのJSはブラウザに送られない**（バンドルサイズが増えない）
- `useState` / `useEffect` / `onClick` は**使えない**

Springで言えば `@Controller` の中でリポジトリを呼んでテンプレートを組んでいるのと同じ。

### Client Component（`'use client'` が必要）

```tsx
// src/features/game/components/LiveRefresh.tsx
'use client'                       // ← ファイル先頭の1行が境界を宣言する

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function LiveRefresh({ hasLiveGames }: LiveRefreshProps) {
  const router = useRouter()
  useEffect(() => { ... }, [hasLiveGames, router])
  return null
}
```

- ブラウザで動く。`useState` / `useEffect` / イベントハンドラが使える
- **サーバーでも一度実行される**（初期HTMLを作るため）。ここが誤解されやすい
- 秘密情報を書いてはいけない（ブラウザに送られる）

### 判断基準

```
useState / useEffect / onClick / ブラウザAPI が要るか？
   ├─ NO  → Server Component（何も書かない）  ← まずこちらを試す
   └─ YES → 'use client' を付ける
```

**`'use client'` は「できるだけ葉（leaf）に寄せる」のが原則。**
親に付けると子孫まで全部クライアント側になり、バンドルが太る。

このリポジトリはこれをよく守っている。`/games` ページの構成：

```
GamesPage              (Server) … シェルだけ返す
├── DateNav            (Client) … Linkと日付計算だけの小さな葉
└── Suspense
    └── GameList       (Server) … DBアクセス
        ├── LiveRefresh (Client) … タイマーだけの小さな葉
        └── GameCard    (Server) … 表示だけなのでサーバーのまま
            ├── GameStatusBadge (Server)
            └── TeamDisplay     (Server)
```

`GameCard` はクリックできる（`Link`）が、`'use client'` は要らない。
`Link` 自体がクライアント機能を内包しているため。**「インタラクティブに見える＝Client」ではない**。

### 境界を越えられるもの／越えられないもの

Server Component から Client Component にpropsを渡すとき、
**props はシリアライズ（JSON化）されてブラウザに送られる**。

```tsx
// ✅ 送れる：プリミティブ、配列、プレーンオブジェクト、Date、JSX
<CommentSection
  gameId={game.id}
  initialComments={initialComments}
  currentUserId={user.id}
  currentUserProfile={{ username: ..., displayName: ..., avatarUrl: ... }}
/>

// ❌ 送れない：関数、クラスインスタンス、Supabaseクライアント、DBコネクション
<Foo onSave={async () => { await db.save() }} />   // Server Actions を除きエラー
```

Javaで「DTOだけをHTTPで返す」制約と同じ。**境界ではデータだけが渡る**。

### 実践パターン：サーバーで取り、クライアントで動かす

このリポジトリで繰り返し出てくる型。

```tsx
// サーバー側（src/app/games/[id]/page.tsx）
const [user, game, initialComments] = await Promise.all([...])   // 初期データを取得
...
<CommentSection gameId={game.id} initialComments={initialComments} ... />
```
```tsx
// クライアント側（useComments.ts）
export function useComments(gameId: string, initialComments: Comment[]) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  //                                       ↑ サーバーの初期値をstateの初期値にする
  // 以降はRealtimeで差分を受け取ってstateを更新していく
```

**初回はサーバーがHTMLごと配る（速い・SEOに効く）→ 以降はクライアントが更新を引き継ぐ。**
これがApp Routerの最も基本的な設計パターン。

### `children` パターンで境界を賢く切る

```tsx
// src/components/HeaderGuard.tsx
'use client'
export function HeaderGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()          // クライアント機能が必要
  if (pathname.startsWith('/auth')) return null
  return <>{children}</>
}
```
```tsx
// src/app/layout.tsx
<HeaderGuard>
  <Header />        {/* ← Header は Server Component のまま！ */}
</HeaderGuard>
```

`HeaderGuard` はClient Componentだが、**`children` として渡された `Header` はサーバーで描画される**。
「Clientコンポーネントの子はすべてClientになる」わけではない、というのが重要な例外。
props（`children`）として渡された要素は、渡す側の環境で描画される。

---

## 3. Suspense とストリーミング

### 問題：一番遅いデータが全体を待たせる

```tsx
// ❌ DBアクセスが終わるまでHTMLが1バイトも送れない
export default async function GamesPage() {
  const games = await getGames()
  return <main><h1>NBA 試合</h1>{...}</main>
}
```

### 解決：シェルを即返し、データは後から流す

```tsx
// src/app/games/page.tsx
export default async function GamesPage({ searchParams }: GamesPageProps) {
  const { date } = await searchParams
  ...
  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-4">NBA 試合</h1>   {/* ← 即座に送られる */}
      <div className="mb-6"><DateNav currentDate={currentDate} /></div>
      <Suspense fallback={<GameListSkeleton />}>
        <GameList currentDate={currentDate} isToday={currentDate === today} />
        {/* ↑ ここのDBアクセスが終わってから、この部分だけ後追いで流れてくる */}
      </Suspense>
    </main>
  )
}
```

```
時間 →
0ms    ┃ <h1>NBA 試合</h1> + DateNav + スケルトンが表示される（TTFB短い）
300ms  ┃ GameList のHTMLが追加で流れてきて、スケルトンと差し替わる
```

**`Suspense` の中は「データ待ちで止まってよい領域」**という宣言。
`fallback` に待機中のUIを渡す。Javaの非同期レスポンスストリーミングに近いが、
HTMLの一部差し替えまでフレームワークがやってくれる点が違う。

`layout.tsx` でも同じことをしている：

```tsx
// src/app/layout.tsx
<Suspense fallback={<HeaderSkeleton />}>
  <HeaderGuard><Header /></HeaderGuard>
</Suspense>
```
ヘッダーの認証確認（`auth.getUser()`）でページ全体をブロックしないための構造。

### `loading.tsx`

```tsx
// src/app/games/loading.tsx
export default function GamesLoading() {
  return <main>...スケルトン...</main>
}
```

`loading.tsx` を置くと、**Next.jsが自動で `page.tsx` を `<Suspense>` で包んでくれる**。
ページ遷移時にこれが出る。手動の `<Suspense>` はページ内の一部分に、
`loading.tsx` はページ全体に効く、という住み分け。

### スケルトンを配列で作るイディオム

```tsx
{[...Array(5)].map((_, i) => (
  <div key={i} className="... animate-pulse">...</div>
))}
```
`[...Array(5)]` は「長さ5の配列」を作る定型句。`_` は「使わない引数」の慣習的な名前。
ここは並び替えが起きないので `key={i}` で問題ない（→ [React編](./03-react-for-java-devs.md) のkeyの話）。

---

## 4. キャッシュ戦略

CLAUDE.md がこのプロジェクトの最重要トピックとして挙げている部分。
**サーバーレスでは「リクエストが来てからデータを取りに行く」のが遅さの根本**という前提に立つ。

### `unstable_cache`

```ts
// src/features/game/repository.ts
async function fetchGamesByDate(date: string): Promise<Game[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('games').select('*').eq('game_date', date)...
}

// 30秒キャッシュ（sync-liveが5分ごとに更新するため十分な鮮度）
export const getGamesByDate = unstable_cache(
  fetchGamesByDate,      // ① ラップする関数
  ['games-by-date'],     // ② キャッシュキーの接頭辞（引数と組み合わされる）
  { revalidate: 30, tags: ['games'] }   // ③ 30秒有効 / 'games' タグを付与
)
```

Spring の `@Cacheable(value = "games", ...)` に相当。違いは**関数を包む形で書く**こと。

```java
@Cacheable(value = "games", key = "#date")
public List<Game> getGamesByDate(String date) { ... }
```

### 鉄則：キャッシュの中で cookie を使わない

```ts
// ✅ src/features/game/repository.ts — adminClient（cookie不要）
export const getGamesByDate = unstable_cache(fetchGamesByDate, ...)
//                                            ↑ 中で createAdminClient() を使っている

// ✅ src/features/comment/repository.ts — 明示的にコメントされている
// unstable_cache内ではcookie不要なadminClientを使う
export const getCommentCounts = unstable_cache(async (gameIds) => {
  const supabase = createAdminClient()
  ...
}, ['comment-counts'], { revalidate: 60, tags: ['comment-counts'] })
```

理由：**キャッシュはユーザーをまたいで共有される**。
cookie（＝そのユーザーのセッション）に依存した結果をキャッシュすると、
他人のデータが見えてしまう。だから `createClient()`（cookie依存）ではなく `createAdminClient()` を使う。

同じrepositoryでも、ユーザー依存のものはキャッシュしていない：

```ts
// src/features/comment/repository.ts
export async function getComments(gameId: string): Promise<Comment[]> {
  const supabase = await createClient()   // cookieベース。RLSを効かせる。キャッシュしない
  ...
}
```

**この使い分けはセキュリティの話**なので、新しくrepository関数を書くときは必ず意識する。

### タグによる明示的な無効化

```ts
// src/app/api/cron/sync-live/route.ts
const result = await syncLiveGames()
revalidateTag('games', 'default')   // DB更新後にNext.jsキャッシュをクリア
```

「30秒待つ」のではなく、**データを更新した側からキャッシュを捨てる**。
`tags: ['games']` を付けた `getGamesByDate` と `getGameById` が両方まとめて無効化される。

### `React.cache()` によるリクエスト内の重複排除

`unstable_cache`（リクエストをまたぐ）とは別のレイヤー。

```ts
// src/lib/supabase/server.ts
// 同一リクエスト内でauth.getUser()の重複呼び出しを排除する
// Header・各ページで個別にgetUser()しても実際のHTTPリクエストは1回のみ
export const getUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
```

Header とページの両方が `getUser()` を呼んでも、SupabaseへのHTTPは1回になる。
**cookie依存なのにキャッシュできるのは、有効範囲が「1リクエストの中だけ」だから**。

| | 有効範囲 | 用途 |
|---|---|---|
| `React.cache()` | 1リクエスト内 | 同じリクエスト中の重複呼び出し排除 |
| `unstable_cache` | リクエストをまたぐ（時間/タグ） | Supabase往復そのものの削減 |

### キャッシュ時間の決め方

このリポジトリの実際の判断：

| データ | 時間 | 理由 |
|---|---|---|
| 試合一覧・詳細 | 30秒 | cronが5分ごとに更新するので30秒で十分な鮮度 |
| コメント数バッジ | 60秒 | 一覧の数字は多少ずれても支障がない |
| コメント本体 | キャッシュなし | 詳細画面。Realtimeで即時反映する |

「更新頻度」と「古くて困る度合い」の掛け算で決める。

---

## 5. Route Handler（`route.ts`）

JSONを返すエンドポイント。`@RestController` に相当。

```ts
// src/app/api/comments/route.ts
export async function POST(request: NextRequest) {
  // ① 認証
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json(err('ログインが必要です'), { status: 401 })

  // ② レートリミット
  const { allowed } = checkRateLimit(`comment:${user.id}`, RATE_LIMIT)
  if (!allowed) return NextResponse.json(err('投稿が多すぎます...'), { status: 429 })

  // ③ バリデーション
  const body: unknown = await request.json()
  const result = PostCommentSchema.safeParse(body)
  if (!result.success) return NextResponse.json(err(...), { status: 400 })

  // ④ 本処理
  const { data, error } = await supabase.from('comments').insert({...}).select(...).single()
  if (error) return NextResponse.json(err('コメントの投稿に失敗しました'), { status: 500 })

  return NextResponse.json(ok(data), { status: 201 })
}
```

**「認証 → レートリミット → バリデーション → 本処理」の順序**は
Springのフィルタチェーンで自動化していたものを手で並べた形。
このリポジトリのAPIはすべてこの順序で書かれている。新しいAPIを書くときも踏襲する。

- 関数名がHTTPメソッドになる（`GET` / `POST` / `PATCH` / `DELETE`）
- エラーレスポンスは `src/types/api.ts` の `ok()` / `err()` で形を統一
- **エラーメッセージにDB構造やスタックトレースを含めない**（CLAUDE.mdのセキュリティ規約）。
  `console.error` でサーバーログにだけ詳細を残す

### GETハンドラの例

```ts
// src/app/auth/callback/route.ts — OAuthコールバック
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}/games`)
}
```

### Cron（Vercelのスケジュール実行）

```json
// vercel.json — Spring の @Scheduled に相当
{ "crons": [{ "path": "/api/cron/sync-games", "schedule": "0 6 * * *" }] }
```

```ts
// src/app/api/cron/sync-live/route.ts
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json(err('Unauthorized'), { status: 401 })
}
```
**cronのエンドポイントも公開URLなので、シークレットで守る必要がある**。
`@Scheduled` と違い「外から叩ける」ことを忘れない。

---

## 6. middleware（`src/middleware.ts`）

全リクエストの前に走る。Servlet Filter 相当。

```ts
// src/middleware.ts
export async function middleware(request: NextRequest) {
  // Supabaseのcookieを読み書きできるクライアントを組み立て
  const supabase = createServerClient(..., { cookies: { getAll, setAll } })
  const { data: { user } } = await supabase.auth.getUser()

  const isPublicPath = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path))

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)      // 未ログインはログインへ
  }
  if (user && request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(...)      // ログイン済みが /auth に来たら /games へ
  }
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- `matcher` で対象URLを絞る（静的ファイルを除外している）
- **セッションcookieのリフレッシュもここで行われる**。
  `setAll` で新しいcookieをレスポンスに書き戻しているのがそれ
- 全リクエストを通るので、**重い処理を書いてはいけない**

> 補足：Next.js 16 では `middleware.ts` に加えて `proxy.ts` というファイル名も認識される
> （`node_modules/next/dist/lib/constants.js` に両方の定数が定義されている）。
> このリポジトリは `src/middleware.ts` を使っている。
> `docs/architecture-guide.md` に「proxy.ts」という記述があるのはこの流れの話。

### middlewareだけに認可を頼らない

middlewareはあくまでUX（リダイレクト）のための防壁。
**本当の認可はRoute Handlerの `auth.getUser()` と、DB側のRLSの二段で守る。**
`/api/comments` が自前で認証チェックしているのはそのため。

---

## 7. クライアント側のナビゲーション API

```tsx
'use client'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
```

| API | 用途 | 実例 |
|---|---|---|
| `useRouter().push(url)` | プログラムから遷移 | |
| `useRouter().refresh()` | **サーバーコンポーネントを再取得**（画面のstateは保つ） | `LiveRefresh.tsx` |
| `usePathname()` | 現在のパス | `HeaderGuard.tsx` |
| `window.location.href = ...` | **フルリロード** | `LoginForm.tsx` |

`LoginForm.tsx` があえてフルリロードしているのには理由がコメントされている：

```tsx
// フルリロードでServer Componentのセッション状態を確実に更新
window.location.href = '/games'
```

ログイン直後はサーバー側のセッション判定を確実にやり直したいので、SPA遷移ではなく素のリロードを選んでいる。
**フレームワークの標準手段をあえて外す判断**の例として読んでおくとよい。

---

## 8. 環境変数

```ts
process.env.NEXT_PUBLIC_SUPABASE_URL       // ブラウザにも渡る
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // ブラウザにも渡る（RLSで守る前提）
process.env.SUPABASE_SERVICE_ROLE_KEY      // サーバーのみ。絶対に露出させない
process.env.CRON_SECRET                    // サーバーのみ
```

**`NEXT_PUBLIC_` 接頭辞が付いたものはビルド時にJSに埋め込まれ、ブラウザから丸見えになる。**
接頭辞のないものをClient Componentで参照すると `undefined` になる（漏れないための仕様）。

Springの `application.yml` と違い、**接頭辞そのものが公開/非公開のスイッチ**になっている点に注意。

---

## 9. Supabaseクライアント3種の使い分け（まとめ）

Next.jsの実行環境が3つあるので、クライアントも3つある。

| ファイル | 実行場所 | キー | RLS | 使う場面 |
|---|---|---|---|---|
| `lib/supabase/client.ts` | ブラウザ | anon | 効く | Client Component、Realtime購読 |
| `lib/supabase/server.ts` | サーバー（cookie有） | anon | 効く | Server Component、Route Handler |
| `lib/supabase/admin.ts` | サーバーのみ | service_role | **バイパス** | `unstable_cache` の中、cron |

判断フロー：

```
ブラウザで動くコード？
  └─ YES → client.ts
  └─ NO  → unstable_cache の中 or cronのバッチ処理？
             └─ YES → admin.ts（cookieが使えない／RLSを越える必要がある）
             └─ NO  → server.ts（ログインユーザーの権限で操作する）
```

**迷ったら `server.ts`。** `admin.ts` はRLSを無効化するので、使う理由を説明できるときだけ使う。

---

## 10. サーバーレスであることの帰結

CLAUDE.md が繰り返し強調している点。Tomcatの常駐プロセスとの違い。

| | Spring on Tomcat | Next.js on Vercel |
|---|---|---|
| プロセス | 常駐 | リクエストごとに起動しうる |
| DBコネクションプール | 効く | **効かない**（毎回別プロセス） |
| Supabaseとの通信 | JDBC（TCP） | **HTTPS**（PostgREST経由） |
| 通信コスト | 接続後は安い | **毎回TLS確立に20〜80ms** |
| 静的変数の永続性 | プロセス生存中は保つ | インスタンス次第（当てにできない） |

だから対策が変わる：

- ❌ PgBouncerでコネクションプール → HTTPSなので効果なし
- ✅ `unstable_cache` でそもそも往復を減らす
- ✅ `Promise.all` で往復を並列化する
- ✅ Suspenseで待ち時間を体感から隠す

`src/utils/rate-limit.ts` の `Map` が「本番スケールではKVへ」とされているのも、
**インスタンスをまたいで状態が共有されないから**。

---

## 章末チェック

1. `GameCard.tsx` に `'use client'` が無いのに `<Link>` でクリックできるのはなぜか
2. `unstable_cache` の中で `createClient()`（cookie版）を使ってはいけない理由
3. `loading.tsx` と `<Suspense>` の使い分け
4. `HeaderGuard`（Client）の子である `Header` がServer Componentでいられる理由
5. cronのエンドポイントに `CRON_SECRET` のチェックが要る理由
6. `router.refresh()` と `window.location.href = '/games'` の違い

→ 次章 [演習課題](./05-exercises.md)
