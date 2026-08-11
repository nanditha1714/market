# Market Research Assistant — React

## Project Structure
```
react-app/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── LoginPage.jsx      # Login form with validation
│   │   ├── SurveyPage.jsx     # 10-question survey
│   │   ├── LoadingScreen.jsx  # Gemini loading state
│   │   ├── ChartCard.jsx      # Reusable Chart.js wrapper
│   │   └── Dashboard.jsx      # Full dashboard with all charts
│   ├── App.jsx                # Screen router
│   ├── api.js                 # Gemini + Supabase API calls
│   ├── constants.js           # Questions + fallback data
│   ├── index.js               # Entry point
│   └── index.css              # Global styles
├── .env                       # API keys (never commit this!)
└── package.json
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure .env
```

REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Run development server
```bash
npm start
```
Opens at http://localhost:3000

### 4. Build for production
```bash
npm run build
```

## Supabase Setup

Run this SQL in Supabase → SQL Editor:

```sql
create table research_submissions (
  id bigint generated always as identity primary key,
  name text, phone text, email text, company_name text, service text,
  industry text, problem text, target_customer text, geography text,
  tam_estimate text, competitors text, pricing_model text, avg_price text,
  self_rating text, stage_challenges text,
  ai_tam text, ai_growth_rate text, ai_customers text,
  ai_competitors integer, ai_stage text, ai_price text, ai_stars numeric(3,1),
  ai_growth_labels text, ai_growth_values text, ai_segments text, ai_geo text,
  ai_competitors_data text, ai_radar_labels text, ai_radar_you text,
  ai_radar_comp text, ai_sentiment text, ai_pricing text,
  ai_avg_rating text, ai_challenges text, ai_insights text,
  dashboard_json jsonb, pdf_url text,
  created_at timestamptz default now()
);
```

Create a public Storage bucket named `dashboards` for screenshots.
