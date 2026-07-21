const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);

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
- 'kpi.price': MUST be a short value of 2-3 words or a clean number/integer (e.g. '$15,000/yr', '$500/mo', or 'USD 250'). DO NOT write a full sentence or paragraph.
- DO NOT use raw double quotes (") inside detailedReport text, insights, or challenges. If you need to quote, use single quotes (') instead.
- DO NOT use raw carriage returns or line breaks inside the JSON string values. You MUST escape all newlines as \\\\n.
- 'detailedReport': MUST provide an extensive, high-quality, professional strategic analysis. For EACH section, return a single string containing EXACTLY three distinct parts separated by the escaped sequence \\\\n\\\\n. Each part must start with "### [Subheading Title]" followed by a dense analysis paragraph (between 120 and 140 words per paragraph). The total word count per section must be between 360 and 420 words to fit and fill the A4 PDF sheets completely (reaching ~80% page height) without exceeding token limits or triggering proxy timeouts:
  - 'executiveSummary': 3 parts with subheadings analyzing the market environment, core opportunity, and competitive positioning.
  - 'marketGrowth': 3 parts with subheadings explaining growth trends (CAGR), demand drivers, and technological shifts.
  - 'segmentation': 3 parts with subheadings analyzing demographic profiles, purchasing behaviors, and product fit.
  - 'geography': 3 parts with subheadings analyzing regional penetration, local regulatory influences, and expansion vectors.
  - 'competition': 3 parts with subheadings analyzing player concentration, structural competitive dynamics, and your key differentiators.
  - 'radarAnalysis': 3 parts with subheadings deep-diving into product quality, brand legacy vs agility, and support/innovation scores.
  - 'pricing': 3 parts with subheadings evaluating pricing frameworks, customer price sensitivity, and monetization scaling paths.
  - 'risks': 3 parts with subheadings identifying market barriers, key operational risks, and concrete mitigation plans.

Return ONLY this EXACT JSON structure, populated:
{"kpi":{"tam":"X.X","growthRate":"X.X%","customers":"X.X","competitors":${compCount},"stage":"${(answers.sc||'Ideation').split(" ")[0]}","price":"${answers.price||'Market Avg'}","stars":4},"growth":{"labels":["2018","2019","2020","2021","2022","2023","2024"],"values":[0,0,0,0,0,0,0]},"segments":[{"label":"X","value":50},{"label":"Y","value":30},{"label":"Z","value":20}],"geo":[{"label":"X","value":50},{"label":"Y","value":30},{"label":"Z","value":20}],"competitors":[{"name":"${comp1}","share":40},{"name":"${comp2}","share":25},{"name":"${comp3}","share":15},{"name":"Your Company","share":10},{"name":"Others","share":10}],"radarLabels":["Price","Quality","Brand","Innovation","Support"],"radarYou":[3,4,3,4,4],"radarComp":[4,3,4,3,3],"sentiment":{"positive":65,"neutral":25,"negative":10},"pricing":[{"name":"Your Company","color":"#16a34a","note":"Value"},{"name":"${comp1}","color":"#1a2b5e","note":"Premium"},{"name":"${comp2}","color":"#f59e0b","note":"Budget"}],"avgRating":"4.1","challenges":["Risk."],"insights":"Summary.","detailedReport":{"executiveSummary":"Exec summary paragraphs.","marketGrowth":"Growth analysis.","segmentation":"Segmentation analysis.","geography":"Geographic analysis.","competition":"Competitive share analysis.","radarAnalysis":"Radar Matrix positioning analysis.","pricing":"Pricing strategy recommendation.","risks":"Risks and mitigation strategy."}}`;
}

app.post('/api/generate', apiLimiter, async (req, res) => {
  if (!GEMINI_KEY) return res.status(500).json({ error: "Server missing Gemini API Key" });
  
  const answers = req.body;
  const prompt = buildPrompt(answers);

  const maxRetries = 2;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Calling Gemini API (Attempt ${attempt}/${maxRetries})...`);
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GEMINI_KEY,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 1.0, maxOutputTokens: 32768 }
          })
        }
      );
      
      const json = await response.json();
      let raw = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!raw) {
        console.error(`Gemini API Platform Error (attempt ${attempt}): HTTP`, response.status);
        console.error("Raw Payload:", JSON.stringify(json, null, 2));
        throw new Error(json.error?.message || 'Empty Gemini response');
      }
      
      raw = raw.replace(/```json|```/g, '').trim();
      let data;
      try {
        data = JSON.parse(raw);
      } catch (parseErr) {
        console.error('❌ JSON Parse Error details:', parseErr.message);
        console.error('Raw response length:', raw.length);
        console.error('Raw response content:', raw);
        if (json.candidates?.[0]) {
          console.error('Candidate Metadata:', JSON.stringify({
            finishReason: json.candidates[0].finishReason,
            safetyRatings: json.candidates[0].safetyRatings,
            citationMetadata: json.candidates[0].citationMetadata,
          }, null, 2));
        }
        throw parseErr;
      }
      
      console.log(`✅ Gemini generated successfully on attempt ${attempt}`);
      return res.json(data);
    } catch (err) {
      console.warn(`⚠️ Gemini API call failed on attempt ${attempt}:`, err.message);
      if (attempt === maxRetries) {
        console.error('❌ All Gemini API attempts exhausted. Failing with 500.');
        return res.status(500).json({ error: "Failed to generate market research" });
      }
      // Wait 1.5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
});

