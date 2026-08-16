# 1. JavaScript 言語編（Java経験者向け）

Javaと比べたときに**思想が違うところだけ**を扱う。
`if` や `for` の書き方は同じなので説明しない。

---

## 0. 最重要の前提：シングルスレッド

Javaで最初に覚えることの半分（スレッド、`synchronized`、`ExecutorService`、並行コレクション）は
**JavaScriptには存在しない**。JSは1本のスレッドで動く。

```
┌─────────────────────────────────────┐
│  Call Stack（1本だけ）                │  ← ここが空になるまで他は動かない
└─────────────────────────────────────┘
          ↑ 空になったら取り出す
┌─────────────────────────────────────┐
│  Microtask Queue（Promiseの続き）     │  ← こちらが優先
├─────────────────────────────────────┤
│  Macrotask Queue（setTimeout, I/O）  │
└─────────────────────────────────────┘
```

これが意味すること：

- **データ競合が原理的に起きない。ロックが要らない。**
  `src/utils/rate-limit.ts` がグローバルな `Map` を `synchronized` なしで触れているのはこのため。

  ```ts
  // src/utils/rate-limit.ts
  const store = new Map<string, RateLimitEntry>()   // モジュールレベルの共有状態

  export function checkRateLimit(key: string, { limit, windowMs }: RateLimitOptions) {
    const now = Date.now()
    const entry = store.get(key)
    // ↑↓ この間に別スレッドが割り込むことはない。JSでは不可能
    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      return { allowed: true, remaining: limit - 1 }
    }
    ...
  }
  ```

  Javaなら `ConcurrentHashMap` か `synchronized` が必須の処理が、素の `Map` で成立する。

- **重い同期処理を書くと全部止まる。**
  Javaの「1リクエスト1スレッド」と違い、CPUを1秒占有する関数は他の全リクエストを1秒待たせる。

- **だからI/Oは必ず非同期**。JSに `blockingRead()` は基本的にない。すべて `Promise`。

> ⚠️ ただし本番では複数のサーバーレス関数インスタンスが並列に立つ。
> `rate-limit.ts` の `Map` はインスタンスごとに別物なので、厳密なグローバル制限にはならない。
> ファイル冒頭のコメントが「本番スケールでは Vercel KV へ」と書いているのはこの意味。
> **シングルスレッドなのは1インスタンス内の話**であって、水平スケールの話ではない。

---

## 1. 変数宣言：`let` と `const`（`var` は使わない）

```ts
const supabase = createAdminClient()   // 再代入不可（Javaの final）
let supabaseResponse = NextResponse.next({ request })  // 再代入する場合のみ let
```

**原則 `const`、再代入が必要なときだけ `let`。** `var` は関数スコープで挙動が古いので使わない。

### 落とし穴：`const` は immutable ではない

Javaの `final` とまったく同じで、**参照の再束縛を禁じるだけ**。中身は変えられる。

```ts
const entry = store.get(key)!
entry.count += 1        // ✅ OK。オブジェクトの中身は変えられる
entry = otherEntry      // ❌ エラー。再代入は不可
```

```java
// Java でまったく同じ挙動
final List<String> list = new ArrayList<>();
list.add("a");          // OK
list = new ArrayList<>(); // コンパイルエラー
```

---

## 2. 型：プリミティブは7種類しかない

| JS | Java の近いもの | 注意 |
|---|---|---|
| `number` | `double` | **`int` / `long` がない。** 全部64bit浮動小数 |
| `bigint` | `BigInteger` | `123n` と書く。滅多に使わない |
| `string` | `String` | イミュータブル。`char` 型はない |
| `boolean` | `boolean` | |
| `undefined` | （なし） | 「まだ値が入っていない」 |
| `null` | `null` | 「意図的に空」 |
| `symbol` | （なし） | ほぼ使わない |

それ以外はすべて `object`（配列も関数もオブジェクト）。

### `number` が `double` である帰結

```ts
0.1 + 0.2 === 0.3        // false （Javaの double と同じ）
Number.MAX_SAFE_INTEGER  // 9007199254740991（2^53-1）。これを超えると精度が壊れる
```

このプロジェクトでスコアやポイントを扱うときは整数しか出ないので実害はないが、
金額計算をするなら整数（セント単位）で持つのが定石。

Zodで整数を強制しているのはこのため：

```ts
// src/features/game/schema.ts
homeScore: z.number().int().nullable(),   // .int() がないと 12.5 が通ってしまう
period: z.number().int().default(0),
```

### `null` と `undefined` は別物

