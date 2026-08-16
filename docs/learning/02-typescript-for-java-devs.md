# 2. TypeScript 型システム編（Java経験者向け）

TypeScript は「JavaScript に型を後付けした言語」。
Java の型システムとは**目的も設計も違う**ので、そこを押さえる。

---

## 0. 最大の違い：型は実行時に消える

```ts
// これは .ts
const game: Game = { id: '...', homeTeam: 'Lakers', ... }
```
```js
// ビルド後の .js（型が完全に消える）
const game = { id: '...', homeTeam: 'Lakers', ... };
```

TypeScript の型は**コンパイル時のみのチェック**であり、
実行時には型情報が1バイトも残らない。

Javaのジェネリクスの型消去（type erasure）は「ジェネリック型引数だけ」消えるが、
**TSは型注釈のすべてが消える**。帰結：

| できないこと | Javaなら |
|---|---|
| `if (x instanceof Game)` で自作型を判定 | `instanceof` で可能 |
| リフレクションで型を読む | `Class<?>` で可能 |
| 型情報でDIコンテナを組む | Springがやっている |
| **外部から来たJSONが `Game` 型であることの保証** | Jacksonが検証してくれる |

最後の項目が決定的に重要で、これが**このプロジェクトで Zod が必須である理由**そのもの。

```ts
// ❌ これは「そう思い込んでいるだけ」。実行時には何も検証されていない
const body = await request.json() as PostCommentInput

// ✅ Zodで実行時に検証してから型を得る
const body: unknown = await request.json()
const result = PostCommentSchema.safeParse(body)
if (!result.success) return NextResponse.json(err(...), { status: 400 })
const { gameId, content } = result.data   // ここで初めて型が保証される
```
（`src/app/api/comments/route.ts` の実装そのまま）

> **原則**: 型注釈は「開発中の約束」。
> システム境界（HTTPリクエスト、DBの生の行、外部API）では**必ずZodで検証する**。

---

## 1. 構造的型付け（Structural Typing）

Javaは**名前的型付け（nominal typing）**：`implements` を宣言していなければ別の型。
TSは**構造的型付け**：**形が同じなら同じ型として扱われる**。

```ts
interface Point { x: number; y: number }

function draw(p: Point) {}

draw({ x: 1, y: 2 })    // ✅ Point と宣言していないが、形が合うのでOK
```

```java
// Java では不可能。implements Point が必要
```

このおかげでインタフェースを事前に切らなくてもよく、
CLAUDE.md の「過剰なクラス抽象化をしない」という方針が成立している。

```ts
// src/features/game/components/GameCard.tsx
interface GameCardProps {
  game: Game
  commentCount: number
  voiceCount?: number
}

export function GameCard({ game, commentCount, voiceCount = 0 }: GameCardProps) { ... }
```
呼び出し側は `GameCardProps` を import すらしない。形が合っていれば通る：
```tsx
<GameCard game={game} commentCount={commentCounts[game.id] ?? 0} voiceCount={...} />
```

### 余剰プロパティチェック（例外ルール）

構造的型付けは「多い分にはOK」が基本だが、**オブジェクトリテラルを直接渡すときだけ**厳しくなる。

```ts
draw({ x: 1, y: 2, z: 3 })          // ❌ エラー：z は Point に無い
const p = { x: 1, y: 2, z: 3 }
draw(p)                              // ✅ 変数経由なら通る
```

タイポを防ぐための特別ルール。理不尽に見えたらこれを思い出す。

---

## 2. `type` と `interface` の使い分け

このプロジェクトの規約（CLAUDE.md）：
> `interface` は拡張可能なオブジェクト形状に、`type` はユニオン・ユーティリティ型に

```ts
// interface：オブジェクトの形（Propsなど）
interface GameListProps {
  currentDate: string
  isToday: boolean
}

// type：ユニオン、エイリアス、z.infer の結果
export type Game = z.infer<typeof GameSchema>
export type GameStatus = 'scheduled' | 'live' | 'final'
export type ApiResponse<T> = { success: boolean; data?: T; error?: string }
```

