# 5. 演習課題

読むだけでは身につかない部分を、**実際にこのリポジトリを壊して直す**ことで覚える。

```bash
npm run dev     # http://localhost:3000
npm run test    # Vitest
npm run lint    # ESLint
```

> 作業前に必ずブランチを切る。すべての課題は「終わったら元に戻す（または捨てる）」前提。
> ```bash
> git switch -c study/exercise-01
> ```

---

## Lv.0 「壊して観察する」課題

**答えを出すことより、エラーメッセージを読むことが目的。**

### 0-1. `'use client'` を外す

`src/features/comment/components/CommentSection.tsx` の1行目 `'use client'` を削除して `npm run dev`。

- どんなエラーが出るか、メッセージを最後まで読む
- 次に `src/features/game/components/GameCard.tsx` に `'use client'` を **追加** してみる。
  エラーにはならないはずだが、何が変わったか考える（ヒント：ブラウザに送られるJSの量）

**確認したいこと**：`'use client'` は「機能を有効にする」のではなく「境界を宣言する」ものだと体感する。

### 0-2. `key` を壊す

`src/features/comment/components/CommentFeed.tsx` の
`{displayed.map((comment) => <CommentItem key={comment.id} ... />)}` を
`key={Math.random()}` に変える。

- コメントを投稿したときの挙動を観察する
- ブラウザの開発者ツールでDOMを見ながらやると分かりやすい

### 0-3. 不変性を破る

`src/features/comment/hooks/useComments.ts` の `addOptimistic` を書き換える。

```ts
// Before
function addOptimistic(comment: Comment) {
  setComments((prev) => [...prev, comment])
}

// After（わざと壊す）
function addOptimistic(comment: Comment) {
  comments.push(comment)
  setComments(comments)
}
```

- コメントを投稿しても画面に出ないことを確認する
- **なぜ出ないのか**を [React編](./03-react-for-java-devs.md) の「不変更新が必須である理由」で説明できるか

### 0-4. `await` を消す

`src/app/games/[id]/page.tsx` の `const { id } = await params` から `await` を消す。
TypeScriptがどう怒るか読む。

---

## Lv.1 小さな変更（1ファイル完結）

### 1-1. スタンプを追加する

`src/features/comment/components/CommentSection.tsx` の `STAMPS` 配列に
好きな絵文字スタンプを2つ追加する。

- **狙い**：配列リテラルとJSXの `map` の関係を掴む
- **発展**：`STAMPS` を `src/features/comment/` 直下の別ファイルに切り出して import する

### 1-2. コメント上限を変える

コメントの最大文字数を 200 → 140 にする。**変更すべき箇所をすべて見つけること。**

<details>
<summary>ヒント（自分で探してから開く）</summary>

`grep -rn "200" src/features/comment/` から始める。
スキーマ、入力欄の `maxLength`、エラーメッセージ、テストの4か所に散っている。
「1か所に定数化すべきでは？」と思ったらそれが正解。定数に切り出してみる。
</details>

- **狙い**：Zodスキーマ・UI・テストの三点が対応していることを確認する
- 変更後に `npm run test` が落ちることを確認し、テストも直す

### 1-3. 表示ロジックを足す

`src/features/game/components/GameStatusBadge.tsx` の `getLiveLabel` を読み、
**第4クォーター残り2分以内なら `'CLUTCH'` と表示する**ように変更する。

```ts
function getLiveLabel(period: number, gameTime: string): string {
  if (gameTime === 'Halftime' || gameTime === 'HT') return 'HT'
  if (period >= 5) return `OT`
  if (period >= 1) return `Q${period}`
  return 'LIVE'
}
```

- `gameTime` の実際の値の形式を `src/features/game/sync.ts` で確認すること
  （外部APIから来る値なので、憶測で実装しない）
- **狙い**：純粋関数の変更 + 実データの確認

### 1-4. ユニットテストを書く