Javaの `null` に相当するものが2つある。これはJava経験者が最も戸惑う点。

| | 意味 | 典型的な出どころ |
|---|---|---|
| `undefined` | 「そのプロパティ自体が存在しない」 | 未定義の変数、無いキー、戻り値なしの関数 |
| `null` | 「存在するが値は空」 | DBのNULL、明示的な「なし」 |

このリポジトリでの使い分けは一貫している：

```ts
// src/features/game/schema.ts
homeScore: z.number().int().nullable(),   // DBのNULL → null（試合前でスコアがない）
```
```ts
// src/features/comment/components/CommentFeed.tsx
const displayName = comment.profile?.displayName ?? '名無し'
//                                ↑ profile が undefined なら全体が undefined
//                                              ↑ null でも undefined でも '名無し'
```

- `?.`（オプショナルチェーン）= Javaの `Optional.map()` を短く書いたもの。
  `null` / `undefined` なら評価を打ち切って `undefined` を返す。
- `??`（null合体演算子）= Javaの `Optional.orElse()`。
  **`null` と `undefined` のときだけ**右側を使う。

### `??` と `||` の違い（重要）

```ts
const count = 0

count || 10   // → 10  ❗ 0 は falsy なので右が選ばれる
count ?? 10   // → 0   ✅ 0 は null でも undefined でもないので左のまま
```

`GameList.tsx` が `??` を使っているのは、コメント0件を10件などに化けさせないため：

```tsx
// src/features/game/components/GameList.tsx
commentCount={commentCounts[game.id] ?? 0}    // キーが無ければ 0
```

**原則：デフォルト値には常に `??` を使い、`||` は使わない。**

### truthy / falsy

`if` に boolean 以外を書ける。falsy（偽と見なされる値）は7つだけ：

```
false, 0, -0, 0n, ""（空文字）, null, undefined, NaN
```

それ以外は全部 truthy（`[]` や `{}` も truthy）。

```tsx
// src/app/games/[id]/page.tsx
isLoggedIn={!!user}    // user（オブジェクト or null）を boolean に変換するイディオム
```

`!!` は「否定して否定する」＝ boolean 化。Javaの `user != null` と同じ意図。

### `===` を使う（`==` は使わない）

```ts
1 == '1'     // true  ❗ 型変換が起きる
1 === '1'    // false ✅ 型も比較する
```

`===` はJavaの `==`（参照比較 + プリミティブ値比較）に相当。
`equals()` に相当するものは無いので、**オブジェクトの中身の比較は自前でやる**。

```ts
{ a: 1 } === { a: 1 }    // false（別インスタンス）
```

React で「値が変わったか」を判定する場面（`useEffect` の依存配列など）では
この参照比較の性質が直接効いてくる。→ [React編](./03-react-for-java-devs.md)

---

## 3. オブジェクトと配列

### オブジェクトリテラル ≒ Map ≒ DTO

JSのオブジェクトは「Javaの `HashMap<String, Object>`」と「DTOインスタンス」の両方の役割を兼ねる。

```ts
// src/types/api.ts
export function ok<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> {
  return { success: true, data, meta }
  //       ↑ new も class も要らない。これだけで「DTO」ができる
}
```

```java
// Java だとこう
public static <T> ApiResponse<T> ok(T data) {
    ApiResponse<T> res = new ApiResponse<>();
    res.setSuccess(true);
    res.setData(data);
    return res;
}
```

### ショートハンド

```ts
const gameId = 'x'
const content = 'hello'

{ gameId: gameId, content: content }   // 冗長
{ gameId, content }                    // 同じ意味。変数名がそのままキーになる
```

`CommentSection.tsx` の `PostCommentSchema.safeParse({ gameId, content })` がこれ。

### 分割代入（destructuring）

```ts
// src/app/games/page.tsx
const { date } = await searchParams        // searchParams.date を取り出す
```
```ts
// src/features/game/repository.ts
const { data, error } = await supabase.from('games').select('*')
//    ↑ 戻り値オブジェクトから2つのフィールドを同時に取り出す
```
```ts
// src/utils/rate-limit.ts
export function checkRateLimit(key: string, { limit, windowMs }: RateLimitOptions) {
  //                                        ↑ 引数を受け取りながら分解する
```

Javaには無い記法だが、**「オブジェクトを渡して中身を名前で受け取る」**だけ。
Javaの名前付き引数の代わりとして多用される。

ネストと同時に取り出すこともできる：