Reactのpropsに `React.FC` を使わないのも規約。理由は型推論が素直で、`children` が勝手に生えないため。

```tsx
// ✅ このプロジェクトのスタイル
interface Props { gameId: string }
export function VoiceRoom({ gameId }: Props) {}

// ❌ 使わない
const VoiceRoom: React.FC<Props> = ({ gameId }) => {}
```

---

## 3. ユニオン型とリテラル型（Javaのenumの代替）

Javaで `enum` を使う場面の大半が、TSでは**文字列リテラルのユニオン**になる。

```ts
// src/features/game/schema.ts
export const GameStatusSchema = z.enum(['scheduled', 'live', 'final'])
export type GameStatus = z.infer<typeof GameStatusSchema>
// → type GameStatus = 'scheduled' | 'live' | 'final'
```

```java
public enum GameStatus { SCHEDULED, LIVE, FINAL }
```

比較すると：

| | Java enum | TSリテラルユニオン |
|---|---|---|
| 実行時の実体 | オブジェクト | ただの文字列 |
| DB/JSONとの相互変換 | 変換コードが要る | **そのまま入る** |
| メソッドを持てる | 持てる | 持てない（関数を別に書く） |
| 網羅性チェック | `switch` + `default` | `switch` で型レベルに検査できる |

### 網羅性チェック

実際の `src/features/game/components/GameStatusBadge.tsx` は早期returnで書かれているが、
`switch` にすると型の恩恵がより明確になる：

```tsx
function label(status: GameStatus): string {
  switch (status) {
    case 'scheduled': return '予定'
    case 'live':      return '試合中'
    case 'final':     return '終了'
  }
  // 全ケース網羅していれば、ここに到達しないとTSが理解し、
  // 戻り値の型エラーが出ない（noImplicitReturns が有効でも通る）
}
```
`GameStatus` に `'postponed'` を足すと、この関数が**即座にコンパイルエラーになる**。
Javaで `default: throw new IllegalStateException()` を書いて実行時まで気づかないのと対照的。

### ユニオンの絞り込み（narrowing）

TSは制御フローを解析して型を自動で狭める。これが `Optional` の代わりになる。

```ts
async function fetchGameById(id: string): Promise<Game | null> { ... }

const game = await getGameById(id)
// ここでの game の型は Game | null

if (!game) notFound()      // notFound() は never を返す（絶対に戻らない）

// ここから下では game の型が Game に確定している
console.log(game.homeTeam)  // ✅ ?. すら不要
```
（`src/app/games/[id]/page.tsx` の実際のパターン）

```java
// Java だと毎回チェックが必要
if (game == null) throw new NotFoundException();
game.getHomeTeam();  // コンパイラは「nullでない」ことを知らない
```

---

## 4. `any` / `unknown` / `never`

| 型 | 意味 | 使うか |
|---|---|---|
| `any` | 型チェックを放棄 | **禁止**（CLAUDE.md） |
| `unknown` | 「何か分からない値」。使う前に必ず絞り込みが要る | **外部入力に必ず使う** |
| `never` | 「絶対に値を持たない」 | 到達不能を表す |

```ts
// src/app/api/comments/route.ts
const body: unknown = await request.json()   // ✅ unknown で受ける
// body.gameId  ← これはコンパイルエラー。絞り込まないと触れない
const result = PostCommentSchema.safeParse(body)
```

`unknown` は Java の `Object` に似ているが、**`Object` よりずっと厳しい**
（`Object` は `toString()` などが呼べるが、`unknown` は何もできない）。

```ts
// src/types/api.ts
export function err(message: string): ApiResponse<never> { ... }
//                                                ↑ data が絶対に入らないことを型で表現
```

### `as` は最後の手段

```ts
// src/features/game/repository.ts
const game = parseGame(row as Record<string, unknown>)
```
`as` は「コンパイラを黙らせる」だけで、**実行時の保証はゼロ**。
ここでは直後に `GameSchema.safeParse()` が走るので安全、という設計になっている。
**`as` の直後に検証がない `as` は疑うべき。**

