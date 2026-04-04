-- 試合中のクォーター・残り時間を保存
alter table games add column period integer not null default 0;
alter table games add column game_time text not null default '';
