-- 1. Add avatarUrl column to userProfiles (if it doesn't exist)
alter table "userProfiles" add column if not exists "avatarUrl" text;

-- 2. Coven posts (board) table
create table if not exists coven_posts (
  id uuid primary key default gen_random_uuid(),
  coven_id uuid not null references covens(id) on delete cascade,
  user_id uuid not null,
  display_name text not null,
  avatar_url text,
  content text not null,
  created_at timestamptz not null default now()
);

alter table coven_posts enable row level security;

-- Members and leader can read posts
create policy "Coven members can read posts"
  on coven_posts for select
  using (
    coven_id in (
      select id from covens where is_public = true or leader_id = auth.uid()
    )
    or coven_id in (select coven_id from coven_members where user_id = auth.uid())
  );

-- Members can create posts
create policy "Coven members can create posts"
  on coven_posts for insert
  with check (
    auth.uid() = user_id
    and (
      coven_id in (select id from covens where leader_id = auth.uid())
      or coven_id in (select coven_id from coven_members where user_id = auth.uid())
    )
  );

-- Users can delete their own posts; leader can delete any
create policy "Authors and leaders can delete posts"
  on coven_posts for delete
  using (
    user_id = auth.uid()
    or coven_id in (select id from covens where leader_id = auth.uid())
  );

-- 3. Supabase Storage: Create 'avatars' bucket manually in the Supabase dashboard
-- Dashboard → Storage → New bucket → Name: "avatars" → Public: true
-- Then add this policy in SQL:
-- create policy "Users can upload their own avatar"
--   on storage.objects for insert
--   with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
-- create policy "Avatars are publicly readable"
--   on storage.objects for select
--   using (bucket_id = 'avatars');
-- create policy "Users can update their own avatar"
--   on storage.objects for update
--   using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
