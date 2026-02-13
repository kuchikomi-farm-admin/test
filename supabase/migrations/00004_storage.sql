-- ============================================================
-- TheJapanLocalMedia: Storage Buckets & Policies
-- ============================================================

-- 1. Create storage buckets
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('avatars', 'avatars', true, 2097152),         -- 2 MB
  ('thumbnails', 'thumbnails', true, 5242880),    -- 5 MB
  ('content-media', 'content-media', true, 52428800);  -- 50 MB (Public for streaming via getPublicUrl)

-- 2. Storage policies
-- ============================================================

-- avatars: 本人のみアップロード、全員閲覧可
create policy "avatar_upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatar_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatar_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

-- thumbnails: admin のみアップロード、全員閲覧可
create policy "thumbnail_upload" on storage.objects
  for insert with check (
    bucket_id = 'thumbnails'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "thumbnail_update" on storage.objects
  for update using (
    bucket_id = 'thumbnails'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "thumbnail_public_read" on storage.objects
  for select using (bucket_id = 'thumbnails');

-- content-media: admin のみアップロード、認証ユーザーのみ閲覧
create policy "content_media_upload" on storage.objects
  for insert with check (
    bucket_id = 'content-media'
    and exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "content_media_read" on storage.objects
  for select using (
    bucket_id = 'content-media'
    and auth.uid() is not null
  );
