-- ============================================================
-- TheJapanLocalMedia: Initial Schema Migration
-- ============================================================

-- 0. Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- 1. Custom Types
-- ============================================================
create type member_rank as enum ('standard', 'gold', 'platinum', 'diamond');
create type user_role as enum ('member', 'admin');
create type user_status as enum ('pending', 'active', 'suspended');
create type content_type as enum ('article', 'video', 'external');
create type content_status as enum ('draft', 'scheduled', 'published');
create type interaction_type as enum ('view', 'like', 'bookmark');
create type unlock_condition_type as enum (
  'content_views_3',
  'profile_completed',
  'first_share',
  'feedback_sent'
);

-- 2. Shared Functions
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 3. profiles
-- ============================================================
create table profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  member_id         text unique not null,
  display_name      text not null,
  email             text not null,
  phone             text,
  bio               text,
  location          text,
  company           text,
  position          text,
  avatar_url        text,
  rank              member_rank not null default 'standard',
  role              user_role not null default 'member',
  status            user_status not null default 'pending',
  screening_answer  text,
  invited_by        uuid references profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create or replace function generate_member_id()
returns trigger as $$
begin
  new.member_id := 'JK-' || lpad(
    (select coalesce(max(substring(member_id from 4)::int), 0) + 1
     from profiles)::text, 5, '0');
  return new;
end;
$$ language plpgsql;

create trigger trg_member_id
  before insert on profiles
  for each row execute function generate_member_id();

create trigger trg_profiles_updated
  before update on profiles
  for each row execute function update_updated_at();

-- 4. invite_codes
-- ============================================================
create table invite_codes (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  created_by  uuid not null references profiles(id),
  used_by     uuid references profiles(id),
  is_used     boolean not null default false,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index idx_invite_codes_code on invite_codes(code);

-- 5. invite_slots
-- ============================================================
create table invite_slots (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  initial_slots int not null default 2,
  bonus_slots   int not null default 0,
  used_slots    int not null default 0,
  updated_at    timestamptz not null default now(),
  unique(user_id)
);

-- 6. slot_unlock_conditions
-- ============================================================
create table slot_unlock_conditions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  condition     unlock_condition_type not null,
  completed     boolean not null default false,
  completed_at  timestamptz,
  unique(user_id, condition)
);

-- 7. referrals
-- ============================================================
create table referrals (
  id              uuid primary key default gen_random_uuid(),
  referrer_id     uuid not null references profiles(id),
  referred_id     uuid references profiles(id),
  invite_code_id  uuid references invite_codes(id),
  clicked_at      timestamptz not null default now(),
  registered_at   timestamptz
);

create index idx_referrals_referrer on referrals(referrer_id);

-- 8. contents
-- ============================================================
create table contents (
  id              uuid primary key default gen_random_uuid(),
  type            content_type not null,
  title           text not null,
  description     text,
  body            text,
  status          content_status not null default 'draft',
  publish_date    timestamptz,
  author_id       uuid references profiles(id),
  author_name     text not null,
  author_bio      text,
  thumbnail_url   text,
  url             text,
  duration        text,
  views           int not null default 0,
  likes           int not null default 0,
  premium         boolean not null default false,
  required_rank   member_rank not null default 'standard',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger trg_contents_updated
  before update on contents
  for each row execute function update_updated_at();

create index idx_contents_status on contents(status);
create index idx_contents_publish_date on contents(publish_date desc);

-- 9. tags & content_tags
-- ============================================================
create table tags (
  id    uuid primary key default gen_random_uuid(),
  name  text unique not null
);

create table content_tags (
  content_id  uuid not null references contents(id) on delete cascade,
  tag_id      uuid not null references tags(id) on delete cascade,
  primary key (content_id, tag_id)
);

-- 10. content_interactions
-- ============================================================
create table content_interactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  content_id  uuid not null references contents(id) on delete cascade,
  type        interaction_type not null,
  created_at  timestamptz not null default now(),
  unique(user_id, content_id, type)
);

create index idx_interactions_content on content_interactions(content_id, type);

-- 11. rewards
-- ============================================================
create table rewards (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text not null,
  required_referrals  int not null,
  icon                text not null default 'Gift',
  status              text not null default 'active'
    check (status in ('active', 'inactive')),
  created_at          timestamptz not null default now()
);

-- 12. reward_claims
-- ============================================================
create table reward_claims (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  reward_id   uuid not null references rewards(id) on delete cascade,
  status      text not null default 'pending'
    check (status in ('pending', 'granted', 'rejected')),
  claimed_at  timestamptz not null default now(),
  granted_at  timestamptz,
  unique(user_id, reward_id)
);

-- 13. broadcasts
-- ============================================================
create table broadcasts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null,
  target_rank text not null default 'all',
  status      text not null default 'sent'
    check (status in ('sent', 'failed', 'scheduled')),
  sent_at     timestamptz not null default now(),
  created_by  uuid references profiles(id)
);

-- 14. notification_preferences
-- ============================================================
create table notification_preferences (
  user_id               uuid primary key references profiles(id) on delete cascade,
  email_new_content     boolean not null default true,
  email_newsletter      boolean not null default true,
  email_invite_update   boolean not null default true,
  line_new_content      boolean not null default false,
  line_reward           boolean not null default true,
  push_browser          boolean not null default false,
  updated_at            timestamptz not null default now()
);

-- 15. login_history
-- ============================================================
create table login_history (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  device        text,
  ip_address    text,
  logged_in_at  timestamptz not null default now()
);

create index idx_login_history_user on login_history(user_id, logged_in_at desc);
