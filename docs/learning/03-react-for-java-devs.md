# 3. React 編（Java経験者向け）

サーバーサイドJavaの経験者にとって、Reactで一番の壁は**文法ではなく考え方**。
「DOMを操作する」のではなく「状態から画面を導出する」。ここを最初に押さえる。

---

## 0. 中心的な考え方：UI = f(state)

```
        ┌──────────┐
state ──│  f（描画）│──> 画面
        └──────────┘
```

命令的なJava/jQuery的発想：
```java
// 「カウントが増えたのでラベルを書き換える」— 手順を書く
label.setText("未読 " + count + "件");
if (count > 0) badge.setVisible(true); else badge.setVisible(false);
```

Reactの宣言的発想：
```tsx
// 「未読が0より多いならバッジがある」— あるべき姿を書く
{unreadCount > 0 && (
  <button onClick={scrollToLatest}>↓ {unreadCount}件の新しいコメント</button>
)}
```
（`src/features/comment/components/CommentSection.tsx` の実物）

**state が変われば、Reactが自動で画面を合わせにいく。**
開発者はDOMを触らない。`document.getElementById` はこのリポジトリに1つも出てこない。

---

## 1. コンポーネント = 関数

```tsx
// src/features/game/components/GameCard.tsx
interface GameCardProps {
  game: Game
  commentCount: number
  voiceCount?: number
}

export function GameCard({ game, commentCount, voiceCount = 0 }: GameCardProps) {
  const time = new Date(game.scheduledAt).toLocaleTimeString('ja-JP', { ... })
  return (
    <Link href={`/games/${game.id}`} className="block">
      ...
    </Link>
  )
}
```

- **引数（props）を受け取ってUIを返す関数**。それ以上のものではない
- 大文字始まりが必須（小文字だとHTMLタグと解釈される）
- クラスコンポーネントは過去の書き方。**このリポジトリには存在しない**

Javaのメンタルモデルで言えば「`render(props)` メソッドだけを持つステートレスなコンポーネント」。

### props は読み取り専用

```tsx
export function GameCard({ game }: GameCardProps) {
  game.homeScore = 100   // ❌ 絶対にやらない。親のデータを壊す
}
```
Javaでいう「引数のオブジェクトを破壊的に変更しない」規律と同じだが、Reactでは**再描画の仕組みが壊れる**ので致命的。

---

## 2. JSX：HTMLに見えるがJavaScript

```tsx
return <div className="flex">{displayName}</div>
```
これはビルド時に関数呼び出しに変換される。だから **JSXの中身はすべて式**。

### Java/HTMLとの違い（引っかかりやすい所）

| やりたいこと | JSX |
|---|---|
| CSSクラス | `className`（`class` は予約語） |
| ラベルの `for` | `htmlFor` |
| 値の埋め込み | `{式}` |
| 属性に変数 | `href={`/games/${game.id}`}` |
| インラインstyle | `style={{ width: `${awayPercent}%` }}`（オブジェクト） |
| コメント | `{/* コメント */}` |
| 複数要素を返す | `<>...</>`（フラグメント）で包む |

### 条件分岐は `&&` と三項演算子

JSXの中に `if` 文は書けない（文ではなく式が必要）。

```tsx
// ① && : 「条件が真なら表示」
{error && <p className="text-red-500 text-xs">{error}</p>}

// ② 三項演算子: 「A か B」
{loading ? 'ログイン中...' : 'ログイン'}

{user ? (
  <CommentSection gameId={game.id} ... />
) : (
  <GuestCommentView gameId={game.id} ... />
)}

// ③ 早期return: 分岐が大きいときはコンポーネントごと分ける
export function CommentFeed({ comments, ... }: CommentFeedProps) {
  if (comments.length === 0) {
    return <div>最初のコメントを投稿しましょう！</div>
  }
  return <div>...</div>
}
```

> ⚠️ `&&` の罠：**左辺が数値の `0` だと `0` が画面に出る**。
> ```tsx
> {comments.length && <List />}   // ❌ 0件のとき画面に "0" と表示される
> {comments.length > 0 && <List />} // ✅ 必ず boolean にする
> ```
> repo のコードが一貫して `> 0` を書いているのはこのため。

### リストは `map` + `key`

```tsx
// src/features/game/components/GameList.tsx
<ul className="flex flex-col gap-3">
  {liveGames.map((game) => (
    <li key={game.id}>
      <GameCard game={game} commentCount={commentCounts[game.id] ?? 0} />
    </li>
  ))}
</ul>
```

**`key` は必須**。Reactが「前回のどの要素と同じか」を判別するための識別子。

- ✅ `key={game.id}` — 安定したID
- ❌ `key={index}` — 並び替え・挿入で描画がバグる（入力欄の中身が別の行に付いていく等）

