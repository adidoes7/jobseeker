-- Run this manually in the Supabase SQL editor after creating a private
-- Storage bucket named "cvs" (Storage > New bucket > uncheck "Public bucket").
-- Path convention enforced by the app: {user_id}/{cv_id}-{filename}
-- This policy is the real access-control boundary for CV files, since users
-- upload directly to Storage from the browser (not through a server action).

create policy "Users can manage their own CVs"
on storage.objects for all
using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
