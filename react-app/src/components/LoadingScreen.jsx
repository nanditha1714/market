import React from 'react';
import BackgroundCanvas from './BackgroundCanvas';

export default function LoadingScreen() {
  return (
    <div style={{
      position:'fixed', inset:0, background:'#f8fafc',
      display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'20px',
      fontFamily: '"Inter", -apple-system, sans-serif',
      backgroundImage: 'linear-gradient(to right, rgba(99, 102, 241, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.03) 1px, transparent 1px)',
      backgroundSize: '36px 36px'
    }}>
      <BackgroundCanvas />
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        position: 'relative',
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px'
      }}>
        <div style={{
          width:'60px', height:'60px', borderRadius:'50%',
          border:'5px solid rgba(30, 58, 138, 0.1)', borderTopColor:'#1e3a8a',
          animation:'spin 1s linear infinite'
        }} />
        <div style={{ color:'#1e3a8a', fontSize:'18px', fontWeight:700, letterSpacing: '-0.01em', marginTop: '10px' }}>
          Your Market Research Dashboard is processing...
        </div>
        <div style={{ color:'#475569', fontSize:'13px', fontWeight: 500 }}>
          Analyzing parameters and generating strategic insights
        </div>
      </div>
    </div>
  );
}
