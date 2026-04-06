import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      position:'fixed', inset:0, background:'linear-gradient(135deg,#0f1c3f,#1a2b5e)',
      display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'18px'
    }}>
      <div style={{
        width:'60px', height:'60px', borderRadius:'50%',
        border:'4px solid rgba(255,255,255,.12)', borderTopColor:'#60a5fa',
        animation:'spin .85s linear infinite'
      }} />
      <div style={{ color:'#fff', fontSize:'15px', fontWeight:600 }}>Generating your Market Research Dashboard…</div>
      <div style={{ color:'rgba(255,255,255,.5)', fontSize:'12px' }}>Powered by Gemini Flash 2.5 · Analysing your responses</div>
    </div>
  );
}
