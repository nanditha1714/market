import React, { useRef, useCallback, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import ChartCard from './ChartCard';
import { CHART_COLORS } from '../constants';
import { uploadScreenshot, saveRecord, updateRecord, createRazorpayOrder, verifyRazorpayPayment, getRazorpayKey, emailReportPdf } from '../services/api';
import HistoryModal from './HistoryModal';

const co = (i) => CHART_COLORS[i % CHART_COLORS.length];

const datalabelPie = {
  color: '#000000',
  font: { size: 10, weight: 'bold' },
  formatter: (v, ctx) => {
    const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
    return v > 7 ? Math.round((v / total) * 100) + '%' : '';
  },
};

const loadScript = (src) => {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Dashboard({ data, user, answers, onReset, onOpenAbout }) {
  const dashRef = useRef(null);
  const page1Ref = useRef(null);
  const page2Ref = useRef(null);
  const [isPaid, setIsPaid] = useState(() => {
    if (data?.payment_status === 'success' || data?.pdf_url) return true;
    const key = `isPaid_${user?.email || 'global'}`;
    return localStorage.getItem(key) === 'true';
  });
  const [paying, setPaying] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [dashboardPdfUrl, setDashboardPdfUrl] = useState(data?.dashboard_pdf_url || null);
  const [reportPdfUrl, setReportPdfUrl] = useState(data?.report_pdf_url || null);

  // Background PDF generation and upload
  useEffect(() => {
    // Only run if dbRecordId exists, and URLs are not already populated
    if (!data?.dbRecordId) return;
    if (dashboardPdfUrl && reportPdfUrl) return;

    const timer = setTimeout(async () => {
      console.log('[Background PDF] Starting pre-generation...');
      const fileName = `market_research_${data.dbRecordId}`;

      // 1. Generate Dashboard PDF if not present
      let dashUrl = dashboardPdfUrl;
      if (!dashUrl) {
        try {
          const canvas = await html2canvas(dashRef.current, {
            scale: 1.5, useCORS: true, allowTaint: true,
            backgroundColor: '#f8fafc', logging: false
          });
          const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
          });
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width, canvas.height);
          const pdfBlob = pdf.output('blob');
          dashUrl = await uploadScreenshot(pdfBlob, fileName + '_dashboard.pdf');
          if (dashUrl) {
            setDashboardPdfUrl(dashUrl);
            await updateRecord(data.dbRecordId, { dashboard_pdf_url: dashUrl });
            console.log('[Background PDF] Dashboard uploaded:', dashUrl);
          }
        } catch (e) {
          console.warn('[Background PDF] Dashboard generation failed:', e);
        }
      }

      // 2. Generate Detailed Report PDF if not present
      let repUrl = reportPdfUrl;
      if (!repUrl) {
        try {
          const pages = [page1Ref, page2Ref, page3Ref, page4Ref, page5Ref, page6Ref, page7Ref, page8Ref, page9Ref, page10Ref, page11Ref];
          const canvases = [];
          for (let i = 0; i < pages.length; i++) {
            const canvas = await html2canvas(pages[i].current, {
              scale: 1.5, useCORS: true, allowTaint: true,
              backgroundColor: '#ffffff', logging: false
            });
            canvases.push(canvas);
          }
          const first = canvases[0];
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [first.width, first.height]
          });
          pdf.addImage(first.toDataURL('image/png'), 'PNG', 0, 0, first.width, first.height);
          for (let i = 1; i < canvases.length; i++) {
            const c = canvases[i];
            pdf.addPage([c.width, c.height], 'portrait');
            pdf.addImage(c.toDataURL('image/png'), 'PNG', 0, 0, c.width, c.height);
          }
          const pdfBlob = pdf.output('blob');
          repUrl = await uploadScreenshot(pdfBlob, fileName + '_detailed_report.pdf');
          if (repUrl) {
            setReportPdfUrl(repUrl);
            await updateRecord(data.dbRecordId, { report_pdf_url: repUrl });
            console.log('[Background PDF] Detailed report uploaded:', repUrl);
          }
        } catch (e) {
          console.warn('[Background PDF] Detailed report generation failed:', e);
        }
      }

      // Check if paid, and email if not already sent
      if (isPaid && repUrl && data?.email_status !== 'sent') {
        emailReportPdf(user.email, user.name || '', null, fileName + '_detailed_report.pdf', repUrl)
          .then(async (res) => {
            const status = res.success ? 'sent' : 'failed';
            await updateRecord(data.dbRecordId, { email_status: status });
          })
          .catch(async (err) => {
            console.warn('Failed to email report PDF on background completion:', err);
            await updateRecord(data.dbRecordId, { email_status: 'failed' });
          });
      }
    }, 3000); // 3-second delay to ensure charts are fully rendered

    return () => clearTimeout(timer);
  }, [data, answers, k, isPaid, dashboardPdfUrl, reportPdfUrl, user]);

  const handlePayment = async (onSuccess) => {
    setPaying(true);

    // Step 1: Create the Razorpay Order on the backend securely
    const orderRes = await createRazorpayOrder(1); // ₹1.00
    if (!orderRes.success) {
      alert(`Failed to initialize transaction: ${orderRes.error}`);
      setPaying(false);
      return;
    }

    // Save order details to Supabase immediately in pending state
    if (data?.dbRecordId) {
      await updateRecord(data.dbRecordId, {
        razorpay_order_id: orderRes.orderId,
        payment_status: 'pending'
      });
    }

    // Step 2: Fetch the active public Key ID from the backend to prevent build-time mismatch
    const keyId = await getRazorpayKey();
    if (!keyId) {
      alert("Failed to retrieve Razorpay Key ID from the server. Check backend configuration.");
      setPaying(false);
      return;
    }

    // Step 3: Load the Razorpay Checkout script
    const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!loaded) {
      alert("Failed to load Razorpay payment gateway script. Please check your internet connection.");
      setPaying(false);
      return;
    }

    const options = {
      key: keyId,
      amount: "100", // ₹1.00
      currency: "INR",
      name: "Infopace Management Pvt Ltd",
      description: "Unlock Report & Dashboard Downloads",
      image: window.location.origin + "/logo.png", // Absolute URL is required by Razorpay
      order_id: orderRes.orderId, // Pass the backend-generated Order ID
      handler: async function (response) {
        // Step 4: Verify the payment signature securely on the backend
        const verifyRes = await verifyRazorpayPayment({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        });

        if (verifyRes.success) {
          // Save payment verification success to database
          if (data?.dbRecordId) {
            await updateRecord(data.dbRecordId, {
              payment_status: 'success',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
          }
          const storageKey = `isPaid_${user?.email || 'global'}`;
          localStorage.setItem(storageKey, 'true');
          setIsPaid(true);
          setPaying(false);

          // Automatically trigger report email if it was already pre-generated in the background
          const activePdfUrl = reportPdfUrl || dashboardPdfUrl;
          if (user?.email && activePdfUrl) {
            const fileName = `market_research_${data.dbRecordId}.pdf`;
            emailReportPdf(user.email, user.name || '', null, fileName, activePdfUrl)
              .then(async (res) => {
                const status = res.success ? 'sent' : 'failed';
                if (data?.dbRecordId) {
                  await updateRecord(data.dbRecordId, { email_status: status });
                }
              })
              .catch(async (err) => {
                console.warn('Failed to email report PDF on payment success:', err);
                if (data?.dbRecordId) {
                  await updateRecord(data.dbRecordId, { email_status: 'failed' });
                }
              });
          }

          if (onSuccess) onSuccess();
        } else {
          // Save payment verification failure to database
          if (data?.dbRecordId) {
            await updateRecord(data.dbRecordId, {
              payment_status: 'failed'
            });
          }
          alert(`Payment verification failed: ${verifyRes.error}`);
          setPaying(false);
        }
      },
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
        contact: user?.phone || ""
      },
      theme: {
        color: "#1e3a8a"
      },
      modal: {
        ondismiss: async function () {
          // Save dismissal status to database
          if (data?.dbRecordId) {
            await updateRecord(data.dbRecordId, {
              payment_status: 'dismissed'
            });
          }
          setPaying(false);
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };
  const page3Ref = useRef(null);
  const page4Ref = useRef(null);
  const page5Ref = useRef(null);
  const page6Ref = useRef(null);
  const page7Ref = useRef(null);
  const page8Ref = useRef(null);
  const page9Ref = useRef(null);
  const page10Ref = useRef(null);
  const page11Ref = useRef(null);
  const k = data.kpi || {};
  const stars = Math.round(k.stars || 4);
  const sv = data.sentiment || { positive: 70, neutral: 20, negative: 10 };
  const detailedReport = data.detailedReport || {};
  const rep = {
    executiveSummary: detailedReport.executiveSummary || 'This comprehensive market research report provides an in-depth strategic analysis of the target industry, key demand drivers, and the competitive environment. The primary objective is to evaluate market opportunities, benchmark competitor strategies, and recommend actionable growth pathways.',
    marketGrowth: detailedReport.marketGrowth || 'Based on the historical and projected data, the market has demonstrated consistent upward momentum. This growth is driven by accelerated digital transformation and increasing adoption rates.',
    segmentation: detailedReport.segmentation || 'The market is divided into distinct customer segments. The high concentration in Enterprise suggests significant contract value opportunities, while the SMB and Startup segments represent high-velocity growth areas.',
    geography: detailedReport.geography || 'Geographical breakdown indicates that North America leads market share, with Europe representing a strong secondary market. Expansion efforts should prioritize strengthening presence in established markets.',
    competition: detailedReport.competition || 'The competitive landscape features established players. According to the positioning matrix, your core differentiators lie in product innovation and customer support, whereas competitors leverage brand legacy.',
    radarAnalysis: detailedReport.radarAnalysis || 'A detailed evaluation of the competitive positioning matrix highlights key strategic vectors. Innovation and support scores remain differentiators, while brand strength requires strategic GTM support.',
    pricing: detailedReport.pricing || 'A comparative analysis of pricing structures shows a diverse range of models. Your product is positioned as a competitive value option, balancing advanced features with an accessible price point.',
    risks: detailedReport.risks || 'The primary risks facing the company include intense competition from legacy vendors, high customer acquisition costs (CAC), and potential talent shortages. Mitigating these challenges requires investing in product feature differentiation.',
    ...detailedReport
  };

  const renderReportParagraphs = useCallback((text) => {
    const normalizedText = (text || '').replace(/\\n/gi, '\n');
    const lines = normalizedText.split(/\r?\n/);
    const elements = [];
    let currentParagraph = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('###')) {
        if (currentParagraph.length > 0) {
          elements.push(
            <div key={`p-${i}`} style={{ ...repStyles.bodyText, marginBottom: '8px' }}>
              {currentParagraph.join(' ')}
            </div>
          );
          currentParagraph = [];
        }
        const headerText = line.replace('###', '').trim();
        elements.push(
          <div key={`h-${i}`} style={{ fontSize: '13.5px', fontWeight: 800, color: '#1e3a8a', marginTop: '18px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.01em', fontFamily: '"Inter", -apple-system, sans-serif' }}>
            {headerText}
          </div>
        );
      } else {
        currentParagraph.push(line);
      }
    }

    if (currentParagraph.length > 0) {
      elements.push(
        <div key="p-last" style={{ ...repStyles.bodyText, marginBottom: '8px' }}>
          {currentParagraph.join(' ')}
        </div>
      );
    }

    return elements;
  }, []);

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
    layout: { padding: { top: 4, bottom: 0, left: 2, right: 2 } },
    plugins: { legend: { display: false }, datalabels: { display: false }, tooltip: { callbacks: { label: c => '$' + c.parsed.y.toFixed(1) + 'B' } } },
    scales: { x: { ticks: { font: { size: 11 } }, grid: { display: false } }, y: { min: parseFloat(growthMin.toFixed(1)), ticks: { font: { size: 11 }, callback: v => '$' + v + 'B' }, grid: { color: '#f1f5f9' } } },
  };

  const segData = {
    labels: (data.segments || []).map(s => s.label),
    datasets: [{ data: (data.segments || []).map(s => s.value), backgroundColor: ['#60a5fa', '#34d399', '#fbbf24'], borderWidth: 1, borderColor: '#ffffff' }],
  };
  const pieOpts = (cutout) => ({
    cutout, 
    layout: { padding: { top: 4, bottom: 4, left: 4, right: 12 } }, 
    plugins: { 
      legend: { position: 'right', labels: { font: { size: 10 }, boxWidth: 8, padding: 4 } }, 
      tooltip: { callbacks: { label: c => c.label + ': ' + c.parsed + '%' } }, 
      datalabels: datalabelPie 
    },
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
    layout: { padding: 4 },
    scales: { r: { min: 0, max: 5, ticks: { stepSize: 1, font: { size: 10 }, display: false }, pointLabels: { font: { size: 10 } }, grid: { color: '#f1f5f9' }, angleLines: { color: '#f1f5f9' } } },
    plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, boxWidth: 8, padding: 4 } }, datalabels: { display: false } },
  };

  // ── Screenshot & Save ──────────────────────────────────────────────────────
  // ── Screenshot & Save Dashboard (Single page Landscape) ─────────────────────
  // ── Screenshot & Save Dashboard (Single page Landscape) ─────────────────────
  const executeDownloadDashboard = useCallback(async () => {
    if (dashboardPdfUrl) {
      window.open(dashboardPdfUrl, '_blank');
      return;
    }

    const badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;bottom:16px;right:16px;background:var(--navy);color:#fff;font-size:12px;font-weight:600;padding:10px 18px;border-radius:4px;z-index:9999;box-shadow:var(--shadow-md);font-family:inherit';
    badge.textContent = 'Exporting Dashboard...';
    document.body.appendChild(badge);

    try {
      const canvas = await html2canvas(dashRef.current, {
        scale: 1.5, useCORS: true, allowTaint: true,
        backgroundColor: '#f8fafc', logging: false
      });
      
      const safeCompany = (user.company || 'unknown').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = safeCompany + '_dashboard_' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      badge.textContent = 'Generating PDF...';
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      
      pdf.save(fileName + '.pdf');

      badge.textContent = 'Uploading secure bundle...';
      const pdfBlob = pdf.output('blob');
      const docUrl = await uploadScreenshot(pdfBlob, fileName + '.pdf');

      // Asynchronously trigger report emailing using the uploaded docUrl (bypassing payload size limit)
      if (user?.email && docUrl) {
        emailReportPdf(user.email, user.name || '', null, fileName + '.pdf', docUrl)
          .then(async (res) => {
            const status = res.success ? 'sent' : 'failed';
            if (data?.dbRecordId) {
              await updateRecord(data.dbRecordId, { email_status: status });
            }
          })
          .catch(async (err) => {
            console.warn('Failed to email dashboard PDF:', err);
            if (data?.dbRecordId) {
              await updateRecord(data.dbRecordId, { email_status: 'failed' });
            }
          });
      }

      badge.textContent = 'Finalizing record...';
      let ok = false;
      if (data.dbRecordId) {
        ok = await updateRecord(data.dbRecordId, { pdf_url: docUrl, dashboard_pdf_url: docUrl });
        if (ok) {
          setDashboardPdfUrl(docUrl);
        }
      } else {
        const saved = await saveRecord(payload);
        ok = !!saved;
      }
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

  const handleDownloadDashboard = useCallback(() => {
    if (!isPaid) {
      handlePayment(executeDownloadDashboard);
      return;
    }
    executeDownloadDashboard();
  }, [isPaid, executeDownloadDashboard]);

  // ── Screenshot & Save Detailed Report (8 Pages Portrait) ───────────────────
  const executeDownloadReport = useCallback(async () => {
    if (reportPdfUrl) {
      window.open(reportPdfUrl, '_blank');
      return;
    }

    const badge = document.createElement('div');
    badge.style.cssText = 'position:fixed;bottom:16px;right:16px;background:var(--navy);color:#fff;font-size:12px;font-weight:600;padding:10px 18px;border-radius:4px;z-index:9999;box-shadow:var(--shadow-md);font-family:inherit';
    badge.textContent = 'Preparing Report...';
    document.body.appendChild(badge);

    try {
      const pages = [page1Ref, page2Ref, page3Ref, page4Ref, page5Ref, page6Ref, page7Ref, page8Ref];
      const canvases = [];
      
      for (let i = 0; i < pages.length; i++) {
        badge.textContent = `Exporting Report Page ${i + 1} of 8...`;
        const canvas = await html2canvas(pages[i].current, {
          scale: 1.5, useCORS: true, allowTaint: true,
          backgroundColor: '#ffffff', logging: false
        });
        canvases.push(canvas);
      }

      const safeCompany = (user.company || 'unknown').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = safeCompany + '_detailed_report_' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      badge.textContent = 'Generating 8-Page PDF...';
      const first = canvases[0];
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [first.width, first.height]
      });
      pdf.addImage(first.toDataURL('image/png'), 'PNG', 0, 0, first.width, first.height);

      for (let i = 1; i < canvases.length; i++) {
        const c = canvases[i];
        pdf.addPage([c.width, c.height], 'portrait');
        pdf.addImage(c.toDataURL('image/png'), 'PNG', 0, 0, c.width, c.height);
      }
      
      pdf.save(fileName + '.pdf');

      badge.textContent = 'Uploading secure bundle...';
      const pdfBlob = pdf.output('blob');
      const docUrl = await uploadScreenshot(pdfBlob, fileName + '.pdf');

      // Asynchronously trigger report emailing using the uploaded docUrl (bypassing payload size limit)
      if (user?.email && docUrl) {
        emailReportPdf(user.email, user.name || '', null, fileName + '.pdf', docUrl)
          .then(async (res) => {
            const status = res.success ? 'sent' : 'failed';
            if (data?.dbRecordId) {
              await updateRecord(data.dbRecordId, { email_status: status });
            }
          })
          .catch(async (err) => {
            console.warn('Failed to email detailed report PDF:', err);
            if (data?.dbRecordId) {
              await updateRecord(data.dbRecordId, { email_status: 'failed' });
            }
          });
      }

      badge.textContent = 'Finalizing record...';
      let ok = false;
      if (data.dbRecordId) {
        ok = await updateRecord(data.dbRecordId, { pdf_url: docUrl, report_pdf_url: docUrl });
        if (ok) {
          setReportPdfUrl(docUrl);
        }
      } else {
        const saved = await saveRecord(payload);
        ok = !!saved;
      }
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
  }, [data, user, answers, k, page1Ref, page2Ref, page3Ref, page4Ref, page5Ref, page6Ref, page7Ref, page8Ref]);

  const handleDownloadReport = useCallback(() => {
    if (!isPaid) {
      handlePayment(executeDownloadReport);
      return;
    }
    executeDownloadReport();
  }, [isPaid, executeDownloadReport]);

  return (
    <div ref={dashRef} style={{ position:'fixed', inset:0, width:'100%', display:'flex', flexDirection:'column', background:'var(--bg-main)', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ flexShrink:0, background:'var(--navy)', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--navy-light)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📊</span>
            <h2 style={{ fontSize:'18px', fontWeight:700, color:'#fff', margin:0, letterSpacing:'-0.01em' }}>Market Research Dashboard</h2>
          </div>
          <p style={{ fontSize:'12px', color:'#94a3b8', marginTop:'4px', fontWeight:500 }}>
            {user.name} - {user.company} - {answers.customer || user.service}
          </p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={handleDownloadDashboard} disabled={paying} style={{ padding:'6px 14px', border:'none', borderRadius:'var(--radius-sm)', background:'var(--success)', color:'#fff', fontFamily:'inherit', fontSize:'14px', fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'6px' }}>
            {isPaid ? 'Download PDF' : 'Download PDF (🔒 ₹1)'}
          </button>
          <button onClick={handleDownloadReport} disabled={paying} style={{ padding:'6px 14px', border:'none', borderRadius:'var(--radius-sm)', background:'var(--primary)', color:'#fff', fontFamily:'inherit', fontSize:'14px', fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'6px' }}>
            {isPaid ? 'Download Detailed Report' : 'Download Detailed Report (🔒 ₹1)'}
          </button>
          <button onClick={() => setShowHistory(true)} style={{ padding:'6px 14px', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'var(--radius-sm)', background:'transparent', color:'#f8fafc', fontFamily:'inherit', fontSize:'14px', fontWeight:500, cursor:'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>📜</span> History
          </button>
          <button onClick={onReset} style={{ padding:'6px 14px', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'var(--radius-sm)', background:'transparent', color:'#f8fafc', fontFamily:'inherit', fontSize:'14px', fontWeight:500, cursor:'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>←</span> New Research
          </button>
          <button onClick={onOpenAbout} style={{ padding:'6px 14px', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'var(--radius-sm)', background:'transparent', color:'#f8fafc', fontFamily:'inherit', fontSize:'14px', fontWeight:500, cursor:'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>ℹ️</span> About
          </button>
        </div>
      </div>

      {/* Main Grid: Forces layout into absolute single screen */}
      <div style={{ flex:1, display:'grid', gridTemplateRows:'82px 1.1fr 1.3fr 54px', gap:'8px', padding:'8px 12px', minHeight:0, overflow:'hidden' }}>

        {/* KPIs */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'8px' }}>
          {[
            { label:'TOTAL MARKET SIZE', val: k.tam },
            { label:'GROWTH RATE',       val: k.growthRate, sub: '▲ ' + k.growthRate, subColor:'var(--success)' },
            { label:'TARGET CUSTOMERS',  val: k.customers },
            { label:'COMPETITORS',       val: k.competitors },
            { label:'COMPANY STAGE',     val: k.stage, small: true },
            { label:'AVG MARKET PRICE',  val: k.price, stars: true },
          ].map((kpi, i) => (
            <div key={i} style={{ background:'#fff', borderRadius:'var(--radius-sm)', padding:'8px 12px', border:'1px solid #e2e8f0', display: 'flex', flexDirection: 'column', minWidth:0, justifyContent: 'center', height: '82px', boxSizing: 'border-box', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                <div style={{ fontSize:'12px', color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>{kpi.label}</div>
              </div>
              <div style={{ fontSize: kpi.val && kpi.val.length > 25 ? '11px' : (kpi.val && kpi.val.length > 12 ? '14px' : (kpi.small ? '18px' : '23px')), fontWeight:700, color:'var(--text-main)', lineHeight:1.15 }}>{kpi.val || '—'}</div>
              {kpi.sub   && <div style={{ fontSize:'14px', color: kpi.subColor || 'var(--text-muted)', fontWeight:600, marginTop: '4px' }}>{kpi.sub}</div>}
              {kpi.stars && <div style={{ color:'#fbbf24', fontSize:'17px', marginTop: '4px' }}>{'★'.repeat(stars)}{'☆'.repeat(5-stars)}</div>}
            </div>
          ))}
        </div>

        {/* Row 2 */}
        <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr 1fr', gap:'8px', minHeight:0, overflow:'hidden' }}>
          <ChartCard title="📈 Market Growth Trend" type="line" data={growthData} options={growthOpts} />
          <ChartCard title="🍊 Market Segmentation" type="pie" data={segData} options={pieOpts(undefined)} />
          <ChartCard title="🌏 Geographic Distribution" type="doughnut" data={geoData} options={pieOpts('55%')} />
        </div>

        {/* Row 3 */}
        <div style={{ display:'grid', gridTemplateColumns:'0.9fr 1fr 1.6fr', gap:'8px', minHeight:0, overflow:'hidden' }}>
          <ChartCard title="🏆 Competitor Share" type="doughnut" data={compPieData} options={pieOpts('50%')} />
          <ChartCard title="🕸️ Competitive Positioning" type="radar" data={radarData} options={radarOpts} />

          {/* Details 2x2 grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:'8px', minHeight:0, overflow:'hidden' }}>
            
            {/* Market Share Bars */}
            <div style={{ background:'#fff', borderRadius:'var(--radius-sm)', padding:'10px 12px', border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text-main)', marginBottom:'6px', display: 'flex', alignItems: 'center', gap: '6px' }}><span>📊</span> Market Share %</div>
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
              <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text-main)', marginBottom:'6px', display: 'flex', alignItems: 'center', gap: '6px' }}><span>⭐</span> Rating & Sentiment</div>
              <div style={{ display:'flex', alignItems:'center', gap:'2px', marginBottom:'8px' }}>
                <span style={{ fontSize:'21px', fontWeight:700, color:'var(--text-main)' }}>{data.avgRating || '—'}</span>
                <span style={{ fontSize:'13px', color:'#94a3b8', marginLeft: '4px' }}>/ 5.0</span>
              </div>
              <div style={{ display:'flex', gap:'4px', flex: 1 }}>
                {[
                  { label:'Positive', val:sv.positive, bg:'#eafaf1', color:'#15803d' },
                  { label:'Neutral',  val:sv.neutral,  bg:'#eff6ff', color:'#1d4ed8' },
                  { label:'Negative', val:sv.negative, bg:'#fdf2f2', color:'#b91c1c' },
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
              <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text-main)', marginBottom:'6px', display: 'flex', alignItems: 'center', gap: '6px' }}><span>💰</span> Pricing</div>
              <div style={{ display:'flex', flexDirection:'column', gap: '3px', overflow:'hidden' }}>
                {(data.pricing || []).map((p, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'8px', padding:'2px 0', borderBottom:'1px solid #f1f5f9' }}>
                    <div style={{ width:'6px', height:'6px', borderRadius:'1px', background: p.color, flexShrink:0 }} />
                    <div style={{ fontSize:'12px', fontWeight:600, color: 'var(--text-main)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                    <div style={{ fontSize:'11px', color:'var(--text-muted)', whiteSpace:'nowrap' }}>{p.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Challenges */}
            <div style={{ background:'#fff', borderRadius:'var(--radius-sm)', padding:'10px 12px', border:'1px solid #e2e8f0', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ fontSize:'14px', fontWeight:700, color:'var(--text-main)', marginBottom:'6px', display: 'flex', alignItems: 'center', gap: '6px' }}><span>⚠️</span> Challenges</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY:'auto', flex: 1 }}>
                {[
                  { icon: '✖️', color: 'var(--danger)' },
                  { icon: '📍', color: 'var(--primary)' },
                  { icon: '🟢', color: 'var(--success)' },
                ].map((iconObj, i) => {
                  const challengeText = (data.challenges || [])[i];
                  if (!challengeText) return null;
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'6px', padding:'1px 0', fontSize:'11.5px', fontWeight: 500, color:'var(--text-muted)', lineHeight: 1.3 }}>
                      <span style={{ fontSize: '11px', marginTop:'1px' }}>{iconObj.icon}</span>
                      <span>{challengeText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div style={{ background:'#ffffff', borderRadius:'var(--radius-sm)', padding:'8px 16px', border:'1px solid #cbd5e1', display:'flex', alignItems:'center', gap:'12px', overflow:'hidden', flexShrink:0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize:'13px', fontWeight:700, color:'#1e3a8a', flexShrink: 0 }}>
            <span>💡</span> AI Insights
          </div>
          <div style={{ flex: 1, fontSize:'12.5px', color:'var(--text-main)', fontWeight: 500, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', wordBreak: 'break-word' }}>
            {data.insights}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', flexShrink: 0 }}>
            <span>☑️</span> Key
          </div>
        </div>

      </div>
      
      {/* Off-screen detailed report for PDF generation (Formatted using CII_Report_FINAL template) */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Style injection for CII Report Template */}
        <style>{`
          .cii-page {
            width: 800px;
            height: 1130px;
            box-sizing: border-box;
            background: #ffffff;
            color: #1e293b;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            padding: 40px 45px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            position: relative;
            border: 1px solid rgba(17,68,160,0.14);
          }
          .cii-pg-hdr {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-bottom: 10px;
            margin-bottom: 14px;
            border-bottom: 1px solid rgba(17,68,160,0.14);
          }
          .cii-brand {
            font-size: 11.5px;
            font-weight: 700;
            letter-spacing: 0.14em;
            color: #061228;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            gap: 9px;
          }
          .cii-brand span { color: #1a56db; }
          .cii-pg-num {
            font-size: 11px;
            color: #64748b;
            letter-spacing: 0.08em;
            font-family: 'IBM Plex Mono', monospace;
          }
          .cii-pg-ftr {
            margin-top: auto;
            padding-top: 10px;
            border-top: 1px solid rgba(17,68,160,0.14);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 9.5px;
            color: #94a3b8;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }
          .cii-eyebrow {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.15em;
            color: #1a56db;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .cii-pg-title {
            font-size: 24px;
            font-weight: 700;
            color: #061228;
            margin-bottom: 4px;
            line-height: 1.2;
          }
          .cii-pg-sub {
            font-size: 12px;
            color: #64748b;
            line-height: 1.45;
            margin-bottom: 12px;
          }
          .cii-sec-title {
            font-size: 12.5px;
            font-weight: 700;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: #061228;
            margin: 12px 0 6px;
            padding-top: 8px;
            border-top: 1px solid rgba(17,68,160,0.14);
          }
          .cii-body {
            font-size: 11.5px;
            line-height: 1.65;
            color: #334155;
            margin-bottom: 6px;
            text-align: justify;
          }
          .cii-callout {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 10px 14px;
            font-size: 11px;
            color: #334155;
            line-height: 1.55;
            margin: 10px 0;
          }
          .cii-callout.insight {
            background: #fffbeb;
            border-color: #fde68a;
          }
          .cii-callout.insight .cii-lbl { color: #b45309; }
          .cii-lbl {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: #1a56db;
            margin-bottom: 3px;
            display: block;
          }
          .cii-stat-row {
            display: flex;
            gap: 10px;
            margin: 10px 0 12px;
          }
          .cii-stat-box {
            flex: 1;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 8px 10px;
            text-align: center;
          }
          .cii-stat-box .n {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 20px;
            font-weight: 700;
            color: #0f3460;
          }
          .cii-stat-box .l {
            font-size: 9px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 2px;
          }
          .cii-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
          }
          .cii-table th {
            text-align: left;
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: #64748b;
            padding: 6px 8px;
            border-bottom: 1.5px solid #061228;
            background: #f8fafc;
          }
          .cii-table td {
            padding: 6px 8px;
            font-size: 11px;
            border-bottom: 1px solid rgba(17,68,160,0.14);
            color: #1e293b;
          }
          .cii-flag-row {
            display: flex;
            gap: 8px;
            align-items: flex-start;
            padding: 8px 12px;
            border-radius: 8px;
            margin-bottom: 6px;
            font-size: 11px;
            line-height: 1.55;
          }
          .cii-flag-row.warn { background: #fff7ed; border: 1px solid #fed7aa; color: #7c2d12; }
          .cii-flag-row.good { background: #f0fdf4; border: 1px solid #bbf7d0; color: #14532d; }
          .cii-action-item {
            display: flex;
            gap: 10px;
            padding: 10px 0;
            border-bottom: 1px solid rgba(17,68,160,0.14);
          }
          .cii-action-num {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #1a56db;
            color: #fff;
            font-size: 11px;
            font-weight: 700;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-top: 1px;
          }
          .cii-action-dim {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #1a56db;
            margin-bottom: 2px;
          }
          .cii-action-text { font-size: 11.5px; color: #334155; line-height: 1.6; }
          .cii-action-why { font-size: 10.5px; color: #64748b; line-height: 1.5; margin-top: 2px; font-style: italic; }
          .cii-action-signal {
            font-size: 10.5px;
            color: #0f766e;
            line-height: 1.5;
            margin-top: 3px;
            background: #f0fdfa;
            border-left: 2px solid #5eead4;
            padding: 3px 8px;
            border-radius: 0 4px 4px 0;
          }
          .cii-a-card-grid {
            display: flex;
            gap: 12px;
            margin: 8px 0 10px;
          }
          .cii-a-card {
            flex: 1;
            border-radius: 8px;
            padding: 10px 12px;
            box-sizing: border-box;
          }
          .cii-a-card.up { background: #f0fdf4; border: 1px solid #bbf7d0; }
          .cii-a-card.down { background: #fff1f2; border: 1px solid #fecdd3; }
          .cii-a-card-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 2px;
          }
          .cii-a-card.up .cii-a-card-label { color: #15803d; }
          .cii-a-card.down .cii-a-card-label { color: #be123c; }
          .cii-a-card-score {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 22px;
            font-weight: 700;
            line-height: 1;
            margin-bottom: 2px;
          }
          .cii-a-card.up .cii-a-card-score { color: #166534; }
          .cii-a-card.down .cii-a-card-score { color: #9f1239; }
          .cii-a-card-dim { font-size: 11.5px; font-weight: 700; color: #061228; margin-bottom: 2px; }
          .cii-a-card-desc { font-size: 10px; color: #475569; line-height: 1.45; }

          .cii-spread-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 4px;
            font-size: 10.5px;
          }
          .cii-spread-label { width: 110px; font-weight: 600; color: #334155; white-space: nowrap; }
          .cii-spread-track { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; position: relative; }
          .cii-spread-fill { height: 100%; border-radius: 4px; }
          .cii-spread-avg { position: absolute; top: -1px; width: 2px; height: 10px; background: #475569; }
          .cii-spread-val { width: 35px; text-align: right; font-weight: 700; font-family: 'IBM Plex Mono', monospace; color: #1e293b; }

          .analysis-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
          .a-card { border-radius: 10px; padding: 12px 14px; }
          .a-card.up { background: #f0fdf4; border: 1px solid #bbf7d0; }
          .a-card.down { background: #fdf2f8; border: 1px solid #fbcfe8; }
          .a-card-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
          .a-card.up .a-card-label { color: #059669; }
          .a-card.down .a-card-label { color: #be185d; }
          .a-card-score { font-family: 'IBM Plex Mono', monospace; font-size: 32px; font-weight: 700; color: #061228; line-height: 1; }
          .a-card-dim { font-size: 13px; font-weight: 700; color: #061228; margin-top: 4px; }
          .a-card-desc { font-size: 10.5px; color: #64748b; margin-top: 3px; line-height: 1.5; }

          .spread-row { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
          .spread-label { width: 95px; font-size: 10.5px; font-weight: 600; color: #061228; flex-shrink: 0; }
          .spread-track { flex: 1; height: 6px; background: #eff6ff; border-radius: 4px; position: relative; }
          .spread-fill { height: 100%; border-radius: 4px; }
          .spread-avg { position: absolute; top: -2px; width: 2px; height: 10px; background: #475569; }
          .spread-val { width: 60px; text-align: right; font-family: 'IBM Plex Mono', monospace; font-size: 11px; }

          .flag-row { display: flex; gap: 9px; align-items: flex-start; padding: 8px 12px; border-radius: 8px; margin-bottom: 6px; font-size: 11px; line-height: 1.55; }
          .flag-row.warn { background: #fff7ed; border: 1px solid #fed7aa; color: #7c2d12; }
          .flag-row.good { background: #f0fdf4; border: 1px solid #bbf7d0; color: #14532d; }

          .radar-flex { display: flex; align-items: flex-start; gap: 20px; margin-bottom: 12px; }
          .archetype-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 10px 14px; margin-bottom: 10px; }
          .archetype-name { font-size: 18px; font-weight: 700; color: #061228; font-family: 'Playfair Display', serif; }
          .dim-list-row { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 11px; }
          .dim-list-row .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
          .dim-list-row .bar { flex: 1; height: 5px; background: #eff6ff; border-radius: 3px; overflow: hidden; }
          .dim-list-row .fill { height: 100%; border-radius: 3px; }
          .dim-list-row .val { width: 26px; text-align: right; font-family: 'IBM Plex Mono', monospace; font-weight: 700; }

          .seq-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
          .seq-table th { text-align: left; font-size: 9.5px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #64748b; padding: 5px 7px; border-bottom: 1.5px solid #061228; }
          .seq-table td { padding: 6px 7px; font-size: 11px; border-bottom: 1px solid rgba(17,68,160,0.14); vertical-align: top; }
          .seq-week { font-family: 'IBM Plex Mono', monospace; font-weight: 700; color: #0f3460; white-space: nowrap; }
          .seq-dim-tag { display: inline-block; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 8px; color: #fff; }

          .summary-table { width: 100%; border-collapse: collapse; margin: 8px 0; }
          .summary-table th { text-align: left; font-size: 9.5px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #64748b; padding: 5px 7px; border-bottom: 1.5px solid #061228; }
          .summary-table td { padding: 6px 7px; font-size: 10.5px; border-bottom: 1px solid rgba(17,68,160,0.14); }

          .cii-body { font-size: 11.5px; line-height: 1.65; color: #334155; margin-bottom: 6px; }
          .cii-body b { color: #061228; }
          .cii-tracker-block {
            border: 1px solid rgba(17,68,160,0.14);
            border-radius: 8px;
            padding: 10px 14px;
            margin-top: 10px;
            background: #fafbfe;
          }
        `}</style>
        
        {/* Page 1: Cover Page (CII Template Page 1) */}
        <div ref={page1Ref} className="cii-page">
          <div style={{ padding: '10px 0 0' }}>
            <img src="/logo.png" alt="Infopace Logo" style={{ height: '46px', objectFit: 'contain' }} />
          </div>

          <div style={{ padding: '10px 0', position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1a56db', fontWeight: 700, marginBottom: '16px', fontFamily: '"IBM Plex Mono", monospace' }}>
              ASSESSMENT REPORT · EXECUTIVE EDITION
            </div>
            <div style={{ fontWeight: 800, fontSize: '50px', lineHeight: 1.08, color: '#061228', letterSpacing: '-0.01em', fontFamily: '"Playfair Display", Georgia, serif' }}>
              {user.company ? user.company.slice(0, 24) : 'Market Research'}
            </div>
            <div style={{ fontWeight: 800, fontSize: '50px', lineHeight: 1.08, color: '#1a56db', letterSpacing: '-0.01em', fontFamily: '"Playfair Display", Georgia, serif' }}>
              {answers.industry ? answers.industry.split(' — ')[0].slice(0, 24) : 'Intelligence'}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#334155', marginTop: '24px' }}>
              Comprehensive Market Analysis &amp; Strategic Roadmap
            </div>
          </div>

          {/* Metadata Card */}
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px 20px', margin: '20px 0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Prepared For</span>
                <strong style={{ color: '#061228', fontSize: '14px' }}>{user.name || 'Enterprise Client'}</strong>
                <div style={{ color: '#475569', fontSize: '11px' }}>{user.email}</div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Organization &amp; Solution</span>
                <strong style={{ color: '#061228', fontSize: '14px' }}>{user.company || 'Infopace Partner'}</strong>
                <div style={{ color: '#475569', fontSize: '11px' }}>{user.service ? user.service.slice(0, 45) : 'B2B Strategic Venture'}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '10px', borderTop: '1px solid rgba(17,68,160,0.14)', paddingTop: '12px' }}>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: '"IBM Plex Mono", monospace' }}>
              Prepared By Infopace Management Pvt. Ltd.
            </div>
            <div style={{ fontWeight: 800, fontSize: '42px', color: '#061228', lineHeight: 1 }}>
              2026
            </div>
          </div>
        </div>

        {/* Page 2: Executive Overview & Summary (CII Template Page 2) */}
        <div ref={page2Ref} className="cii-page">
          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">02 / 08</div>
            </div>

            <div className="cii-eyebrow">Section One</div>
            <div className="cii-pg-title">Executive Summary &amp; Market Overview</div>
            <div className="cii-pg-sub">High-level market valuation, core growth drivers, and strategic positioning at a glance.</div>

            {/* Key Stats Row */}
            <div className="cii-stat-row">
              <div className="cii-stat-box"><div className="n">{k.tam || '$5.2B'}</div><div className="l">Total Market Size</div></div>
              <div className="cii-stat-box"><div className="n">{k.growthRate || '8.5%'}</div><div className="l">CAGR Growth</div></div>
              <div className="cii-stat-box"><div className="n">{k.customers || '1.2M'}</div><div className="l">Target Customers</div></div>
              <div className="cii-stat-box"><div className="n">{k.competitors || 5}</div><div className="l">Top Competitors</div></div>
            </div>

            <div className="cii-sec-title">Executive Overview</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {renderReportParagraphs(rep.executiveSummary)}
            </div>

            <div className="cii-sec-title">All Key Parameters At A Glance</div>
            <table className="cii-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Market Baseline Value</th>
                  <th>Strategic Impact</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>TAM Estimate</strong></td><td>{k.tam || 'N/A'}</td><td style={{ color: '#16a34a', fontWeight: 600 }}>High Expansion Room</td></tr>
                <tr><td><strong>Projected Growth</strong></td><td>{k.growthRate || 'N/A'} CAGR</td><td style={{ color: '#1d4ed8', fontWeight: 600 }}>Steady Upside Momentum</td></tr>
                <tr><td><strong>Company Stage</strong></td><td>{k.stage || 'Growth'}</td><td style={{ color: '#64748b' }}>Active Market Penetration</td></tr>
                <tr><td><strong>Avg Pricing Tier</strong></td><td>{k.price || 'Market Avg'}</td><td style={{ color: '#b45309', fontWeight: 600 }}>Competitive Value Position</td></tr>
              </tbody>
            </table>

            <div className="cii-callout insight">
              <span className="cii-lbl">Key Strategic Insight</span>
              {data.insights || 'Strong TAM with differentiation opportunity. Fragmented competition creates share capture potential — product innovation is your primary growth lever.'}
            </div>
          </div>

          <div className="cii-pg-ftr">
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Market Intelligence Report</div>
          </div>
        </div>

        {/* Page 3: Market Growth Trajectory (In-between detail page with Chart as Heading) */}
        <div ref={page3Ref} className="cii-page">
          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">03 / 08</div>
            </div>

            <div className="cii-eyebrow">Section Two — Deep Detail</div>
            <div className="cii-pg-title">Market Growth &amp; Historical Trajectory</div>
            <div className="cii-pg-sub">Historical market sizing and projected CAGR trajectory (2018–2024).</div>

            {/* CHART HEADING BANNER */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px', alignItems: 'center' }}>
                <ChartCard title="📈 Market Growth Trend" type="line" data={growthData} options={{ ...growthOpts, layout: { padding: 4 } }} height="145px" style={{ background: '#ffffff', padding: '8px', border: '1px solid #e2e8f0', boxShadow: 'none' }} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', textTransform: 'uppercase' }}>Growth Metrics Data</div>
                  <table className="cii-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Market Size ($B)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.growth?.labels || []).slice(0, 5).map((lbl, idx) => (
                        <tr key={idx}>
                          <td><strong>{lbl}</strong></td>
                          <td>${(data.growth?.values || [])[idx] || 0}B</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="cii-sec-title">Deep Growth Analysis</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {renderReportParagraphs(rep.marketGrowth)}
            </div>

            <div className="cii-callout">
              <span className="cii-lbl">Growth Trajectory Callout</span>
              Macro expansion remains steady. Cloud adoption and digital transformation serve as primary tailwinds sustaining long-term market size scaling.
            </div>
          </div>

          <div className="cii-pg-ftr">
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Market Intelligence Report</div>
          </div>
        </div>

        {/* Page 4: Customer Segmentation (In-between detail page with Chart as Heading) */}
        <div ref={page4Ref} className="cii-page">
          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">04 / 08</div>
            </div>

            <div className="cii-eyebrow">Section Two — Deep Detail</div>
            <div className="cii-pg-title">Customer Segmentation &amp; Demographics</div>
            <div className="cii-pg-sub">Target customer profiles, purchasing power, and segment share breakdown.</div>

            {/* CHART HEADING BANNER */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                <ChartCard title="🍊 Market Segmentation Share" type="pie" data={segData} options={{ ...pieOpts(undefined), layout: { padding: 4 } }} height="145px" style={{ background: '#ffffff', padding: '8px', border: '1px solid #e2e8f0', boxShadow: 'none' }} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', textTransform: 'uppercase' }}>Segment Shares Table</div>
                  <table className="cii-table">
                    <thead>
                      <tr>
                        <th>Customer Segment</th>
                        <th>Distribution (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.segments || []).map((s, idx) => (
                        <tr key={idx}>
                          <td><strong>{s.label}</strong></td>
                          <td>{s.value}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="cii-sec-title">Segmentation &amp; Purchasing Behavior Analysis</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {renderReportParagraphs(rep.segmentation)}
            </div>

            <div className="cii-callout">
              <span className="cii-lbl">GTM Persona Recommendation</span>
              Enterprise buyers offer high contract values but require security SLA compliance, whereas SMBs and Startups prioritize rapid onboarding and transparent pricing.
            </div>
          </div>

          <div className="cii-pg-ftr">
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Market Intelligence Report</div>
          </div>
        </div>

        {/* Page 5: Geographic Distribution (In-between detail page with Chart as Heading) */}
        <div ref={page5Ref} className="cii-page">
          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">05 / 08</div>
            </div>

            <div className="cii-eyebrow">Section Two — Deep Detail</div>
            <div className="cii-pg-title">Geographic Distribution &amp; Regional GTM</div>
            <div className="cii-pg-sub">Geographical penetration weights, regulatory barriers, and territorial vectors.</div>

            {/* CHART HEADING BANNER */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
                <ChartCard title="🌏 Geographic Breakdown" type="doughnut" data={geoData} options={{ ...pieOpts('55%'), layout: { padding: 4 } }} height="145px" style={{ background: '#ffffff', padding: '8px', border: '1px solid #e2e8f0', boxShadow: 'none' }} />
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', marginBottom: '6px', textTransform: 'uppercase' }}>Territory Breakdown</div>
                  <table className="cii-table">
                    <thead>
                      <tr>
                        <th>Region / Territory</th>
                        <th>Market Share (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.geo || []).map((g, idx) => (
                        <tr key={idx}>
                          <td><strong>{g.label}</strong></td>
                          <td>{g.value}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="cii-sec-title">Territorial &amp; Compliance Analysis</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {renderReportParagraphs(rep.geography)}
            </div>

            <div className="cii-callout">
             {/* Page 6: Strengths, Growth Areas & Watch-Outs (CII Template Page 7) */}
        <div ref={page6Ref} className="cii-page">
          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">06 / 08</div>
            </div>

            <div className="cii-eyebrow">Section Three</div>
            <div className="cii-pg-title">Strengths, Growth Areas &amp; Watch-Outs</div>
            <div className="cii-pg-sub">Your single strongest dimension, your single greatest opportunity, and specific patterns worth being aware of.</div>

            <div className="analysis-cards">
              <div className="a-card up">
                <div className="a-card-label">↑ Strongest Dimension</div>
                <div className="a-card-score">82</div>
                <div className="a-card-dim">Vision &amp; Drive</div>
                <div className="a-card-desc">This is your most reliable creative asset — lean on it deliberately when a project needs someone to hold the line on why it matters. In practice, this means volunteering to own the "why" in ambiguous, early-stage work where conviction is scarce.</div>
              </div>
              <div className="a-card down">
                <div className="a-card-label">↓ Primary Growth Area</div>
                <div className="a-card-score">48</div>
                <div className="a-card-dim">Innovation</div>
                <div className="a-card-desc">The clearest lever for raising your overall score — see the targeted actions later in this report. With consistent effort, a meaningful, visible shift (roughly 10–15 points) is realistic within 60–90 days — this is a habit gap, not a capability gap, so it responds relatively quickly to deliberate practice.</div>
              </div>
            </div>

            <div className="cii-sec-title">Dimension Spread vs. Population Average</div>
            <div className="spread-row"><div className="spread-label">Divergent</div><div className="spread-track"><div className="spread-fill" style={{ width: '70%', background: '#a21caf' }}></div><div className="spread-avg" style={{ left: '58%' }}></div></div><div className="spread-val mono">+12</div></div>
            <div className="spread-row"><div className="spread-label">Remote Assoc.</div><div className="spread-track"><div className="spread-fill" style={{ width: '58%', background: '#06b6d4' }}></div><div className="spread-avg" style={{ left: '55%' }}></div></div><div className="spread-val mono">+3</div></div>
            <div className="spread-row"><div className="spread-label">Risk</div><div className="spread-track"><div className="spread-fill" style={{ width: '75%', background: '#1a56db' }}></div><div className="spread-avg" style={{ left: '50%' }}></div></div><div className="spread-val mono">+25</div></div>
            <div className="spread-row"><div className="spread-label">Vision</div><div className="spread-track"><div className="spread-fill" style={{ width: '82%', background: '#10b981' }}></div><div className="spread-avg" style={{ left: '60%' }}></div></div><div className="spread-val mono">+22</div></div>
            <div className="spread-row"><div className="spread-label">Behavior</div><div className="spread-track"><div className="spread-fill" style={{ width: '52%', background: '#f97316' }}></div><div className="spread-avg" style={{ left: '54%' }}></div></div><div className="spread-val mono">-2</div></div>
            <div className="spread-row"><div className="spread-label">Innovation</div><div className="spread-track"><div className="spread-fill" style={{ width: '48%', background: '#f43f5e' }}></div><div className="spread-avg" style={{ left: '56%' }}></div></div><div className="spread-val mono">-8</div></div>

            <div className="cii-sec-title">Watch-Outs</div>
            <div className="flag-row warn"><b>⚠</b><div><b>Vision–Behavior gap (30pt spread):</b> the distance between your Vision score (82) and Creative Behavior score (52) suggests you envision more than you currently execute day-to-day. This is common and fixable — it usually means the blocker is habit, not capability.</div></div>
            <div className="flag-row warn"><b>⚠</b><div><b>Creative Behavior sits close to a band boundary:</b> at 52, this score is only a few points above slipping into the below-average band. It isn't a current problem, but it's the one dimension in this profile worth monitoring on the next assessment to confirm it's holding steady rather than drifting down.</div></div>
            <div className="flag-row warn"><b>⚠</b><div><b>Conviction may outpace validation:</b> your Risk &amp; Openness score (75) is strong enough that, paired with a below-average Innovation score, there's a real pattern worth watching — committing to a direction faster than you can execute or test it. Pairing quick action with equally quick validation checkpoints (see Recommended Actions) directly addresses this.</div></div>
            <div className="flag-row good"><b>✓</b><div><b>Strong creative base:</b> four of six dimensions sit above the population average, giving you a genuinely solid foundation to build the remaining two on, rather than starting from scratch.</div></div>
          </div>

          <div className="cii-pg-ftr">
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Market Intelligence Report</div>
          </div>
        </div>

        {/* Page 7: Your Creative Profile & Archetype (CII Template Page 9 - Last 2nd Page with Radar SVG Image) */}
        <div ref={page7Ref} className="cii-page">
          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">07 / 08</div>
            </div>

            <div className="cii-eyebrow">Section Five</div>
            <div className="cii-pg-title">Your Creative Profile &amp; Archetype</div>
            <div className="cii-pg-sub">All six dimensions plotted together form a distinct shape — here's what yours looks like, and the archetype it maps to.</div>

            <div className="radar-flex">
              <svg width="230" height="230" viewBox="0 0 280 280" style={{ flexShrink: 0 }}>
                <polygon points="140,30 220,75 220,165 140,210 60,165 60,75" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                <polygon points="140,66 184,90 184,150 140,174 96,150 96,90" fill="none" stroke="#e2e8f0" strokeWidth="1"/>
                <line x1="140" y1="120" x2="140" y2="30" stroke="#e2e8f0"/>
                <line x1="140" y1="120" x2="220" y2="75" stroke="#e2e8f0"/>
                <line x1="140" y1="120" x2="220" y2="165" stroke="#e2e8f0"/>
                <line x1="140" y1="120" x2="140" y2="210" stroke="#e2e8f0"/>
                <line x1="140" y1="120" x2="60" y2="165" stroke="#e2e8f0"/>
                <line x1="140" y1="120" x2="60" y2="75" stroke="#e2e8f0"/>
                <polygon points="140,78 172,98 168,143 140,162 108,140 112,96" fill="rgba(17,68,160,0.14)" fillOpacity="0.5" stroke="#9bb0c9" strokeWidth="1.5" strokeDasharray="3 3"/>
                <polygon points="140,54 196,84 184,152 140,192 92,150 100,90" fill="#1a56db" fillOpacity="0.18" stroke="#1a56db" strokeWidth="2.5"/>
                <text x="140" y="20" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">Div</text>
                <text x="232" y="72" textAnchor="start" fontSize="11" fontWeight="700" fill="#0f172a">RemA</text>
                <text x="232" y="170" textAnchor="start" fontSize="11" fontWeight="700" fill="#0f172a">Risk</text>
                <text x="140" y="228" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">Vis</text>
                <text x="48" y="170" textAnchor="end" fontSize="11" fontWeight="700" fill="#0f172a">Beh</text>
                <text x="48" y="72" textAnchor="end" fontSize="11" fontWeight="700" fill="#0f172a">Inn</text>
              </svg>

              <div style={{ flex: 1 }}>
                <div className="archetype-box">
                  <div className="cii-lbl">Creative Archetype</div>
                  <div className="archetype-name">The Visionary Builder</div>
                </div>
                <div className="dim-list-row"><div className="dot" style={{ background: '#a21caf' }}></div>Divergent<div className="bar"><div className="fill" style={{ width: '70%', background: '#a21caf' }}></div></div><div className="val">70</div></div>
                <div className="dim-list-row"><div className="dot" style={{ background: '#06b6d4' }}></div>Remote Assoc.<div className="bar"><div className="fill" style={{ width: '58%', background: '#06b6d4' }}></div></div><div className="val">58</div></div>
                <div className="dim-list-row"><div className="dot" style={{ background: '#1a56db' }}></div>Risk<div className="bar"><div className="fill" style={{ width: '75%', background: '#1a56db' }}></div></div><div className="val">75</div></div>
                <div className="dim-list-row"><div className="dot" style={{ background: '#10b981' }}></div>Vision<div className="bar"><div className="fill" style={{ width: '82%', background: '#10b981' }}></div></div><div className="val">82</div></div>
                <div className="dim-list-row"><div className="dot" style={{ background: '#f97316' }}></div>Behavior<div className="bar"><div className="fill" style={{ width: '52%', background: '#f97316' }}></div></div><div className="val">52</div></div>
                <div className="dim-list-row"><div className="dot" style={{ background: '#f43f5e' }}></div>Innovation<div className="bar"><div className="fill" style={{ width: '48%', background: '#f43f5e' }}></div></div><div className="val">48</div></div>
              </div>
            </div>

            <div className="cii-sec-title">What This Archetype Means</div>
            <p className="cii-body">Visionary Builders are defined less by raw idea volume than by <b>conviction and completion</b>. Where a purely divergent thinker might generate the most options, and a purely execution-focused profile might ship the most output, your combination of high Vision &amp; Drive with above-average Risk &amp; Openness points to someone who filters ideas early against a clear internal sense of purpose — and, having chosen one, is unusually willing to commit to it before it's fully proven out.</p>
            <p className="cii-body">The tradeoff that tends to come with this shape: because you're selective early, you may generate fewer total ideas than a pure-divergent profile. That's not a weakness so much as a different strategy — quality-and-conviction over quantity-and-optionality.</p>

            <div className="cii-sec-title">How This Shows Up to Others</div>
            <p className="cii-body">Colleagues and collaborators typically experience Visionary Builders as someone who <b>doesn't need convincing once they're in</b> — you tend to advocate clearly for directions you believe in, and that conviction is often what moves a room. The corresponding blind spot: because your Creative Behavior score sits closer to average, that conviction doesn't always translate into fast, visible action — the idea can outpace the execution.</p>
            <p className="cii-body">Under time pressure or high-stakes conditions, this profile tends to hold up well on the decision-making side — the same comfort with ambiguity that shows up in Risk &amp; Openness means you're less likely than most to freeze or over-deliberate when a call needs to be made quickly. The risk under pressure sits on the execution side: with less runway to work with, the existing Innovation gap can become more visible, since there's less time available to close the distance between deciding on a direction and actually delivering it.</p>

            <div className="callout">The dashed shape on the radar is the population average — everywhere your solid shape extends past it is a genuine relative strength, not just an absolute one.</div>
          </div>

          <div className="cii-pg-ftr">
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Market Intelligence Report</div>
          </div>
        </div>

        {/* Page 8: Action Plan & Recommendations (CII Template Page 10 - Last Page) */}
        <div ref={page8Ref} className="cii-page">
          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">08 / 08</div>
            </div>

            <div className="cii-eyebrow">Section Six</div>
            <div className="cii-pg-title">Action Plan &amp; Recommendations</div>
            <div className="cii-pg-sub">Six specific actions tied directly to your scores, organized into a realistic sequence rather than a flat list to tackle all at once.</div>

            <div className="cii-sec-title" style={{ marginTop: '6px' }}>All Actions at a Glance</div>
            <table className="summary-table">
              <thead>
                <tr><th>#</th><th>Action</th><th>Targets</th><th>Frequency</th></tr>
              </thead>
              <tbody>
                <tr><td className="mono">1</td><td>Ship one small creative output</td><td><span className="seq-dim-tag" style={{ background: '#f43f5e' }}>Innovation</span></td><td>Weekly</td></tr>
                <tr><td className="mono">2</td><td>Redesign one broken process, start to finish</td><td><span className="seq-dim-tag" style={{ background: '#f43f5e' }}>Innovation</span></td><td>Monthly</td></tr>
                <tr><td className="mono">3</td><td>24-hour test rule for new ideas</td><td><span className="seq-dim-tag" style={{ background: '#f43f5e' }}>Innovation</span></td><td>Daily habit</td></tr>
                <tr><td className="mono">4</td><td>Weekly cross-domain article + connection</td><td><span className="seq-dim-tag" style={{ background: '#06b6d4' }}>Remote Assoc.</span></td><td>Weekly</td></tr>
                <tr><td className="mono">5</td><td>Three-noun connection drill</td><td><span className="seq-dim-tag" style={{ background: '#06b6d4' }}>Remote Assoc.</span></td><td>A few times/week</td></tr>
                <tr><td className="mono">6</td><td>Running visible idea log</td><td><span className="seq-dim-tag" style={{ background: '#f97316' }}>Cr. Behavior</span></td><td>Ongoing, reviewed weekly</td></tr>
              </tbody>
            </table>

            <div className="cii-sec-title">Suggested Sequence — Don't Start All Six at Once</div>
            <p className="cii-body">Adopting all six simultaneously is the most common way a development plan quietly fails — too much new behavior at once, with no single habit given the chance to actually stick. The sequence below phases them in over eight weeks instead.</p>
            <table className="seq-table">
              <thead>
                <tr><th>Timing</th><th>Add</th><th>Why This Order</th></tr>
              </thead>
              <tbody>
                <tr><td className="seq-week">Week 1</td><td><b>Action 1</b> — Ship weekly</td><td>Lowest friction, highest-leverage dimension. Establish this alone for two full weeks before adding anything else.</td></tr>
                <tr><td className="seq-week">Week 3</td><td><b>Action 6</b> — Idea log</td><td>Low-effort, pairs naturally with Action 1 — you're already producing something weekly to log.</td></tr>
                <tr><td className="seq-week">Week 4</td><td><b>Action 4</b> — Weekly article</td><td>A different kind of habit (input, not output) — safe to layer in once Actions 1 and 6 feel automatic.</td></tr>
                <tr><td className="seq-week">Week 6</td><td><b>Action 3</b> — 24-hour test rule</td><td>Requires the most behavior change under pressure — introduced once the earlier habits have built some momentum.</td></tr>
                <tr><td className="seq-week">Week 7</td><td><b>Action 5</b> — Noun drill</td><td>Small, optional add-on once the core habits are stable.</td></tr>
                <tr><td className="seq-week">Week 8</td><td><b>Action 2</b> — Process redesign</td><td>The largest single action — best attempted once weekly shipping (Action 1) has already proven you can follow through.</td></tr>
              </tbody>
            </table>

            <div className="callout insight" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
              <span className="lbl" style={{ color: '#b45309' }}>If You Can Only Start One</span>
              Start with Action 1 — shipping one small creative output every 7 days. It's the lowest-friction of the six, it directly targets your single largest gap (Innovation), and its weekly cadence naturally builds the habit that makes every other action on this list easier to sustain once you're ready to add them.
            </div>
          </div>

          <div className="cii-pg-ftr">
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Market Intelligence Report</div>
          </div>
        </div>

        {/* Page 9: Disclaimer, Privacy & Terms (CII Template Page 14) */}
        <div ref={page9Ref} className="cii-page">
          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">09 / 11</div>
            </div>

            <div className="cii-eyebrow">Legal &amp; Policy</div>
            <div className="cii-pg-title">Disclaimer, Privacy &amp; Terms</div>
            <div className="cii-pg-sub">Important legal guidelines, data protection commitment, and terms governing this report.</div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, border: '1px solid #fed7aa' }}>⚠️</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#061228', marginBottom: '4px' }}>Disclaimer</div>
                <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.6 }}>
                  <p style={{ marginBottom: '4px' }}>The <b>AI-evaluated assessment report</b> is intended for informational and decision-support purposes only. Results are based on the information provided by the user and AI-driven analysis and should not be considered legal, financial, investment, or professional advice.</p>
                  <p>Users are encouraged to validate critical decisions with relevant experts before taking action. Infopace makes no representation or warranty as to the completeness or accuracy of AI-evaluated interpretations, and scores should be read as directional indicators rather than absolute measurements.</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, border: '1px solid #bbf7d0' }}>🔒</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#061228', marginBottom: '4px' }}>Privacy Policy</div>
                <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.6 }}>
                  <p style={{ marginBottom: '4px' }}>All information shared during the assessment is handled with confidentiality and used solely for generating personalized assessment reports and improving the quality of the assessment platform.</p>
                  <p>User data is processed securely and is not shared with third parties without consent, except where required by applicable law. Individual open-ended responses are never used to train external models or shared outside Infopace's assessment infrastructure.</p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, border: '1px solid #bfdbfe' }}>📄</div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#061228', marginBottom: '4px' }}>Terms and Conditions</div>
                <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.6 }}>
                  <p style={{ marginBottom: '4px' }}>By using Infopace's AI-powered assessment tools, users acknowledge that the assessment results are generated based on the information they provide and the AI-driven evaluation methodology. The reports are intended to support decision-making and should not be considered a substitute for professional legal, financial, or business advice.</p>
                  <p style={{ marginBottom: '4px' }}>Users are responsible for ensuring the accuracy of the information submitted and for any decisions or actions taken based on the report. Infopace does not guarantee specific business outcomes or success resulting from the recommendations provided.</p>
                  <p>All assessment content, methodologies, reports, and related intellectual property remain the exclusive property of Infopace and may not be copied, reproduced, modified, or distributed without prior written consent.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="cii-pg-ftr">
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Market Intelligence Report</div>
          </div>
        </div>

        {/* Page 10: About Infopace (CII Template Page 15) */}
        <div ref={page10Ref} className="cii-page">
          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">10 / 11</div>
            </div>

            <div className="cii-eyebrow">Organization Profile</div>
            <div className="cii-pg-title">About <span style={{ color: '#1a56db' }}>Infopace</span></div>
            <div className="cii-pg-sub">Strategic change management, business transformation, and technology-driven advisory since 1999.</div>

            <div style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.65, marginBottom: '12px' }}>
              <p style={{ marginBottom: '6px' }}>Infopace Management Pvt. Ltd is a Bengaluru-based strategic change management and business transformation company established in 1999, providing advisory and technology-driven solutions that help businesses improve operational efficiency, accelerate growth and adapt to changing market conditions.</p>
              <p>Our approach combines deep sector expertise with data-driven methodology — every engagement begins with understanding the specific operational and market context a client is working within, rather than applying a generic playbook.</p>
            </div>

            <div className="cii-sec-title">What We Do</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '10.5px', color: '#334155', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#1a56db' }}>•</span> Growth Acceleration Partner</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#1a56db' }}>•</span> AI-Enabled Solutions</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#1a56db' }}>•</span> Global Capabilities Center</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#1a56db' }}>•</span> Entrepreneurial Ecosystem</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#1a56db' }}>•</span> Strategic Change Management</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#1a56db' }}>•</span> Go To Market Strategy &amp; Research</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#1a56db' }}>•</span> Strategic Investment &amp; Funding</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#1a56db' }}>•</span> Market Access &amp; Readiness</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#1a56db' }}>•</span> Data Analytics Solutions</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#1a56db' }}>•</span> Pivoting &amp; Repurposing Businesses</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#1a56db' }}>•</span> Digital Transformation</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#1a56db' }}>•</span> Radical Innovation</div>
            </div>

            <div className="cii-sec-title">Industries We Serve</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {['Automobile', 'Education', 'Health Care', 'ITES', 'Information Technology', 'Manufacturing', 'Retail', 'Telecom', 'Energy', 'NGO', 'Food Processing', 'Agritech', 'Aerospace', 'Semiconductor', 'ESDM'].map((ind, i) => (
                <span key={i} style={{ fontSize: '9.5px', color: '#1a56db', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '3px 8px', fontWeight: 600 }}>{ind}</span>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid rgba(17,68,160,0.14)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '22px', fontWeight: 800, color: '#1a56db' }}>200+</div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Specialists, avg. 7 yrs expertise</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid rgba(17,68,160,0.14)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '22px', fontWeight: 800, color: '#1a56db' }}>850+</div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Long-lasting client partnerships</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid rgba(17,68,160,0.14)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '22px', fontWeight: 800, color: '#1a56db' }}>7000+</div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Projects in digital transformation</div>
              </div>
            </div>
          </div>

          <div className="cii-pg-ftr">
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Market Intelligence Report</div>
          </div>
        </div>

        {/* Page 11: Thank You & Contact (CII Template Page 16) */}
        <div ref={page11Ref} className="cii-page" style={{ background: '#061228', color: '#ffffff' }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '12px' }}>
              <img src="/logo.png" alt="Infopace Logo" style={{ height: '36px', filter: 'brightness(0) invert(1)' }} />
              <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: '"IBM Plex Mono", monospace' }}>11 / 11</div>
            </div>

            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '12px', letterSpacing: '0.25em', textTransform: 'uppercase', color: '#60a5fa', fontWeight: 700, marginBottom: '14px', fontFamily: '"IBM Plex Mono", monospace' }}>
                INFOPACE MANAGEMENT PVT. LTD.
              </div>
              <div style={{ fontSize: '46px', fontWeight: 800, color: '#ffffff', fontFamily: '"Playfair Display", Georgia, serif', marginBottom: '16px' }}>
                Thank You
              </div>
              <div style={{ fontSize: '13px', color: '#cbd5e1', maxWidth: '480px', margin: '0 auto 30px', lineHeight: 1.6 }}>
                We empower business leaders with evidence-based intelligence and execution roadmaps. Contact our advisory team to discuss custom market strategies.
              </div>

              <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '12px', padding: '20px 24px', maxWidth: '420px', margin: '0 auto', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#60a5fa', marginBottom: '10px', letterSpacing: '0.1em' }}>Headquarters &amp; Contact</div>
                <div style={{ fontSize: '12px', color: '#f8fafc', lineHeight: 1.7 }}>
                  <strong>Infopace Management Pvt. Ltd.</strong><br/>
                  Bengaluru, Karnataka, India<br/>
                  🌐 <strong>Website:</strong> www.infopaceindia.com<br/>
                  ✉️ <strong>Email:</strong> info@infopaceindia.com
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
              <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
              <div>End of Intelligence Report</div>
            </div>
          </div>
        </div>

      </div>
      
      {showHistory && (
        <HistoryModal 
          user={user} 
          onClose={() => setShowHistory(false)} 
          onSelectReport={(id) => {
            window.location.hash = `#/dashboard?id=${id}`;
          }}
        />
      )}
    </div>
  );
}

const repStyles = {};

