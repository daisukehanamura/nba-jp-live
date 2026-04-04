# 実装計画

レビューしやすいようにマイルストーン単位で区切る。
各マイルストーン完了時にレビューを行い、OKが出たら次に進む。

---

## マイルストーン一覧

| # | 内容 | レビューポイント |
|---|---|---|
| M1 | Supabase基盤・認証 | ログイン/サインアップが動くか |
| M2 | 試合一覧・詳細画面 | 試合データが表示されるか |
| M3 | リアルタイムコメント | コメントが流れるか（コア体験） |
| M4 | 引用カード | X/Reddit引用が差し込まれるか |
| M5 | 仕上げ | エラー・レート制限・パフォーマンス |

---

## M1: Supabase基盤・認証

**目標**: ログイン/サインアップが動く状態にする

### タスク
- [ ] Supabaseクライアント設定（`src/lib/supabase/server.ts` / `client.ts`）
- [ ] 共通型定義（`src/types/api.ts` に ApiResponse 型）
- [ ] `auth` feature: schema.ts / repository.ts
- [ ] ログイン・サインアップページ（`src/app/auth/`）
- [ ] middleware でミドルウェアガード（未認証ユーザーをリダイレクト）
- [ ] auth のユニットテスト（schema バリデーション）

**レビュー観点**
- Supabase Authが正しく動くか
- RLSが効いているか（service_role キーがクライアントに漏れていないか）
- middleware のガードが正しく機能するか

---

## M2: 試合一覧・詳細画面

**目標**: 試合データを表示できる状態にする

### タスク
- [ ] `game` feature: schema.ts / types.ts / repository.ts
- [ ] 試合一覧ページ（`src/app/games/page.tsx`）
- [ ] 試合詳細ページ（`src/app/games/[id]/page.tsx`）
- [ ] `GameCard` コンポーネント（試合カード）
- [ ] `GameStatus` バッジ（scheduled / live / final）
- [ ] game repository のユニットテスト

**レビュー観点**
- データフェッチの責務がhooksに分離されているか
- schema.ts の型がDBスキーマと一致しているか
- コンポーネントがシンプルに保たれているか

---

## M3: リアルタイムコメント（コア体験）

**目標**: 試合ページでコメントがリアルタイムに流れる

### タスク
- [ ] `comment` feature: schema.ts / types.ts / repository.ts
- [ ] `useComments` フック（Supabase Realtime購読）
- [ ] コメント投稿フォーム（`CommentForm`）
- [ ] コメント表示（上から下に流れるUI `CommentFeed`）
- [ ] API Route: `POST /api/comments`（レートリミット付き）
- [ ] comment のユニットテスト（schema / repository）

**レビュー観点**
- リアルタイム購読の接続・切断が正しく管理されているか（メモリリーク）
- コメント投稿のレートリミットが機能しているか
- RLSで自分のコメントのみ削除できるか
- 200文字制限がフロント・サーバー両方で効いているか

---

## M4: 引用カード

**目標**: 試合中にX/Reddit引用がリアルタイムで差し込まれる

### タスク
- [ ] `src/lib/x-api/client.ts`（X API Bearerトークン認証）
- [ ] `src/lib/reddit/client.ts`（Reddit API）
- [ ] `quote-card` feature: schema.ts / types.ts / repository.ts
- [ ] `useQuoteCards` フック（Supabase Realtime購読）
- [ ] `QuoteCard` コンポーネント（X/Reddit引用カードUI）
- [ ] quote-card のユニットテスト

**レビュー観点**
- 外部APIのエラーハンドリングが適切か
- `(source, external_id)` のユニーク制約で重複挿入が防げているか
- 引用カードとコメントのフィードへの混在表示が自然か

---

## M5: 仕上げ

**目標**: 本番リリースできる品質にする

### タスク
- [ ] エラーバウンダリ・グローバルエラーハンドリング
- [ ] ローディング・スケルトンUI
- [ ] 全API Routeのレートリミット見直し
- [ ] Vercel連携・環境変数設定
- [ ] E2Eテスト（Playwright）: ログイン→コメント投稿フロー
- [ ] `docs/setup-log.md` 最終更新

**レビュー観点**
- エラーメッセージに内部情報が漏れていないか
- Vercel上で環境変数が正しく設定されているか
- E2Eテストが通るか

---

## 進め方のルール

- 1マイルストーン = 1PRを目安にする
- 各マイルストーン完了後にレビューしてからマージ・次へ進む
- テストを書いてから実装する（TDD）
- 迷ったら小さく作って動かす
