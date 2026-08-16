# 6. つまずきポイント集（逆引き）

Java経験者がこのスタックで踏みやすい罠のカタログ。
**「症状 → 原因 → 対処」**で引ける形にしてある。

---

## A. JavaScript / TypeScript

### A-1. `if (count)` で 0 が弾かれる

```ts
const count = 0
if (count) { ... }        // 実行されない（0 は falsy）
const x = count || 10     // 10 になってしまう
```

**対処**：デフォルト値は必ず `??`、判定は明示的に `> 0` や `!== undefined` と書く。

```tsx
{comments.length > 0 && <List />}          // ✅
commentCount={commentCounts[game.id] ?? 0} // ✅
```

### A-2. `{0}` が画面に表示される

```tsx
{comments.length && <List />}    // 0件のとき画面に "0" が出る
```
`&&` は左辺が falsy ならその値をそのまま返す。React は `0` を数値として描画してしまう
（`false` / `null` / `undefined` は描画されない）。

**対処**：左辺を必ず boolean にする。`{comments.length > 0 && ...}`

### A-3. `null` と `undefined` を混同する

```ts
z.string().nullable()   // string | null      … DBのNULL
z.string().optional()   // string | undefined … キー自体が無い
```
Zodスキーマで取り違えると、実データが通らなくなる。

**対処**：**DB由来 = `nullable`、JSONで省略されうる = `optional`** と覚える。
判断に迷ったら実際のレスポンスを `console.log` で確認する。

### A-4. `arr[0]` の型が `string | undefined` になって怒られる

`tsconfig.json` の `noUncheckedIndexedAccess: true` による意図的な厳しさ。

**対処**：
```ts
arr[0]?.message ?? 'デフォルト'   // ✅ 推奨
arr[0]!                          // 根拠が明確なときだけ
```

### A-5. `await` の付け忘れ

```ts
const games = getGamesByDate(date)   // ❌ Promise<Game[]> が入る
games.map(...)                        // 型エラー、または実行時に謎の挙動
```

**対処**：`async` 関数の呼び出しには必ず `await`。
`if (promise)` は常に true なので、条件分岐の中では特に気づきにくい。

### A-6. `Promise.all` の1つがこけて全部落ちる

```ts
const [a, b] = await Promise.all([getA(), getB()])   // Bが落ちるとページ全体が500
```

**対処**：**落ちてもよい処理には個別に `.catch()`** を付ける。

```ts
getVoiceParticipantCounts(ids).catch(() => ({} as Record<string, number>))
```

### A-7. `as` でごまかして実行時に壊れる

```ts
const body = await request.json() as PostCommentInput   // ❌ 何も検証されていない
```

**対処**：システム境界では必ず Zod。`as` は「直後に検証がある」ときだけ許容。

---

## B. React

### B-1. state を変えたのに画面が更新されない

**原因1：直接代入している**
```ts
comments.push(x)      // ❌
error = 'メッセージ'   // ❌
```
**対処**：必ず `setComments(...)` / `setError(...)` を呼ぶ。

**原因2：同じ参照を渡している**
```ts
comments.push(x)
setComments(comments)   // ❌ 配列の参照が変わっていないので変化と見なされない
```
**対処**：新しい配列/オブジェクトを作る。
```ts
setComments((prev) => [...prev, x])
setComments((prev) => prev.map((c) => (c.id === id ? { ...c, id: realId } : c)))
```

### B-2. state 更新が1回分しか反映されない

```ts
setCount(count + 1)
setCount(count + 1)   // 合計で +1 にしかならない
```
`count` は今回のレンダー時点の値で固定されているため。

**対処**：直前の値に依存するときは関数形式。
```ts
setUnreadCount((n) => n + 1)
```

### B-3. `useEffect` が無限ループする

```tsx
useEffect(() => {
  setComments([...comments, x])   // ❌ stateを更新 → 再レンダー → effect再実行 → …
}, [comments])
```

**対処**：
- 依存配列を見直す
- そもそも `useEffect` が不要ではないか疑う（props から計算できるならレンダー中に計算する）
- オブジェクト/配列/関数を依存配列に入れると、毎回新しい参照になって毎回発火する点に注意

### B-4. ページ遷移してもタイマー／購読が生き残る

```tsx
useEffect(() => {
  setInterval(() => router.refresh(), 300000)
  // ❌ クリーンアップを返していない
}, [])
```