`src/features/prediction/schema.ts` の `calcOdds` にテストを書く。
`src/features/prediction/schema.test.ts` を新規作成する。

```ts
import { describe, it, expect } from 'vitest'
import { calcOdds } from './schema'

describe('calcOdds', () => {
  it('全員が同じチームを選んだら最低オッズ1.1になる', () => {
    expect(calcOdds(10, 10)).toBe(1.1)
  })
  // 以下を自分で書く：
  // - 少数派を選ぶとオッズが上がること
  // - 上限10.0を超えないこと
  // - 小数第1位に丸められること
})
```

- 既存の `src/features/game/schema.test.ts` の書き方に合わせる
- `npm run test` で通ることを確認
- **狙い**：JUnitとの対応（`describe` = テストクラス、`it` = `@Test`、`expect().toBe()` = `assertEquals`）

---

## Lv.2 複数ファイルにまたがる変更

### 2-1. コメント数バッジのキャッシュ時間を変える

`getCommentCounts` の `revalidate: 60` を `5` にして、挙動の違いを観察する。

- 別ブラウザ（またはシークレットウィンドウ）でコメントを投稿し、
  一覧のバッジが更新されるまでの時間を測る
- 元に戻したうえで、**なぜ60秒が選ばれているのか**を自分の言葉で説明する
- **狙い**：キャッシュがトレードオフであることを体感する

### 2-2. 「今日の試合数」を表示する

`/games` ページの `<h1>NBA 試合</h1>` の横に、その日の試合数を出す。

- どのコンポーネントが `games` を持っているか探す（`GameList.tsx`）
- `page.tsx` では `games` を持っていないことに気づくはず。**どう解決するか2案考える**
  1. `GameList` の中で見出しごと描く
  2. `page.tsx` でも取得する（`unstable_cache` のおかげで追加コストはほぼゼロ）
- **狙い**：Suspense境界とデータの所在の関係を理解する

<details>
<summary>設計上の答え</summary>

案1が素直。`page.tsx` に持ち上げると `<Suspense>` の外側でawaitすることになり、
**シェルの即時表示という設計意図が壊れる**（データが揃うまでh1すら出せなくなる）。
Suspenseの外はデータを待たない、が原則。
</details>

### 2-3. プロフィールにひとこと欄を追加する（フルスタック課題）

これが総合演習。DBからUIまで一周する。

1. `supabase/migrations/` に新しいマイグレーションを追加（`profiles` に `bio` カラム、200文字まで）
2. `src/features/auth/schema.ts` の `ProfileSchema` に `bio` を追加（`nullable()`）
3. `src/features/auth/repository.ts` のパース関数でsnake_case→camelCase変換を追加
4. `src/app/api/profile/route.ts` のバリデーションに `bio` を追加
5. `src/features/auth/components/ProfileEditForm.tsx` に入力欄を追加
6. `src/app/profile/page.tsx` で表示

- **狙い**：CLAUDE.mdの層構造（schema → repository → API → component）を体で覚える
- 既存の `displayName` がどう流れているかを grep で追うと、そのまま設計図になる
  ```bash
  grep -rn "displayName" src/ | grep -v node_modules
  ```

### 2-4. 「盛り上がっている試合」バッジ

コメント数が10件以上の試合カードに 🔥 バッジを出す。

- `GameCard.tsx` はすでに `commentCount` を受け取っている
- 閾値は定数として切り出す
- **発展**：`GameList.tsx` で「盛り上がり順」のセクションを追加してみる。
  ただし CLAUDE.md の「ループ内API呼び出し禁止」に抵触しない方法で

---

## Lv.3 設計を考える課題

コードを書く前に**まず文章で設計を書く**。実装は任意。

### 3-1. コメント削除機能

自分のコメントだけ削除できるようにする。設計として答えるべき問い：

