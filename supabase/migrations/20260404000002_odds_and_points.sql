-- profilesにポイント追加
alter table profiles add column points integer not null default 0;

-- predictionsにオッズ・獲得ポイント追加
alter table predictions add column odds numeric(4,2) not null default 1.00;
alter table predictions add column points_earned integer; -- null = 未確定

-- gamesに精算済みフラグ追加
alter table games add column settled_at timestamptz;

-- ポイント履歴テーブル
create table point_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  game_id uuid references games(id) on delete cascade not null,
  prediction_id uuid references predictions(id) on delete cascade not null,
  points integer not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index point_logs_user_id_idx on point_logs(user_id);

alter table point_logs enable row level security;
create policy "users can read own point logs" on point_logs for select using (auth.uid() = user_id);

-- 試合精算関数（アトミックに実行）
create or replace function settle_game(p_game_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_winner text;
  r record;
  v_points integer;
begin
  -- 未精算のfinal試合のみ対象
  select
    case when home_score > away_score then 'home' else 'away' end
  into v_winner
  from games
  where id = p_game_id
    and status = 'final'
    and settled_at is null
    and home_score is not null
    and away_score is not null;

  if not found then return; end if;

  -- 正解者にポイント付与
  for r in
    select id, user_id, odds
    from predictions
    where game_id = p_game_id
      and predicted_winner = v_winner
      and points_earned is null
  loop
    v_points := floor(r.odds * 100)::integer;

    update predictions set points_earned = v_points where id = r.id;
    update profiles set points = points + v_points where id = r.user_id;

    insert into point_logs (user_id, game_id, prediction_id, points, description)
    values (r.user_id, p_game_id, r.id, v_points, '予測正解');
  end loop;

  -- 不正解は points_earned = 0 でマーク
  update predictions
  set points_earned = 0
  where game_id = p_game_id
    and predicted_winner != v_winner
    and points_earned is null;

  -- 精算完了
  update games set settled_at = now() where id = p_game_id;
end;
$$;
