-- 開発用シードデータ
-- Supabase SQL Editor で実行する

insert into games (external_id, home_team, away_team, home_score, away_score, status, scheduled_at, started_at, ended_at)
values
  -- LIVE
  ('nba-2026-001', 'Lakers', 'Celtics', 98, 94, 'live',
   now() - interval '2 hours', now() - interval '2 hours', null),

  -- 予定
  ('nba-2026-002', 'Warriors', 'Bulls', null, null, 'scheduled',
   now() + interval '3 hours', null, null),

  ('nba-2026-003', 'Nets', 'Heat', null, null, 'scheduled',
   now() + interval '6 hours', null, null),

  -- 終了
  ('nba-2026-004', 'Suns', 'Nuggets', 112, 108, 'final',
   now() - interval '1 day', now() - interval '1 day', now() - interval '22 hours'),

  ('nba-2026-005', 'Bucks', 'Clippers', 105, 99, 'final',
   now() - interval '2 days', now() - interval '2 days', now() - interval '46 hours');