Javaの `equals`/`hashCode` を渡してリスト差分を取っているようなもの、と考えると腑に落ちる。

---

## 3. state と再レンダリング

### `useState`

```tsx
// src/features/auth/components/LoginForm.tsx
const [error, setError] = useState<string | null>(null)
const [loading, setLoading] = useState(false)
```

- 分割代入で `[現在の値, 更新関数]` を受け取る
- **`error = 'x'` と直接代入しても画面は変わらない。必ず `setError('x')` を呼ぶ**
- `setError` を呼ぶと、**そのコンポーネント関数がもう一度先頭から実行される**

### 「関数がもう一度実行される」の意味

これがReactで最も理解が要る部分。

```tsx
export function LoginForm() {
  const [loading, setLoading] = useState(false)
  console.log('render')          // ← setLoading のたびにこの行が再度走る

  async function handleSubmit(e) { ... }  // ← 関数も毎回作り直される

  return <form onSubmit={handleSubmit}>...</form>
}
```

Javaのインスタンスと違い、**コンポーネントは呼ばれるたびにローカル変数を作り直す**。
それでも `loading` の値が保たれるのは、Reactが外部に状態を保持していて `useState` が毎回それを返すから。

```
1回目の呼び出し: useState(false) → [false, setLoading]
   ユーザーがsubmit → setLoading(true)
2回目の呼び出し: useState(false) → [true,  setLoading]   ← 引数のfalseは初回のみ使われる
```

### 更新関数の2つの形

```tsx
setLoading(true)                          // 新しい値を直接渡す
setComments((prev) => [...prev, comment]) // 直前の値から計算する（推奨）
```

**直前の値に依存するときは必ず関数形式を使う。** 理由は、Reactが更新をまとめて処理するため、
`setCount(count + 1)` を2回呼んでも `count` が古いままで1しか増えないことがあるから。

```tsx
// src/features/comment/hooks/useComments.ts
setUnreadCount((n) => n + 1)              // ✅ 関数形式
setComments((prev) => [...prev, result.data])
```

### 不変更新が必須である理由

Reactは新旧の state を **`===` で比較**する（→ [JavaScript編](./01-javascript-for-java-devs.md) の参照比較）。

```tsx
// ❌ 画面が更新されない：配列の「参照」は同じままだから
comments.push(newComment)
setComments(comments)

// ✅ 新しい配列を作るので参照が変わり、Reactが変化を検知する
setComments((prev) => [...prev, newComment])
```

```tsx
// オブジェクトの一部だけ更新する場合も新しく作る
setComments((prev) =>
  prev.map((c) => (c.id === tempId ? { ...c, id: realId } : c))
)
```

Javaの不変オブジェクト（`record` + wither）と同じ発想。**Reactでは規約ではなく動作要件**である点が違う。

### state に置くもの／置かないもの

```tsx
// src/features/prediction/components/PredictionPanel.tsx
const [summary, setSummary] = useState(initialSummary)
const total = summary.homeCount + summary.awayCount              // ← stateにしない
const homePercent = total === 0 ? 50 : Math.round((summary.homeCount / total) * 100)
```

**他のstateから計算できるものはstateにしない。** レンダリングのたびに計算すればよい。
`total` を別のstateにすると、同期がずれてバグる。

---

## 4. `useEffect`：外の世界との同期

`useEffect` は「レンダリングの結果として、React管理外のもの（DOM、タイマー、WebSocket、外部API）を同期させる」ためのもの。

```tsx
useEffect(() => {
  // 副作用の処理
  return () => {
    // クリーンアップ（後片付け）
  }
}, [依存配列])
```

### 依存配列の3パターン

```tsx
useEffect(() => {...})          // 毎回のレンダー後に実行（ほぼ使わない）
useEffect(() => {...}, [])      // マウント時に1回だけ
useEffect(() => {...}, [gameId])// gameId が === で変わったときに再実行
```

### 実例1：タイマー（`LiveRefresh.tsx`）

このリポジトリで最も小さく、最も分かりやすい `useEffect`。

```tsx
// src/features/game/components/LiveRefresh.tsx
'use client'
export function LiveRefresh({ hasLiveGames }: LiveRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    if (!hasLiveGames) return          // 早期return。この場合は何もしない

    const id = setInterval(() => {
      router.refresh()                 // サーバーからデータを取り直す
    }, REFRESH_INTERVAL_MS)

    return () => clearInterval(id)     // ← 必ず後片付けする
  }, [hasLiveGames, router])

  return null                          // 画面には何も描かない
}
```

学べる点：
1. **UIを持たないコンポーネントがあってよい**（`return null`）。副作用を置くためだけの存在
2. **クリーンアップを返す**。返さないとページ遷移後もタイマーが動き続けてリークする
   （Javaの `try-with-resources` / `@PreDestroy` に相当）
