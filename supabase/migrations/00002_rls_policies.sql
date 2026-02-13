-- ============================================================
-- TheJapanLocalMedia: Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table invite_codes enable row level security;
alter table invite_slots enable row level security;
alter table slot_unlock_conditions enable row level security;
alter table referrals enable row level security;
alter table contents enable row level security;
alter table tags enable row level security;
alter table content_tags enable row level security;
alter table content_interactions enable row level security;
alter table rewards enable row level security;
alter table reward_claims enable row level security;
alter table broadcasts enable row level security;
alter table notification_preferences enable row level security;
alter table login_history enable row level security;

-- ────────────── profiles ──────────────

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id);

create policy "profiles_select_admin" on profiles
  for select using (
    is_admin()
  );

create policy "profiles_update_admin" on profiles
  for update using (
    is_admin()
  );

-- ────────────── invite_codes ──────────────

create policy "invite_codes_select_own" on invite_codes
  for select using (created_by = auth.uid());

create policy "invite_codes_insert_own" on invite_codes
  for insert with check (created_by = auth.uid());

-- ────────────── invite_slots ──────────────

create policy "invite_slots_select_own" on invite_slots
  for select using (user_id = auth.uid());

create policy "invite_slots_update_own" on invite_slots
  for update using (user_id = auth.uid());

-- ────────────── slot_unlock_conditions ──────────────

create policy "slot_unlock_select_own" on slot_unlock_conditions
  for select using (user_id = auth.uid());

create policy "slot_unlock_update_own" on slot_unlock_conditions
  for update using (user_id = auth.uid());

-- ────────────── referrals ──────────────

create policy "referrals_select_own" on referrals
  for select using (referrer_id = auth.uid());

create policy "referrals_insert" on referrals
  for insert with check (true);  -- trackClick は匿名を含む

-- ────────────── contents ──────────────

create policy "contents_select_published" on contents
  for select using (
    status = 'published'
    and (
      premium = false
      or required_rank <= (select rank from profiles where id = auth.uid())
    )
  );

create policy "contents_all_admin" on contents
  for all using (
    is_admin()
  );

-- ────────────── tags ──────────────

create policy "tags_select_all" on tags
  for select using (true);

create policy "tags_manage_admin" on tags
  for all using (
    is_admin()
  );

-- ────────────── content_tags ──────────────

create policy "content_tags_select_all" on content_tags
  for select using (true);

create policy "content_tags_manage_admin" on content_tags
  for all using (
    is_admin()
  );

-- ────────────── content_interactions ──────────────

create policy "interactions_own" on content_interactions
  for all using (user_id = auth.uid());

-- ────────────── rewards ──────────────

create policy "rewards_select_all" on rewards
  for select using (true);

create policy "rewards_manage_admin" on rewards
  for all using (
    is_admin()
  );

-- ────────────── reward_claims ──────────────

create policy "reward_claims_select_own" on reward_claims
  for select using (user_id = auth.uid());

create policy "reward_claims_insert_own" on reward_claims
  for insert with check (user_id = auth.uid());

create policy "reward_claims_manage_admin" on reward_claims
  for all using (
    is_admin()
  );

-- ────────────── broadcasts ──────────────

create policy "broadcasts_select_all" on broadcasts
  for select using (true);

create policy "broadcasts_manage_admin" on broadcasts
  for all using (
    is_admin()
  );

-- ────────────── notification_preferences ──────────────

create policy "notification_prefs_own" on notification_preferences
  for all using (user_id = auth.uid());

-- ────────────── login_history ──────────────

create policy "login_history_select_own" on login_history
  for select using (user_id = auth.uid());

create policy "login_history_insert" on login_history
  for insert with check (user_id = auth.uid());
