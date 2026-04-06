export const QUESTIONS = [
  { id: 1, key: 'industry',    text: 'What industry does your company operate in?',                                       ph: 'e.g. Technology / SaaS, Healthcare, Retail, Finance…' },
  { id: 2, key: 'problem',     text: 'What problem does your company solve?',                                              ph: 'Describe the core problem your product addresses…' },
  { id: 3, key: 'customer',    text: 'Who is your primary target customer?',                                               ph: 'e.g. B2B enterprise, SMBs, mass market consumers…' },
  { id: 4, key: 'geo',         text: 'Which geographic markets does your company target?',                                  ph: 'e.g. North America, Europe, Asia-Pacific…' },
  { id: 5, key: 'tam',         text: 'What is your estimated Total Addressable Market (TAM)?',                             ph: 'e.g. $5B, around $500M, not sure yet…' },
  { id: 6, key: 'competitors', text: 'Who are your top 3 competitors? (comma-separated)',                                  ph: 'e.g. Salesforce, HubSpot, Zoho…' },
  { id: 7, key: 'pricing',     text: "What is your company's pricing model?",                                              ph: 'e.g. Subscription $49/mo, one-time purchase, freemium…' },
  { id: 8, key: 'price',       text: 'What is the average price of your product or service?',                             ph: 'e.g. $99/month, $499 one-time, free with premium at $29/mo…' },
  { id: 9, key: 'ratings',     text: 'How does your company compare to competitors? Describe your strengths and weaknesses.', ph: 'e.g. Our product quality is strong (5/5), pricing is competitive (4/5), but brand awareness is low (2/5)…' },
  { id: 10, key: 'sc',         text: 'What stage is your company in and what are your biggest market challenges?',         ph: 'e.g. Growth stage (Series A), biggest challenges are customer acquisition cost and intense competition…' },
];

export const CHART_COLORS = ['#1a2b5e','#2563eb','#60a5fa','#16a34a','#f59e0b','#ea580c'];

export const FALLBACK_DATA = {
  kpi: { tam:'$5.2B', growthRate:'8.5%', customers:'1.2M', competitors:6, stage:'Growth', price:'$45', stars:4 },
  growth: { labels:['2019','2020','2021','2022','2023','2024','2025'], values:[1,1.3,1.7,2.2,3.0,4.0,5.2] },
  segments: [{ label:'Enterprise',value:45 },{ label:'SMB',value:35 },{ label:'Startups',value:20 }],
  geo: [{ label:'North America',value:40 },{ label:'Europe',value:30 },{ label:'Asia',value:20 },{ label:'Others',value:10 }],
  competitors: [{ name:'Comp A',share:35 },{ name:'Comp B',share:25 },{ name:'Comp C',share:18 },{ name:'You',share:12 },{ name:'Others',share:10 }],
  radarLabels: ['Price','Product Quality','Brand Strength','Innovation','Customer Support'],
  radarYou: [3,4,3,4,4], radarComp: [4,3,4,3,3],
  sentiment: { positive:70, neutral:20, negative:10 },
  pricing: [{ name:'Your Product',color:'#16a34a',note:'Competitive' },{ name:'Comp A',color:'#1a2b5e',note:'Premium' },{ name:'Comp B',color:'#f59e0b',note:'Budget' }],
  avgRating: '4.3',
  challenges: ['Intense competition','Market awareness','CAC','Talent shortage'],
  insights: '🎯 Strong TAM with differentiation opportunity. 📈 Fragmented competition creates share capture potential. 💡 Customer support is your key differentiator — invest here.',
};
