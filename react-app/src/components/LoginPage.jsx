import React, { useState, useEffect } from 'react';
import { sendOtp, verifyOtp } from '../services/api';
import BackgroundCanvas from './BackgroundCanvas';

const s = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    background: '#f8fafc'
  },
  topBar: {
    height: '60px',
    background: '#0b1329',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0,
    zIndex: 10
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  topBarLogo: {
    height: '32px',
    borderRadius: '4px',
    background: '#fff',
    padding: '2px 6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  topBarTextWrap: {
    display: 'flex',
    flexDirection: 'column'
  },
  topBarCompany: {
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    lineHeight: 1.2
  },
  topBarAssessment: {
    color: '#60a5fa',
    fontSize: '9.5px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    lineHeight: 1.2
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  topBarDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 8px #10b981'
  },
  topBarLive: {
    color: '#94a3b8',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  },
  mainArea: {
    display: 'flex',
    flex: 1,
    height: 'calc(100vh - 60px)',
    overflow: 'hidden',
    position: 'relative'
  },
  sidebar: {
    width: '380px',
    background: '#0c1427',
    padding: '40px 30px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    flexShrink: 0,
    borderRight: '1px solid rgba(255,255,255,0.05)',
    zIndex: 5,
    overflowY: 'auto'
  },
  sidebarBrandCard: {
    background: '#ffffff',
    padding: '12px 18px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '32px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  },
  sidebarSubtitle: {
    color: '#38bdf8',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    marginBottom: '12px',
    display: 'block'
  },
  sidebarTitle: {
    fontFamily: '"Playfair Display", "Georgia", serif',
    color: '#ffffff',
    fontSize: '25px',
    fontWeight: 600,
    lineHeight: 1.3,
    marginBottom: '16px'
  },
  sidebarDesc: {
    color: '#94a3b8',
    fontSize: '13.5px',
    lineHeight: 1.55,
    fontWeight: 400
  },
  sidebarDivider: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    margin: '18px 0'
  },
  statNumber: {
    color: '#ffffff',
    fontSize: '22px',
    fontWeight: 700,
    marginBottom: '2px'
  },
  statDesc: {
    color: '#64748b',
    fontSize: '11.5px',
    lineHeight: 1.4
  },
  contentPane: {
    flex: 1,
    background: '#f8fafc',
    backgroundImage: 'linear-gradient(to right, rgba(99, 102, 241, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.03) 1px, transparent 1px)',
    backgroundSize: '36px 36px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '30px 20px',
    overflowY: 'auto',
    position: 'relative'
  },
  card: {
    width: '100%',
    maxWidth: '540px',
    background: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #cbd5e1',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.02)',
    padding: '36px 32px',
    zIndex: 5,
    margin: 'auto'
  },
  cardTitle: {
    fontFamily: '"Playfair Display", "Georgia", serif',
    fontSize: '26px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '4px'
  },
  cardSubtitle: {
    fontSize: '13px',
    color: '#64748b',
    marginBottom: '24px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '18px 20px',
    marginBottom: '24px'
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
    boxShadow: '0 1px 2px rgba(0,0,0,0.01)',
    transition: 'all 0.2s'
  },
  input: {
    width: '100%',
    padding: '11px 14px',
    border: 'none',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
    fontFamily: 'inherit',
    background: 'transparent'
  },
  select: {
    width: '100%',
    padding: '11px 14px',
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
  phonePrefix: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0 12px',
    background: '#f8fafc',
    borderRight: '1px solid #cbd5e1',
    userSelect: 'none'
  },
  phonePrefixText: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155'
  },
  buttonPrimary: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: '6px',
    background: '#1e3a8a',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  buttonDisabled: {
    background: '#94a3b8',
    cursor: 'not-allowed'
  }
};

const teamSizes = ['Solo', '2–5', '6–15', '16–50', '51–200', '200+'];

