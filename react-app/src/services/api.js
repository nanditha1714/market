import { FALLBACK_DATA } from '../constants';

const API_BASE = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '');
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// ── Resilient HTTP fetch retry helper ────────────────────────────────────────
async function fetchWithRetry(url, options, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (i === retries - 1) throw err;
      console.warn(`Fetch connection failed, retrying in ${delay}ms (attempt ${i + 1}/${retries})...`, err);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ── Call Backend Proxy instead of raw Gemini ─────────────────────────────────
export async function callGemini(answers) {
  try {
    const res = await fetchWithRetry(`${API_BASE}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers)
    });
    const json = await res.json();
    if (!res.ok || json.error) throw new Error(json.error || 'Backend request failed');
    return json;
  } catch (err) {
    console.error('Backend error:', err);
    return FALLBACK_DATA; 
  }
}

// ── Upload screenshot to Supabase Storage ────────────────────────────────────
export async function uploadScreenshot(blob, fileName) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return '';
  try {
    const contentType = fileName.endsWith('.pdf') ? 'application/pdf' : 'image/png';
    const res = await fetchWithRetry(SUPABASE_URL + '/storage/v1/object/dashboards/' + fileName, {
      method: 'POST',
      headers: {
        'Content-Type':  contentType,
        'apikey':        SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'x-upsert':      'true',
      },
      body: blob,
    });
    if (res.ok) {
      return SUPABASE_URL + '/storage/v1/object/public/dashboards/' + fileName;
    }
    const err = await res.text();
    console.warn('Storage upload failed:', err);
    return '';
  } catch (err) {
    console.warn('Upload error:', err);
    return '';
  }
}

// ── Save record to Supabase DB ────────────────────────────────────────────────
export async function saveRecord(payload) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const res = await fetchWithRetry(SUPABASE_URL + '/rest/v1/research_submissions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Prefer':        'return=representation',
      },
      body: JSON.stringify(payload),
    });
    if (res.status === 201) {
      const data = await res.json();
      console.log('✅ Saved to Supabase:', data);
      return data[0]; // Return the created record object
    }
    const err = await res.text();
    console.warn('DB save failed:', err);
    return null;
  } catch (err) {
    console.warn('Save error:', err);
    return null;
  }
}

// ── Update existing record in Supabase DB ─────────────────────────────────────
export async function updateRecord(id, updates) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;
  try {
    const res = await fetchWithRetry(`${SUPABASE_URL}/rest/v1/research_submissions?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type':  'application/json',
        'apikey':        SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      console.log('✅ Updated Supabase record:', id);
      return true;
    }
    const err = await res.text();
    console.warn('DB update failed:', err);
    return false;
  } catch (err) {
    console.warn('Update error:', err);
    return false;
  }
}
