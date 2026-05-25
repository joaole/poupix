-- PouPix storage bucket for receipts/attachments
-- Supabase Storage is managed via API; this documents the expected setup.

-- Create bucket (run via Supabase dashboard or management API):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

-- Storage RLS policies:
-- Allow authenticated users to upload to their own folder
-- Policy: "receipts: insert own"  ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: "receipts: select own"  ON storage.objects FOR SELECT
--   USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: "receipts: delete own"  ON storage.objects FOR DELETE
--   USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

select 1; -- placeholder so migration file is valid SQL