export default function LoginPage({ onLogin, initialGoogleUser }) {
  const [form, setForm] = useState({
    name: initialGoogleUser?.name || '',
    phone: initialGoogleUser?.phone || '',
    email: initialGoogleUser?.email || '',
    company: initialGoogleUser?.company || '',
    service: initialGoogleUser?.service || '',
    role: initialGoogleUser?.role || '',
    teamSize: ''
  });

  useEffect(() => {
    if (initialGoogleUser) {
      setForm(prev => ({
        ...prev,
        name: initialGoogleUser.name || prev.name,
        email: initialGoogleUser.email || prev.email
      }));
    }
  }, [initialGoogleUser]);

  const handleGoogleSignIn = (e) => {
    if (e) e.preventDefault();
    const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
    if (!SUPABASE_URL) {
      alert('Supabase URL not configured.');
      return;
    }
    const redirectUrl = encodeURIComponent(window.location.origin);
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectUrl}`;
  };

  const [errors, setErrors] = useState({});
  const [currentSubStep, setCurrentSubStep] = useState(1); // 1 or 2
  const [step, setStep] = useState('FORM'); // 'FORM' or 'OTP'
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState(null);
  const [inputFocused, setInputFocused] = useState({});

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    if (errors[k]) {
      setErrors(prev => ({ ...prev, [k]: null }));
    }
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // Only allow numbers (0-9)
    setForm(f => ({ ...f, phone: val.slice(0, 10) })); // Cap at 10 digits
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: null }));
    }
  };

  const setFocus = (k, val) => {
    setInputFocused(prev => ({ ...prev, [k]: val }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!form.company.trim()) errs.company = 'Organization/Company name is required';
    if (!form.role) errs.role = 'Role selection is required';
    
    const phoneClean = form.phone.replace(/\s+/g, '');
    if (!phoneClean) {
      errs.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      errs.phone = 'Must be a 10-digit number starting with 6-9';
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.service.trim()) errs.service = 'Description of your product, service, or business idea is required';
    if (!form.consent) errs.consent = 'You must agree to the terms to proceed';
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    onLogin(form);
  };

  const handleVerify = async () => {
    if (!otp || otp.trim().length !== 6) {
      setOtpError('Please enter a 6-digit OTP code.');
      return;
    }
    setLoading(true);
    setOtpError(null);
    const res = await verifyOtp(form.email, otp);
    setLoading(false);
    if (res.success) {
      onLogin(form);
    } else {
      setOtpError(res.error || 'Invalid OTP code. Please try again.');
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setOtpError(null);
    setOtpSentMsg(null);
    const res = await sendOtp(form.email);
    setLoading(false);
    if (res.success) {
      setOtpSentMsg('A new verification code has been sent.');
    } else {
      setOtpError(res.error || 'Failed to resend code.');
    }
  };

  const renderStepIndicator = () => {
    const isStep1 = step === 'FORM' && currentSubStep === 1;
    const isStep2 = step === 'FORM' && currentSubStep === 2;
    const isOTP = step === 'OTP';
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Step 1 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: '#1e3a8a',
              color: '#fff', fontSize: '10px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              1
            </div>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#1e3a8a' }}>
              Personal details
            </span>
          </div>

          {/* Line */}
          <div style={{ width: '30px', height: '1px', background: '#cbd5e1' }} />

          {/* Step 2 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: (isStep2 || isOTP) ? '#1e3a8a' : '#f1f5f9',
              color: (isStep2 || isOTP) ? '#fff' : '#64748b', fontSize: '10px', fontWeight: 700,
              border: (isStep2 || isOTP) ? 'none' : '1px solid #cbd5e1',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              2
            </div>
            <span style={{ fontSize: '12.5px', fontWeight: (isStep2 || isOTP) ? 600 : 500, color: (isStep2 || isOTP) ? '#1e3a8a' : '#64748b' }}>
              Venture context
            </span>
          </div>
        </div>
        
        <div style={{ fontSize: '12.5px', color: '#94a3b8', fontWeight: 600 }}>
          {isStep1 ? '1 / 2' : (isStep2 ? '2 / 2' : 'Verify')}
        </div>
      </div>
    );
  };

  const getBorderColor = (k, error) => {
    if (error) return 'var(--danger)';
    if (inputFocused[k]) return '#1e3a8a';
    return '#cbd5e1';
  };

  const getBoxShadow = (k) => {
    if (inputFocused[k]) return '0 0 0 1px #1e3a8a';
    return '0 1px 2px rgba(0,0,0,0.01)';
  };

  return (
    <div style={s.container}>
      {/* Top Header Bar */}
      <div style={s.topBar}>
        <div style={s.topBarLeft}>
          <div style={s.topBarLogo}>
            <img src="/logo.png" alt="Logo Icon" style={{ height: '20px', objectFit: 'contain' }} />
          </div>
          <div style={s.topBarTextWrap}>
            <span style={s.topBarCompany}>Infopace Management Pvt Ltd</span>
            <span style={s.topBarAssessment}>Market Research</span>
          </div>
        </div>
        <div style={s.topBarRight}>
          <div style={s.topBarDot} />
          <span style={s.topBarLive}>Live Analysis</span>
        </div>
      </div>

      {/* Main Area Layout */}
      <div style={s.mainArea}>
        {/* Left Columns branding panel */}
        <div style={s.sidebar}>
          <div>
            <div style={s.sidebarBrandCard}>
              <img src="/logo.png" alt="Infopace Logo" style={{ height: '28px', objectFit: 'contain' }} />
            </div>
            <span style={s.sidebarSubtitle}>Market Research</span>
            <h2 style={s.sidebarTitle}>Know your market before your competitors do.</h2>
            <p style={s.sidebarDesc}>
              Our engine maps your sector, geography, and model — then surfaces a personalised intelligence brief within minutes.
            </p>

            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { title: 'Instant Boardroom Insights', desc: 'Get a professional-grade market analysis in under 60 seconds, saving weeks of manual desk research.' },
                { title: 'Personalized Market Roadmaps', desc: 'No generic templates. Receive custom benchmarks tailored specifically to your product and geography.' },
                { title: 'Investment-Grade PDF Reports', desc: 'Instantly download structured, A4 PDF reports designed to impress investors and stakeholders.' }
              ].map((pt, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ color: '#38bdf8', fontSize: '14px', marginTop: '2px', fontWeight: 'bold' }}>✓</span>
                  <div>
                    <h4 style={{ color: '#ffffff', fontSize: '13.5px', fontWeight: 600, marginBottom: '2px' }}>{pt.title}</h4>
                    <p style={{ color: '#94a3b8', fontSize: '12px', lineHeight: 1.45 }}>{pt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={s.sidebarDivider} />
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ flex: 1 }}>
                <div style={s.statNumber}>2×</div>
                <div style={s.statDesc}>Faster than traditional research</div>
              </div>
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.08)' }} />
              <div style={{ flex: 1 }}>
                <div style={s.statNumber}>35+</div>
                <div style={s.statDesc}>Data points analysed per assessment</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right content pane with reactive background */}
        <div style={s.contentPane}>
          <BackgroundCanvas />

          <div className="animate-fade-in" style={s.card}>
            {renderStepIndicator()}

            {/* Sub-step 1: Personal Details */}
            {step === 'FORM' && currentSubStep === 1 && (
              <div>
                <h3 style={s.cardTitle}>Personal details</h3>
                <p style={s.cardSubtitle}>Stored securely. Never shared.</p>

                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                    marginTop: '16px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s',
                    fontFamily: 'inherit'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" style={{ display: 'block' }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#94a3b8', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                  <span>OR CONTINUE MANUALLY</span>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                </div>

                <div style={s.grid}>
                  <div style={s.field}>
                    <label style={s.label}>Full Name *</label>
                    <div style={{ ...s.inputWrap, borderColor: getBorderColor('name', errors.name), boxShadow: getBoxShadow('name') }}>
                      <input
                        type="text"
                        placeholder="Jane Doe"
                        value={form.name}
                        onChange={set('name')}
                        onFocus={() => setFocus('name', true)}
                        onBlur={() => setFocus('name', false)}
                        style={s.input}
                      />
                    </div>
                    {errors.name && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>{errors.name}</div>}
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Email *</label>
                    <div style={{ ...s.inputWrap, borderColor: getBorderColor('email', errors.email), boxShadow: getBoxShadow('email') }}>
                      <input
                        type="email"
                        placeholder="jane@company.com"
                        value={form.email}
                        onChange={set('email')}
                        onFocus={() => setFocus('email', true)}
                        onBlur={() => setFocus('email', false)}
                        style={s.input}
                      />
                    </div>
                    {errors.email && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>{errors.email}</div>}
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Organization *</label>
                    <div style={{ ...s.inputWrap, borderColor: getBorderColor('company', errors.company), boxShadow: getBoxShadow('company') }}>
                      <input
                        type="text"
                        placeholder="Acme Technologies"
                        value={form.company}
                        onChange={set('company')}
                        onFocus={() => setFocus('company', true)}
                        onBlur={() => setFocus('company', false)}
                        style={s.input}
                      />
                    </div>
                    {errors.company && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>{errors.company}</div>}
                  </div>

                  <div style={s.field}>
                    <label style={s.label}>Role *</label>
                    <div style={{ ...s.inputWrap, borderColor: getBorderColor('role', errors.role), boxShadow: getBoxShadow('role') }}>
                      <select
                        value={form.role}
                        onChange={set('role')}
                        onFocus={() => setFocus('role', true)}
                        onBlur={() => setFocus('role', false)}
                        style={s.select}
                      >
                        <option value="">Select...</option>
                        <option value="Founder / Co-Founder">Founder / Co-Founder</option>
                        <option value="Executive / CEO">Executive / CEO</option>
                        <option value="Product Manager">Product Manager</option>
                        <option value="Developer / Engineer">Developer / Engineer</option>
                        <option value="Marketer / Sales">Marketer / Sales</option>
                        <option value="Consultant / Analyst">Consultant / Analyst</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {errors.role && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>{errors.role}</div>}
                  </div>

                  <div style={{ ...s.field, gridColumn: '1 / -1' }}>
                    <label style={s.label}>Phone *</label>
                    <div style={{ ...s.inputWrap, borderColor: getBorderColor('phone', errors.phone), boxShadow: getBoxShadow('phone'), alignItems: 'center' }}>
                      <div style={s.phonePrefix}>
                        <span style={{ fontSize: '16px' }}>🇮🇳</span>
                        <span style={s.phonePrefixText}>+91</span>
                      </div>
                      <input
                        type="text"
                        placeholder="9876543210"
                        value={form.phone}
                        onChange={handlePhoneChange}
                        onFocus={() => setFocus('phone', true)}
                        onBlur={() => setFocus('phone', false)}
                        style={s.input}
                      />
                    </div>
                    {errors.phone ? (
                      <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>{errors.phone}</div>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>India: 10 digits, starts 6–9</span>
                    )}
                  </div>

                  {/* Team Size Option */}
                  <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                    <label style={s.label}>Team Size (Optional)</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {teamSizes.map(sz => {
                        const isSel = form.teamSize === sz;
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, teamSize: sz }))}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '6px',
                              border: isSel ? '2px solid #1e3a8a' : '1px solid #cbd5e1',
                              background: isSel ? '#eff6ff' : '#ffffff',
                              color: isSel ? '#1e3a8a' : '#475569',
                              fontSize: '12.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                              minWidth: '65px',
                              textAlign: 'center'
                            }}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (validateStep1()) {
                      setCurrentSubStep(2);
                    }
                  }}
                  style={s.buttonPrimary}
                  onMouseOver={e => e.currentTarget.style.background = '#1e293b'}
                  onMouseOut={e => e.currentTarget.style.background = '#1e3a8a'}
                >
                  Continue →
                </button>
              </div>
            )}

            {/* Sub-step 2: Venture Context */}
            {step === 'FORM' && currentSubStep === 2 && (
              <div>
                <h3 style={s.cardTitle}>Venture context</h3>
                <p style={s.cardSubtitle}>Describe your core offering to feed the intelligence engine.</p>

                {otpError && (
                  <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '13px', fontWeight: 600, marginBottom: '20px', border: '1px solid #fecaca', textAlign: 'center' }}>
                    ⚠️ {otpError}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  <div style={s.field}>
                    <label style={s.label}>Service / Product *</label>
                    <div style={{ ...s.inputWrap, borderColor: getBorderColor('service', errors.service), boxShadow: getBoxShadow('service') }}>
                      <textarea
                        rows={4}
                        placeholder="Describe your core product or service offering..."
                        value={form.service}
                        onChange={set('service')}
                        onFocus={() => setFocus('service', true)}
                        onBlur={() => setFocus('service', false)}
                        style={{ ...s.input, resize: 'none' }}
                      />
                    </div>
                    {errors.service && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>{errors.service}</div>}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        id="consent"
                        checked={form.consent || false}
                        onChange={(e) => {
                          setForm(f => ({ ...f, consent: e.target.checked }));
                          if (errors.consent) {
                            setErrors(prev => ({ ...prev, consent: null }));
                          }
                        }}
                        style={{ width: '17px', height: '17px', marginTop: '1px', cursor: 'pointer', accentColor: '#1e3a8a' }}
                      />
                      <label htmlFor="consent" style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.45, cursor: 'pointer', userSelect: 'none' }}>
                        I consent to the collection and processing of my details to generate this market research dashboard.
                      </label>
                    </div>
                    {errors.consent && <div style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px', fontWeight: 600 }}>{errors.consent}</div>}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => setCurrentSubStep(1)}
                    disabled={loading}
                    style={{
                      flex: '0 0 100px',
                      padding: '14px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      background: '#ffffff',
                      color: '#475569',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#f8fafc' }}
                    onMouseOut={e => { e.currentTarget.style.background = '#ffffff' }}
                  >
                    ← Back
                  </button>
                  
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{
                      ...s.buttonPrimary,
                      flex: 1,
                      ...(loading ? s.buttonDisabled : {})
                    }}
                    onMouseOver={e => { if(!loading) e.currentTarget.style.background = '#1e293b' }}
                    onMouseOut={e => { if(!loading) e.currentTarget.style.background = '#1e3a8a' }}
                  >
                    {loading ? 'Processing...' : 'Proceed to Research'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: OTP Verification */}
            {step === 'OTP' && (
              <div>
                <h3 style={s.cardTitle}>Email Verification</h3>
                <p style={s.cardSubtitle}>
                  A 6-digit verification code has been sent to:<br/>
                  <strong style={{ color: '#0f172a' }}>{form.email}</strong>
                </p>

                {otpSentMsg && (
                  <div style={{ padding: '10px 14px', background: '#f0fdf4', color: '#16a34a', borderRadius: '6px', fontSize: '13px', fontWeight: 600, marginBottom: '20px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                    ✓ {otpSentMsg}
                  </div>
                )}

                {otpError && (
                  <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#dc2626', borderRadius: '6px', fontSize: '13px', fontWeight: 600, marginBottom: '20px', border: '1px solid #fecaca', textAlign: 'center' }}>
                    ⚠️ {otpError}
                  </div>
                )}

                <div style={{ ...s.field, marginBottom: '24px' }}>
                  <label style={{ ...s.label, textAlign: 'center' }}>Enter 6-Digit Code</label>
                  <div style={{ ...s.inputWrap, borderColor: getBorderColor('otp', otpError), boxShadow: getBoxShadow('otp') }}>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      disabled={loading}
                      onFocus={() => setFocus('otp', true)}
                      onBlur={() => setFocus('otp', false)}
                      style={{
                        ...s.input,
                        textAlign: 'center',
                        fontSize: '22px',
                        fontWeight: 700,
                        letterSpacing: '10px',
                        padding: '12px 16px',
                        fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleVerify}
                  disabled={loading || otp.length !== 6}
                  style={{
                    ...s.buttonPrimary,
                    ...((loading || otp.length !== 6) ? s.buttonDisabled : {})
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify & Proceed'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                  <button
                    onClick={handleResend}
                    disabled={loading}
                    style={{
                      background: 'none', border: 'none', color: '#2563eb', fontSize: '13.5px', fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer', padding: 0
                    }}
                  >
                    Resend Code
                  </button>
                  <button
                    onClick={() => {
                      setStep('FORM');
                      setCurrentSubStep(2);
                      setOtp('');
                      setOtpError(null);
                      setOtpSentMsg(null);
                    }}
                    disabled={loading}
                    style={{
                      background: 'none', border: 'none', color: '#64748b', fontSize: '13.5px', fontWeight: 600,
                      cursor: loading ? 'not-allowed' : 'pointer', padding: 0
                    }}
                  >
                    ← Edit Details
                  </button>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
