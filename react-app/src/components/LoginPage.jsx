import React, { useState } from 'react';
import { sendOtp, verifyOtp } from '../services/api';

const s = {
  wrap: { 
    position: 'fixed', inset: 0, 
    background: '#e4edf5', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    padding: '40px 20px', overflowY: 'auto'
  },
  card: {
    width: '100%', maxWidth: '800px',
    padding: '48px 20px',
    margin: 'auto'
  },
  head: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  h1: { 
    fontSize: '32px', 
    fontWeight: 700, 
    color: '#1e3a8a',
    marginBottom: '12px',
    letterSpacing: '-0.01em'
  },
  p: { 
    fontSize: '16px', 
    color: '#64748b' 
  },
  grid: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', 
    gap: '24px 32px',
    marginBottom: '28px'
  },
  field: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '10px' 
  },
  label: { 
    fontSize: '14px', 
    fontWeight: 600, 
    color: '#334155' 
  },
  inputWrap: {
    display: 'flex',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: 'none',
    fontSize: '15px',
    color: '#0f172a',
    outline: 'none',
    fontFamily: 'inherit',
    background: 'transparent'
  },
  prefix: {
    padding: '14px 16px',
    background: '#f1f5f9',
    borderRight: '1px solid #e2e8f0',
    color: '#475569',
    fontWeight: 600,
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
};