```ts
// src/app/api/comments/route.ts
const { data: { user } } = await supabase.auth.getUser()
//       ↑ data の中の user を取り出して user という変数にする
```

### スプレッド構文 `...` と不変更新

このプロジェクトのコーディング原則にある「不変性優先」を実現する記法。

```ts
// src/features/comment/hooks/useComments.ts
setComments((prev) => [...prev, result.data])
//                     ↑ 元配列を展開した新しい配列を作る（push はしない）
```
```ts
setComments((prev) =>
  prev.map((c) => (c.id === tempId ? { ...c, id: realId } : c))
  //                                  ↑ c の全プロパティをコピーし、id だけ差し替えた新オブジェクト
)
```

```java
// Java 17 の record で近いことをすると
List<Comment> next = prev.stream()
    .map(c -> c.id().equals(tempId) ? new Comment(realId, c.gameId(), c.content()) : c)
    .toList();
```

**なぜ新しく作るのか**：Reactは `===` で変化を検知する（→ 2節の参照比較）。
`prev.push(x)` すると配列の参照が変わらないので、**Reactが再描画してくれない**。
これは後述の React編で最も重要なルールになる。

### 配列メソッド（Stream API 相当）

```ts
// src/features/game/components/GameList.tsx
const liveGames = games.filter((g) => g.status === 'live')
const ids = games.map((g) => g.id)
```

```java
// Java
List<Game> liveGames = games.stream().filter(g -> g.status() == LIVE).toList();
List<UUID> ids = games.stream().map(Game::id).toList();
```

違いは3つ：

1. **`.stream()` と `.toList()` が要らない**（配列に直接生えている）
2. **遅延評価されない**。`filter` は即座に新しい配列を作る
3. `flatMap` は Java と同じだが、**空を返すのに空配列を使う**

```ts
// src/features/game/repository.ts — 「パースできた行だけ残す」イディオム
return data.flatMap((row) => {
  const game = parseGame(row as Record<string, unknown>)
  return game ? [game] : []      // 成功なら要素1の配列、失敗なら空配列
})
```

```java
// Java の同等表現
return data.stream()
    .map(this::parseGame)
    .filter(Objects::nonNull)
    .toList();
```

よく使うものの対応表：

| JS | Java Stream |
|---|---|
| `arr.map(f)` | `.map(f)` |
| `arr.filter(f)` | `.filter(f)` |
| `arr.flatMap(f)` | `.flatMap(f)` |
| `arr.reduce(f, init)` | `.reduce(init, f)` |
| `arr.find(f)` | `.filter(f).findFirst().orElse(null)` |
| `arr.some(f)` | `.anyMatch(f)` |
| `arr.every(f)` | `.allMatch(f)` |
| `arr.slice(-50)` | 末尾50件（`subList` 相当。負数は末尾から） |
| `arr.includes(x)` | `.contains(x)` |

```ts
// src/middleware.ts — some の実例
const isPublicPath = PUBLIC_PATHS.some((path) =>
  request.nextUrl.pathname.startsWith(path)
)
```
```ts
// src/features/comment/components/CommentFeed.tsx — 末尾50件
const displayed = showAll ? comments : comments.slice(-INITIAL_VISIBLE)
```

### 配列アクセスは必ず `T | undefined` として扱う

CLAUDE.md にも明記されているルール。JSは範囲外アクセスで例外を投げず `undefined` を返す。

```ts
const arr = [1, 2, 3]
arr[99]        // undefined（Java なら IndexOutOfBoundsException）
```

```ts
// src/app/games/page.tsx
const today = d.toISOString().split('T')[0]!
//                                        ↑ 「絶対 undefined じゃない」とTSに伝える(!)
```
```ts
// src/app/api/comments/route.ts
err(result.error.issues[0]?.message ?? '入力内容を確認してください')
//                        ↑ ?. と ?? で安全に処理する（こちらが推奨）
```

---

## 4. 関数

### 関数は値である（第一級オブジェクト）

Javaでラムダや `Function<T,R>` を使う場面が、JSでは言語の基本形。

```ts
// 関数宣言（巻き上げされる = 定義より前で呼べる）
function parseGame(row: Record<string, unknown>): Game | null { ... }

// 関数式 + アロー関数（変数に代入する）
const handleVote = async (w: PredictedWinner) => { ... }
```

このリポジトリの使い分け：
- トップレベルの名前付き処理 → `function` 宣言
- コールバック・イベントハンドラ → アロー関数

### アロー関数の省略記法

