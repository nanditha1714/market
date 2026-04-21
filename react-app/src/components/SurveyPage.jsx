import React, { useState } from 'react';
import { QUESTIONS } from '../constants';

export default function SurveyPage({ onComplete }) {
  const [cur, setCur] = useState(0);
  const [answers, setAnswers] = useState({});
  const [fade, setFade] = useState('in');

  const q = QUESTIONS[cur];
  const pct = Math.round(((cur + 1) / QUESTIONS.length) * 100);
  const val = answers[q.key] || '';
  const canNext = val.trim().length > 0;

  const setVal = (v) => setAnswers(a => ({ ...a, [q.key]: v }));

  const goNext = () => {
    if (!canNext) return;
    if (cur < QUESTIONS.length - 1) {
      setFade('out');
      setTimeout(() => {
        setCur(c => c + 1);
        setFade('in');
      }, 150);
    } else {
      onComplete(answers);
    }
  };

  const goBack = () => {
    if (cur > 0) {
      setFade('out');
      setTimeout(() => {
        setCur(c => c - 1);
        setFade('in');
      }, 150);
    }
  };

  const isLast = cur === QUESTIONS.length - 1;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#e4edf5', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10vh 20px', overflowY: 'auto' }}>
      
      <div style={{ width: '100%', maxWidth: '800px', margin: 'auto' }}>
        {/* Header */}
        <div style={{ padding: '32px 20px 24px', borderBottom: '1px solid rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e3a8a', letterSpacing: '-0.01em', marginBottom: '8px' }}>Market Research</h1>
          <p style={{ fontSize: '15px', color: '#64748b' }}>Please complete parameter {cur + 1} of {QUESTIONS.length} to finalize baseline context.</p>
          
          <div style={{ marginTop: '24px', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct + '%', background: '#1e3a8a', borderRadius: '4px', transition: 'width 0.3s ease-out' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <span>Data Input Active</span>
            <span style={{ color: '#1e3a8a' }}>{pct}% Complete</span>
          </div>
        </div>

        {/* Body with Fade transition */}
        <div style={{ padding: '32px 20px 40px', opacity: fade === 'in' ? 1 : 0, transition: 'opacity 0.15s ease-out' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Section: {q.id}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 600, color: '#334155', lineHeight: 1.5, marginBottom: '24px' }}>
            {q.text}
          </div>

          <textarea
            key={q.key}
            rows={5}
            placeholder={q.ph}
            value={val}
            onChange={e => setVal(e.target.value)}
            autoFocus
            style={{
              width: '100%', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px',
              padding: '16px', 
              fontFamily: 'inherit', 
              fontSize: '15px', 
              color: '#0f172a',
              outline: 'none', 
              resize: 'none', 
              transition: 'all 0.2s',
              background: '#ffffff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}
            onFocus={e => { e.target.style.borderColor = '#2c5282'; e.target.style.boxShadow = '0 0 0 1px #2c5282'; }}
            onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = '0 1px 2px rgba(0,0,0,0.02)'; }}
          />

          <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
            {cur > 0 && (
              <button 
                onClick={goBack} 
                style={{ 
                  padding: '14px 28px', border: '1px solid #cbd5e1', borderRadius: '8px', 
                  background: '#ffffff', fontFamily: 'inherit', fontSize: '15px', fontWeight: 600, color: '#334155', 
                  cursor: 'pointer', transition: 'all 0.2s' 
                }}
                onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={e => e.currentTarget.style.background = '#ffffff'}
              >
                Previous
              </button>
            )}
            <button
              onClick={goNext}
              disabled={!canNext}
              style={{
                flex: 1, padding: '14px', border: 'none', borderRadius: '8px',
                background: canNext ? '#1e3a8a' : '#94a3b8',
                fontFamily: 'inherit', fontSize: '15px', fontWeight: 600,
                color: '#ffffff',
                cursor: canNext ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => { if(canNext) e.currentTarget.style.background = '#2c5282' }}
              onMouseOut={e => { if(canNext) e.currentTarget.style.background = '#1e3a8a' }}
            >
              {isLast ? 'Execute Analysis & Generate Dashboard' : 'Confirm & Proceed'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
