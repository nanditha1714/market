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
  kpi: { tam: '$52.8B', growthRate: '14.2%', customers: '850K+', competitors: 8, stage: 'Growth', price: '$299/mo', stars: 4 },
  growth: { labels: ['2020','2021','2022','2023','2024','2025','2026'], values: [12, 16.5, 22, 29.5, 38, 46.8, 52.8] },
  segments: [
    { label: 'Large Enterprise', value: 40 },
    { label: 'Mid-Market', value: 35 },
    { label: 'SMB', value: 15 },
    { label: 'Government', value: 10 }
  ],
  geo: [
    { label: 'North America', value: 45 },
    { label: 'Europe', value: 30 },
    { label: 'Asia-Pacific', value: 17 },
    { label: 'Rest of World', value: 8 }
  ],
  competitors: [
    { name: 'ServiceNow', share: 28 },
    { name: 'RSA Archer', share: 20 },
    { name: 'LogicGate', share: 15 },
    { name: 'Infopace', share: 12 },
    { name: 'Others', share: 25 }
  ],
  radarLabels: ['Compliance Coverage', 'AI Automation', 'Ease of Use', 'Integration Depth', 'Reporting & Audit'],
  radarYou: [4, 5, 4, 4, 5],
  radarComp: [5, 3, 3, 4, 4],
  sentiment: { positive: 78, neutral: 14, negative: 8 },
  pricing: [
    { name: 'Infopace Starter', color: '#16a34a', note: '$99/mo — Core GRC + Market Reports' },
    { name: 'Infopace Pro', color: '#1a56db', note: '$299/mo — AI Insights + Audit Trails' },
    { name: 'Infopace Enterprise', color: '#7c3aed', note: 'Custom — Full Suite + Dedicated CSM' },
    { name: 'ServiceNow GRC', color: '#1a2b5e', note: '$800+/mo — Complex Setup' },
    { name: 'RSA Archer', color: '#f59e0b', note: '$600+/mo — On-Premise Heavy' }
  ],
  avgRating: '4.5',
  challenges: [
    'High customer acquisition cost in enterprise segment due to long sales cycles',
    'Strong brand incumbency of legacy GRC players (ServiceNow, RSA Archer)',
    'Regulatory fragmentation across North America, EU (GDPR/NIS2), and APAC markets',
    'Talent gap in AI-driven compliance engineering and data privacy expertise'
  ],
  insights: '🎯 $52.8B GRC market growing at 14.2% CAGR — Infopace positioned in the fastest-growing AI-automation layer. 📈 Legacy incumbents vulnerable to agile cloud-native alternatives. 💡 Infopace\'s AI-first approach and affordable pricing are the key differentiators in regulated B2B sectors.',
  detailedReport: {
    executiveSummary: '### 1.1 Market Environment & Overview\nThe global Governance, Risk & Compliance (GRC) software market is experiencing unprecedented growth, driven by increasing regulatory complexity, digital transformation mandates, and the rising frequency of cyber incidents across regulated industries. Infopace\'s AI-powered Market Research Assessment Tool occupies a uniquely disruptive position within this $52.8B market, offering an intelligence-first, cloud-native platform purpose-built for mid-to-large B2B organizations.\n\n### 1.2 Core Strategic Opportunity\nOrganizations across finance, healthcare, manufacturing, technology, and government are actively replacing fragmented, spreadsheet-driven risk management workflows with integrated GRC platforms. Infopace\'s AI engine delivers real-time market demand analysis, competitive intelligence, and actionable compliance roadmaps — enabling CIOs, CISOs, compliance officers, and internal audit teams to make evidence-based decisions at speed.\n\n### 1.3 Strategic Positioning\nInfopace\'s competitive positioning centers on three pillars: AI-driven automation (replacing manual risk assessments), affordable enterprise-grade pricing (vs. $600–$1,200/mo legacy tools), and rapid deployment with zero-code onboarding. This combination creates a powerful wedge into the mid-market segment while offering a credible enterprise upgrade path.',

    marketGrowth: '### 2.1 Market Demand Trajectory\nThe GRC software market has grown from $12B in 2020 to a projected $52.8B by 2026, representing a 14.2% CAGR. This expansion is fueled by the adoption of cloud-native risk management architectures, the proliferation of AI-assisted compliance tools, and tightening regulatory environments (GDPR, SOC2, ISO 27001, HIPAA) across core target verticals.\n\n### 2.2 Key Growth Drivers\nDigital transformation initiatives have accelerated the need for real-time risk visibility across global operations. IT managers and CISOs report a 3x increase in audit frequency since 2022, creating an urgent demand for automated evidence collection and continuous compliance monitoring. Infopace directly addresses this pain point with its AI-driven assessment engine.\n\n### 2.3 Five-Year Outlook\nBy 2028, the AI-native GRC segment is expected to represent 35% of total GRC spending, growing at a 22% CAGR — significantly outpacing legacy on-premise solutions. Organizations that fail to adopt AI-augmented compliance tools face 40% higher audit remediation costs and 2.7x longer time-to-compliance. Infopace is positioned to capture this high-growth subsegment through early market entry and product-led growth strategies.',

    segmentation: '### 3.1 Enterprise Segment (40%)\nLarge enterprises (1,000+ employees) represent the highest contract value segment, averaging $850/mo per account. These buyers — CISOs, Heads of Risk, and Internal Audit Directors — prioritize SOC2/ISO compliance automation, role-based access controls, and executive reporting dashboards. Infopace\'s Enterprise tier directly addresses these requirements with custom workflow builders and dedicated CSM support.\n\n### 3.2 Mid-Market Segment (35%)\nMid-market organizations (200–999 employees) represent Infopace\'s primary growth engine, combining reasonable deal velocity with meaningful contract values ($299–$499/mo). IT Managers and Compliance Officers in this tier seek automated vulnerability tracking, regulatory change management, and cross-team collaboration tools — all core capabilities of the Infopace Pro tier.\n\n### 3.3 SMB & Government (25%)\nSMBs and government agencies together represent 25% of the addressable market. Government entities increasingly mandate GRC tool adoption following NIST Cybersecurity Framework updates, creating a new procurement wave. Infopace\'s Starter tier offers entry-level compliance at $99/mo, capturing SMBs and seeding long-term enterprise upgrades through land-and-expand motion.',

    geography: '### 4.1 North American Market Leadership (45%)\nNorth America dominates GRC spending at 45% of global revenue, driven by SEC cybersecurity disclosure rules, FTC enforcement actions, and state-level privacy legislation. U.S. enterprises are significantly increasing GRC budgets post-SEC 2023 disclosure mandate, creating immediate procurement opportunities for Infopace\'s compliance automation suite.\n\n### 4.2 European Regulatory Landscape (30%)\nEurope represents 30% market share, accelerated by GDPR enforcement maturity, NIS2 Directive implementation (October 2024), and DORA (Digital Operational Resilience Act) compliance requirements for financial institutions. Infopace\'s multi-framework compliance engine (GDPR, ISO 27001, DORA) positions it ideally for European enterprise contracts.\n\n### 4.3 Asia-Pacific Expansion Opportunity (17%)\nAsia-Pacific represents the fastest-growing regional opportunity at 17% share and growing at 18% CAGR, driven by Singapore\'s PDPA updates, Australia\'s Privacy Act reforms, and India\'s DPDP Act implementation. Infopace should prioritize Singapore and Australia as APAC beachhead markets, leveraging local compliance expertise and regional data residency infrastructure.',

    competition: '### 5.1 Competitive Landscape Overview\nServiceNow GRC dominates with 28% market share, leveraging its ITSM installed base for GRC cross-sell. RSA Archer holds 20% share among legacy enterprise buyers. However, both platforms suffer from complex implementations (3–9 month deployments) and premium pricing ($600–$1,200/mo), creating significant vulnerability to agile alternatives.\n\n### 5.2 Infopace\'s Competitive Differentiators\nInfopace scores 5/5 on AI Automation and 5/5 on Reporting & Audit — the two dimensions where legacy incumbents are most exposed. The platform\'s zero-code onboarding (< 2 weeks vs. 3–9 months for ServiceNow) and AI-generated assessment reports are unique capabilities that directly address the top pain points cited by target buyers.\n\n### 5.3 Market Entry & Share Capture Strategy\nInfopace\'s 12% current market share represents significant upside relative to market position. By targeting mid-market organizations dissatisfied with over-engineered legacy tools, and leveraging AI-first positioning as a modern alternative, Infopace can credibly target 20–25% market share within 3 years through a combination of product-led growth and direct enterprise sales.',

    radarAnalysis: '### 6.1 Positioning Matrix Analysis\nAcross five competitive dimensions — Compliance Coverage, AI Automation, Ease of Use, Integration Depth, and Reporting & Audit — Infopace outperforms the composite competitor average on AI Automation and Reporting & Audit by a significant margin. These are the two fastest-growing evaluation criteria among enterprise GRC buyers as of 2024.\n\n### 6.2 AI Automation Supremacy\nInfopace\'s AI engine automates 70% of manual risk assessment tasks compared to 30% automation in legacy tools. This translates directly to audit preparation time savings of 60–80 hours per compliance cycle — a measurable ROI that accelerates enterprise procurement decisions.\n\n### 6.3 Integration & Coverage Roadmap\nThe primary gap identified is Compliance Coverage depth — ensuring all major frameworks (PCI-DSS, HIPAA, CMMC, FedRAMP) are natively supported. Roadmap investments in framework library expansion and pre-built integration connectors (for Jira, Slack, ServiceNow, Microsoft 365) will directly close this gap and strengthen the enterprise sales motion.',

    pricing: '### 7.1 Pricing Architecture & Market Positioning\nInfopace\'s tiered pricing strategy ($99/mo Starter, $299/mo Pro, Enterprise custom) represents a 60–75% cost advantage versus ServiceNow GRC and RSA Archer. This aggressive value-based positioning captures budget-constrained mid-market buyers while maintaining premium optionality for enterprise accounts requiring custom SLAs.\n\n### 7.2 Value-Based Pricing Rationale\nThe Pro tier ($299/mo) is engineered to deliver measurable ROI within 60 days of deployment, based on time-saved in audit preparation (avg. 65 hours/cycle × $85/hr analyst cost = $5,525 saved per audit). This positions Infopace\'s pricing as a direct cost-recovery play rather than a discretionary software expense.\n\n### 7.3 Monetization Expansion Levers\nRevenue expansion opportunities include: (1) Professional Services — compliance readiness assessments and training packages; (2) Add-on AI modules — real-time regulatory change alerts and predictive risk scoring; (3) Partner ecosystem commissions — reseller and integration partner revenue share. These levers are projected to expand average contract value (ACV) by 45% within 18 months.',

    risks: '### 8.1 Primary Market Risks\nThe principal risks facing Infopace include ServiceNow\'s existing ITSM customer lock-in (making GRC cross-sell frictionless for incumbents), regulatory fragmentation requiring continuous framework updates, and the high cost of enterprise sales cycles. Each of these risks requires targeted mitigation investment.\n\n### 8.2 Competitive Response Risk\nAs AI-native GRC gains visibility, legacy incumbents are likely to acquire or build competing AI capabilities. ServiceNow\'s $2.85B acquisition of G2K Group signals aggressive expansion. Infopace must establish deep customer relationships and build proprietary AI training data advantages before incumbents can replicate the core value proposition.\n\n### 8.3 Mitigation Framework\nMitigation priorities: (1) Accelerate framework coverage roadmap to pre-empt incumbent catch-up; (2) Build network effects through shared compliance benchmarking data (anonymized) that creates switching costs; (3) Establish enterprise reference customers in each vertical (Finance, Healthcare, Manufacturing) to build credibility and reduce sales friction for subsequent accounts.'
  }
};