// ── Authentication & OTP Email Verification (SMTP) ──────────────────────────
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 8000,
});

const otpCache = {};

// Request OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required.' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpCache[email] = {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  };

  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || `"Infopace Security" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Your Market Research Verification OTP',
      text: `Your One-Time Password (OTP) for verification is: ${otp}\n\nThis OTP is valid for 10 minutes. Please enter it on the website to complete your signup.\n\nBest regards,\nInfopace Team`,
      html: `
        <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 8px; background: #ffffff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h2 style="color: #1e3a8a; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.01em;">Infopace Market Intelligence</h2>
          </div>
          <p style="font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 20px 0;">
            To verify your account and generate your market research dashboard, please use the following 6-digit One-Time Password (OTP):
          </p>
          <div style="background: #f1f5f9; padding: 18px 24px; border-radius: 6px; font-size: 32px; font-weight: 800; color: #1e3a8a; text-align: center; letter-spacing: 0.25em; margin: 24px 0; border: 1px solid #e2e8f0;">
            ${otp}
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 24px 0 0 0; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            This OTP is valid for 10 minutes. If you did not request this research submission, you can safely ignore this email.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[OTP] Sent successfully to ${email}`);
    res.json({ success: true, message: 'OTP sent successfully.' });
  } catch (err) {
    console.warn(`[OTP Fallback] SMTP failed, logging to console. For ${email}, the OTP is: ${otp}`, err.message);
    // Return mock success in development if env is not configured, to let the user review the UI flow!
    if (!process.env.SMTP_USER) {
      return res.json({ success: true, message: 'OTP simulated and printed in console logs.' });
    }
    res.status(500).json({ error: 'Failed to send verification email. Please check server SMTP configuration.' });
  }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  const cached = otpCache[email];
  if (!cached) {
    return res.status(400).json({ error: 'No verification request found for this email.' });
  }

  if (Date.now() > cached.expiresAt) {
    delete otpCache[email];
    return res.status(400).json({ error: 'OTP has expired.' });
  }

  if (cached.otp !== otp.trim()) {
    return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
  }

  delete otpCache[email];
  res.json({ success: true, message: 'OTP verified successfully.' });
});

// Production: serve React build
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const buildPath = path.join(__dirname, '../react-app/build');
  app.use(express.static(buildPath));
  
  app.use((req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

app.listen(PORT, () => console.log(`Secure Backend listening on port ${PORT}`));
