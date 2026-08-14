-- 1. ALTER TABLE query to add payment tracking, email status, and dual PDF URLs to your Supabase table.
ALTER TABLE research_submissions 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'not_sent',
ADD COLUMN IF NOT EXISTS dashboard_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS report_pdf_url TEXT;

-- 2. Ensure the 'dashboards' storage bucket exists and is marked public
INSERT INTO storage.buckets (id, name, public)
VALUES ('dashboards', 'dashboards', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Storage Policies for 'dashboards' bucket (Allow Uploads, Upserts, and Public Reads)
DROP POLICY IF EXISTS "Public Read Access for dashboards" ON storage.objects;
CREATE POLICY "Public Read Access for dashboards" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'dashboards');

DROP POLICY IF EXISTS "Public Insert Access for dashboards" ON storage.objects;
CREATE POLICY "Public Insert Access for dashboards" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'dashboards');

DROP POLICY IF EXISTS "Public Update Access for dashboards" ON storage.objects;
CREATE POLICY "Public Update Access for dashboards" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'dashboards')
WITH CHECK (bucket_id = 'dashboards');

