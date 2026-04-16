const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet({
  contentSecurityPolicy: false, // Disabled for ease of dynamic chart rendering
}));
app.use(cors());
app.use(express.json());

// API Rate Limiter: 5 requests per 1-minute window per IP
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 5,
  message: { error: "Too many research requests. Please wait a minute before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

const GEMINI_KEY = process.env.GEMINI_API_KEY;

// Keep building prompt server-side so prompt structure isn't exposed
function buildPrompt(answers) {
  const compList = (answers.competitors || '').split(',').map(s => s.trim()).filter(Boolean);
  const comp1 = compList[0] || 'Competitor A';
  const comp2 = compList[1] || 'Competitor B';
  const comp3 = compList[2] || 'Competitor C';
  const compCount = compList.length > 0 ? compList.length : 3;

  return `You are a market analyst. Generate a highly accurate JSON dataset reflecting this survey (DO NOT hallucinate templates). If the input is gibberish/test characters, abort and return EXACTLY: {"error": "Invalid/nonsensical input."}
SURVEY:
1.Industry: ${answers.industry}
2.Problem: ${answers.problem}
3.Customer: ${answers.customer}
4.Geo: ${answers.geo}
5.TAM: ${answers.tam}
6.Competitors: ${answers.competitors}
7.Pricing: ${answers.pricing}
8.Price: ${answers.price}
9.Ratings (Self vs Comp): ${answers.ratings}
10.Stage/Challenges: ${answers.sc}

RULES:
- Provide REALISTIC estimates based on the industry.
- 'growth.values': 7 realistic market sizes (2018-2024).
- 'competitors': MUST use EXACTLY ${comp1}, ${comp2}, ${comp3}, Your Company, Others. 'share' sum to 100.
- 'segments': 3 real sub-segments summing to 100 (CALCULATE UNIQUE %'s, NO 45/35/20).
- 'geo': break down market share across focus regions, summing to 100 (NO 40/30/20/10).
- 'challenges': EXACTLY 1 dense bullet point risk.
- 'insights': 1 concise sentence summary.

Return ONLY this EXACT JSON structure, populated:
{"kpi":{"tam":"X.X","growthRate":"X.X%","customers":"X.X","competitors":${compCount},"stage":"${(answers.sc||'Ideation').split(" ")[0]}","price":"${answers.price||'Market Avg'}","stars":4},"growth":{"labels":["2018","2019","2020","2021","2022","2023","2024"],"values":[0,0,0,0,0,0,0]},"segments":[{"label":"X","value":50},{"label":"Y","value":30},{"label":"Z","value":20}],"geo":[{"label":"X","value":50},{"label":"Y","value":30},{"label":"Z","value":20}],"competitors":[{"name":"${comp1}","share":40},{"name":"${comp2}","share":25},{"name":"${comp3}","share":15},{"name":"Your Company","share":10},{"name":"Others","share":10}],"radarLabels":["Price","Quality","Brand","Innovation","Support"],"radarYou":[3,4,3,4,4],"radarComp":[4,3,4,3,3],"sentiment":{"positive":65,"neutral":25,"negative":10},"pricing":[{"name":"Your Company","color":"#16a34a","note":"Value"},{"name":"${comp1}","color":"#1a2b5e","note":"Premium"},{"name":"${comp2}","color":"#f59e0b","note":"Budget"}],"avgRating":"4.1","challenges":["Risk."],"insights":"Summary."}`;
}

app.post('/api/generate', apiLimiter, async (req, res) => {
  if (!GEMINI_KEY) return res.status(500).json({ error: "Server missing Gemini API Key" });
  
  const answers = req.body;
  const prompt = buildPrompt(answers);

  try {
    const response = await fetch(
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
    
    const json = await response.json();
    let raw = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // If the response failed, dump the actual platform error block.
    if (!raw) {
      console.error("Gemini API Platform Error: HTTP", response.status);
      console.error("Raw Payload:", JSON.stringify(json, null, 2));
      throw new Error(json.error?.message || 'Empty Gemini response');
    }
    
    raw = raw.replace(/```json|```/g, '').trim();
    const data = JSON.parse(raw);
    res.json(data);
  } catch (err) {
    console.error('Gemini proxy error:', err);
    res.status(500).json({ error: "Failed to generate market research" });
  }
});

// Production: serve React build
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const buildPath = path.join(__dirname, '../react-app/build');
  app.use(express.static(buildPath));
  
  app.get('/:path*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

app.listen(PORT, () => console.log(`Secure Backend listening on port ${PORT}`));