**対処**：必ず後片付けを返す。`LiveRefresh.tsx` が手本。
```tsx
const id = setInterval(...)
return () => clearInterval(id)
```

### B-5. リストの表示がおかしい／入力欄の中身が別の行に付く

**原因**：`key` が無い、または `key={index}`。

**対処**：安定した一意のIDを使う。`key={comment.id}`。
（並び替えも挿入も起きない静的なリストなら `index` でよい。例：スケルトンの `[...Array(5)]`）

### B-6. 「Rendered more hooks than during the previous render」

**原因**：フックを条件分岐やループの中で呼んでいる。

```tsx
if (!user) return null
const [x, setX] = useState(0)   // ❌ 早期returnより後でフックを呼んでいる
```

**対処**：フックは**必ずコンポーネントのトップレベル**で、早期returnより前に呼ぶ。

### B-7. `onClick={handleClick()}` で即座に実行される

**対処**：関数を渡す。引数が必要なら包む。
```tsx
onClick={handleClick}
onClick={() => onVote('away')}
```

### B-8. フォーム送信でページがリロードされる

**対処**：`e.preventDefault()` を忘れない。

---

## C. Next.js（Server / Client 境界）

### C-1. 「You're importing a component that needs useState...」

**原因**：Server Component で `useState` / `useEffect` / `onClick` を使っている。

**対処**：そのファイルの先頭に `'use client'` を追加する。
ただし**その前に「本当にクライアント機能が必要か」を疑う**。
表示するだけならサーバーのままでよい。

### C-2. 「Functions cannot be passed directly to Client Components」

**原因**：Server Component から Client Component に関数を props で渡している。

**対処**：
- ハンドラは Client Component 側で定義する
- どうしてもサーバー処理を呼びたいなら Server Actions（このリポジトリは未使用。
  今は Route Handler + `fetch` で実現している。`PredictionPanel.tsx` 参照）

### C-3. `console.log` がどこにも出ない

**原因**：実行場所の勘違い。

| コンポーネント | ログの出力先 |
|---|---|
| Server Component | **ターミナル**（`npm run dev` を動かしている画面） |
| Client Component | **ブラウザのコンソール** |
| Client Componentの初回レンダー | **両方**（サーバーでも一度実行されるため） |

これが分かると Server/Client 境界の理解が一段深まる。

### C-4. `process.env.XXX` が `undefined`

**原因**：`NEXT_PUBLIC_` が付いていない環境変数をブラウザ側で参照している。

**対処**：
- ブラウザで必要 → `NEXT_PUBLIC_` を付ける（**ただし公開されるので秘密情報は不可**）
- 秘密情報 → サーバー側でのみ参照する設計に変える
- `.env.local` を変更したら**開発サーバーを再起動**する

### C-5. `params` / `searchParams` で型エラー

**原因**：Next.js 15以降、これらは `Promise` になった。

**対処**：
```tsx
interface GamePageProps { params: Promise<{ id: string }> }
const { id } = await params
```
古い記事・古いAIの出力をコピーすると必ずここで詰まる。

### C-6. `cookies()` / `headers()` を使うとキャッシュが効かない

**原因**：リクエストスコープのAPIを使うと動的レンダリング扱いになる。

**対処**：`unstable_cache` の中では `createAdminClient()` を使う（CLAUDE.mdの規約）。
**これはパフォーマンスだけでなくセキュリティの要件**でもある（→ [Next.js編](./04-nextjs-app-router.md) 4節）。

### C-7. データを更新したのに画面が古いまま

**原因**：`unstable_cache` の `revalidate` 期間内。

**対処**：
- 更新側で `revalidateTag('games', 'default')` を呼ぶ（`sync-live/route.ts` が手本）
- クライアントから即座に反映したいなら `router.refresh()`
- そもそもキャッシュすべきデータか再考する

### C-8. ログイン後もヘッダーがログアウト状態のまま

**原因**：Server Component が持っているセッション状態が古い。

**対処**：`LoginForm.tsx` は `window.location.href = '/games'` でフルリロードして解決している。
`router.push()` では不十分な場合がある、という実例。

### C-9. POSTリクエストがキャッシュされない

Next.js の fetch キャッシュは GET のみ。LiveKit のような POST API を叩く処理は
**`unstable_cache` で自前にラップする**（CLAUDE.md の注意事項）。

---

