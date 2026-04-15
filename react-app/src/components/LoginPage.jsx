import React, { useState } from 'react';

const s = {
  wrap: { 
    position: 'fixed', inset: 0, 
    background: '#2c5282', /* Exact match for the dark corporate blue background */
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    padding: '40px 20px', overflowY: 'auto'
  },
  card: {
    width: '100%', maxWidth: '800px', /* Generous width matching the "this big" request */
    background: '#f8fafc', /* Very light off-white background from the image */
    borderRadius: '16px',
    padding: '48px 60px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    margin: 'auto'
  },
  head: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  h1: { 
    fontSize: '32px', 
    fontWeight: 700, 
    color: '#1e3a8a', /* Dark blue text from image */
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
    gap: '24px 32px', /* Substantial gaps corresponding to the reference image */
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
    
    // Check phone: must start with 6,7,8,9 and be exactly 10 digits (ignoring spaces)
    const phoneClean = form.phone.replace(/\s+/g, '');
    if (!/^[6-9]\d{9}$/.test(phoneClean)) errs.phone = 'Must be 10 digits starting with 6-9';
    
    // Check email: must be valid email containing @
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    
    if (!form.company.trim()) errs.company = 'Required';
    if (!form.service.trim()) errs.service = 'Required';
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onLogin(form);
  };

  return (
    <div style={s.wrap}>
      <div className="animate-fade-in" style={s.card}>
        
        <div style={s.head}>
          <h1 style={s.h1}>Market Research Assistant</h1>
          <p style={s.p}>Enter your details to generate your dashboard.</p>
        </div>

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
          disabled={!isFormValid()}
          style={{
            width: '100%', padding: '16px', border: 'none', borderRadius: '8px',
            background: isFormValid() ? '#1e3a8a' : '#94a3b8', fontFamily: 'inherit',
            fontSize: '16px', fontWeight: 600, color: '#fff', 
            cursor: isFormValid() ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
          }}
          onMouseOver={e => { if(isFormValid()) e.currentTarget.style.background = '#2c5282' }}
          onMouseOut={e => { if(isFormValid()) e.currentTarget.style.background = '#1e3a8a' }}
        >
          Start Market Research
        </button>
        
      </div>
    </div>
  );
}
