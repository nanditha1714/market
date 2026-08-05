-- ALTER TABLE query to add payment tracking, email status, and dual PDF URLs to your Supabase table.
-- Copy and paste this script in your Supabase SQL Editor and click "Run".

ALTER TABLE research_submissions 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
ADD COLUMN IF NOT EXISTS razorpay_signature TEXT,
ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'not_sent',
ADD COLUMN IF NOT EXISTS dashboard_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS report_pdf_url TEXT;
