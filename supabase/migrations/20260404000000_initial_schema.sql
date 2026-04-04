-- ============================================================
-- courtside-jp: Initial Schema
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

create type game_status as enum ('scheduled', 'live', 'final');
create type quote_source as enum ('x', 'reddit');

-- ============================================================
-- profiles
-- Supabase Auth の auth.users と 1:1 で紐付く
-- ============================================================

create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text not null unique,
  display_name text not null,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table profiles is 'ユーザープロフィール（auth.users と 1:1）';

-- ============================================================
-- games
-- NBA 試合情報。外部データソース（NBA API）から同期する
-- ============================================================

create table games (
  id          uuid primary key default gen_random_uuid(),
  external_id text not null unique,   -- NBA API の試合ID
  home_team   text not null,
  away_team   text not null,
  home_score  int,
  away_score  int,
  status      game_status not null default 'scheduled',
  scheduled_at timestamptz not null,
  started_at  timestamptz,
  ended_at    timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table games is 'NBA試合情報';
comment on column games.external_id is 'NBA API の試合ID';

-- ============================================================
-- comments
-- ユーザーによるリアルタイムコメント
-- ============================================================

create table comments (
  id          uuid primary key default gen_random_uuid(),
  game_id     uuid not null references games(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 200),
  created_at  timestamptz not null default now()
);

comment on table comments is 'リアルタイムコメント';
comment on column comments.content is '最大200文字';

-- ============================================================
-- quote_cards
-- X（旧Twitter）や Reddit の引用カード
-- ============================================================

create table quote_cards (
  id            uuid primary key default gen_random_uuid(),
  game_id       uuid not null references games(id) on delete cascade,
  source        quote_source not null,
  external_id   text not null,             -- ツイートID または Reddit投稿ID
  author_name   text not null,
  author_handle text not null,
  content       text not null,
  url           text not null,
  published_at  timestamptz not null,
  created_at    timestamptz not null default now(),
  unique (source, external_id)             -- 同じ投稿の重複挿入を防ぐ
);

comment on table quote_cards is 'X/Reddit の引用カード';

-- ============================================================
-- INDEXES
-- ============================================================

-- コメントは game_id + 時系列で取得することが多い
create index idx_comments_game_id_created_at on comments(game_id, created_at desc);

-- quote_cards も同様
create index idx_quote_cards_game_id_published_at on quote_cards(game_id, published_at desc);

-- 試合一覧は status + scheduled_at で絞り込む
create index idx_games_status_scheduled_at on games(status, scheduled_at desc);

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_games_updated_at
  before update on games
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles   enable row level security;
alter table games      enable row level security;
alter table comments   enable row level security;
alter table quote_cards enable row level security;

-- profiles
create policy "profiles_select_all"
  on profiles for select using (true);

create policy "profiles_insert_own"
  on profiles for insert with check (auth.uid() = id);

create policy "profiles_update_own"
  on profiles for update using (auth.uid() = id);

-- games（誰でも読める、書き込みはサービスロールのみ）
create policy "games_select_all"
  on games for select using (true);

-- comments
create policy "comments_select_all"
  on comments for select using (true);

create policy "comments_insert_authenticated"
  on comments for insert
  with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "comments_delete_own"
  on comments for delete using (auth.uid() = user_id);

-- quote_cards（誰でも読める、書き込みはサービスロールのみ）
create policy "quote_cards_select_all"
  on quote_cards for select using (true);
