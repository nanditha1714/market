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
  const page1Ref = useRef(null);
  const page2Ref = useRef(null);
  const k = data.kpi || {};
  const stars = Math.round(k.stars || 4);
  const sv = data.sentiment || { positive: 70, neutral: 20, negative: 10 };
  const detailedReport = data.detailedReport || {};
  const rep = {
    marketGrowth: detailedReport.marketGrowth || 'Based on the historical and projected data, the market has demonstrated consistent upward momentum. This steady growth is driven by accelerated digital transformation and increasing adoption rates across target demographics.',
    segmentation: detailedReport.segmentation || 'The market is divided into distinct customer segments. The high concentration in Enterprise suggests significant contract value opportunities, while the SMB and Startup segments represent high-velocity growth areas.',
    geography: detailedReport.geography || 'Geographical breakdown indicates that North America leads market share, with Europe representing a strong secondary market. Expansion efforts should prioritize strengthening presence in established markets.',
    competition: detailedReport.competition || 'The competitive landscape features established players. According to the positioning matrix, your core differentiators lie in product innovation and customer support, whereas competitors leverage brand legacy.',
    pricing: detailedReport.pricing || 'A comparative analysis of pricing structures shows a diverse range of models. Your product is positioned as a competitive value option, balancing advanced features with an accessible price point.',
    risks: detailedReport.risks || 'The primary risks facing the company include intense competition from legacy vendors, high customer acquisition costs (CAC), and potential talent shortages. Mitigating these challenges requires investing in product feature differentiation.',
    ...detailedReport
  };

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
    badge.textContent = 'Exporting Dashboard...';
    document.body.appendChild(badge);

    try {
      // 1. Capture Dashboard Page
      const canvasDash = await html2canvas(dashRef.current, {
        scale: 1.5, useCORS: true, allowTaint: true,
        backgroundColor: '#f8fafc', logging: false
      });
      
      // 2. Capture Report Page 1
      badge.textContent = 'Exporting Report Page 1...';
      const canvasPage1 = await html2canvas(page1Ref.current, {
        scale: 1.5, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', logging: false
      });

      // 3. Capture Report Page 2
      badge.textContent = 'Exporting Report Page 2...';
      const canvasPage2 = await html2canvas(page2Ref.current, {
        scale: 1.5, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', logging: false
      });

      const safeCompany = (user.company || 'unknown').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = safeCompany + '_' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      badge.textContent = 'Generating Multi-page PDF...';
      const imgDash = canvasDash.toDataURL('image/png');
      const imgPage1 = canvasPage1.toDataURL('image/png');
      const imgPage2 = canvasPage2.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: canvasDash.width > canvasDash.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvasDash.width, canvasDash.height]
      });
      pdf.addImage(imgDash, 'PNG', 0, 0, canvasDash.width, canvasDash.height);

      // Add Report Page 1 (Portrait)
      pdf.addPage([canvasPage1.width, canvasPage1.height], 'portrait');
      pdf.addImage(imgPage1, 'PNG', 0, 0, canvasPage1.width, canvasPage1.height);

      // Add Report Page 2 (Portrait)
      pdf.addPage([canvasPage2.width, canvasPage2.height], 'portrait');
      pdf.addImage(imgPage2, 'PNG', 0, 0, canvasPage2.width, canvasPage2.height);
      
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
  }, [data, user, answers, k, page1Ref, page2Ref]);

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
      
      {/* Off-screen detailed report for PDF generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Page 1: Cover Page & Executive Summary */}
        <div ref={page1Ref} style={repStyles.page}>
          <div>
            <div style={repStyles.header}>
              <div style={repStyles.title}>Comprehensive Market Intelligence Report</div>
              <div style={repStyles.metaText}>
                <strong>Prepared For:</strong> {user.company || 'N/A'} | <strong>Author:</strong> {user.name || 'N/A'} ({user.email}) | <strong>Date:</strong> {new Date().toLocaleDateString()}
              </div>
              <div style={{ ...repStyles.metaText, fontSize: '11px', marginTop: '2px' }}>
                <strong>Target Solution:</strong> {user.service || 'N/A'}
              </div>
            </div>

            {/* Executive Summary */}
            <div style={repStyles.section}>
              <div style={repStyles.sectionTitle}>1. Executive Summary & Overview</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(rep.executiveSummary || '').split('\n\n').map((p, idx) => (
                  <div key={idx} style={repStyles.bodyText}>
                    {p}
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Differentiators Summary */}
            <div style={{ marginTop: '24px', background: '#f8fafc', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px' }}>Strategic Market Takeaways:</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ borderLeft: '3px solid #1e3a8a', paddingLeft: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a' }}>Primary Opportunity:</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>Leverage advanced product innovation to address legacy systems vulnerabilities in B2B enterprise hubs.</div>
                </div>
                <div style={{ borderLeft: '3px solid #16a34a', paddingLeft: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a' }}>Customer Success Alignment:</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>High customer support satisfaction serves as the baseline customer retention engine.</div>
                </div>
              </div>
            </div>
          </div>

          <div style={repStyles.footer}>
            <span>CONFIDENTIAL - INFOPACE MARKET INTELLIGENCE</span>
            <span>Page 1 of 8</span>
          </div>
        </div>

        {/* Page 2: Market Growth Trajectory */}
        <div ref={page2Ref} style={repStyles.page}>
          <div>
            <div style={repStyles.header}>
              <div style={repStyles.title}>Market Growth & Macro Trends</div>
              <div style={repStyles.metaText}>
                <strong>Industry Sector:</strong> {answers.industry || 'N/A'} | <strong>Subject:</strong> 2018-2024 Size Projection
              </div>
            </div>

            <div style={repStyles.section}>
              <div style={repStyles.sectionTitle}>2. Market Growth Trajectory & Forecasts</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {(rep.marketGrowth || '').split('\n\n').map((p, idx) => (
                  <div key={idx} style={repStyles.bodyText}>
                    {p}
                  </div>
                ))}
              </div>

              <div style={repStyles.grid}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', textTransform: 'uppercase' }}>Growth Metrics Data</div>
                  <table style={repStyles.table}>
                    <thead>
                      <tr>
                        <th style={repStyles.th}>Year</th>
                        <th style={repStyles.th}>Market Size ($B)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.growth?.labels || []).map((lbl, idx) => (
                        <tr key={idx}>
                          <td style={repStyles.td}>{lbl}</td>
                          <td style={repStyles.td}>${(data.growth?.values || [])[idx] || 0}B</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', textTransform: 'uppercase' }}>Visual Trajectory</div>
                  <ChartCard title="Trajectory Graph" type="line" data={growthData} options={{ ...growthOpts, layout: { padding: 4 } }} height="130px" style={{ background: '#f8fafc', padding: '6px', border: '1px solid #e2e8f0', boxShadow: 'none' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={repStyles.footer}>
            <span>CONFIDENTIAL - INFOPACE MARKET INTELLIGENCE</span>
            <span>Page 2 of 8</span>
          </div>
        </div>

        {/* Page 3: Customer Segmentation */}
        <div ref={page3Ref} style={repStyles.page}>
          <div>
            <div style={repStyles.header}>
              <div style={repStyles.title}>Customer Segmentation Breakdown</div>
              <div style={repStyles.metaText}>
                <strong>Target Segment Focus:</strong> {answers.customer || 'N/A'}
              </div>
            </div>

            <div style={repStyles.section}>
              <div style={repStyles.sectionTitle}>3. Customer Segmentation & Persona Distribution</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {(rep.segmentation || '').split('\n\n').map((p, idx) => (
                  <div key={idx} style={repStyles.bodyText}>
                    {p}
                  </div>
                ))}
              </div>

              <div style={repStyles.grid}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', textTransform: 'uppercase' }}>Segment Shares</div>
                  <table style={repStyles.table}>
                    <thead>
                      <tr>
                        <th style={repStyles.th}>Segment Class</th>
                        <th style={repStyles.th}>Distribution (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.segments || []).map((s, idx) => (
                        <tr key={idx}>
                          <td style={repStyles.td}>{s.label}</td>
                          <td style={repStyles.td}>{s.value}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', textTransform: 'uppercase' }}>Visual Distribution</div>
                  <ChartCard title="Segmentation Graph" type="pie" data={segData} options={{ ...pieOpts(undefined), layout: { padding: 4 } }} height="130px" style={{ background: '#f8fafc', padding: '6px', border: '1px solid #e2e8f0', boxShadow: 'none' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={repStyles.footer}>
            <span>CONFIDENTIAL - INFOPACE MARKET INTELLIGENCE</span>
            <span>Page 3 of 8</span>
          </div>
        </div>

        {/* Page 4: Geographic Distribution */}
        <div ref={page4Ref} style={repStyles.page}>
          <div>
            <div style={repStyles.header}>
              <div style={repStyles.title}>Geographic Distribution & Penetration</div>
              <div style={repStyles.metaText}>
                <strong>Geographical Scope:</strong> {answers.geo || 'N/A'}
              </div>
            </div>

            <div style={repStyles.section}>
              <div style={repStyles.sectionTitle}>4. Regional Distribution & GTM Localization</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {(rep.geography || '').split('\n\n').map((p, idx) => (
                  <div key={idx} style={repStyles.bodyText}>
                    {p}
                  </div>
                ))}
              </div>

              <div style={repStyles.grid}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', textTransform: 'uppercase' }}>Regional Weights</div>
                  <table style={repStyles.table}>
                    <thead>
                      <tr>
                        <th style={repStyles.th}>Focus Territory</th>
                        <th style={repStyles.th}>Percentage Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.geo || []).map((g, idx) => (
                        <tr key={idx}>
                          <td style={repStyles.td}>{g.label}</td>
                          <td style={repStyles.td}>{g.value}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', textTransform: 'uppercase' }}>Regional Graph</div>
                  <ChartCard title="Geography Graph" type="doughnut" data={geoData} options={{ ...pieOpts('55%'), layout: { padding: 4 } }} height="130px" style={{ background: '#f8fafc', padding: '6px', border: '1px solid #e2e8f0', boxShadow: 'none' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={repStyles.footer}>
            <span>CONFIDENTIAL - INFOPACE MARKET INTELLIGENCE</span>
            <span>Page 4 of 8</span>
          </div>
        </div>

        {/* Page 5: Competitor Share Analysis */}
        <div ref={page5Ref} style={repStyles.page}>
          <div>
            <div style={repStyles.header}>
              <div style={repStyles.title}>Competitive Landscape & Shares</div>
              <div style={repStyles.metaText}>
                <strong>Top Benchmark:</strong> {answers.competitors || 'N/A'}
              </div>
            </div>

            <div style={repStyles.section}>
              <div style={repStyles.sectionTitle}>5. Competitor Share Distribution & Market Concentration</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {(rep.competition || '').split('\n\n').map((p, idx) => (
                  <div key={idx} style={repStyles.bodyText}>
                    {p}
                  </div>
                ))}
              </div>

              <div style={repStyles.grid}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', textTransform: 'uppercase' }}>Share Standings</div>
                  <table style={repStyles.table}>
                    <thead>
                      <tr>
                        <th style={repStyles.th}>Market Player</th>
                        <th style={repStyles.th}>Estimated Share (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.competitors || []).map((c, idx) => (
                        <tr key={idx}>
                          <td style={repStyles.td}>{c.name}</td>
                          <td style={repStyles.td}>{c.share}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', textTransform: 'uppercase' }}>Visual Standing</div>
                  <ChartCard title="Share Graph" type="doughnut" data={compPieData} options={{ ...pieOpts('50%'), layout: { padding: 4 } }} height="130px" style={{ background: '#f8fafc', padding: '6px', border: '1px solid #e2e8f0', boxShadow: 'none' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={repStyles.footer}>
            <span>CONFIDENTIAL - INFOPACE MARKET INTELLIGENCE</span>
            <span>Page 5 of 8</span>
          </div>
        </div>

        {/* Page 6: Competitive Positioning Matrix */}
        <div ref={page6Ref} style={repStyles.page}>
          <div>
            <div style={repStyles.header}>
              <div style={repStyles.title}>Competitive Positioning Matrix</div>
              <div style={repStyles.metaText}>
                <strong>Benchmarking Profile:</strong> You vs Top Industry Competitor
              </div>
            </div>

            <div style={repStyles.section}>
              <div style={repStyles.sectionTitle}>6. Strategic Vector Analysis</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {(rep.radarAnalysis || '').split('\n\n').map((p, idx) => (
                  <div key={idx} style={repStyles.bodyText}>
                    {p}
                  </div>
                ))}
              </div>

              <div style={repStyles.grid}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', textTransform: 'uppercase' }}>Vector Comparisons</div>
                  <table style={repStyles.table}>
                    <thead>
                      <tr>
                        <th style={repStyles.th}>KPI Vector</th>
                        <th style={repStyles.th}>Self (1-5)</th>
                        <th style={repStyles.th}>Top Comp (1-5)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.radarLabels || []).map((lbl, idx) => (
                        <tr key={idx}>
                          <td style={repStyles.td}>{lbl}</td>
                          <td style={repStyles.td}>{(data.radarYou || [])[idx] || 0}</td>
                          <td style={repStyles.td}>{(data.radarComp || [])[idx] || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', textTransform: 'uppercase' }}>Positioning Graph</div>
                  <ChartCard title="Matrix Graph" type="radar" data={radarData} options={{ ...radarOpts, layout: { padding: 4 } }} height="130px" style={{ background: '#f8fafc', padding: '6px', border: '1px solid #e2e8f0', boxShadow: 'none' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={repStyles.footer}>
            <span>CONFIDENTIAL - INFOPACE MARKET INTELLIGENCE</span>
            <span>Page 6 of 8</span>
          </div>
        </div>

        {/* Page 7: Pricing Strategy & Monetization */}
        <div ref={page7Ref} style={repStyles.page}>
          <div>
            <div style={repStyles.header}>
              <div style={repStyles.title}>Pricing Strategy & Monetization Models</div>
              <div style={repStyles.metaText}>
                <strong>Selected Model:</strong> {answers.pricing || 'N/A'} | <strong>Base Price:</strong> {answers.price || 'N/A'}
              </div>
            </div>

            <div style={repStyles.section}>
              <div style={repStyles.sectionTitle}>7. Monetization Strategy & Margin Capture</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {(rep.pricing || '').split('\n\n').map((p, idx) => (
                  <div key={idx} style={repStyles.bodyText}>
                    {p}
                  </div>
                ))}
              </div>

              <div style={repStyles.grid}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', textTransform: 'uppercase' }}>Pricing Architectures</div>
                  <table style={repStyles.table}>
                    <thead>
                      <tr>
                        <th style={repStyles.th}>Offer Tier</th>
                        <th style={repStyles.th}>Strategic Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.pricing || []).map((pr, idx) => (
                        <tr key={idx}>
                          <td style={repStyles.td}>{pr.name}</td>
                          <td style={repStyles.td}>{pr.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '4px', textAlign: 'center', height: '130px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#16a34a' }}>{data.avgRating || '4.2'}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginTop: '4px' }}>Value Index Score</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px', lineHeight: 1.3 }}>Highly favorable pricing-to-feature conversion metric across target users.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={repStyles.footer}>
            <span>CONFIDENTIAL - INFOPACE MARKET INTELLIGENCE</span>
            <span>Page 7 of 8</span>
          </div>
        </div>

        {/* Page 8: Macro Risks & Mitigations */}
        <div ref={page8Ref} style={repStyles.page}>
          <div>
            <div style={repStyles.header}>
              <div style={repStyles.title}>Macro Risks, Challenges & Mitigations</div>
              <div style={repStyles.metaText}>
                <strong>State:</strong> {k.stage || 'N/A'} | <strong>Risk Matrix Review</strong>
              </div>
            </div>

            <div style={repStyles.section}>
              <div style={repStyles.sectionTitle}>8. Strategic Risk Management</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {(rep.risks || '').split('\n\n').map((p, idx) => (
                  <div key={idx} style={repStyles.bodyText}>
                    {p}
                  </div>
                ))}
              </div>

              <div style={repStyles.grid}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c', marginBottom: '6px', textTransform: 'uppercase' }}>Identified High-Priority Risks</div>
                  <ul style={repStyles.bulletList}>
                    {(data.challenges || []).map((c, idx) => (
                      <li key={idx} style={repStyles.bulletItem}>{c}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '12px', borderRadius: '4px', height: '130px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c', textTransform: 'uppercase' }}>Mitigation Framework:</div>
                    <div style={{ fontSize: '10px', color: '#991b1b', marginTop: '6px', lineHeight: 1.4 }}>
                      Deploy self-service developer portals to reduce high-touch onboarding friction and scale technical differentiators.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={repStyles.footer}>
            <span>CONFIDENTIAL - INFOPACE MARKET INTELLIGENCE</span>
            <span>Page 8 of 8</span>
          </div>
        </div>

      </div>
    </div>
  );
}

const repStyles = {
  page: {
    width: '800px',
    height: '1130px',
    background: '#ffffff',
    color: '#0f172a',
    padding: '45px 40px',
    boxSizing: 'border-box',
    fontFamily: '"Inter", -apple-system, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    border: '1px solid #e2e8f0',
  },
  header: {
    borderBottom: '2px solid #0f172a',
    paddingBottom: '8px',
    marginBottom: '14px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: '-0.02em',
  },
  metaText: {
    fontSize: '11px',
    color: '#475569',
    marginTop: '3px',
    fontWeight: 500,
  },
  section: {
    marginBottom: '14px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#1e3a8a',
    textTransform: 'uppercase',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '3px',
    marginBottom: '6px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.10fr 0.90fr',
    gap: '15px',
    alignItems: 'start',
  },
  bodyText: {
    fontSize: '11.5px',
    lineHeight: '1.5',
    color: '#334155',
    textAlign: 'justify',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '10px',
  },
  th: {
    background: '#f1f5f9',
    color: '#0f172a',
    fontWeight: 700,
    textAlign: 'left',
    padding: '5px 6px',
    borderBottom: '1px solid #cbd5e1',
  },
  td: {
    padding: '4px 6px',
    borderBottom: '1px solid #f1f5f9',
    color: '#334155',
  },
  footer: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '9px',
    color: '#64748b',
    fontWeight: 500,
  },
  bulletList: {
    paddingLeft: '14px',
    margin: '4px 0 0 0',
  },
  bulletItem: {
    fontSize: '11px',
    color: '#334155',
    lineHeight: '1.4',
    marginBottom: '2px',
  }
};

