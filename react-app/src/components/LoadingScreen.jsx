import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      position:'fixed', inset:0, background:'#e4edf5',
      display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'20px',
      fontFamily: '"Inter", -apple-system, sans-serif'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        width:'60px', height:'60px', borderRadius:'50%',
        border:'5px solid rgba(30, 58, 138, 0.1)', borderTopColor:'#1e3a8a',
        animation:'spin 1s linear infinite'
      }} />
      <div style={{ color:'#1e3a8a', fontSize:'18px', fontWeight:700, letterSpacing: '-0.01em', marginTop: '10px' }}>
        Generating your Market Research Dashboard...
      </div>
      <div style={{ color:'#475569', fontSize:'13px', fontWeight: 500 }}>
        Powered by Gemini Flash 2.5 · Analyzing your responses
      </div>
    </div>
  );
}