3. 依存配列に `hasLiveGames` があるので、ライブ試合が終わればタイマーが張り直される

### 実例2：購読とイベントリスナ（`useComments.ts`）

```tsx
// src/features/comment/hooks/useComments.ts
useEffect(() => {
  const supabase = createClient()

  const channel = supabase
    .channel(`comments:${gameId}`)
    .on('postgres_changes', { event: 'INSERT', table: 'comments', filter: `game_id=eq.${gameId}` },
      async (payload) => { ... })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)   // 購読解除
  }
}, [gameId])                          // 別の試合に移ったら購読し直す
```

WebSocket購読・イベントリスナ・タイマー、いずれも**「作る」と「壊す」を1つのeffectに書く**のがルール。

### `useEffect` を使わなくてよい場面

初心者が最も誤用する。以下は `useEffect` **不要**：

| やりたいこと | 正しいやり方 |
|---|---|
| propsから値を計算する | そのままレンダー中に計算する |
| ボタンが押されたときの処理 | `onClick` ハンドラに書く |
| フォーム送信時にAPIを呼ぶ | `onSubmit` ハンドラに書く（`LoginForm.tsx` がそう） |
| 初期表示のデータ取得 | **Server Componentで取る**（→ [Next.js編](./04-nextjs-app-router.md)） |

このリポジトリで `useEffect` が使われているのは
「スクロール監視」「自動スクロール」「Realtime購読」「定期リフレッシュ」だけ。
**すべて React の外側の世界に関わるもの**である点に注目。

---

## 5. `useRef`：再レンダリングを起こさない箱

```tsx
// src/features/comment/hooks/useComments.ts
const scrollContainerRef = useRef<HTMLDivElement | null>(null)
const receivedIds = useRef<Set<string>>(new Set(...))
const isAtBottomRef = useRef(true)
```

`useRef` には2つの用途がある。

### 用途1：DOM要素への参照

```tsx
const inputRef = useRef<HTMLInputElement>(null)
...
<input ref={inputRef} type="text" />
...
if (inputRef.current) inputRef.current.value = ''   // 送信後にクリア
```

### 用途2：再描画を起こしたくない値の保持

```tsx
const isAtBottomRef = useRef(true)
// スクロールのたびに更新されるが、画面表示には影響しない
isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD
```

### `useState` と `useRef` の使い分け

| | 変更したら再描画 | 用途 |
|---|---|---|
| `useState` | **する** | 画面に出る値 |
| `useRef` | **しない** | 画面に出ない値・DOM参照 |

`useComments.ts` はこの使い分けの教科書になっている：

```tsx
const [unreadCount, setUnreadCount] = useState(0)   // 画面にバッジとして出る → state
const isAtBottomRef = useRef(true)                  // 判定用。画面に出ない → ref
const receivedIds = useRef<Set<string>>(new Set())  // 重複除去用 → ref
```

もし `receivedIds` を `useState` にすると、コメントが来るたび余計な再描画が走る。

---

## 6. カスタムフック：ロジックの抽出

**「`use` で始まる関数」= カスタムフック**。他のフックを呼べる普通の関数にすぎない。

Javaで「Serviceクラスにロジックを切り出す」のと同じ動機で、
**UIから状態管理ロジックを分離する**。

```tsx
// src/features/comment/hooks/useComments.ts（抜粋）
export function useComments(gameId: string, initialComments: Comment[]) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [unreadCount, setUnreadCount] = useState(0)
  ...
  return {
    comments, unreadCount, scrollContainerRef, bottomRef,
    scrollToLatest, addOptimistic, confirmOptimistic,
  }
}
```

使う側は中身を知らなくていい：

```tsx
// src/features/comment/components/CommentSection.tsx
const {
  comments, unreadCount, scrollContainerRef, bottomRef,
  scrollToLatest, addOptimistic, confirmOptimistic,
} = useComments(gameId, initialComments)
```

CLAUDE.md のディレクトリ構成で `features/*/hooks/` が独立しているのはこの分離のため。

### フックのルール（厳守）

1. **フックはコンポーネント or カスタムフックのトップレベルでのみ呼ぶ**
   - ❌ `if (x) { useState(...) }` — 条件分岐の中で呼ばない
   - ❌ ループの中、`return` より後で呼ばない
2. 呼ぶ順番が毎回同じでなければならない

理由：Reactは「何番目に呼ばれたフックか」で状態を対応づけているため。
（ESLintの `react-hooks/rules-of-hooks` が検出してくれる）

---

## 7. イベントハンドリングとフォーム

### イベントハンドラ

```tsx
<button onClick={() => onVote('away')} disabled={loading}>
<button onClick={scrollToLatest}>
<form onSubmit={handleSubmit}>
```

- `onClick={handleClick}` — **関数を渡す**
- `onClick={handleClick()}` — ❌ 即座に実行してその戻り値を渡してしまう
- 引数を渡したいときは `onClick={() => onVote('away')}` とアロー関数で包む

