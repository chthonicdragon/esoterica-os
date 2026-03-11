-- Covens system tables
-- Run this in your Supabase SQL editor to set up the Covens feature

-- 1. Covens table
create table if not exists covens (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  leader_id uuid not null,
  leader_name text not null,
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. Coven members table
create table if not exists coven_members (
  id uuid primary key default gen_random_uuid(),
  coven_id uuid not null references covens(id) on delete cascade,
  user_id uuid not null,
  display_name text not null,
  role text not null default 'member' check (role in ('leader', 'member')),
  joined_at timestamptz not null default now(),
  unique(coven_id, user_id)
);

-- 3. Join requests table
create table if not exists coven_join_requests (
  id uuid primary key default gen_random_uuid(),
  coven_id uuid not null references covens(id) on delete cascade,
  user_id uuid not null,
  display_name text not null,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  requested_at timestamptz not null default now(),
  unique(coven_id, user_id)
);

-- Row Level Security (RLS)
alter table covens enable row level security;
alter table coven_members enable row level security;
alter table coven_join_requests enable row level security;

-- Covens policies
create policy "Public covens are viewable by all authenticated users"
  on covens for select
  using (is_public = true or leader_id = auth.uid());

create policy "Authenticated users can create covens"
  on covens for insert
  with check (auth.uid() = leader_id);

create policy "Leaders can update their covens"
  on covens for update
  using (auth.uid() = leader_id);

create policy "Leaders can delete their covens"
  on covens for delete
  using (auth.uid() = leader_id);

-- Members policies
create policy "Members are viewable by coven members and leaders"
  on coven_members for select
  using (
    user_id = auth.uid()
    or coven_id in (select id from covens where leader_id = auth.uid())
    or coven_id in (select coven_id from coven_members where user_id = auth.uid())
  );

create policy "Leaders can insert members"
  on coven_members for insert
  with check (
    coven_id in (select id from covens where leader_id = auth.uid())
    or user_id = auth.uid()
  );

create policy "Leaders can delete members"
  on coven_members for delete
  using (
    coven_id in (select id from covens where leader_id = auth.uid())
    or user_id = auth.uid()
  );

-- Join requests policies
create policy "Users can see their own requests; leaders can see requests to their covens"
  on coven_join_requests for select
  using (
    user_id = auth.uid()
    or coven_id in (select id from covens where leader_id = auth.uid())
  );

create policy "Authenticated users can submit join requests"
  on coven_join_requests for insert
  with check (auth.uid() = user_id);

create policy "Leaders can update request status"
  on coven_join_requests for update
  using (coven_id in (select id from covens where leader_id = auth.uid()));

create policy "Users can delete their own pending requests"
  on coven_join_requests for delete
  using (user_id = auth.uid());