### `!`（非nullアサーション）

```ts
const today = d.toISOString().split('T')[0]!
const awayWins = hasScore && game.awayScore! > game.homeScore!
```
「絶対 `null`/`undefined` じゃない」と主張する記号。間違っていれば実行時に落ちる。
`hasScore` で確認済みの直後など、**根拠が同じ画面内にあるときだけ**使う。

---

## 5. strict設定を読む

`tsconfig.json` の設定は「どれくらい厳しくチェックするか」のダイヤル。
このプロジェクトは強めに設定されている。

```jsonc
{
  "strict": true,                    // 厳格モード一式（strictNullChecks 等を含む）
  "noUncheckedIndexedAccess": true,  // 配列/インデックスアクセスに undefined を足す
  "noImplicitReturns": true,         // 一部の分岐だけ return し忘れるとエラー
  "noFallthroughCasesInSwitch": true // switch の break 忘れをエラーに
}
```

### `strictNullChecks`（`strict` に含まれる）

これがJavaとの体感差を一番生む。

```ts
let name: string = null    // ❌ エラー。string に null は入らない
let name: string | null = null  // ✅ null を許すなら型に書く
```

つまり**すべての型がデフォルトで non-null**。
Javaで `@NonNull` アノテーションを全フィールドに付けた状態が標準になっている。
`Optional<T>` を使う必要がなく、`T | null` で足りる。

### `noUncheckedIndexedAccess`

前章で触れた「配列アクセスは `T | undefined`」を強制する設定。

```ts
const arr: string[] = ['a']
const x = arr[0]        // 型は string | undefined（この設定がなければ string）
```

やや面倒だが、`arr[0].toUpperCase()` による実行時クラッシュを防いでくれる。
だから repo のコードは `[0]?.message ?? 'default'` や `[0]!` の形になっている。

---

## 6. ジェネリクス

書き方はJavaとほぼ同じ。

```ts
// src/types/api.ts
export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: string
  meta?: { total: number; limit: number; offset: number }
}

export function ok<T>(data: T, meta?: ApiResponse<T>['meta']): ApiResponse<T> {
  return { success: true, data, meta }
}
```

```java
public record ApiResponse<T>(boolean success, T data, String error) {}
public static <T> ApiResponse<T> ok(T data) { ... }
```

### Java にない便利機能

**インデックスアクセス型**：他の型の一部を取り出せる。

```ts
ApiResponse<T>['meta']    // meta フィールドの型（{total,limit,offset} | undefined）
```
「metaの型」を別途 export しなくて済む。DRYに効く。

**`typeof` 型演算子**：値から型を取り出す。

```ts
export type Comment = z.infer<typeof CommentSchema>
//                                  ↑ 「値 CommentSchema の型」を取得
```

**ユーティリティ型**（標準で用意されている型変換）：

| 型 | 意味 |
|---|---|
| `Partial<T>` | 全フィールドをオプショナルに |
| `Required<T>` | 全フィールドを必須に |
| `Pick<T, 'a'\|'b'>` | 一部だけ抜き出す |
| `Omit<T, 'a'>` | 一部を除く |
| `Record<K, V>` | キーバリューのオブジェクト |
| `ReturnType<typeof f>` | 関数の戻り値の型 |

```ts
Record<string, number>              // src/features/game/components/GameList.tsx
Record<string, unknown>             // src/features/game/repository.ts
```

Javaで同じことをするには手でクラスを書く必要がある。TSでは型を「計算」できる。

---

## 7. Zod：型とバリデーションを1か所に書く

Zodは**スキーマを1つ書くと、バリデータと型の両方が手に入る**ライブラリ。

```ts
// src/features/comment/schema.ts
export const PostCommentSchema = z.object({
  gameId: z.string().uuid(),
  content: z.string()
    .min(1, 'コメントを入力してください')
    .max(200, '200文字以内で入力してください'),
})

export type PostCommentInput = z.infer<typeof PostCommentSchema>
// → { gameId: string; content: string }
```