## D. Supabase

### D-1. データが取れない・空配列が返る

**原因の筆頭：RLS**。`anon` キーではポリシーに合致する行しか見えない。

**切り分け手順**：
1. Supabaseダッシュボードの SQL Editor で直接クエリして、データ自体はあるか確認
2. 同じクエリを `createAdminClient()` に変えてみる → 取れたら RLS が原因
3. `supabase/migrations/*.sql` のポリシーを読む

**注意**：RLSで弾かれても**エラーにはならず空が返る**。ここが最も混乱しやすい。

### D-2. 3つのクライアントのどれを使うか分からない

```
ブラウザで動く？          → client.ts
unstable_cache の中／cron → admin.ts
それ以外のサーバー処理     → server.ts   ← 迷ったらこれ
```
`admin.ts` は RLS をバイパスするので、**使う理由を説明できないなら使わない**。

### D-3. カラム名が合わない

DBは `snake_case`、TSは `camelCase`。**変換は repository のパース関数の1か所だけ**で行う。

```ts
homeTeam: row.home_team,
externalId: row.external_id,
```
コンポーネント側で `row.home_team` が出てきたら、それは層の漏れ。

### D-4. Realtime でイベントが届かない

チェックリスト：
1. 対象テーブルで Realtime が有効になっているか（Supabaseダッシュボード）
2. `filter` の書式が正しいか（`game_id=eq.${gameId}`）
3. `useEffect` の依存配列が正しく、購読が解除されっぱなしになっていないか
4. RLS でその行が見えているか（**見えない行のイベントは届かない**）

### D-5. 自分の投稿が2回表示される

**原因**：楽観的更新で追加したものと、Realtime で戻ってきたものが重複。

**対処**：`useComments.ts` の `receivedIds`（`Set`）で既知IDを弾く。
サーバーから本物のIDが返ったら `confirmOptimistic` で登録する。

---

## E. 環境・ツール

### E-1. `npm run dev` が起動しない

- `.env.local` が存在するか（`.env.local.example` を参照）
- `npm install` 済みか
- Node のバージョン（Next.js 16 は新しめのNodeを要求する）

### E-2. 型エラーは出ないのに実行時に落ちる

**原因**：型は実行時に消える（→ [TypeScript編](./02-typescript-for-java-devs.md) 0節）。
外部から来た値を検証せずに信頼している。

**対処**：Zod で境界を固める。

### E-3. ESLintに怒られる

このリポジトリで特に引っかかるルール：
- `react-hooks/rules-of-hooks` — フックの呼び出し位置
- `react-hooks/exhaustive-deps` — `useEffect` の依存配列の漏れ
- `@typescript-eslint/no-explicit-any` — `any` 禁止

`exhaustive-deps` の警告は**大抵正しい**。黙らせる前に、なぜ依存が必要なのか考える。

---

## F. Java脳が残っていると起きること（設計編）

| やりがちなこと | このプロジェクトでの正解 |
|---|---|
| `interface IGameRepository` を切ってから実装 | 関数を直接書く。抽象化は必要になってから（CLAUDE.md） |
| クラスとコンストラクタで状態を持つ | 関数 + フックで持つ |
| DTOクラスとバリデーションを別々に定義 | Zodスキーマ1つから型を導出（`z.infer`） |
| `try/catch` で制御フローを書く | `safeParse` / `{ data, error }` の戻り値で分岐 |
| ループの中でDBアクセス | `.in()` でまとめて取る（`getCommentCounts` が手本）。N+1禁止 |
| `useEffect` でデータ取得（SPAの発想） | Server Component で `await` する |
| 全部の状態を親で持って配る | 必要な場所に置く。計算できるものはstateにしない |
| middlewareで認可すれば安全と考える | middleware / API / RLS の三層で守る |

最後の行が一番重要。**middlewareはUXのため、RLSがセキュリティの最終防衛線**。

---

## 困ったときに読む順番

1. エラーメッセージの最初の3行
2. この章の該当セクション
3. 該当する概念の章（[JS](./01-javascript-for-java-devs.md) / [TS](./02-typescript-for-java-devs.md) / [React](./03-react-for-java-devs.md) / [Next.js](./04-nextjs-app-router.md)）
4. 似たことをやっている既存コードを `grep` で探す ← **これが一番速いことが多い**
5. `docs/architecture-guide.md`（Supabase・インフラの全体像）
