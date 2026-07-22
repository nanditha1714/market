import React, { useState } from 'react';
import BackgroundCanvas from './BackgroundCanvas';

const s = {
  container: {
    position: 'fixed',
    inset: 0,
    background: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    overflowY: 'auto',
    backgroundImage: 'linear-gradient(to right, rgba(99, 102, 241, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.03) 1px, transparent 1px)',
    backgroundSize: '36px 36px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif'
  },
  headerWrap: {
    textAlign: 'center',
    marginBottom: '20px',
    zIndex: 5,
    maxWidth: '800px',
    flexShrink: 0
  },
  title: {
    fontFamily: '"Playfair Display", "Georgia", serif',
    fontSize: '30px',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    marginBottom: '6px'
  },
  subtitle: {
    fontSize: '13.5px',
    color: '#475569',
    lineHeight: 1.45,
    margin: 0
  },
  tabsWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px',
    background: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    overflowX: 'auto',
    marginBottom: '20px',
    zIndex: 5,
    maxWidth: '840px',
    width: '100%',
    justifyContent: 'space-between',
    boxSizing: 'border-box'
  },
  tabActive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: '#1d4ed8',
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    transition: 'all 0.2s',
    minWidth: '95px',
    justifyContent: 'center',
    userSelect: 'none'
  },
  tabInactive: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    color: '#64748b',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.2s',
    minWidth: '95px',
    justifyContent: 'center',
    userSelect: 'none'
  },
  tabCircleActive: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: '#ffffff',
    color: '#1d4ed8',
    fontSize: '9.5px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabCircleInactive: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: '#f1f5f9',
    color: '#64748b',
    fontSize: '9.5px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    width: '100%',
    maxWidth: '840px',
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #cbd5e1',
    borderTop: '4px solid #2563eb',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.02)',
    zIndex: 5,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    margin: 'auto'
  },
  cardHeader: {
    padding: '20px 28px',
    borderBottom: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  headerIconWrap: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    background: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0
  },
  headerTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0
  },
  headerSubtitle: {
    fontSize: '12px',
    color: '#64748b',
    margin: '2px 0 0 0'
  },
  cardBody: {
    padding: '28px'
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '18px 20px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  inputWrap: {
    display: 'flex',
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    overflow: 'hidden',
    transition: 'all 0.2s'
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: 'none',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    fontFamily: 'inherit',
    background: 'transparent'
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    border: 'none',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    fontFamily: 'inherit',
    background: 'url("data:image/svg+xml;utf8,<svg fill=\'%2364748b\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/></svg>") no-repeat right 12px center',
    backgroundSize: '18px',
    paddingRight: '32px',
    appearance: 'none',
    cursor: 'pointer'
  },
  cardFooter: {
    padding: '18px 28px',
    background: '#f8fafc',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  buttonPrimary: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    background: '#1d4ed8',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  buttonSecondary: {
    padding: '10px 20px',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    background: '#ffffff',
    color: '#475569',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  buttonDisabled: {
    background: '#94a3b8',
    cursor: 'not-allowed'
  }
};

const stages = ['Idea Stage', 'MVP / Prototype', 'Live Pilots', 'Paying Customers', 'Scaling / Growth'];

export default function SurveyPage({ user, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState({
    businessName: user?.company || '',
    industry: '',
    businessType: '',
    geo: '',
    problem: '',
    sc: '',
    tam: '',
    marketDrivers: '',
    customer: '',
    painPoints: '',
    competitors: '',
    strengths: '',
    pricing: '',
    price: '',
    challenges: '',
    ratings: '',
    gtm: '',
    consent: false
  });
  const [inputFocused, setInputFocused] = useState({});
  const [gibberishError, setGibberishError] = useState(null);

  const isGibberish = (text) => {
    if (!text || text.trim().length === 0) return false;
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().split(/\s+/);
    for (const word of words) {
      if (/^[a-z]+$/.test(word)) {
        if (word.length > 5) {
          const vowels = (word.match(/[aeiou]/g) || []).length;
          if (vowels === 0) return true;
          if (word.length > 8 && (vowels / word.length) < 0.15) return true;
        }
        if (/(?:asdf|qwerty|zxcv|lkjh|mnbvc|12345)/i.test(word)) return true;
        if (/(.)\1{4,}/.test(word)) return true;
      }
    }
    if (words.length > 3) {
      const unique = new Set(words);
      if (unique.size / words.length < 0.35) return true;
    }
    return false;
  };

  const checkCurrentStepGibberish = () => {
    const checkFields = [];
    if (currentStep === 1) {
      checkFields.push({ name: 'Product/Business Name', val: form.businessName, key: 'businessName' });
      checkFields.push({ name: 'Problem description', val: form.problem, key: 'problem' });
    } else if (currentStep === 2) {
      checkFields.push({ name: 'TAM estimate', val: form.tam, key: 'tam' });
      checkFields.push({ name: 'Market Drivers', val: form.marketDrivers, key: 'marketDrivers' });
    } else if (currentStep === 3) {
      checkFields.push({ name: 'Target Customer', val: form.customer, key: 'customer' });
      checkFields.push({ name: 'Customer Pain Points', val: form.painPoints, key: 'painPoints' });
    } else if (currentStep === 4) {
      const compList = form.competitors.split(',').map(c => c.trim()).filter(c => c.length > 5);
      for (const comp of compList) {
        checkFields.push({ name: 'Competitor name', val: comp, key: 'competitors' });
      }
      checkFields.push({ name: 'Strengths/weaknesses', val: form.strengths, key: 'strengths' });
    } else if (currentStep === 5) {
      checkFields.push({ name: 'Average Pricing Rate', val: form.price, key: 'price' });
    } else if (currentStep === 6) {
      checkFields.push({ name: 'Biggest Roadblocks', val: form.challenges, key: 'challenges' });
      checkFields.push({ name: 'Key Vulnerabilities', val: form.ratings, key: 'ratings' });
    } else if (currentStep === 7) {
      if (form.gtm.trim()) {
        checkFields.push({ name: 'Go-To-Market strategy', val: form.gtm, key: 'gtm' });
      }
    }
    for (const f of checkFields) {
      if (isGibberish(f.val)) {
        return `Nonsensical or test inputs detected in "${f.name}". Please answer the questions properly once again.`;
      }
    }
    return null;
  };

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setGibberishError(null);
  };
  const setFocus = (k, val) => setInputFocused(prev => ({ ...prev, [k]: val }));

  const getBorderColor = (k) => {
    if (gibberishError && isFieldCheckedInCurrentStep(k) && isGibberish(form[k])) return 'var(--danger)';
    return inputFocused[k] ? '#1d4ed8' : '#cbd5e1';
  };
  const getBoxShadow = (k) => {
    if (gibberishError && isFieldCheckedInCurrentStep(k) && isGibberish(form[k])) return '0 0 0 1px var(--danger)';
    return inputFocused[k] ? '0 0 0 1px #1d4ed8' : 'none';
  };

  const isFieldCheckedInCurrentStep = (k) => {
    if (currentStep === 1) return k === 'businessName' || k === 'problem';
    if (currentStep === 2) return k === 'tam' || k === 'marketDrivers';
    if (currentStep === 3) return k === 'customer' || k === 'painPoints';
    if (currentStep === 4) return k === 'competitors' || k === 'strengths';
    if (currentStep === 5) return k === 'price';
    if (currentStep === 6) return k === 'challenges' || k === 'ratings';
    if (currentStep === 7) return k === 'gtm';
    return false;
  };

  const getStepIcon = (step) => {
    switch (step) {
      case 1: return '🚀';
      case 2: return '📈';
      case 3: return '👥';
      case 4: return '🏆';
      case 5: return '💰';
      case 6: return '⚠️';
      case 7: return '🗺️';
      default: return '📝';
    }
  };

  const getStepTitle = (step) => {
    switch (step) {
      case 1: return 'Tell us about your product';
      case 2: return 'Analyze your market size';
      case 3: return 'Identify your target audience';
      case 4: return 'Map the competitive landscape';
      case 5: return 'Determine pricing and revenue';
      case 6: return 'Assess market risks & challenges';
      case 7: return 'Formulate Go-To-Market strategy';
      default: return 'Market Parameters';
    }
  };

  const getStepSubtitle = (step) => {
    switch (step) {
      case 1: return 'This drives everything — AI tailors all subsequent questions to your exact context';
      case 2: return 'Estimate your addressable market space and core macro demand factors';
      case 3: return 'Define your target customer profiles and their primary operational pain points';
      case 4: return 'List your top competitors and how your capabilities benchmark against them';
      case 5: return 'Specify your monetization architectures and target pricing tiers';
      case 6: return 'Identify roadblocks, operational risks, and key barriers to entry';
      case 7: return 'Outline GTM marketing vectors and submit to generate your dashboard';
      default: return 'Define parameters to populate analysis metrics';
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          form.businessName.trim().length > 0 &&
          form.industry.length > 0 &&
          form.businessType.length > 0 &&
          form.geo.length > 0 &&
          form.problem.trim().length >= 20 &&
          form.sc.length > 0
        );
      case 2:
        return form.tam.trim().length > 0 && form.marketDrivers.trim().length > 0;
      case 3:
        return form.customer.trim().length > 0 && form.painPoints.trim().length > 0;
      case 4:
        return form.competitors.trim().length > 0 && form.strengths.trim().length > 0;
      case 5:
        return form.pricing.length > 0 && form.price.trim().length > 0;
      case 6:
        return form.challenges.trim().length > 0 && form.ratings.trim().length > 0;
      case 7:
        return form.consent;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!isStepValid()) return;
    
    // Check for gibberish
    const gibberishMsg = checkCurrentStepGibberish();
    if (gibberishMsg) {
      setGibberishError(gibberishMsg);
      return;
    }

    if (currentStep < 7) {
      setCurrentStep(c => c + 1);
    } else {
      // Compile everything back to the 10 baseline keys expected by App.jsx
      const compiled = {
        industry: `${form.industry} (${form.businessType})`,
        problem: `${form.problem}${form.marketDrivers ? '\n\nMarket Drivers: ' + form.marketDrivers : ''}`,
        customer: `${form.customer}${form.painPoints ? '\n\nPain Points: ' + form.painPoints : ''}`,
        geo: form.geo,
        tam: form.tam,
        competitors: form.competitors,
        pricing: form.pricing,
        price: form.price,
        ratings: `${form.strengths}${form.ratings ? '\n\nCapabilities Vector: ' + form.ratings : ''}`,
        sc: `${form.sc} Stage. Roadblocks: ${form.challenges}${form.gtm ? '\n\nGTM Strategy: ' + form.gtm : ''}`
      };
      onComplete(compiled);
    }
  };

  const renderStepFields = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={s.grid2}>
            <div style={s.field}>
              <label style={s.label}>Product / Business Name *</label>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('businessName'), boxShadow: getBoxShadow('businessName') }}>
                <input
                  type="text"
                  placeholder="e.g. MediSense AI"
                  value={form.businessName}
                  onChange={set('businessName')}
                  onFocus={() => setFocus('businessName', true)}
                  onBlur={() => setFocus('businessName', false)}
                  style={s.input}
                />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Industry Sector *</label>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('industry'), boxShadow: getBoxShadow('industry') }}>
                <select
                  value={form.industry}
                  onChange={set('industry')}
                  onFocus={() => setFocus('industry', true)}
                  onBlur={() => setFocus('industry', false)}
                  style={s.select}
                >
                  <option value="">Select...</option>
                  <option value="Healthcare & Pharma">Healthcare & Pharma</option>
                  <option value="Technology & SaaS">Technology & SaaS</option>
                  <option value="E-commerce & Retail">E-commerce & Retail</option>
                  <option value="Finance & FinTech">Finance & FinTech</option>
                  <option value="Education & EdTech">Education & EdTech</option>
                  <option value="Manufacturing & Industrial">Manufacturing & Industrial</option>
                  <option value="Energy & CleanTech">Energy & CleanTech</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Business Type *</label>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('businessType'), boxShadow: getBoxShadow('businessType') }}>
                <select
                  value={form.businessType}
                  onChange={set('businessType')}
                  onFocus={() => setFocus('businessType', true)}
                  onBlur={() => setFocus('businessType', false)}
                  style={s.select}
                >
                  <option value="">Select...</option>
                  <option value="B2B — Enterprise">B2B — Enterprise</option>
                  <option value="B2B — SMBs">B2B — SMBs</option>
                  <option value="B2C — Mass Market Consumer">B2C — Mass Market Consumer</option>
                  <option value="B2C — Premium / Niche">B2C — Premium / Niche</option>
                  <option value="Marketplace / Platform">Marketplace / Platform</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Target Geography *</label>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('geo'), boxShadow: getBoxShadow('geo') }}>
                <select
                  value={form.geo}
                  onChange={set('geo')}
                  onFocus={() => setFocus('geo', true)}
                  onBlur={() => setFocus('geo', false)}
                  style={s.select}
                >
                  <option value="">Select...</option>
                  <option value="North America">North America</option>
                  <option value="Europe (EU/UK)">Europe (EU/UK)</option>
                  <option value="South Asia (SAARC)">South Asia (SAARC)</option>
                  <option value="East Asia & Pacific">East Asia & Pacific</option>
                  <option value="Latin America">Latin America</option>
                  <option value="Middle East & Africa">Middle East & Africa</option>
                  <option value="Global">Global</option>
                </select>
              </div>
            </div>

            <div style={{ ...s.field, gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={s.label}>What problem does your product solve? * (Be Specific)</label>
                <span style={{ fontSize: '11px', color: form.problem.trim().length >= 20 ? '#16a34a' : '#64748b', fontWeight: 600 }}>
                  {form.problem.trim().length} / min 20 {form.problem.trim().length >= 20 && '✓'}
                </span>
              </div>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('problem'), boxShadow: getBoxShadow('problem') }}>
                <textarea
                  rows={3}
                  placeholder="e.g. Manual patient monitoring in hospitals is error-prone and takes too much staff time, leading to patient neglect..."
                  value={form.problem}
                  onChange={set('problem')}
                  onFocus={() => setFocus('problem', true)}
                  onBlur={() => setFocus('problem', false)}
                  style={{ ...s.input, resize: 'none' }}
                />
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748b', marginTop: '-3px' }}>Be specific — min 20 characters</span>
            </div>

            {/* Stage Selector */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={s.label}>Stage of Business *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {stages.map(st => {
                  const isSel = form.sc === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, sc: st }))}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '6px',
                        border: isSel ? '2px solid #1d4ed8' : '1px solid #cbd5e1',
                        background: isSel ? '#eff6ff' : '#ffffff',
                        color: isSel ? '#1d4ed8' : '#475569',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        minWidth: '100px',
                        textAlign: 'center'
                      }}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={s.field}>
              <label style={s.label}>Estimated Total Addressable Market (TAM) *</label>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('tam'), boxShadow: getBoxShadow('tam') }}>
                <input
                  type="text"
                  placeholder="e.g. $5B, around $500M, or 'Not sure yet'..."
                  value={form.tam}
                  onChange={set('tam')}
                  onFocus={() => setFocus('tam', true)}
                  onBlur={() => setFocus('tam', false)}
                  style={s.input}
                />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Core Market Drivers & growth factors *</label>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('marketDrivers'), boxShadow: getBoxShadow('marketDrivers') }}>
                <textarea
                  rows={4}
                  placeholder="e.g. Acceleration in cloud adoption, rising internet usage, or government mandates on data compliance..."
                  value={form.marketDrivers}
                  onChange={set('marketDrivers')}
                  onFocus={() => setFocus('marketDrivers', true)}
                  onBlur={() => setFocus('marketDrivers', false)}
                  style={{ ...s.input, resize: 'none' }}
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={s.field}>
              <label style={s.label}>Target Customer / User Profile *</label>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('customer'), boxShadow: getBoxShadow('customer') }}>
                <textarea
                  rows={3}
                  placeholder="e.g. B2B enterprise IT directors, SMB business owners, or patients with chronic healthcare conditions..."
                  value={form.customer}
                  onChange={set('customer')}
                  onFocus={() => setFocus('customer', true)}
                  onBlur={() => setFocus('customer', false)}
                  style={{ ...s.input, resize: 'none' }}
                />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Primary Customer Pain Points *</label>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('painPoints'), boxShadow: getBoxShadow('painPoints') }}>
                <textarea
                  rows={3}
                  placeholder="e.g. High operation costs, lack of real-time insights, manual spreadsheet workflows, or compliance fines..."
                  value={form.painPoints}
                  onChange={set('painPoints')}
                  onFocus={() => setFocus('painPoints', true)}
                  onBlur={() => setFocus('painPoints', false)}
                  style={{ ...s.input, resize: 'none' }}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={s.field}>
              <label style={s.label}>Top 3 Competitors * (Comma-separated)</label>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('competitors'), boxShadow: getBoxShadow('competitors') }}>
                <input
                  type="text"
                  placeholder="e.g. Salesforce, HubSpot, Zoho (or 'None' if creating a new niche)"
                  value={form.competitors}
                  onChange={set('competitors')}
                  onFocus={() => setFocus('competitors', true)}
                  onBlur={() => setFocus('competitors', false)}
                  style={s.input}
                />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Your strengths & weaknesses vs Competitors *</label>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('strengths'), boxShadow: getBoxShadow('strengths') }}>
                <textarea
                  rows={4}
                  placeholder="e.g. Strength: We offer a mobile-friendly application. Weakness: Legacy players have larger brand awareness."
                  value={form.strengths}
                  onChange={set('strengths')}
                  onFocus={() => setFocus('strengths', true)}
                  onBlur={() => setFocus('strengths', false)}
                  style={{ ...s.input, resize: 'none' }}
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div style={s.grid2}>
            <div style={s.field}>
              <label style={s.label}>Pricing Model *</label>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('pricing'), boxShadow: getBoxShadow('pricing') }}>
                <select
                  value={form.pricing}
                  onChange={set('pricing')}
                  onFocus={() => setFocus('pricing', true)}
                  onBlur={() => setFocus('pricing', false)}
                  style={s.select}
                >
                  <option value="">Select...</option>
                  <option value="Subscription / SaaS">Subscription / SaaS</option>
                  <option value="One-time purchase">One-time purchase</option>
                  <option value="Usage-based / Pay-as-you-go">Usage-based / Pay-as-you-go</option>
                  <option value="Freemium">Freemium</option>
                  <option value="Commission / Take-rate">Commission / Take-rate</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Average Pricing Rate *</label>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('price'), boxShadow: getBoxShadow('price') }}>
                <input
                  type="text"
                  placeholder="e.g. $49/month per user, $499 one-time"
                  value={form.price}
                  onChange={set('price')}
                  onFocus={() => setFocus('price', true)}
                  onBlur={() => setFocus('price', false)}
                  style={s.input}
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={s.field}>
              <label style={s.label}>Biggest Roadblocks & Market Barriers *</label>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('challenges'), boxShadow: getBoxShadow('challenges') }}>
                <textarea
                  rows={3}
                  placeholder="e.g. Navigating complex global healthcare regulations, intense CAC friction, or customer skepticism of new tech..."
                  value={form.challenges}
                  onChange={set('challenges')}
                  onFocus={() => setFocus('challenges', true)}
                  onBlur={() => setFocus('challenges', false)}
                  style={{ ...s.input, resize: 'none' }}
                />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Key Technical / Product Vulnerabilities *</label>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('ratings'), boxShadow: getBoxShadow('ratings') }}>
                <textarea
                  rows={3}
                  placeholder="e.g. Large developer footprint required, cloud data security vulnerabilities, or dependencies on legacy integrations..."
                  value={form.ratings}
                  onChange={set('ratings')}
                  onFocus={() => setFocus('ratings', true)}
                  onBlur={() => setFocus('ratings', false)}
                  style={{ ...s.input, resize: 'none' }}
                />
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={s.field}>
              <label style={s.label}>Go-To-Market Marketing Channels (Optional)</label>
              <div style={{ ...s.inputWrap, borderColor: getBorderColor('gtm'), boxShadow: getBoxShadow('gtm') }}>
                <textarea
                  rows={4}
                  placeholder="e.g. organic SEO articles, paid developer ads, inbound content marketing, or direct enterprise outreach..."
                  value={form.gtm}
                  onChange={set('gtm')}
                  onFocus={() => setFocus('gtm', true)}
                  onBlur={() => setFocus('gtm', false)}
                  style={{ ...s.input, resize: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '12px' }}>
              <input 
                type="checkbox" 
                id="consentResearch"
                checked={form.consent}
                onChange={(e) => setForm(f => ({ ...f, consent: e.target.checked }))}
                style={{ width: '18px', height: '18px', marginTop: '1px', cursor: 'pointer', accentColor: '#1d4ed8' }}
              />
              <label htmlFor="consentResearch" style={{ fontSize: '13px', color: '#475569', lineHeight: 1.45, cursor: 'pointer', userSelect: 'none' }}>
                I authorize the AI engine to compile my survey parameters, perform real-time baseline indexing, and output a detailed research report.
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={s.container}>
      <BackgroundCanvas />
      
      {/* Title Header */}
      <div style={s.headerWrap}>
        <h1 style={s.title}>Market Research</h1>
        <p style={s.subtitle}>
          Describe your product. Our AI reads your sector, geography and business type — then generates custom questions and a personalised market intelligence dashboard.
        </p>
      </div>

      {/* Tabs Container */}
      <div style={s.tabsWrap}>
        {[
          { num: 1, label: 'About' },
          { num: 2, label: 'Market' },
          { num: 3, label: 'Audience' },
          { num: 4, label: 'Competition' },
          { num: 5, label: 'Revenue' },
          { num: 6, label: 'Risk' },
          { num: 7, label: 'GTM' }
        ].map((tab) => {
          const isActive = currentStep === tab.num;
          return (
            <div
              key={tab.num}
              style={isActive ? s.tabActive : s.tabInactive}
            >
              <div style={isActive ? s.tabCircleActive : s.tabCircleInactive}>
                {tab.num}
              </div>
              <span>{tab.label}</span>
            </div>
          );
        })}
      </div>

      {/* Main Form Card */}
      <div className="animate-fade-in" style={s.card}>
        
        {/* Card Header */}
        <div style={s.cardHeader}>
          <div style={s.headerIconWrap}>
            {getStepIcon(currentStep)}
          </div>
          <div>
            <h3 style={s.headerTitle}>{getStepTitle(currentStep)}</h3>
            <p style={s.headerSubtitle}>{getStepSubtitle(currentStep)}</p>
          </div>
        </div>

        {/* Card Body */}
        <div style={s.cardBody}>
          {renderStepFields()}

          {gibberishError && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: '#fef2f2',
              borderLeft: '4px solid #ef4444',
              borderRadius: '4px',
              color: '#991b1b',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <span>{gibberishError}</span>
            </div>
          )}
        </div>

        {/* Card Footer */}
        <div style={s.cardFooter}>
          {currentStep > 1 ? (
            <button
              onClick={() => setCurrentStep(c => c - 1)}
              style={s.buttonSecondary}
              onMouseOver={e => e.currentTarget.style.background = '#f1f5f9'}
              onMouseOut={e => e.currentTarget.style.background = '#ffffff'}
            >
              ← Back
            </button>
          ) : <div />}

          <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
            Step {currentStep} of 7
          </span>

          <button
            onClick={handleNext}
            disabled={!isStepValid()}
            style={{
              ...s.buttonPrimary,
              ...(!isStepValid() ? s.buttonDisabled : {})
            }}
            onMouseOver={e => { if(isStepValid()) e.currentTarget.style.background = '#1e3a8a' }}
            onMouseOut={e => { if(isStepValid()) e.currentTarget.style.background = '#1d4ed8' }}
          >
            {currentStep === 7 ? 'Execute Analysis & Generate Dashboard →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
