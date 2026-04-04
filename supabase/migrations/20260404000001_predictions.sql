-- 勝利予測テーブル
create table predictions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references games(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  predicted_winner text not null check (predicted_winner in ('home', 'away')),
  created_at timestamptz not null default now(),
  unique(game_id, user_id)
);

create index predictions_game_id_idx on predictions(game_id);

-- RLS
alter table predictions enable row level security;

create policy "anyone can read predictions"
  on predictions for select using (true);

create policy "authenticated users can insert own predictions"
  on predictions for insert
  with check (auth.uid() = user_id);