```ts
(g) => g.id                  // 式1つなら return を省略でき、それが戻り値になる
(g) => { return g.id }       // 上と同じ
(g) => ({ id: g.id })        // ❗ オブジェクトを返すときは () で囲む（{} はブロックと解釈される）
() => setShowAll(true)       // 引数なし
```

### `this` は Java と全然違う

Javaの `this` は常に「そのインスタンス」。JSの `this` は **呼び出し方で決まる**。

これが原因のバグを避けるため、**このリポジトリのモダンなReactコードには `this` が一度も出てこない**。
関数コンポーネント + フックで書く限り `this` は不要。

覚えておくべきことは1つだけ：
> **アロー関数は自分の `this` を持たず、外側のスコープの `this` を引き継ぐ。**
> 迷ったらアロー関数を使えばよい。

### クロージャ

関数が「定義されたときの環境」を覚えている性質。Javaの匿名クラスがfinal変数をキャプチャするのに近いが、
**JSは再代入される変数もキャプチャできる**（参照を掴んでいる）。

```ts
// src/features/comment/hooks/useComments.ts
useEffect(() => {
  const container = scrollContainerRef.current
  if (!container) return

  function handleScroll() {
    const { scrollTop, scrollHeight, clientHeight } = container!
    //                                               ↑ 外側の container を覚えている
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD
    ...
  }

  container.addEventListener('scroll', handleScroll, { passive: true })
  return () => container.removeEventListener('scroll', handleScroll)
  //     ↑ この後片付け関数も container と handleScroll を覚えている
}, [])
```

クロージャは React の心臓部（stateの正体はクロージャに閉じ込められた値）なので、
ここは理解しておく価値がある。

### デフォルト引数

```tsx
// src/features/game/components/GameCard.tsx
export function GameCard({ game, commentCount, voiceCount = 0 }: GameCardProps) {
  //                                            ↑ 渡されなければ 0
```

Javaのオーバーロードで表現していたものが、これ1行で済む。

---

## 5. 非同期処理：Promise と async/await

Javaの `CompletableFuture` にほぼ対応するが、**JSではI/Oが必ず非同期**なので使用頻度が桁違い。

### Promise の3状態

```
pending（実行中）→ fulfilled（成功、値を持つ）
                 → rejected（失敗、エラーを持つ）
```

### async / await

```ts
// src/features/game/repository.ts
async function fetchGamesByDate(date: string): Promise<Game[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('games').select('*').eq('game_date', date)
  if (error || !data) return []
  return data.flatMap(...)
}
```

ルール：
- `async` を付けた関数の**戻り値は必ず `Promise<T>` になる**。`return []` と書いても呼び出し側には `Promise<Game[]>` が届く
- `await` は `async` 関数の中でしか書けない（トップレベルawaitはモジュールでのみ可）
- `await` を**書き忘れると `Promise` オブジェクトそのものが変数に入る**。TSがエラーにしてくれることが多いが、
  `if (promise)` は常に truthy になるので注意

### 直列と並列（`Promise.all`）

これはこのプロジェクトのパフォーマンス設計の中核。

```ts
// ❌ 直列：合計 = A + B（ウォーターフォール）
const a = await getA()
const b = await getB()

// ✅ 並列：合計 = max(A, B)
const [a, b] = await Promise.all([getA(), getB()])
```

```ts
// src/app/games/[id]/page.tsx — 実例
const [user, game, initialComments] = await Promise.all([
  getUser(),
  getGameById(id),
  getComments(id),
])
// ↑ 3本のHTTPS往復が同時に飛ぶ。直列なら3倍かかる

// 次の2つは user と game に依存するので、ここで初めて2段目を投げる
const [profile, predictionSummary] = await Promise.all([
  user ? getProfile(user.id) : Promise.resolve(null),
  getPredictionSummary(game.id, user?.id ?? null),
])
```

`Promise.resolve(null)` は「すでに完了しているPromise」を作るイディオム。
`Promise.all` の配列は型を揃える必要があるため、条件分岐でもPromiseを返している。

| メソッド | 挙動 |
|---|---|
| `Promise.all` | 全部成功で成功。**1つでも失敗すると全体が失敗** |
| `Promise.allSettled` | 全部の結果（成功/失敗）を待つ |
| `Promise.race` | 最初に決着した1つ |

### エラーハンドリング

```ts
try {
  await something()
} catch (e) {
  // e の型は unknown（Java の catch (Exception e) と違い型が保証されない）
}
```

Promiseチェーンの `.catch()` でも書ける。**部分的な失敗を握りつぶす**用途に便利：