const Input = ({ label, prefix, error, full, ...props }) => {
  const [focused, setFocused] = useState(false);
  const isTextarea = props.rows !== undefined;
  const Component = isTextarea ? 'textarea' : 'input';
  
  return (
    <div style={{ ...s.field, ...(full ? { gridColumn: '1 / -1' } : {}) }}>
      <label style={s.label}>{label} *</label>
      <div style={{
        ...s.inputWrap, 
        borderColor: error ? 'var(--danger)' : focused ? '#2c5282' : '#e2e8f0',
        boxShadow: focused ? '0 0 0 1px #2c5282' : '0 1px 2px rgba(0,0,0,0.02)',
        transition: 'all 0.2s'
      }}>
        {prefix && <div style={s.prefix}>{prefix}</div>}
        <Component
          {...props}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...s.input,
            resize: isTextarea ? 'none' : undefined,
          }}
        />
      </div>
      {error && <span style={{ fontSize: '13px', color: 'var(--danger)', fontWeight: 500, marginTop: '2px' }}>This field is required</span>}
    </div>
  );
};

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '', service: '' });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState('FORM'); // 'FORM' or 'OTP'
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [otpSentMsg, setOtpSentMsg] = useState(null);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const isFormValid = () => {
    if (!form.name.trim()) return false;
    const phoneClean = form.phone.replace(/\s+/g, '');
    if (!/^[6-9]\d{9}$/.test(phoneClean)) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return false;
    if (!form.company.trim()) return false;
    if (!form.service.trim()) return false;
    if (!form.consent) return false;
    return true;
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    
    const phoneClean = form.phone.replace(/\s+/g, '');
    if (!/^[6-9]\d{9}$/.test(phoneClean)) errs.phone = 'Must be 10 digits starting with 6-9';
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    
    if (!form.company.trim()) errs.company = 'Required';
    if (!form.service.trim()) errs.service = 'Required';
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setOtpError(null);
    setOtpSentMsg(null);
    const res = await sendOtp(form.email);
    setLoading(false);
    if (res.success) {
      setStep('OTP');
      setOtpSentMsg('A verification code has been sent to your email.');
    } else {
      setOtpError(res.error || 'Failed to send verification code. Please check SMTP settings.');
    }
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

  if (step === 'OTP') {
    return (
      <div style={s.wrap}>
        <div className="animate-fade-in" style={{ ...s.card, maxWidth: '460px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', padding: '40px 32px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✉️</div>
            <h1 style={{ ...s.h1, fontSize: '24px', marginBottom: '8px' }}>Email Verification</h1>
            <p style={{ ...s.p, fontSize: '14px', lineHeight: 1.5 }}>
              A 6-digit verification code has been sent to:<br/>
              <strong style={{ color: '#0f172a' }}>{form.email}</strong>
            </p>
          </div>

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

          <div style={{ ...s.field, marginBottom: '20px' }}>
            <label style={{ ...s.label, textAlign: 'center' }}>Enter 6-Digit Code</label>
            <div style={s.inputWrap}>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
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
              width: '100%', padding: '14px', border: 'none', borderRadius: '8px',
              background: loading || otp.length !== 6 ? '#94a3b8' : '#1e3a8a', fontFamily: 'inherit',
              fontSize: '15px', fontWeight: 600, color: '#fff', 
              cursor: loading || otp.length !== 6 ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              marginBottom: '16px'
            }}
          >
            {loading ? 'Verifying...' : 'Verify & Proceed'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={handleResend}
              disabled={loading}
              style={{
                background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', padding: 0
              }}
            >
              Resend Code
            </button>
            <button
              onClick={() => {
                setStep('FORM');
                setOtp('');
                setOtpError(null);
                setOtpSentMsg(null);
              }}
              disabled={loading}
              style={{
                background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', padding: 0
              }}
            >
              ← Edit Details
            </button>
          </div>
          
        </div>
      </div>
    );
  }

  return (
    <div style={s.wrap}>
      <div className="animate-fade-in" style={s.card}>
        
        <div style={s.head}>
          <img src="/logo.png" alt="Infopace Logo" style={{ height: '64px', marginBottom: '20px', objectFit: 'contain' }} />
          <h1 style={s.h1}>Market Research Assistant</h1>
          <p style={s.p}>Enter your details to generate your dashboard.</p>
        </div>

        {otpError && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', fontWeight: 600, marginBottom: '20px', border: '1px solid #fecaca', textAlign: 'center' }}>
            ⚠️ {otpError}
          </div>
        )}

        <div style={s.grid}>
          <Input 
            label="Full Name" 
            placeholder="John Doe" 
            value={form.name} 
            onChange={set('name')} 
            error={errors.name} 
          />
          <Input 
            label="Phone Number" 
            prefix="+91"
            placeholder="98765 43210" 
            value={form.phone} 
            onChange={set('phone')} 
            error={errors.phone} 
          />
          <Input 
            label="Email Address" 
            placeholder="john@company.com" 
            value={form.email} 
            onChange={set('email')} 
            error={errors.email} 
          />
          <Input 
            label="Company / Organization" 
            placeholder="Acme Corp" 
            value={form.company} 
            onChange={set('company')} 
            error={errors.company} 
          />
          <Input 
            full
            label="Service / Product" 
            placeholder="Describe your core product or service offering..." 
            rows={3} 
            value={form.service} 
            onChange={set('service')} 
            error={errors.service} 
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '24px' }}>
          <input 
            type="checkbox" 
            id="consent"
            checked={form.consent || false}
            onChange={(e) => setForm(f => ({ ...f, consent: e.target.checked }))}
            style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer', accentColor: '#1e3a8a' }}
          />
          <label htmlFor="consent" style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, cursor: 'pointer', userSelect: 'none' }}>
            I consent to the collection and processing of my details to generate this market research dashboard.
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isFormValid() || loading}
          style={{
            width: '100%', padding: '16px', border: 'none', borderRadius: '8px',
            background: !isFormValid() || loading ? '#94a3b8' : '#1e3a8a', fontFamily: 'inherit',
            fontSize: '16px', fontWeight: 600, color: '#fff', 
            cursor: !isFormValid() || loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          }}
          onMouseOver={e => { if(isFormValid() && !loading) e.currentTarget.style.background = '#2c5282' }}
          onMouseOut={e => { if(isFormValid() && !loading) e.currentTarget.style.background = '#1e3a8a' }}
        >
          {loading ? 'Sending Verification Code...' : 'Start Market Research'}
        </button>
        
      </div>
    </div>
  );
}
