import { FALLBACK_DATA } from './constants';

const GEMINI_KEY   = process.env.REACT_APP_GEMINI_API_KEY;
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// ── Build Gemini prompt ───────────────────────────────────────────────────────
export function buildPrompt(answers) {
  const compList = (answers.competitors || '').split(',').map(s => s.trim()).filter(Boolean);
  const comp1 = compList[0] || 'Competitor A';
  const comp2 = compList[1] || 'Competitor B';
  const comp3 = compList[2] || 'Competitor C';
  const compCount = compList.length > 0 ? compList.length : 3;

  return "You are an elite market research analyst. Review the following survey answers. Using your internal knowledge base, generate a highly accurate, data-driven market research dataset that truly reflects the specific industry, geography, and competitors mentioned. DO NOT hallucinate random data. If the user's survey answers are random gibberish, test characters, or completely lack realistic business context, you MUST abort and return exactly this JSON: {\"error\": \"Invalid or nonsensical input detected. Please provide genuine business details to generate market research.\"} and NOTHING ELSE.\n\n"
    + "CRITICAL ACCURACY INSTRUCTION: Your output MUST clearly and undeniably derive from the user's explicit survey answers. The numbers, insights, sizing, and market splits must uniquely map to the user's target customer, pricing model, and specific niche described below rather than falling back on broad global templates.\n\n"
    + "SURVEY ANSWERS:\n"
    + "1. Industry: " + answers.industry + "\n"
    + "2. Problem solved: " + answers.problem + "\n"
    + "3. Target customer: " + answers.customer + "\n"
    + "4. Geography: " + answers.geo + "\n"
    + "5. TAM estimate: " + answers.tam + "\n"
    + "6. Competitors: " + answers.competitors + "\n"
    + "7. Pricing model: " + answers.pricing + "\n"
    + "8. Average price: " + answers.price + "\n"
    + "9. Self-assessment vs competitors: " + answers.ratings + "\n"
    + "10. Stage and challenges: " + answers.sc + "\n\n"
    + "RULES:\n"
    + "A) Provide a REALISTIC estimate for 'tam' (Total Addressable Market), 'growthRate', and 'customers' based on real-world macro industry data.\n"
    + "B) 'growth.values' must be 7 numbers representing realistic market sizes (in billions) for the years 2018-2024. Ensure it reflects the true market trajectory (e.g., COVID impacts if applicable).\n"
    + "C) 'competitors' must use EXACTLY " + comp1 + ", " + comp2 + ", " + comp3 + ", Your Company, and Others. Their 'share' values MUST sum to 100, estimated accurately based on actual market dominance.\n"
    + "D) 'segments' must be 3 real, data-driven sub-segments of this specific industry that sum to 100. YOU MUST CALCULATE UNIQUE VALUES based on the industry, DO NOT output 45, 35, 20.\n"
    + "E) 'geo' must realistically breakdown the market share across the user's focus regions and sum to 100. DO NOT output 40, 30, 20, 10.\n"
    + "F) 'challenges' must be EXACTLY 1 dense bullet point for macro risks, derived from answer 10, fleshed out with deep industry context.\n"
    + "G) 'insights' must be EXACTLY a single sentence executive summary mentioning actual overarching market dynamics.\n\n"
    + "Return ONLY valid JSON with NO markdown fences. Follow this EXACT STRUCTURE but REPLACE ALL numeric and text values (including the example percentages) with your highly accurate analysis for THIS specific market:\n"
    + '{"kpi":{"tam":"X.X","growthRate":"X.X%","customers":"X.X","competitors":' + compCount + ',"stage":"' + answers.sc.split(" ")[0] + '","price":"' + (answers.price || 'Market Avg') + '","stars":4},'
    + '"growth":{"labels":["2018","2019","2020","2021","2022","2023","2024"],"values":[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]},'
    + '"segments":[{"label":"Real Segment 1","value":45},{"label":"Real Segment 2","value":35},{"label":"Real Segment 3","value":20}],'
    + '"geo":[{"label":"Real Region 1","value":40},{"label":"Real Region 2","value":30},{"label":"Real Region 3","value":20},{"label":"Others","value":10}],'
    + '"competitors":[{"name":"' + comp1 + '","share":40},{"name":"' + comp2 + '","share":25},{"name":"' + comp3 + '","share":15},{"name":"Your Company","share":10},{"name":"Others","share":10}],'
    + '"radarLabels":["Price","Quality","Brand","Innovation","Support"],'
    + '"radarYou":[3,4,3,4,4],"radarComp":[4,3,4,3,3],'
    + '"sentiment":{"positive":65,"neutral":25,"negative":10},'
    + '"pricing":[{"name":"Your Company","color":"#16a34a","note":"Value"},{"name":"' + comp1 + '","color":"#1a2b5e","note":"Premium"},{"name":"' + comp2 + '","color":"#f59e0b","note":"Budget"}],'
    + '"avgRating":"4.1","challenges":["One highly specific, dense macro risk challenge."],"insights":"A concise, single-sentence executive mapping of overarching market shifts."}';
}

// ── Call Gemini API ───────────────────────────────────────────────────────────
export async function callGemini(answers) {
  const prompt = buildPrompt(answers);
  try {
    const res = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_KEY,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 1.0, maxOutputTokens: 8192 }
        })
      }
    );
    const json = await res.json();
    console.log('Gemini response status:', res.status);
    let raw = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!raw) throw new Error('Empty Gemini response');
    raw = raw.replace(/```json|```/g, '').trim();
    const data = JSON.parse(raw);
    console.log('growth values:', data.growth?.values);
    console.log('competitors:', data.competitors?.map(c => c.name));
    return data;
  } catch (err) {
    console.error('Gemini error:', err);
    return FALLBACK_DATA;
  }
}

// ── Upload screenshot to Supabase Storage ────────────────────────────────────
export async function uploadScreenshot(blob, fileName) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return '';
  try {
    const contentType = fileName.endsWith('.pdf') ? 'application/pdf' : 'image/png';
    const res = await fetch(SUPABASE_URL + '/storage/v1/object/dashboards/' + fileName, {
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
  if (!SUPABASE_URL || !SUPABASE_KEY) return false;
  try {
    const res = await fetch(SUPABASE_URL + '/rest/v1/research_submissions', {
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
      console.log('✅ Saved to Supabase');
      return true;
    }
    const err = await res.text();
    console.warn('DB save failed:', err);
    return false;
  } catch (err) {
    console.warn('Save error:', err);
    return false;
  }
}