Javaで同じことをすると2か所（クラス定義 + アノテーション）に分かれるが、Zodは1か所で済む。

```java
public record PostCommentInput(
    @NotNull UUID gameId,
    @NotBlank @Size(max = 200, message = "200文字以内で入力してください") String content
) {}
```

### `parse` と `safeParse`

```ts
Schema.parse(input)       // 失敗すると例外を投げる
Schema.safeParse(input)   // { success: true, data } | { success: false, error } を返す
```

**このリポジトリは一貫して `safeParse`**。例外に頼らないスタイル（→ 前章の「例外を投げない」節）。

```ts
// 失敗を「値」として扱う3パターン

// ① APIでは400を返す
const result = PostCommentSchema.safeParse(body)
if (!result.success) {
  return NextResponse.json(err(result.error.issues[0]?.message ?? '...'), { status: 400 })
}

// ② DBの行パースでは null にして呼び出し側で捨てる
function parseGame(row: Record<string, unknown>): Game | null {
  const result = GameSchema.safeParse({ ... })
  return result.success ? result.data : null
}

// ③ Realtimeイベントでは無視する
if (result.success) {
  setComments((prev) => [...prev, result.data])
}
```

### snake_case ↔ camelCase の変換場所

Supabase（PostgreSQL）は `home_team`、TSは `homeTeam`。**この変換はrepositoryのパース関数で行う**。

```ts
// src/features/game/repository.ts
const result = GameSchema.safeParse({
  id: row.id,
  externalId: row.external_id,      // ← ここで変換
  homeTeam: row.home_team,
  homeScore: row.home_score,
  period: row.period ?? 0,           // ← DBのNULLにデフォルトを当てる
  gameTime: row.game_time ?? '',
})
```

Javaの `@JsonProperty("home_team")` に相当する処理を手書きしている形。
**この1か所を通る限り、アプリ内部ではcamelCaseだけを意識すればよい**という設計。

### よく使うZod API

```ts
z.string().uuid()                  // UUID形式
z.string().email('メッセージ')       // メール形式 + カスタムメッセージ
z.string().min(1).max(200)
z.string().regex(/^[a-zA-Z0-9_]+$/, 'メッセージ')
z.number().int()                   // 整数
z.number().nullable()              // number | null （DBのNULL）
z.object({...}).optional()         // フィールド自体が無くてもよい
z.enum(['home', 'away'])           // リテラルユニオン
z.number().int().default(0)        // 無ければ0を入れる
```

**`nullable()` と `optional()` の違い**（前章の null/undefined に対応）：

```ts
z.string().nullable()   // string | null       … 値はあるが空（DBのNULL）
z.string().optional()   // string | undefined  … キー自体が無いかもしれない
```

```ts
// src/features/comment/schema.ts — 両方が出てくる好例
profile: z.object({
  avatarUrl: z.string().nullable(),   // プロフィールはあるがアバター未設定
}).optional(),                        // そもそもプロフィールが取れなかった
```

---

## 8. 型を書く場所・書かない場所

CLAUDE.md の規約：
> エクスポートされる関数には引数・戻り値の型を明示

```ts
// ✅ export する関数：型を明示（APIの契約になるため）
export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions
): { allowed: boolean; remaining: number } { ... }

// ✅ ローカル変数：推論に任せる（冗長な注釈は書かない）
const now = Date.now()                    // number と推論される
const liveGames = games.filter(...)       // Game[] と推論される

// ❌ 冗長
const now: number = Date.now()
```

Javaの `var` を「ローカルだけ使う」のと同じ感覚でよい。

---

## 章末チェック

1. なぜ `as PostCommentInput` ではなく Zod の `safeParse` を使うのか
2. `unknown` と `any` の違い。なぜ `any` が禁止か
3. `z.string().nullable()` と `z.string().optional()` の使い分け
4. `GameStatus` に `'postponed'` を追加したら、どこがコンパイルエラーになるか（実際にやってみる）
5. `noUncheckedIndexedAccess` が有効だと `arr[0]` の型は何になるか

→ 次章 [React 編](./03-react-for-java-devs.md)
