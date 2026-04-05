# HOOPMIN アーキテクチャ図

## システム全体図

```mermaid
graph TD
  subgraph Client["クライアント (Browser / PWA)"]
    A["/games 試合一覧"]
    B["/games/[id] 試合詳細"]
    C["/profile マイページ"]
    D["/ranking ランキング"]
  end

  subgraph Vercel["Next.js / Vercel (バックエンド)"]
    E["Server Components\nAPI Routes"]
    F["/api/cron/*\n定期処理"]
  end

  subgraph Supabase["Supabase"]
    G["Auth\nメール認証・セッション管理"]
    H["PostgreSQL\nprofiles / games / comments / predictions"]
    I["Realtime\nコメントのリアルタイム配信"]
  end

  J["balldontlie API\nNBA試合データ・スコア"]
  K["LiveKit Cloud\n音声通話 SFU\n最大5人/ルーム"]
  L["cron-job.org\n5分毎・1時間毎に実行"]

  A & B & C & D -->|HTTP / RSC| E
  E -->|認証確認・データ取得| Supabase
  B -->|WebRTC 音声| K
  E -->|JWT発行| K
  L -->|HTTP trigger| F
  F -->|試合データ同期| H
  F -->|ポイント精算| H
  J -->|スコア・スケジュール取得| F
  I -->|WebSocket| B
```

## データフロー図

```mermaid
sequenceDiagram
  participant U as ユーザー
  participant FE as Next.js (Vercel)
  participant SB as Supabase
  participant BDL as balldontlie API
  participant LK as LiveKit Cloud

  Note over FE,BDL: 試合データ同期 (5分毎)
  FE->>BDL: GET /games (live)
  BDL-->>FE: 試合・スコアデータ
  FE->>SB: games テーブル upsert

  Note over U,SB: ユーザー登録
  U->>FE: SignUp (email/pass/username)
  FE->>SB: auth.signUp()
  SB-->>SB: トリガー: profiles 自動作成

  Note over U,LK: 音声通話参加
  U->>FE: POST /api/voice/token
  FE->>LK: 参加人数確認 (上限5人)
  FE-->>U: JWT トークン
  U->>LK: WebRTC 接続

  Note over U,SB: コメント投稿
  U->>FE: POST /api/comments
  FE->>SB: INSERT into comments
  SB-->>U: Realtime で全員に配信
```

## 主要コンポーネント早見表

| 関心事 | 何を使っているか |
|---|---|
| **データソース（試合情報）** | balldontlie API（NBA公式スタッツ） |
| **認証** | Supabase Auth（メール＋パスワード） |
| **バックエンド** | Next.js API Routes（Vercel上のサーバーレス関数） |
| **DB** | Supabase PostgreSQL |
| **リアルタイム** | Supabase Realtime（WebSocket） |
| **音声通話** | LiveKit Cloud（WebRTC SFU） |
| **定期処理** | cron-job.org → Next.js API Routes |

---

## データフロー

### 試合データ同期
```
balldontlie API
  → /api/cron/sync-live (5分毎, cron-job.org)
  → Supabase games テーブル更新
  → revalidateTag('games') でキャッシュ破棄
  → 次のリクエストで最新データを表示
```

### ユーザー認証
```
SignUpForm
  → supabase.auth.signUp()
  → DBトリガー: handle_new_user() → profiles 自動作成
  → POST /api/profile (フォールバック)
  → /games にリダイレクト
```

### 予測・ポイント
```
ユーザーが予測投票
  → POST /api/predictions
  → オッズ計算 (チーム順位・点差・投票分布)
  → predictions テーブルに保存

試合終了
  → /api/cron/settle-predictions (1時間毎)
  → 正解者に points_earned を付与
  → profiles.points を加算
```

### 音声通話
```
ユーザーが「参加する」
  → POST /api/voice/token
  → LiveKit RoomService で参加人数確認 (上限5人)
  → JWT トークン発行
  → LiveKitRoom コンポーネントで接続
  → RoomAudioRenderer で音声再生
```

## 技術スタック

| レイヤー | 技術 | 用途 |
|---|---|---|
| フロントエンド | Next.js 16 (App Router) | UI・ルーティング |
| スタイル | Tailwind CSS | デザイン |
| 認証・DB | Supabase | Auth・PostgreSQL・Realtime |
| 音声通話 | LiveKit Cloud | WebRTC SFU |
| 外部データ | balldontlie API | NBA試合データ |
| デプロイ | Vercel | ホスティング |
| Cron | cron-job.org | 定期実行 |
| バリデーション | Zod | スキーマ検証 |

## コスト構造（現在）

| サービス | 無料枠 | 現在の使用量 |
|---|---|---|
| Vercel | 100GB帯域/月 | 極小 |
| Supabase | 500MB DB / 50,000 MAU | 極小 |
| LiveKit | 50,000分/月 | 極小 |
| balldontlie | 60req/分 | sync時のみ |
| cron-job.org | 無料 | 2ジョブ |

**現在のランニングコスト: $0/月**
