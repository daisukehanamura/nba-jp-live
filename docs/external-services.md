# 外部サービス連携まとめ

## 1. Vercel（ホスティング）

- **役割**: Next.jsアプリのホスティング・デプロイ
- **プラン**: Hobby（無料）
- **URL**: `https://your-app.vercel.app`
- **制約**: Cronは1日1回まで（`0 6 * * *`のみ使用）
- **設定場所**: `vercel.json` / Vercel Dashboard > Settings > Environment Variables

---

## 2. Supabase（DB・認証・リアルタイム）

- **役割**: PostgreSQL DB / ユーザー認証 / コメントのリアルタイム配信
- **プラン**: Free（無料）
- **制約**: 500MB DB / 月50,000 MAU / 2プロジェクトまで
- **使っている機能**:
  - **Database**: games / comments / profiles / predictions / point_logs テーブル
  - **Auth**: メール+パスワード認証・セッション管理
  - **Realtime**: コメントのリアルタイム購読（`postgres_changes`）
  - **Row Level Security**: 全テーブルにRLSポリシーを設定
- **関連ファイル**: `src/lib/supabase/`
- **環境変数**:
  ```
  NEXT_PUBLIC_SUPABASE_URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  ```

---

## 3. balldontlie API（NBAデータ）

- **役割**: NBA試合データの取得（スケジュール・スコア・試合状況）
- **URL**: `https://api.balldontlie.io/v1`
- **プラン**: Free（無料）
- **制約**: レートリミットあり（429エラーが出たら1秒スリープして再試行）
- **取得データ**:
  - `date`: NBA日付（ET基準）
  - `datetime` / `status`: 試合開始時刻（UTC ISO文字列）
  - `home_team_score` / `visitor_team_score`: スコア
  - `period`: クォーター（0=未開始, 1-4, 5+=OT）
  - `time`: 残り時間（"5:23" / "Halftime"）
- **関連ファイル**: `src/lib/balldontlie/client.ts`, `src/features/game/sync.ts`
- **環境変数**:
  ```
  BALLDONTLIE_API_KEY
  ```

---

## 4. ESPN CDN（チームロゴ画像）

- **役割**: NBAチームのロゴ画像配信
- **URL**: `https://a.espncdn.com/i/teamlogos/nba/500/{abbrev}.png`
- **プラン**: 無料（公開CDN）
- **APIキー不要**
- **関連ファイル**: `src/utils/nba-teams.ts`, `next.config.ts`（remotePatterns設定）

---

## 5. cron-job.org（定期実行）

- **役割**: Vercel Hobbyプランでは使えない高頻度Cronの代替
- **プラン**: 無料
- **設定するジョブ**:

  | ジョブ名 | エンドポイント | スケジュール | 用途 |
  |---|---|---|---|
  | sync-live | `/api/cron/sync-live` | `*/5 * * * *` | ライブスコア更新 |
  | settle-predictions | `/api/cron/settle-predictions` | `0 * * * *` | 予測ポイント精算 |

- **認証ヘッダー設定**（必須）:
  ```
  Authorization: Bearer {CRON_SECRET}
  ```
- **設定場所**: https://cron-job.org

---

## 6. Vercel Cron（毎朝の全体同期）

- **役割**: 2週間分の試合スケジュールを毎日同期
- **スケジュール**: `0 6 * * *`（UTC 6:00 = JST 15:00）
- **エンドポイント**: `/api/cron/sync-games`
- **設定場所**: `vercel.json`

---

## データフロー図

```
balldontlie API
    │
    ├─ /api/cron/sync-games（毎朝 Vercel Cron）
    │       └─ 2週間分のスケジュール同期
    │
    └─ /api/cron/sync-live（5分ごと cron-job.org）
            └─ 今日・昨日のスコアをリアルタイム更新
                        │
                        ▼
                  Supabase DB
                        │
          ┌─────────────┼──────────────┐
          │             │              │
     ブラウザ       Realtime        Vercel
    (Next.js)    (コメント配信)   (SSR/ISR)
          │
    cron-job.org
    settle-predictions（毎時）
          └─ 試合終了後にポイント付与
```

---

## 環境変数一覧

`.env.local` に設定が必要な変数：

| 変数名 | 取得元 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API |
| `BALLDONTLIE_API_KEY` | balldontlie.io > Dashboard |
| `CRON_SECRET` | 自分で生成（任意の文字列） |
