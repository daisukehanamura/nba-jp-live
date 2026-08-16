# HOOPMIN 学習ガイド（Java経験者向け）

Java（Spring）の経験を土台に、**JavaScript / TypeScript / React / Next.js** を
このリポジトリの実コードを教材として学ぶためのガイド。

「一般的な入門書」ではなく、**HOOPMINのソースを読んで、いじって、理解する**ことを目的にしている。
すべてのコード例は `src/` に実在するファイルから引用している。

---

## 読む順番

| # | ドキュメント | 内容 | 目安 |
|---|---|---|---|
| 1 | [JavaScript 言語編](./01-javascript-for-java-devs.md) | 値・型・関数・非同期。Javaとの思想の違い | 3〜4h |
| 2 | [TypeScript 型システム編](./02-typescript-for-java-devs.md) | 構造的型付け、ユニオン型、Zodとの関係 | 2〜3h |
| 3 | [React 編](./03-react-for-java-devs.md) | 宣言的UI、state、フック、再レンダリング | 4〜5h |
| 4 | [Next.js App Router 編](./04-nextjs-app-router.md) | Server/Client Component、キャッシュ、ルーティング | 4〜5h |
| 5 | [演習課題](./05-exercises.md) | 実際に手を動かす課題（易→難） | 随時 |
| 6 | [つまずきポイント集](./06-pitfalls.md) | Java脳で書くとハマる罠のカタログ | 逆引き |

アーキテクチャ全体像（Supabase / RLS / Realtime / Vercel）は
既存の [`../architecture-guide.md`](../architecture-guide.md) が担当する。
このガイドは**言語とフレームワークそのもの**にフォーカスする。

---

## 学習の進め方（推奨）

### ステップ1: 動かす
```bash
npm install
npm run dev      # http://localhost:3000
npm run test     # Vitest（schemaのユニットテスト）
npm run lint
```

### ステップ2: 1本の線を追う
最初にやるべきは「文法の暗記」ではなく、**1つのリクエストがどう流れるかを追う**こと。

```
ブラウザで /games を開く
  └→ src/middleware.ts            … 全リクエストの前処理（Filterに相当）
      └→ src/app/games/page.tsx    … ページのシェルを即返す
          └→ src/features/game/components/GameList.tsx  … データ取得（Suspenseの内側）
              └→ src/features/game/repository.ts        … Supabaseへクエリ
                  └→ src/features/game/schema.ts        … Zodで検証して型を確定
                      └→ GameCard.tsx                   … 1試合ぶんのHTMLを生成
```

この7ファイルを上から順に読むだけで、Next.jsの主要概念のほぼ全部に触れられる。

### ステップ3: 壊して直す
[演習課題](./05-exercises.md) を上から順にやる。
読むだけでは `'use client'` の意味は身につかない。**わざと外してエラーを見る**のが一番速い。

---

## Java との対応表（早見）

| Java / Spring | HOOPMIN | 補足 |
|---|---|---|
| `mvn` / `gradle` | `npm` | `package.json` が `pom.xml` 相当 |
| `pom.xml` の dependencies | `package.json` の `dependencies` | |
| `mvn install` | `npm install` | `package-lock.json` = 依存の固定 |
| クラス | 関数（コンポーネント / repository関数） | クラスはほぼ使わない |
| `@Controller` + Thymeleaf | Server Component (`page.tsx`) | HTMLをサーバーで組む |
| `@RestController` | Route Handler (`route.ts`) | JSONを返す |
| `@Repository` / JPA | `repository.ts` | 関数ベース |
| `@Entity` / DTO | Zodスキーマ + `z.infer` の型 | 型は実行時に消える |
| `javax.validation` | Zod | `safeParse` = `BindingResult` 的 |
| `Filter` / `Interceptor` | `src/middleware.ts` | |
| `@PreAuthorize` | Supabase RLS（SQLのポリシー） | DB側で効く |
| JUnit + Mockito | Vitest | `*.test.ts` |
| `Optional<T>` | `T \| null` / `T \| undefined` | 言語機能として組み込み |
| `Stream` API | 配列メソッド（`map` / `filter` / `reduce`） | 遅延評価ではない |
| `CompletableFuture` | `Promise` | `async` / `await` |
| `synchronized` / スレッド | **存在しない**（シングルスレッド） | 最重要の差 |

---

## このリポジトリを教材にする利点

- **実運用中のコード**なので、教科書的な理想形ではなく現実のトレードオフが入っている
  （例: `src/utils/rate-limit.ts` はインメモリ実装で、コメントに「本番スケールではKVへ」と明記されている）
- Java的な設計（Repository層、DTO、バリデーション）が意識的に残されているため、対応づけて読める
- CLAUDE.md にコーディング規約が明文化されている（ファイル200〜400行、`any` 禁止、N+1禁止 など）

---

## 参照した実ファイル一覧

このガイドで教材として使う主要ファイル：

```
src/middleware.ts                                  … 認証ガード
src/app/layout.tsx                                 … ルートレイアウト
src/app/games/page.tsx                             … Server Component + Suspense
src/app/games/[id]/page.tsx                        … 動的ルート + 並列fetch
src/app/api/comments/route.ts                      … Route Handler
src/features/game/repository.ts                    … unstable_cache
src/features/game/schema.ts                        … Zod
src/features/game/components/GameList.tsx          … async Server Component
src/features/game/components/GameCard.tsx          … 純粋な表示コンポーネント
src/features/game/components/LiveRefresh.tsx       … 副作用だけのClient Component
src/features/comment/hooks/useComments.ts          … カスタムフック
src/features/comment/components/CommentSection.tsx … 楽観的更新
src/features/prediction/components/PredictionPanel.tsx … fetch + state
src/lib/supabase/{client,server,admin}.ts          … 3種のクライアント
src/utils/rate-limit.ts                            … Mapとクロージャ
src/types/api.ts                                   … ジェネリクス
```
