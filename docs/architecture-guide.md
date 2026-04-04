# アーキテクチャ・技術解説ガイド

Springバックエンド経験者向けに、Next.js/Supabase構成の概念を解説する。

---

## 全体像

```
ブラウザ
  ↕ HTTP
Vercel（Next.jsアプリ）
  ↕ HTTPS
Supabase（DB + 認証 + リアルタイム）
```

従来のSpring構成と比較：

| Spring構成 | このプロジェクト |
|---|---|
| Tomcat/Spring Boot サーバー | Next.js（Vercel上で動く） |
| Spring Security | Supabase Auth + proxy.ts |
| JPA/Hibernate | Supabase クライアント（repository.ts） |
| MySQL/PostgreSQL | Supabase（PostgreSQL） |
| REST API | Next.js API Route / Server Actions |
| WebSocket | Supabase Realtime |

---

## Next.js App Router の基本

### サーバーコンポーネント vs クライアントコンポーネント

Next.jsのコンポーネントは2種類ある。

**サーバーコンポーネント（デフォルト）**
- サーバー上で実行される。ブラウザには HTMLが届く
- DBアクセスや秘密情報を直接扱える
- `useState` / `useEffect` などのReactフックは使えない
- Springの `@Controller` + Thymeleaf に近い感覚

```tsx
// src/app/games/page.tsx
// async/await で直接DBアクセスできる
export default async function GamesPage() {
  const games = await getGames() // サーバー上で実行
  return <div>{games.map(...)}</div>
}
```

**クライアントコンポーネント（`'use client'` 宣言が必要）**
- ブラウザ上で実行される。インタラクティブなUI
- `useState`, `useEffect`, イベントハンドラが使える
- DBに直接アクセスできない（Supabaseクライアント経由）

```tsx
'use client'
// src/features/auth/components/LoginForm.tsx
export function LoginForm() {
  const [loading, setLoading] = useState(false) // ブラウザ上で動く
  ...
}
```

---

## ディレクトリの役割

### `src/app/`
**ルーティング専用**。ファイル名がURLになる。

```
src/app/
  page.tsx              → /
  games/
    page.tsx            → /games
    [id]/
      page.tsx          → /games/任意のID（動的ルート）
  auth/
    login/page.tsx      → /auth/login
    callback/route.ts   → /auth/callback（APIエンドポイント）
```

`[id]` はSpringの `@PathVariable` に相当。

### `src/features/`
**機能別モジュール**。1つの機能（game, comment等）に関わるコードをここに集める。

```
features/game/
  schema.ts       → 型定義 + バリデーション（Zodスキーマ）
  repository.ts   → DBアクセス（Springの @Repository に相当）
  components/     → UIコンポーネント
  hooks/          → データフェッチ・状態管理ロジック
```

### `src/lib/supabase/`
Supabaseクライアントの初期化。**3種類ある**のが重要。

| ファイル | 使う場所 | キー |
|---|---|---|
| `client.ts` | ブラウザ（クライアントコンポーネント） | anon key |
| `server.ts` | サーバー（サーバーコンポーネント・API Route） | anon key |
| `admin.ts` | サーバーのみ（RLS無視が必要な操作） | service_role key |

---

## Supabase の仕組み

### RLS（Row Level Security）
PostgreSQLの行単位アクセス制御。Springの `@PreAuthorize` に相当。

```sql
-- 自分のコメントしか削除できない
create policy "comments_delete_own"
  on comments for delete using (auth.uid() = user_id);
```

- `anon key` でクエリするとRLSが適用される（一般ユーザー権限）
- `service_role key` でクエリするとRLSをバイパスできる（管理者権限）

### Realtime
Supabaseの特徴機能。DBの変更をWebSocketでブラウザに即時配信する。

```ts
// チャンネルを購読するとINSERT/UPDATE/DELETEをリアルタイムで受信できる
supabase.channel('comments')
  .on('postgres_changes', { event: 'INSERT', table: 'comments' }, handler)
  .subscribe()
```

---

## データフローの全体像

### サーバーコンポーネント（試合一覧ページ）
```
ブラウザがリクエスト
  → Vercel上のNext.jsサーバーが /games/page.tsx を実行
  → getGames() が src/lib/supabase/server.ts のクライアントでDBを直接クエリ
  → HTMLを生成してブラウザに返す
```

### クライアントコンポーネント（ログインフォーム）
```
ユーザーがフォームを送信
  → LoginForm.tsx のhandleSubmit が実行（ブラウザ上）
  → Zodでバリデーション
  → src/lib/supabase/client.ts のクライアントでSupabase Authを呼ぶ
  → 認証成功 → /games にリダイレクト
```

---

## proxy.ts（旧: middleware）

すべてのリクエストの前に実行される処理。Springの `Filter` に相当。

```ts
// 未ログインユーザーを /auth/login にリダイレクト
if (!user && !isPublicPath) {
  return NextResponse.redirect('/auth/login')
}
```

---

## Zodとは

TypeScriptの型定義とバリデーションを同時にできるライブラリ。
Springの `javax.validation`（`@NotNull`, `@Size`等）に相当。

```ts
const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type SignUpInput = z.infer<typeof SignUpSchema> // 型を自動生成
```

`safeParse()` で失敗しても例外をthrowしない（Springの `BindingResult` に近い）。

---

## repository.ts パターン

SpringのJPAリポジトリに相当。DBアクセスをここに集約する。

```ts
// Spring
@Repository
public interface GameRepository extends JpaRepository<Game, UUID> {}

// このプロジェクト
export async function getGames(): Promise<Game[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('games').select('*')
  return data ?? []
}
```

Supabaseクライアントはクエリビルダー形式（`.from().select().eq()`）で、
JPA の `findByStatus()` のようなものを自分でメソッドとして書く形。

---

## テスト戦略

| Springでの対応 | このプロジェクト |
|---|---|
| JUnit + Mockito | Vitest |
| @WebMvcTest | コンポーネントテスト（未実装） |
| @DataJpaTest | Integration test（M5で実装予定） |

現在はschemaのバリデーションロジック（ビジネスルール）のみをユニットテスト。
DBアクセスのテストはSupabase localを使って後で追加する。
