import React, { useRef, useEffect } from 'react';
import { Chart } from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);
Chart.defaults.color = '#000000';
Chart.defaults.borderColor = '#e2e8f0';

export default function ChartCard({ title, type, data, options, style, height = '100%' }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, { 
      type, 
      data, 
      options: { 
        ...options, 
        animation: false, 
        responsive: true, 
        maintainAspectRatio: false 
      } 
    });

    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, [type, data, options]);

  return (
    <div className="glass-panel" style={{ borderRadius:'var(--radius-md)', padding:'12px', display:'flex', flexDirection:'column', overflow:'hidden', transition: 'box-shadow 0.2s', ...style }} onMouseOver={e=>e.currentTarget.style.boxShadow='var(--shadow-md)'} onMouseOut={e=>e.currentTarget.style.boxShadow='var(--shadow-sm)'}>
      <div style={{ fontSize:'15px', fontWeight:800, color:'var(--text-main)', marginBottom:'8px', flexShrink:0, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{title}</div>
      <div style={{ flex:1, height: height, minHeight: 0, overflow:'hidden', display:'block', position: 'relative' }}>
        <canvas ref={canvasRef} style={{ display:'block', width: '100%', height: '100%' }} />
      </div>
    </div>
  );
}

