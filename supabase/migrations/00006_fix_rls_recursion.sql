-- ============================================================
-- TheJapanLocalMedia: Fix RLS infinite recursion on profiles table
-- ============================================================
-- Problem: admin policies on profiles reference profiles itself,
-- causing infinite recursion. Fix: use a security definer function.

-- 1. Helper function (security definer bypasses RLS)
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  )
$$;

grant execute on function is_admin() to authenticated;

-- 2. Fix profiles admin policies
drop policy if exists "profiles_select_admin" on profiles;
drop policy if exists "profiles_update_admin" on profiles;

create policy "profiles_select_admin" on profiles
  for select using (is_admin());

create policy "profiles_update_admin" on profiles
  for update using (is_admin());

-- 3. Fix all other admin policies to use is_admin()
drop policy if exists "contents_all_admin" on contents;
create policy "contents_all_admin" on contents
  for all using (is_admin());

drop policy if exists "tags_manage_admin" on tags;
create policy "tags_manage_admin" on tags
  for all using (is_admin());

drop policy if exists "content_tags_manage_admin" on content_tags;
create policy "content_tags_manage_admin" on content_tags
  for all using (is_admin());

drop policy if exists "rewards_manage_admin" on rewards;
create policy "rewards_manage_admin" on rewards
  for all using (is_admin());

drop policy if exists "reward_claims_manage_admin" on reward_claims;
create policy "reward_claims_manage_admin" on reward_claims
  for all using (is_admin());

drop policy if exists "broadcasts_manage_admin" on broadcasts;
create policy "broadcasts_manage_admin" on broadcasts
  for all using (is_admin());
