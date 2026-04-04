-- NBA の試合日付（ET基準、YYYY-MM-DD）を保存するカラムを追加
-- scheduled_at（UTC実時刻）とは別に、日付ナビゲーション用に使用する
alter table games add column game_date text;

create index games_game_date_idx on games(game_date);