```ts
// src/features/game/components/GameList.tsx
isToday
  ? getVoiceParticipantCounts(games.map((g) => g.id)).catch(() => ({} as Record<string, number>))
  : Promise.resolve({} as Record<string, number>)
// ↑ LiveKit（外部API）が落ちても、通話人数を空にするだけでページ全体は表示する
```

これは重要な設計判断で、`Promise.all` の中で1つでもrejectすると全体が落ちるため、
**落ちてもいい処理には個別に `.catch()` を付ける**。

### 「例外を投げない」スタイル

Supabaseクライアントも Zod も、**エラーを例外ではなく戻り値で返す**。

```ts
const { data, error } = await supabase.from('games').select('*')  // errorフィールド
const result = GameSchema.safeParse(input)                        // result.success
```

Javaの検査例外よりも Go に近い。`try/catch` はこのコードベースにほとんど出てこない。

---

## 6. モジュール（import / export）

**1ファイル = 1モジュール**。Javaのパッケージ + `public` 修飾子に相当する。

```ts
export function GameCard() {}        // 名前付きエクスポート（このリポジトリの原則）
export default function GamesPage(){} // デフォルトエクスポート
```

```ts
import { GameCard } from './GameCard'                    // 名前付きは {} が要る
import GamesPage from '@/app/games/page'                 // デフォルトは {} なし
import type { Game } from '../schema'                    // 型だけのimport（実行時に消える）
import { unstable_cache } from 'next/cache'              // ライブラリ
```

### このリポジトリの規約

- **原則は名前付きエクスポート**（IDEの補完とリファクタが効く）
- **`export default` は Next.js が要求する場所だけ**：`page.tsx` / `layout.tsx` / `loading.tsx`
- `@/` は `src/` のエイリアス（`tsconfig.json` の `paths` で定義）
- `import type` を使うと「これは型だけ」とTSに伝わり、バンドルに含まれない

---

## 7. 覚えておくと読める小ネタ

### テンプレートリテラル

```ts
`comments:${gameId}`                          // Java の String.format / テキストブロック相当
`game_id=eq.${gameId}`
`🏀 ${game.awayTeam} ${game.awayScore} - ${game.homeScore} ${game.homeTeam}\n...`
```
バッククォート内で改行もそのまま書ける。

### 三項演算子の多用

Javaでは可読性を理由に控えることが多いが、**JSXの中では `if` が書けない**ため多用される。

```tsx
{user ? <CommentSection ... /> : <GuestCommentView ... />}
```

### `Record<string, number>` と `Map`

キーバリューには2つの選択肢がある。

```ts
const commentCounts: Record<string, number> = {}   // ただのオブジェクト。JSONにできる
const store = new Map<string, RateLimitEntry>()    // 本物のMap。キーに任意の型が使える
```

**JSONとして送受信するなら `Record`、内部の状態管理なら `Map`**。
`commentCounts[game.id] ?? 0` のようにアクセスできるのが `Record` の利点。

### `Set`

```ts
// src/features/comment/hooks/useComments.ts
const receivedIds = useRef<Set<string>>(new Set(initialComments.map((c) => c.id)))
if (receivedIds.current.has(id)) return    // 重複コメントを弾く
receivedIds.current.add(id)
```
Javaの `HashSet` と同じ。

### `crypto.randomUUID()`

```ts
const tempId = crypto.randomUUID()   // Java の UUID.randomUUID()
```

### 日付は `Date` + `Intl`

JSの `Date` は貧弱（Java 8以前の `java.util.Date` 相当）。タイムゾーンは `Intl` で扱う。

```ts
// src/app/games/page.tsx
const jstToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(new Date())
// 'en-CA' ロケールは YYYY-MM-DD 形式になるという小技
```
```ts
// src/features/game/components/GameCard.tsx
new Date(game.scheduledAt).toLocaleTimeString('ja-JP', {
  hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo',
})
```
`LocalDateTime` / `ZonedDateTime` に相当するものは標準にない（Temporal APIが策定中）。

---

## 章末チェック

以下に即答できれば次章へ。

1. `count ?? 10` と `count || 10` で結果が変わるのはどんなときか
2. `setComments([...prev, x])` と `prev.push(x)` の違いと、なぜ前者でなければならないか
3. `Promise.all` の中の1つが失敗したらどうなるか。落ちてほしくないときはどうするか
4. `arr[99]` の戻り値の型は何か
5. `const` されたオブジェクトのフィールドは書き換えられるか

→ 次章 [TypeScript 型システム編](./02-typescript-for-java-devs.md)