### `e.preventDefault()`

```tsx
// src/features/auth/components/LoginForm.tsx
async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()      // ブラウザ標準のフォーム送信（ページ遷移）を止める
  ...
}
```
これを忘れるとページがリロードされてstateが飛ぶ。

### 非制御コンポーネント（このリポジトリのスタイル）

入力欄の扱いには2方式ある。

```tsx
// ① 制御コンポーネント：入力のたびstateを更新
const [value, setValue] = useState('')
<input value={value} onChange={(e) => setValue(e.target.value)} />

// ② 非制御コンポーネント：送信時にだけ値を読む
const inputRef = useRef<HTMLInputElement>(null)
<input ref={inputRef} type="text" />
const content = inputRef.current?.value.trim() ?? ''
```

`CommentSection.tsx` は②を採用している。**1文字打つたびの再描画を避けるため**で、
リアルタイムチャットのように高頻度描画がある画面では合理的な選択。

`LoginForm.tsx` はさらに別解で、`FormData` を使っている：

```tsx
const formData = new FormData(e.currentTarget)
const raw: SignInInput = {
  email: formData.get('email') as string,
  password: formData.get('password') as string,
}
```
`name` 属性から値を取る、Servletの `request.getParameter()` に近い書き方。

---

## 8. 楽観的更新（Optimistic Update）

Reactらしい設計が最もよく出ている部分。`CommentSection.tsx` を読む。

```
ユーザーが送信
  ↓
① 仮IDで即座に画面へ追加          ← ユーザーは待たされない
  ↓
② サーバーへINSERT（数百ms）
  ↓
③ 成功: 仮IDを本物のIDに差し替え
   失敗: エラーメッセージを表示
```

```tsx
// src/features/comment/components/CommentSection.tsx
const tempId = crypto.randomUUID()
addOptimistic({
  id: tempId,
  gameId, userId: currentUserId, content,
  createdAt: new Date().toISOString(),
  profile: currentUserProfile,
})

const { data, error: dbError } = await supabase
  .from('comments')
  .insert({ game_id: gameId, user_id: currentUserId, content })
  .select('id').single()

if (dbError || !data) {
  setError('投稿に失敗しました。もう一度お試しください')
} else {
  confirmOptimistic(tempId, data.id)
}
```

```tsx
// src/features/comment/hooks/useComments.ts
function confirmOptimistic(tempId: string, realId: string) {
  receivedIds.current.add(realId)      // ← Realtimeで同じものが返ってきても弾く
  setComments((prev) => prev.map((c) => (c.id === tempId ? { ...c, id: realId } : c)))
}
```

`receivedIds` に本物のIDを登録しているのが肝で、
**自分の投稿がRealtime経由で戻ってきて二重表示になるのを防いでいる**。

```tsx
// Realtime受信側
const id = payload.new['id'] as string
if (receivedIds.current.has(id)) return   // 既知なら無視
receivedIds.current.add(id)
```

分散システムの冪等性（idempotency）の考え方がそのままフロントに出てくる例。

---

## 9. コンポーネント設計の指針

このリポジトリのコンポーネントは役割が明確に分かれている。読むときの分類軸にできる。

| 種類 | 例 | 特徴 |
|---|---|---|
| 表示専用（presentational） | `GameCard`, `GameStatusBadge`, `TeamDisplay` | propsを受けて描くだけ。stateなし |
| 状態を持つ（container） | `CommentSection`, `PredictionPanel` | state + ハンドラを持つ |
| 副作用専用 | `LiveRefresh` | `return null`。effectだけ |
| ロジック（フック） | `useComments` | UIなし。状態と関数を返す |
| データ取得（Server Component） | `GameList` | `async`。DBを叩く |

### 同一ファイル内の子コンポーネント

```tsx
// src/features/prediction/components/PredictionPanel.tsx
export function PredictionPanel({...}) { ... }

function VoteButtons({...}) { ... }    // exportしない = このファイル専用
function ResultsView({...}) { ... }
```

**他所で使わないならexportせず同じファイルに置く**。Javaのprivate staticなインナークラスに近い。
ファイルが400行を超えてきたら分割を検討する（CLAUDE.md の規約）。

---

## 章末チェック

1. `setComments` を呼んだあと、コンポーネント関数はどうなるか
2. `comments.push(x); setComments(comments)` が動かない理由
3. `key={index}` が危険な理由
4. `useState` ではなく `useRef` を選ぶのはどんな値か
5. `useEffect` のクリーンアップ関数を返し忘れると何が起きるか（`LiveRefresh.tsx` で考える）
6. 楽観的更新で `receivedIds` が必要な理由

→ 次章 [Next.js App Router 編](./04-nextjs-app-router.md)
