-- auth.users にユーザーが作成されたとき、自動的に profiles を作成するトリガー
create or replace function handle_new_user()
returns trigger as $$
declare
  base_username text;
  final_username text;
  suffix text;
begin
  base_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  -- username の UNIQUE 制約に備えて UUID の先頭4文字をサフィックスとして付与
  suffix := substr(replace(new.id::text, '-', ''), 1, 4);
  final_username := base_username || '_' || suffix;

  insert into profiles (id, username, display_name)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
