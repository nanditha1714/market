import React, { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ChartCard from './ChartCard';
import { CHART_COLORS } from '../constants';
import { uploadScreenshot, saveRecord } from '../services/api';

const co = (i) => CHART_COLORS[i % CHART_COLORS.length];

const datalabelPie = {
  color: '#000000',
  font: { size: 15, weight: 'bold' },
  formatter: (v, ctx) => {
    const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
    return v > 5 ? Math.round((v / total) * 100) + '%' : '';
  },
};

export default function Dashboard({ data, user, answers, onReset }) {
  const dashRef = useRef(null);
  const k = data.kpi || {};
  const stars = Math.round(k.stars || 4);
  const sv = data.sentiment || { positive: 70, neutral: 20, negative: 10 };

  // ── Chart configs ──────────────────────────────────────────────────────────
  const growthData = {
    labels: data.growth?.labels || [],
    datasets: [{
      data: data.growth?.values || [],
      borderColor: 'var(--primary)', backgroundColor: 'rgba(29, 78, 216, 0.08)',
      borderWidth: 2, pointRadius: 2, pointBackgroundColor: 'var(--primary)', fill: true, tension: 0.1,
    }],
  };
  const growthMin = Math.min(...(data.growth?.values || [0])) * 0.85;
  const growthOpts = {
    layout: { padding: 24 },
    plugins: { legend: { display: false }, datalabels: { display: false }, tooltip: { callbacks: { label: c => '$' + c.parsed.y.toFixed(1) + 'B' } } },
    scales: { x: { ticks: { font: { size: 14 } }, grid: { display: false } }, y: { min: parseFloat(growthMin.toFixed(1)), ticks: { font: { size: 14 }, callback: v => '$' + v + 'B' }, grid: { color: '#f1f5f9' } } },
  };

  const segData = {
    labels: (data.segments || []).map(s => s.label),
    datasets: [{ data: (data.segments || []).map(s => s.value), backgroundColor: ['#60a5fa', '#34d399', '#fbbf24'], borderWidth: 1, borderColor: '#ffffff' }],
  };
  const pieOpts = (cutout) => ({
    cutout, layout: { padding: 24 }, plugins: { legend: { position: 'right', labels: { font: { size: 14 }, boxWidth: 10, padding: 6 } }, tooltip: { callbacks: { label: c => c.label + ': ' + c.parsed + '%' } }, datalabels: datalabelPie },
  });

  const geoData = {
    labels: (data.geo || []).map(g => g.label),
    datasets: [{ data: (data.geo || []).map(g => g.value), backgroundColor: ['#a78bfa', '#f472b6', '#38bdf8', '#fb923c'], borderWidth: 1, borderColor: '#ffffff' }],
  };

  const compPieData = {
    labels: (data.competitors || []).map(c => c.name),
    datasets: [{ data: (data.competitors || []).map(c => c.share), backgroundColor: CHART_COLORS, borderWidth: 1, borderColor: '#ffffff' }],
  };

  const radarData = {
    labels: data.radarLabels || [],
    datasets: [
      { label: 'You', data: data.radarYou || [], borderColor: 'var(--primary-dark)', backgroundColor: 'rgba(29, 78, 216, 0.1)', pointBackgroundColor: 'var(--primary-dark)', borderWidth: 1, pointRadius: 2 },
      { label: 'Top Comp', data: data.radarComp || [], borderColor: 'var(--success)', backgroundColor: 'rgba(21, 128, 61, 0.1)', pointBackgroundColor: 'var(--success)', borderWidth: 1, pointRadius: 2 },
    ],
  };
  const radarOpts = {
    layout: { padding: 24 },
    scales: { r: { min: 0, max: 5, ticks: { stepSize: 1, font: { size: 13 }, display: false }, pointLabels: { font: { size: 14 } }, grid: { color: '#f1f5f9' }, angleLines: { color: '#f1f5f9' } } },
    plugins: { legend: { position: 'bottom', labels: { font: { size: 14 }, boxWidth: 10, padding: 6 } }, datalabels: { display: false } },
  };

  // ── Screenshot & Save ──────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;bottom:16px;right:16px;background:var(--navy);color:#fff;font-size:12px;font-weight:600;padding:10px 18px;border-radius:4px;z-index:9999;box-shadow:var(--shadow-md);font-family:inherit';
    badge.textContent = 'Exporting Image...';
    document.body.appendChild(badge);

    try {
      const canvas = await html2canvas(dashRef.current, {
        scale: 1.5, useCORS: true, allowTaint: true,
        backgroundColor: '#f8fafc', logging: false
      });
      
      const safeCompany = (user.company || 'unknown').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = safeCompany + '_' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      badge.textContent = 'Generating PDF...';
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      
      // Trigger native client side download
      pdf.save(fileName + '.pdf');

      badge.textContent = 'Uploading secure bundle...';
      const pdfBlob = pdf.output('blob');
      const docUrl = await uploadScreenshot(pdfBlob, fileName + '.pdf');

      badge.textContent = 'Finalizing record...';
      const payload = {
        name: user.name, phone: user.phone, email: user.email,
        company_name: user.company, service: user.service,
        industry: answers.industry || '', problem: answers.problem || '',
        target_customer: answers.customer || '', geography: answers.geo || '',
        tam_estimate: answers.tam || '', competitors: answers.competitors || '',
        pricing_model: answers.pricing || '', avg_price: answers.price || '',
        self_rating: answers.ratings || '', stage_challenges: answers.sc || '',
        ai_tam: k.tam || '', ai_growth_rate: k.growthRate || '',
        ai_customers: k.customers || '', ai_competitors: parseInt(k.competitors || 0),
        ai_stage: k.stage || '', ai_price: k.price || '', ai_stars: parseFloat(k.stars || 0),
        ai_growth_labels: JSON.stringify(data.growth?.labels || []),
        ai_growth_values: JSON.stringify(data.growth?.values || []),
        ai_segments: JSON.stringify(data.segments || []),
        ai_geo: JSON.stringify(data.geo || []),
        ai_competitors_data: JSON.stringify(data.competitors || []),
        ai_radar_labels: JSON.stringify(data.radarLabels || []),
        ai_radar_you: JSON.stringify(data.radarYou || []),
        ai_radar_comp: JSON.stringify(data.radarComp || []),
        ai_sentiment: JSON.stringify(data.sentiment || {}),
        ai_pricing: JSON.stringify(data.pricing || []),
        ai_avg_rating: data.avgRating || '',
        ai_challenges: JSON.stringify(data.challenges || []),
        ai_insights: data.insights || '',
        dashboard_json: JSON.stringify(data),
        pdf_url: docUrl,
        created_at: new Date().toISOString(),
      };

      const ok = await saveRecord(payload);
      badge.style.background = ok ? 'var(--success)' : 'var(--danger)';
      badge.textContent = ok ? 'Export Complete' : 'System Error: Export Failed';

      if (ok && docUrl) {
        const btn = document.createElement('a');
        btn.href = docUrl; btn.target = '_blank';
        btn.style.cssText = 'position:fixed;bottom:16px;right:200px;background:var(--primary);color:#fff;font-size:12px;font-weight:600;padding:10px 18px;border-radius:4px;z-index:9999;text-decoration:none;font-family:inherit;box-shadow:var(--shadow-md)';
        btn.textContent = 'View Secure Document';
        document.body.appendChild(btn);
        setTimeout(() => btn.remove(), 8000);
      }
    } catch (err) {
      badge.style.background = 'var(--danger)';
      badge.textContent = 'Hardware/Permission Error';
      console.error(err);
    }
    setTimeout(() => { if (badge.parentNode) badge.remove(); }, 6000);
  }, [data, user, answers, k]);

  return (
    <div ref={dashRef} style={{ position:'fixed', inset:0, width:'100%', display:'flex', flexDirection:'column', background:'var(--bg-main)', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink:0, background:'var(--navy)', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--navy-light)' }}>
        <div>
          <h2 style={{ fontSize:'19px', fontWeight:600, color:'#fff', margin:0, letterSpacing:'-0.01em', textTransform: 'uppercase' }}>Market Research Output</h2>
          <p style={{ fontSize:'14px', color:'#94a3b8', marginTop:'2px', fontWeight:500 }}>{user.name} | {user.company} | TARGET: {answers.customer}</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={handleSave} style={{ padding:'6px 14px', border:'none', borderRadius:'var(--radius-sm)', background:'var(--success)', color:'#fff', fontFamily:'inherit', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>Download PDF</button>
          <button onClick={onReset} style={{ padding:'5px 13px', border:'1px solid #334155', borderRadius:'var(--radius-sm)', background:'transparent', color:'#f8fafc', fontFamily:'inherit', fontSize:'14px', fontWeight:600, cursor:'pointer' }}>New Research</button>
        </div>
      </div>

      {/* Main Grid: Forces layout into absolute single screen */}
      <div style={{ flex:1, display:'grid', gridTemplateRows:'auto 1fr 1.2fr auto', gap:'8px', padding:'8px 12px', minHeight:0, overflow:'hidden' }}>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'8px' }}>
          {[
            { label:'Total Market Size', val: k.tam },
            { label:'Growth Rate',       val: k.growthRate, sub: '▲ ' + k.growthRate, subColor:'var(--success)' },
            { label:'Target Customers',  val: k.customers },
            { label:'Competitor Baseline',       val: k.competitors },
            { label:'Company Stage',     val: k.stage, small: true },
            { label:'Avg Market Price',  val: k.price, stars: true },
          ].map((kpi, i) => (
            <div key={i} style={{ background:'#fff', borderRadius:'var(--radius-sm)', padding:'10px 14px', border:'1px solid #e2e8f0', display: 'flex', flexDirection: 'column', minWidth:0, justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                <div style={{ fontSize:'13px', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>{kpi.label}</div>
              </div>
              <div style={{ fontSize: kpi.small ? '20px' : '25px', fontWeight:700, color:'var(--text-main)', lineHeight:1.1 }}>{kpi.val || '—'}</div>
              {kpi.sub   && <div style={{ fontSize:'14px', color: kpi.subColor || 'var(--text-muted)', fontWeight:600, marginTop: '4px' }}>{kpi.sub}</div>}
              {kpi.stars && <div style={{ color:'var(--navy-light)', fontSize:'17px', marginTop: '4px' }}>{'★'.repeat(stars)}{'☆'.repeat(5-stars)}</div>}
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr', gap:'8px', minHeight:0, overflow:'hidden' }}>
          <ChartCard title="Market Growth Trajectory" type="line" data={growthData} options={growthOpts} />
          <ChartCard title="Industry Segmentation" type="pie" data={segData} options={pieOpts(undefined)} />
          <ChartCard title="Geographic Distribution" type="doughnut" data={geoData} options={pieOpts('55%')} />
        </div>

        {/* Row 3 */}
        <div style={{ display:'grid', gridTemplateColumns:'0.9fr 1fr 1.6fr', gap:'8px', minHeight:0, overflow:'hidden' }}>
          <ChartCard title="Competitor Market Share" type="doughnut" data={compPieData} options={pieOpts('50%')} />
          <ChartCard title="Competitive Positioning Matrix" type="radar" data={radarData} options={radarOpts} />

          {/* Details 2x2 grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:'8px', minHeight:0, overflow:'hidden' }}>
            
            {/* Market Share Bars */}
            <div style={{ background:'#fff', borderRadius:'var(--radius-sm)', padding:'10px 12px', border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text-main)', marginBottom:'6px', textTransform: 'uppercase' }}>Market Share Distribution</div>
              <div style={{ flex:1, display: 'flex', flexDirection: 'column', gap: '4px', overflow:'hidden' }}>
                {(data.competitors || []).map((c, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <div style={{ fontSize:'13px', color:'var(--text-muted)', fontWeight:500, width:'60px', flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                    <div style={{ flex:1, height:'8px', background:'#f1f5f9', borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width: Math.max(2, c.share)+'%', background: co(i), borderRadius:'2px' }} />
                    </div>
                    <span style={{ fontSize:'12px', color:'var(--text-main)', fontWeight:600, width: '24px', textAlign: 'right' }}>{c.share}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rating & Sentiment */}
            <div style={{ background:'#fff', borderRadius:'var(--radius-sm)', padding:'10px 12px', border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text-main)', marginBottom:'6px', textTransform: 'uppercase' }}>Sentiment Analysis</div>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'8px' }}>
                <span style={{ fontSize:'21px', fontWeight:700, color:'var(--text-main)' }}>{data.avgRating || '—'}</span>
                <span style={{ fontSize:'13px', color:'var(--text-muted)' }}>IDX Score</span>
              </div>
              <div style={{ display:'flex', gap:'4px', flex: 1 }}>
                {[
                  { label:'POS', val:sv.positive, bg:'#f1f5f9', color:'var(--success)' },
                  { label:'NEU',  val:sv.neutral,  bg:'#f8fafc', color:'var(--primary)' },
                  { label:'NEG', val:sv.negative, bg:'#f8fafc', color:'var(--danger)' },
                ].map(s => (
                  <div key={s.label} style={{ flex:1, textAlign:'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRadius:'4px', background: s.bg, border: '1px solid #e2e8f0', padding:'6px' }}>
                    <div style={{ fontSize:'16px', fontWeight:700, color: s.color, lineHeight:1.1 }}>{s.val}%</div>
                    <div style={{ fontSize:'12px', fontWeight:600, color: 'var(--text-muted)', marginTop:'4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div style={{ background:'#fff', borderRadius:'var(--radius-sm)', padding:'10px 12px', border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text-main)', marginBottom:'6px', textTransform: 'uppercase' }}>Pricing Architectures</div>
              <div style={{ display:'flex', flexDirection:'column', gap: '4px', overflow:'hidden' }}>
                {(data.pricing || []).map((p, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'4px 0', borderBottom:'1px solid #f1f5f9' }}>
                    <div style={{ width:'6px', height:'6px', borderRadius:'1px', background: p.color, flexShrink:0 }} />
                    <div style={{ fontSize:'13px', fontWeight:600, color: 'var(--text-main)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize:'12px', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{p.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Challenges */}
            <div style={{ background:'#fff', borderRadius:'var(--radius-sm)', padding:'10px 12px', border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text-main)', marginBottom:'6px', textTransform: 'uppercase' }}>Macro Risks & Challenges</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow:'hidden' }}>
                {(data.challenges || []).slice(0, 5).map((c, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'6px', padding:'2px 0', fontSize:'13px', fontWeight: 500, color:'var(--text-muted)', lineHeight: 1.4 }}>
                    <span style={{ fontSize: '13px', color: 'var(--danger)', marginTop:'2px' }}>•</span>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div style={{ background:'#ffffff', borderRadius:'var(--radius-sm)', padding:'8px 16px', border:'1px solid #cbd5e1', display:'flex', alignItems:'center', gap:'12px', overflow:'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '4px', background: 'var(--navy)', color: '#fff', fontSize: '12px', fontWeight: 'bold', flexShrink:0 }}>
            AI
          </div>
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '12px', overflow:'hidden' }}>
            <div style={{ fontSize:'13px', fontWeight:700, color:'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Executive Summary</div>
            <div style={{ fontSize:'15px', color:'var(--text-main)', fontWeight: 500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{data.insights}</div>
          </div>
        </div>

      </div>
    </div>
  );
}