1. どこで認可するか。middleware / Route Handler / RLS の**3層それぞれで何をすべきか**
2. 楽観的更新をするか。失敗したらどう戻すか
3. Realtime の DELETE イベントを購読する必要はあるか（`useComments.ts` は今 INSERT しか見ていない）
4. 削除済みコメントを他ユーザーの画面からどう消すか

<details>
<summary>考えるヒント</summary>

RLS で `auth.uid() = user_id` を条件にした delete ポリシーを書けば、
**仮にAPIの認可を書き忘れてもDBが守る**。これが多層防御。
`docs/architecture-guide.md` のRLSの節を参照。
</details>

### 3-2. レートリミットをKVに移す

`src/utils/rate-limit.ts` のコメントにある移行を設計する。

1. なぜインメモリでは不十分なのか（サーバーレスの何が問題か）を説明する
2. インタフェース（`checkRateLimit` のシグネチャ）を変えずに済むか。済まないなら何が変わるか
3. `async` になることで呼び出し側（`src/app/api/comments/route.ts`）はどう変わるか
4. KVが落ちたときの挙動をどうするか（fail open / fail closed）

### 3-3. 音声通話の参加人数取得を速くする

`GameList.tsx` は LiveKit の参加人数取得に `.catch()` を付けて失敗を握りつぶしている。

```ts
isToday
  ? getVoiceParticipantCounts(games.map((g) => g.id)).catch(() => ({}))
  : Promise.resolve({})
```

1. なぜ `isToday` のときだけ取得しているのか
2. `.catch()` が無いと何が起きるか（`Promise.all` の性質から説明する）
3. LiveKit が遅いとき、ページ全体を待たせないためにどんな手があるか
   （ヒント：`GameList` をさらに2つの Suspense 境界に分ける案を検討する）

---

## Lv.4 読解課題（コードを書かない）

### 4-1. リクエストを1本追う

「ユーザーが `/games/{id}` でコメントを投稿してから、
**別のユーザーの画面に表示されるまで**」に通過するファイルを、順番にすべて列挙する。

想定される要素：middleware / page.tsx / CommentSection / supabase client / RLS / Realtime / useComments。
**分岐（楽観的更新の経路と、Realtimeの経路）が2本あることに気づけるか**が肝。

### 4-2. キャッシュの寿命を説明する

`getGamesByDate` の結果が更新される経路は**2つ**ある。両方説明する。

<details>
<summary>答え</summary>

1. `revalidate: 30` による時間切れ
2. `src/app/api/cron/sync-live/route.ts` の `revalidateTag('games', 'default')` による明示的な破棄

後者があるおかげで、cronがスコアを更新した直後に新しい値が出る。
</details>

### 4-3. 型を追う

`Game` 型がどこで生まれ、どこで検証され、どこまで運ばれるかを図にする。

```
Supabase の games テーブル（snake_case, 型なし）
  → ??? 
  → GameCard の props（Game型）
```

`???` を埋める。

---

## 進め方の目安

| あなたの状態 | やる課題 |
|---|---|
| まだ何も分からない | Lv.0 全部 |
| 文法は読めるが書けない | Lv.1 全部 + Lv.4-1 |
| 1ファイルなら変更できる | Lv.2 |
| 機能追加ができる | Lv.3 + Lv.4 |

---

## 詰まったときのデバッグ手順

1. **エラーメッセージを最後まで読む**。Next.jsのエラーは長いが、
   だいたい最初の3行に「どのファイルの何が問題か」が書いてある
2. `npm run lint` を回す。フックのルール違反などはESLintが検出する
3. サーバー側の `console.log` は**ターミナル**に出る。クライアント側は**ブラウザのコンソール**に出る。
   出ないときは「実行場所を勘違いしている」可能性が高い（Server/Client境界の理解を確認する合図）
4. 型エラーはエディタ上で追う。`as` で黙らせるのは最後の手段
5. → [つまずきポイント集](./06-pitfalls.md) に典型的な症状と原因をまとめてある

> ⚠️ `console.log` は本番禁止（CLAUDE.md）。デバッグで入れたものは必ず消す。
