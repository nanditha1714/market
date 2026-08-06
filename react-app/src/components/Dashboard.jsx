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

const ENABLE_PAYMENT = true; // Set to true to re-enable Razorpay payment gateway

const waveSvg = (
  <div style={{ position: 'absolute', right: 0, top: 0, width: '300px', height: '180px', overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
    <div style={{ transform: 'scale(0.55) rotate(4deg)', transformOrigin: 'top right', width: '760px', height: '480px' }}>
      <svg width="760" height="480" viewBox="0 0 760 480">
        <path d="M 0.0 23.8 Q 17.3 25.4 25.9 26.2 Q 51.8 28.9 60.5 29.8 Q 86.4 32.5 95.0 33.3 Q 120.9 35.8 129.5 36.6 Q 155.5 38.8 164.1 39.5 Q 190.0 41.4 198.6 42.0 Q 224.5 43.6 233.2 44.0 Q 259.1 45.2 267.7 45.5 Q 293.6 46.1 302.3 46.0 Q 328.2 45.6 336.8 45.2 Q 362.7 43.7 371.4 42.9 Q 397.3 40.0 405.9 38.8 Q 431.8 34.9 440.5 33.4 Q 466.4 28.7 475.0 27.0 Q 500.9 21.9 509.5 20.1 Q 535.5 14.8 544.1 13.1 Q 570.0 7.9 578.6 6.2 Q 604.5 1.2 613.2 -0.3 Q 639.1 -4.8 647.7 -6.1 Q 673.6 -9.9 682.3 -10.9 Q 708.2 -13.7 716.8 -14.3 Q 742.7 -15.6 751.4 -15.7" fill="none" stroke="#1a56db" strokeWidth="1.05" strokeOpacity="0.75" strokeLinecap="round"/>
        <path d="M 0.0 30.0 Q 17.3 31.7 25.9 32.5 Q 51.8 35.2 60.5 36.1 Q 86.4 38.7 95.0 39.6 Q 120.9 42.0 129.5 42.8 Q 155.5 45.0 164.1 45.7 Q 190.0 47.7 198.6 48.3 Q 224.5 49.9 233.2 50.4 Q 259.1 51.4 267.7 51.6 Q 293.6 51.7 302.3 51.5 Q 328.2 50.5 336.8 49.9 Q 362.7 47.6 371.4 46.5 Q 397.3 42.9 405.9 41.5 Q 431.8 37.0 440.5 35.3 Q 466.4 30.2 475.0 28.4 Q 500.9 23.0 509.5 21.1 Q 535.5 15.7 544.1 13.9 Q 570.0 8.6 578.6 6.9 Q 604.5 1.9 613.2 0.4 Q 639.1 -4.0 647.7 -5.3 Q 673.6 -8.7 682.3 -9.5 Q 708.2 -11.6 716.8 -12.0 Q 742.7 -12.5 751.4 -12.3" fill="none" stroke="#1a56db" strokeWidth="1.05" strokeOpacity="0.70" strokeLinecap="round"/>
        <path d="M 0.0 41.2 Q 17.3 44.2 25.9 45.7 Q 51.8 50.3 60.5 51.8 Q 86.4 56.4 95.0 57.8 Q 120.9 62.2 129.5 63.5 Q 155.5 67.5 164.1 68.7 Q 190.0 72.1 198.6 73.0 Q 224.5 75.5 233.2 76.1 Q 259.1 77.3 267.7 77.3 Q 293.6 76.7 302.3 76.1 Q 328.2 73.6 336.8 72.3 Q 362.7 67.7 371.4 65.8 Q 397.3 59.5 405.9 57.0 Q 431.8 49.3 440.5 46.4 Q 466.4 37.6 475.0 34.5 Q 500.9 25.0 509.5 21.7 Q 535.5 11.8 544.1 8.4 Q 570.0 -1.6 578.6 -4.9 Q 604.5 -14.5 613.2 -17.6 Q 639.1 -26.4 647.7 -29.0 Q 673.6 -36.4 682.3 -38.4 Q 708.2 -43.7 716.8 -45.0 Q 742.7 -47.9 751.4 -48.3" fill="none" stroke="#1a56db" strokeWidth="1.30" strokeOpacity="0.65" strokeLinecap="round"/>
      </svg>
    </div>
  </div>
);

export default function Dashboard({ data, user, answers, onReset, onOpenAbout }) {
  const k = (data && data.kpi) ? data.kpi : {};
  const dashRef = useRef(null);
  const page1Ref = useRef(null);
  const page2Ref = useRef(null);
  const page3Ref = useRef(null);
  const page4Ref = useRef(null);
  const page5Ref = useRef(null);
  const page6Ref = useRef(null);
  const page7Ref = useRef(null);
  const page8Ref = useRef(null);
  const page9Ref = useRef(null);
  const page10Ref = useRef(null);
  const page11Ref = useRef(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [isPaid, setIsPaid] = useState(() => {
    if (!ENABLE_PAYMENT) return true;
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
            scale: 1.2, useCORS: true, allowTaint: true,
            backgroundColor: '#f8fafc', logging: false
          });
          const pdf = new jsPDF({
            orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height],
            compress: true
          });
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
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
              scale: 1.2, useCORS: true, allowTaint: true,
              backgroundColor: '#ffffff', logging: false
            });
            canvases.push(canvas);
          }
          const first = canvases[0];
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'px',
            format: [first.width, first.height],
            compress: true
          });
          pdf.addImage(first.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, first.width, first.height, undefined, 'FAST');
          for (let i = 1; i < canvases.length; i++) {
            const c = canvases[i];
            pdf.addPage([c.width, c.height], 'portrait');
            pdf.addImage(c.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, c.width, c.height, undefined, 'FAST');
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
  const stars = Math.round(k.stars || 4);
  const sv = data.sentiment || { positive: 70, neutral: 20, negative: 10 };
  const detailedReport = data.detailedReport || {};
  const rep = {
    summary: detailedReport.executiveSummary || 'This comprehensive market research report provides an in-depth strategic analysis of the target industry, key demand drivers, and the competitive environment. The primary objective is to evaluate market opportunities, benchmark competitor strategies, and recommend actionable growth pathways.',
    executiveSummary: detailedReport.executiveSummary || 'This comprehensive market research report provides an in-depth strategic analysis of the target industry, key demand drivers, and the competitive environment.',
    marketGrowth: detailedReport.marketGrowth || 'Based on the historical and projected data, the market has demonstrated consistent upward momentum. This growth is driven by accelerated digital transformation and increasing adoption rates.',
    marketOverview: detailedReport.marketGrowth || 'The market demonstrates strong upward momentum driven by digital transformation and rising compliance requirements across regulated industries.',
    segmentation: detailedReport.segmentation || 'The market is divided into distinct customer segments. The high concentration in Enterprise suggests significant contract value opportunities, while SMB and Startup segments represent high-velocity growth areas.',
    geography: detailedReport.geography || 'Geographical breakdown indicates that North America leads market share, with Europe representing a strong secondary market.',
    competitive: detailedReport.competition || detailedReport.competitive || 'The competitive landscape features established players. Your core differentiators lie in product innovation and customer support, whereas competitors leverage brand legacy and aggressive pricing.',
    competition: detailedReport.competition || 'The competitive landscape features established players. Core differentiators lie in product innovation and customer support.',
    radarAnalysis: detailedReport.radarAnalysis || 'A detailed evaluation of the competitive positioning matrix highlights key strategic vectors. Innovation and support scores remain differentiators.',
    pricing: detailedReport.pricing || 'A comparative analysis of pricing structures shows a diverse range of models. Your product is positioned as a competitive value option, balancing advanced features with an accessible price point.',
    risks: detailedReport.risks || 'The primary risks facing the company include intense competition from legacy vendors, high customer acquisition costs, and potential talent shortages.',
    ...detailedReport
  };


  const renderFormattedText = useCallback((str) => {
    if (!str) return '';
    const parts = str.split(/(\*\*.*?\*\*|^[A-Z0-9\s,&/\-]{4,}:)/gm);
    return parts.map((part, idx) => {
      if (!part) return null;
      if (part.startsWith('**') && part.endsWith('**')) {
        return <b key={idx} style={{ color: '#061228', fontWeight: 700 }}>{part.slice(2, -2)}</b>;
      }
      if (/^[A-Z0-9\s,&/\-]{4,}:$/.test(part)) {
        const formattedPrefix = part.charAt(0) + part.slice(1).toLowerCase();
        return <b key={idx} style={{ color: '#061228', fontWeight: 700 }}>{formattedPrefix} </b>;
      }
      return part;
    });
  }, []);

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
          const paraText = currentParagraph.join(' ');
          elements.push(
            <p key={`p-${i}`} className="cii-body" style={{ fontSize: '11.5px', lineHeight: '1.65', color: '#000000', marginBottom: '8px', textTransform: 'none', fontFamily: '"Inter", system-ui, sans-serif' }}>
              {renderFormattedText(paraText)}
            </p>
          );
          currentParagraph = [];
        }
        const headerText = line.replace(/^###\s*/, '').trim();
        elements.push(
          <div key={`h-${i}`} className="cii-sec-title" style={{ fontSize: '13px', fontWeight: 700, color: '#061228', marginTop: i > 0 ? '14px' : '4px', marginBottom: '6px', letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: '"Inter", system-ui, sans-serif', borderTop: i > 0 ? '1px solid rgba(17,68,160,0.14)' : 'none', paddingTop: i > 0 ? '10px' : 0 }}>
            {headerText}
          </div>
        );
      } else {
        currentParagraph.push(line);
      }
    }

    if (currentParagraph.length > 0) {
      const paraText = currentParagraph.join(' ');
      elements.push(
        <p key="p-last" className="cii-body" style={{ fontSize: '11.5px', lineHeight: '1.65', color: '#000000', marginBottom: '8px', textTransform: 'none', fontFamily: '"Inter", system-ui, sans-serif' }}>
          {renderFormattedText(paraText)}
        </p>
      );
    }

    return elements;
  }, [renderFormattedText]);

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
        scale: 1.2, useCORS: true, allowTaint: true,
        backgroundColor: '#f8fafc', logging: false
      });
      
      const safeCompany = (user.company || 'unknown').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = safeCompany + '_dashboard_' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      badge.textContent = 'Generating PDF...';
      const imgData = canvas.toDataURL('image/jpeg', 0.85);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
        compress: true
      });
      pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
      
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
      const pages = [page1Ref, page2Ref, page3Ref, page4Ref, page5Ref, page6Ref, page7Ref, page8Ref, page9Ref, page10Ref, page11Ref];
      const canvases = [];
      
      for (let i = 0; i < pages.length; i++) {
        badge.textContent = `Exporting Report Page ${i + 1} of 11...`;
        const canvas = await html2canvas(pages[i].current, {
          scale: 1.2, useCORS: true, allowTaint: true,
          backgroundColor: '#ffffff', logging: false
        });
        canvases.push(canvas);
      }

      const safeCompany = (user.company || 'unknown').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = safeCompany + '_detailed_report_' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      badge.textContent = 'Generating 11-Page PDF...';
      const first = canvases[0];
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [first.width, first.height],
        compress: true
      });
      pdf.addImage(first.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, first.width, first.height, undefined, 'FAST');

      for (let i = 1; i < canvases.length; i++) {
        const c = canvases[i];
        pdf.addPage([c.width, c.height], 'portrait');
        pdf.addImage(c.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, c.width, c.height, undefined, 'FAST');
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
  }, [data, user, answers, k, page1Ref, page2Ref, page3Ref, page4Ref, page5Ref, page6Ref, page7Ref, page8Ref, page9Ref, page10Ref, page11Ref]);

  const handleDownloadReport = useCallback(() => {
    if (!isPaid) {
      handlePayment(executeDownloadReport);
      return;
    }
    executeDownloadReport();
  }, [isPaid, executeDownloadReport]);

  return (
    <div ref={dashRef} style={{ position:'fixed', inset:0, width:'100%', display:'flex', flexDirection:'column', background:'var(--bg-main)', overflowY:'auto' }}>
      {/* Header */}
      <div style={{ flexShrink:0, background:'var(--navy)', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--navy-light)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>📊</span>
            <h2 style={{ fontSize:'18px', fontWeight:700, color:'#fff', margin:0, letterSpacing:'-0.01em' }}>Market Research Dashboard</h2>
          </div>
          <p style={{ fontSize:'11.5px', color:'#94a3b8', marginTop:'3px', fontWeight:500, maxWidth:'460px', lineHeight:1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }} title={`${user.name} - ${user.company} - ${answers.customer || user.service}`}>
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

      {/* Main Grid: Dashboard View */}
      {activeView === 'dashboard' && (
      <div style={{ flex:1, display:'grid', gridTemplateRows:'82px 190px 210px 54px', gap:'8px', padding:'8px 12px', minHeight:'560px' }}>

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
      )}
      
      {/* Detailed report container — always off-screen; used only for PDF background generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Style injection for CII Report Template */}
        <style>{`
          .cii-page {
            width: 800px;
            height: 1130px;
            box-sizing: border-box;
            background: #ffffff;
            color: #000000;
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
            color: #000000;
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
            color: #000000;
            margin-bottom: 6px;
            text-align: justify;
          }
          .cii-callout {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 10px 14px;
            font-size: 11px;
            color: #000000;
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
            color: #000000;
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
          .cii-action-text { font-size: 11.5px; color: #000000; line-height: 1.6; }
          .cii-action-why { font-size: 10.5px; color: #000000; line-height: 1.5; margin-top: 2px; font-style: italic; }
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
          .cii-a-card-desc { font-size: 10px; color: #000000; line-height: 1.45; }

          .cii-spread-row {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 4px;
            font-size: 10.5px;
          }
          .cii-spread-label { width: 110px; font-weight: 600; color: #000000; white-space: nowrap; }
          .cii-spread-track { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; position: relative; }
          .cii-spread-fill { height: 100%; border-radius: 4px; }
          .cii-spread-avg { position: absolute; top: -1px; width: 2px; height: 10px; background: #475569; }
          .cii-spread-val { width: 35px; text-align: right; font-weight: 700; font-family: 'IBM Plex Mono', monospace; color: #000000; }

          .analysis-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
          .a-card { border-radius: 10px; padding: 12px 14px; }
          .a-card.up { background: #f0fdf4; border: 1px solid #bbf7d0; }
          .a-card.down { background: #fdf2f8; border: 1px solid #fbcfe8; }
          .a-card-label { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 4px; }
          .a-card.up .a-card-label { color: #059669; }
          .a-card.down .a-card-label { color: #be185d; }
          .a-card-score { font-family: 'IBM Plex Mono', monospace; font-size: 32px; font-weight: 700; color: #061228; line-height: 1; }
          .a-card-dim { font-size: 13px; font-weight: 700; color: #061228; margin-top: 4px; }
          .a-card-desc { font-size: 10.5px; color: #000000; margin-top: 3px; line-height: 1.5; }

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
          .tag-pill { display: inline-block; font-size: 10px; font-weight: 700; color: #16a34a; background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 12px; padding: 2px 8px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
          .persona-name { font-size: 20px; font-weight: 700; color: #061228; font-family: 'Playfair Display', serif; }
          .glance-table { width: 100%; border-collapse: collapse; margin: 6px 0; }
          .glance-table td { padding: 4px 6px; font-size: 10.5px; border-bottom: 1px solid rgba(17,68,160,0.14); }
          .glance-table .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; margin-right: 6px; }
          .glance-table .nm { font-weight: 700; color: #061228; }
          .glance-table .sc { font-family: 'IBM Plex Mono', monospace; font-weight: 700; text-align: right; font-size: 11.5px; }
          .dim-block { display: flex; gap: 12px; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid rgba(17,68,160,0.14); }
          .dim-score-col { text-align: center; width: 60px; flex-shrink: 0; }
          .dim-score-col .n { font-family: 'IBM Plex Mono', monospace; font-size: 26px; font-weight: 700; line-height: 1; }
          .dim-score-col .band { font-size: 8.5px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-top: 2px; }
          .dim-body { flex: 1; font-size: 10.5px; color: #000000; line-height: 1.5; }
          .dim-name { font-size: 12px; font-weight: 700; color: #061228; margin-bottom: 2px; }
          .dim-desc { font-size: 10.5px; color: #000000; margin-bottom: 3px; font-style: italic; }
          .dim-tell { font-size: 10px; color: #000000; margin-bottom: 2px; position: relative; padding-left: 9px; }
          .dim-tell::before { content: '•'; position: absolute; left: 0; color: #1a56db; }
          .dim-extra { font-size: 9.5px; color: #000000; margin-top: 2px; background: #f8fafc; padding: 3px 6px; border-radius: 4px; border-left: 2px solid #cbd5e1; }
          .dim-extra .k { font-weight: 700; color: #000000; }
        `}</style>
        
        {/* Page 1: Cover Page (Market Research Assessment) */}
        <div ref={page1Ref} className="cii-page">
          <div style={{ padding: '14mm 16mm 0' }}>
            <img src="/logo.png" alt="Infopace" style={{ height: '56px' }} />
          </div>

          <div style={{ padding: '14mm 16mm 0', position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '11.5px', letterSpacing: '.2em', textTransform: 'uppercase', color: '#1a56db', fontWeight: 600, marginBottom: '6mm', fontFamily: '"IBM Plex Mono", monospace' }}>
              Market Intelligence Report · Business Edition
            </div>
            <div style={{ fontWeight: 800, fontSize: '64px', lineHeight: 1.08, color: '#061228', letterSpacing: '-.01em', fontFamily: '"Playfair Display", Georgia, serif' }}>
              Market
            </div>
            <div style={{ fontWeight: 800, fontSize: '64px', lineHeight: 1.08, color: '#1a56db', letterSpacing: '-.01em', fontFamily: '"Playfair Display", Georgia, serif' }}>
              Research
            </div>
            <div style={{ fontWeight: 800, fontSize: '40px', lineHeight: 1.08, color: '#334155', letterSpacing: '-.01em', fontFamily: '"Playfair Display", Georgia, serif' }}>
              Assessment
            </div>
            <div style={{ fontSize: '13.8px', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: '#334155', marginTop: '8mm' }}>
              AI-Powered Business Intelligence Analysis
            </div>
          </div>

          <div style={{ position: 'relative', flex: 1, height: '150mm', marginTop: '-4mm' }}>
            <svg width="760" height="480" viewBox="0 0 760 480" style={{ position: 'absolute', left: '-30px', bottom: 0 }}>
              <path d="M 0.0 23.8 Q 17.3 25.4 25.9 26.2 Q 51.8 28.9 60.5 29.8 Q 86.4 32.5 95.0 33.3 Q 120.9 35.8 129.5 36.6 Q 155.5 38.8 164.1 39.5 Q 190.0 41.4 198.6 42.0 Q 224.5 43.6 233.2 44.0 Q 259.1 45.2 267.7 45.5 Q 293.6 46.1 302.3 46.0 Q 328.2 45.6 336.8 45.2 Q 362.7 43.7 371.4 42.9 Q 397.3 40.0 405.9 38.8 Q 431.8 34.9 440.5 33.4 Q 466.4 28.7 475.0 27.0 Q 500.9 21.9 509.5 20.1 Q 535.5 14.8 544.1 13.1 Q 570.0 7.9 578.6 6.2 Q 604.5 1.2 613.2 -0.3 Q 639.1 -4.8 647.7 -6.1 Q 673.6 -9.9 682.3 -10.9 Q 708.2 -13.7 716.8 -14.3 Q 742.7 -15.6 751.4 -15.7" fill="none" stroke="#1a56db" strokeWidth="1.05" strokeOpacity="0.75" strokeLinecap="round"/>
              <path d="M 0.0 30.0 Q 17.3 31.7 25.9 32.5 Q 51.8 35.2 60.5 36.1 Q 86.4 38.7 95.0 39.6 Q 120.9 42.0 129.5 42.8 Q 155.5 45.0 164.1 45.7 Q 190.0 47.7 198.6 48.3 Q 224.5 49.9 233.2 50.4 Q 259.1 51.4 267.7 51.6 Q 293.6 51.7 302.3 51.5 Q 328.2 50.5 336.8 49.9 Q 362.7 47.6 371.4 46.5 Q 397.3 42.9 405.9 41.5 Q 431.8 37.0 440.5 35.3 Q 466.4 30.2 475.0 28.4 Q 500.9 23.0 509.5 21.1 Q 535.5 15.7 544.1 13.9 Q 570.0 8.6 578.6 6.9 Q 604.5 1.9 613.2 0.4 Q 639.1 -4.0 647.7 -5.3 Q 673.6 -8.7 682.3 -9.5 Q 708.2 -11.6 716.8 -12.0 Q 742.7 -12.5 751.4 -12.3" fill="none" stroke="#1a56db" strokeWidth="1.05" strokeOpacity="0.70" strokeLinecap="round"/>
              <path d="M 0.0 41.2 Q 17.3 44.2 25.9 45.7 Q 51.8 50.3 60.5 51.8 Q 86.4 56.4 95.0 57.8 Q 120.9 62.2 129.5 63.5 Q 155.5 67.5 164.1 68.7 Q 190.0 72.1 198.6 73.0 Q 224.5 75.5 233.2 76.1 Q 259.1 77.3 267.7 77.3 Q 293.6 76.7 302.3 76.1 Q 328.2 73.6 336.8 72.3 Q 362.7 67.7 371.4 65.8 Q 397.3 59.5 405.9 57.0 Q 431.8 49.3 440.5 46.4 Q 466.4 37.6 475.0 34.5 Q 500.9 25.0 509.5 21.7 Q 535.5 11.8 544.1 8.4 Q 570.0 -1.6 578.6 -4.9 Q 604.5 -14.5 613.2 -17.6 Q 639.1 -26.4 647.7 -29.0 Q 673.6 -36.4 682.3 -38.4 Q 708.2 -43.7 716.8 -45.0 Q 742.7 -47.9 751.4 -48.3" fill="none" stroke="#1a56db" strokeWidth="1.30" strokeOpacity="0.65" strokeLinecap="round"/>
            </svg>
          </div>

          <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 16mm 14mm' }}>
            <div style={{ fontSize: '10.3px', color: '#94a3b8', fontFamily: '"IBM Plex Mono", monospace' }}>Prepared By Infopace Management Pvt. Ltd.</div>
            <div style={{ fontWeight: 800, fontSize: '57.5px', color: '#061228', lineHeight: 1.1 }}>2026</div>
          </div>
        </div>

        {/* Page 2: Contents (CII Template Page 2 Word-for-Word) */}
        <div ref={page2Ref} className="cii-page">
          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">02 / 11</div>
            </div>

            <div className="cii-eyebrow">In This Report</div>
            <div className="cii-pg-title" style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '34px', fontWeight: 700, marginBottom: '6mm', color: '#061228' }}>Contents</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
              {[
                { title: 'Our Assessment Suite', sub: 'An overview of all five Infopace assessment tools', page: '03' },
                { title: 'Executive Summary & Overview', sub: 'Total market size, growth rate, and key market findings', page: '04' },
                { title: 'Market Growth Trend', sub: 'Historical market growth trajectory and CAGR projections', page: '05' },
                { title: 'Competitor Share & Positioning', sub: 'Competitor landscape, market share, and positioning matrix', page: '06' },
                { title: 'Market Challenges', sub: 'Key barriers, risk factors, and market entry challenges', page: '07' },
                { title: 'Rating, Sentiment & Pricing', sub: 'Customer sentiment analysis and competitive pricing landscape', page: '08' },
                { title: 'Disclaimer, Privacy & Terms', sub: 'Legal guidelines, privacy commitment, and terms', page: '09' },
                { title: 'About Infopace', sub: 'Organization profile, key metrics, and advisory services', page: '10' },
                { title: 'Thank You & Contact', sub: 'Headquarters, website, and advisory contact info', page: '11' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'baseline', gap: '14px', padding: '12px 0', borderBottom: '1px solid rgba(17,68,160,0.14)' }}>
                  <div style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '15px', color: '#0f172a', flexShrink: 0, fontWeight: 700 }}>
                    {item.title}
                    <span style={{ display: 'block', fontSize: '10px', color: '#94a3b8', marginTop: '2px', fontFamily: '"Inter", sans-serif', fontWeight: 400 }}>{item.sub}</span>
                  </div>
                  <div style={{ flex: 1, borderBottom: '1px dotted #cbd5e1', marginBottom: '3px' }}></div>
                  <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '11px', color: '#94a3b8', flexShrink: 0, fontWeight: 700 }}>{item.page}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="cii-pg-ftr">
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Report</div>
          </div>
        </div>

        {/* Page 3: Our Assessment Suite (CII Template Page 3 Word-for-Word) */}
        <div ref={page3Ref} className="cii-page" style={{ position: 'relative' }}>
          {waveSvg}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">03 / 11</div>
            </div>

            <div className="cii-eyebrow">Company Overview</div>
            <div className="cii-pg-title" style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '34px', fontWeight: 700, marginBottom: '5mm', color: '#061228' }}>Our Assessment Suite</div>

            <p style={{ fontSize: '11.5px', color: '#000000', lineHeight: 1.75, marginBottom: '3mm', textTransform: 'none', fontFamily: '"Inter", sans-serif' }}>
              Over the reporting period, Infopace continued to strengthen its portfolio of AI-powered business assessment tools, delivering intelligent, data-driven solutions that assist entrepreneurs, startups, and organizations make informed strategic decisions.
            </p>
            <p style={{ fontSize: '11.5px', color: '#000000', lineHeight: 1.75, marginBottom: '5mm', textTransform: 'none', fontFamily: '"Inter", sans-serif' }}>
              Each assessment leverages AI to analyze user responses and generate comprehensive reports containing actionable insights, key findings, strengths, improvement areas, and tailored recommendations. The current suite includes the following five tools:
            </p>

            <div style={{ fontSize: '10px', letterSpacing: '.14em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '3mm', fontWeight: 700, fontFamily: '"IBM Plex Mono", monospace' }}>The Assessment Suite</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { color: '#a21caf', name: 'Market Research Assessment', desc: 'Validates business ideas by analyzing market demand, customer needs, industry trends, and competition, enabling informed market-entry decisions.' },
                { color: '#06b6d4', name: 'Market Potential', desc: 'Evaluates the growth potential and commercial viability of a product or business by assessing market size, demand, scalability and risk opportunities.' },
                { color: '#1a56db', name: 'Creative Innovation Index', desc: 'Measures innovation capability by assessing creativity, problem-solving and adaptability, assisting individuals and organizations strengthen their innovation potential.' },
                { color: '#f97316', name: 'Business Risk Assessment', desc: 'Identifies strategic, operational, financial and market risks, enabling businesses to proactively mitigate challenges and improve resilience.' },
                { color: '#f43f5e', name: 'Founder and Co-Founder Compatibility', desc: 'Assesses alignment between founders in leadership, communication, values, and decision-making to build stronger partnerships and reduce future conflicts.' }
              ].map((tool, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', padding: '9px 12px', borderBottom: '1px solid rgba(17,68,160,0.14)', background: '#f8fafc', borderRadius: '6px' }}>
                  <div style={{ width: '4px', background: tool.color, borderRadius: '2px', flexShrink: 0 }}></div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#0f172a', marginBottom: '2px' }}>{tool.name}</div>
                    <div style={{ fontSize: '10.5px', color: '#000000', lineHeight: 1.55, textTransform: 'none', fontFamily: '"Inter", sans-serif' }}>{tool.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cii-pg-ftr" style={{ position: 'relative', zIndex: 1 }}>
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Report</div>
          </div>
        </div>

        {/* Page 4: Executive Summary & Market Overview */}
        <div ref={page4Ref} className="cii-page">
          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">04 / 11</div>
            </div>

            <div className="cii-eyebrow">Section One</div>
            <div className="cii-pg-title">Executive Summary &amp; Market Overview</div>
            <div className="cii-pg-sub">A high-level view of the total addressable market, key findings, and strategic market positioning.</div>

            {/* KPI Stat Row */}
            <div className="cii-stat-row" style={{ marginTop: '10px', marginBottom: '10px' }}>
              <div className="cii-stat-box"><div className="n" style={{ fontSize: '14px' }}>{k.tam || '—'}</div><div className="l">Total Market Size</div></div>
              <div className="cii-stat-box"><div className="n" style={{ fontSize: '14px', color: '#16a34a' }}>{k.growthRate || '—'}</div><div className="l">Growth Rate</div></div>
              <div className="cii-stat-box"><div className="n" style={{ fontSize: '14px' }}>{k.customers || '—'}</div><div className="l">Target Customers</div></div>
              <div className="cii-stat-box"><div className="n" style={{ fontSize: '14px' }}>{k.competitors || '—'}</div><div className="l">Competitors</div></div>
            </div>

            <div className="cii-sec-title">Executive Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              {renderReportParagraphs(rep.summary)}
            </div>

            <div className="cii-sec-title">Key Market Findings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              {(data.challenges || []).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#1a56db', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>{'0' + (i+1)}</span>
                  <span style={{ fontSize: '11px', color: '#334155', lineHeight: 1.55 }}>{c}</span>
                </div>
              ))}
            </div>

            <div className="cii-callout insight">
              <span className="cii-lbl">AI Key Insight</span>
              {data.insights || 'AI-powered analysis has identified the key market trends, segments, and opportunities outlined in this report.'}
            </div>
          </div>

          <div className="cii-pg-ftr">
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Market Intelligence Report</div>
          </div>
        </div>

        {/* Page 5: Market Opportunity Analysis */}
        <div ref={page5Ref} className="cii-page">
          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">05 / 11</div>
            </div>

            <div className="cii-eyebrow">Section Two</div>
            <div className="cii-pg-title">Market Opportunity Analysis</div>
            <div className="cii-pg-sub">In-depth breakdown of market dimensions, growth drivers, pricing landscape, and strategic opportunity windows.</div>

            {/* Growth Trend Mini Chart */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div style={{ textAlign: 'center', padding: '8px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#1a56db', fontFamily: '"IBM Plex Mono", monospace' }}>{k.tam || '—'}</div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Addressable Market</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#16a34a', fontFamily: '"IBM Plex Mono", monospace' }}>{k.growthRate || '—'}</div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Annual Growth Rate</div>
                </div>
                <div style={{ textAlign: 'center', padding: '8px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#a21caf', fontFamily: '"IBM Plex Mono", monospace' }}>{k.price || '—'}</div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avg Market Price</div>
                </div>
              </div>
            </div>

            <div className="cii-sec-title">Pricing Landscape</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
              {(data.pricing || []).map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.color || '#1a56db', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                    <div style={{ fontSize: '9.5px', color: '#64748b' }}>{p.note}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="cii-sec-title">Market Opportunity Deep Dive</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {renderReportParagraphs(rep.marketOverview)}
            </div>
          </div>

          <div className="cii-pg-ftr">
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Market Intelligence Report</div>
          </div>
        </div>

        {/* Page 5: Market Growth Trend */}
        <div ref={page5Ref} className="cii-page">
          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">05 / 11</div>
            </div>

            <div className="cii-eyebrow">Section Two</div>
            <div className="cii-pg-title">Market Growth Trend</div>
            <div className="cii-pg-sub">Historical growth trajectory, CAGR benchmarks, and forward market projections for the assessed industry.</div>

            {/* Full-width Growth Chart — compact height to leave room for KPIs and text */}
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px 12px 8px', marginBottom: '10px' }}>
              <ChartCard title="📈 Market Growth Trajectory ($ Billions)" type="line" data={growthData} options={growthOpts} height="140px" style={{ background: '#ffffff', padding: '6px', border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: '8px' }} />
            </div>

            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '7px', marginBottom: '10px' }}>
              <div style={{ textAlign: 'center', padding: '8px 4px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#1a56db', fontFamily: '"IBM Plex Mono", monospace' }}>{k.tam || '—'}</div>
                <div style={{ fontSize: '8.5px', color: '#1e3a8a', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Market Size</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 4px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#16a34a', fontFamily: '"IBM Plex Mono", monospace' }}>{k.growthRate || '—'}</div>
                <div style={{ fontSize: '8.5px', color: '#15803d', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>CAGR</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 4px', background: '#fefce8', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#b45309', fontFamily: '"IBM Plex Mono", monospace' }}>{k.customers || '—'}</div>
                <div style={{ fontSize: '8.5px', color: '#92400e', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Target Customers</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px 4px', background: '#fdf4ff', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#7c3aed', fontFamily: '"IBM Plex Mono", monospace' }}>{k.stage || '—'}</div>
                <div style={{ fontSize: '8.5px', color: '#6d28d9', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Company Stage</div>
              </div>
            </div>

            <div className="cii-sec-title" style={{ marginBottom: '6px' }}>Market Growth Analysis</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Show only first 2 sections of growth analysis to fit page */}
              {renderReportParagraphs(
                (rep.marketGrowth || '').split('\n\n').slice(0, 2).join('\n\n')
              )}
            </div>
          </div>

          <div className="cii-pg-ftr">
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Market Intelligence Report</div>
          </div>
        </div>

        {/* Page 6: Competitor Share & Competitive Positioning */}
        <div ref={page6Ref} className="cii-page">

          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">06 / 11</div>
            </div>

            <div className="cii-eyebrow">Section Three</div>
            <div className="cii-pg-title">Competitor Share &amp; Strategic Positioning</div>
            <div className="cii-pg-sub">Market share distribution across key competitors and a radar-based competitive positioning matrix.</div>

            {/* Two charts side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px' }}>
                <ChartCard title="🏆 Market Share Distribution" type="doughnut" data={compPieData} options={{ ...pieOpts('50%'), layout: { padding: 4 } }} height="170px" style={{ background: '#ffffff', padding: '6px', border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: '8px' }} />
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '10px' }}>
                <ChartCard title="🕸 Competitive Positioning Radar" type="radar" data={radarData} options={radarOpts} height="170px" style={{ background: '#ffffff', padding: '6px', border: '1px solid #e2e8f0', boxShadow: 'none', borderRadius: '8px' }} />
              </div>
            </div>

            {/* Competitor share table */}
            <div className="cii-sec-title">Competitor Market Share Breakdown</div>
            <table className="cii-table" style={{ marginBottom: '12px' }}>
              <thead><tr><th>Competitor</th><th>Market Share (%)</th><th>Positioning</th></tr></thead>
              <tbody>
                {(data.competitors || []).map((c, i) => (
                  <tr key={i}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.share}%</td>
                    <td style={{ fontSize: '10px', color: '#64748b' }}>
                      {i === 0 ? 'Market Leader — Premium Segment' :
                       i === 1 ? 'Established — Legacy Enterprise' :
                       i === 2 ? 'Challenger — Mid-Market Focus' :
                       i === 3 ? 'Disruptor — AI-Native (You)' : 'Fragmented Players'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="cii-sec-title">Competitive Analysis</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {renderReportParagraphs(rep.competitive)}
            </div>
          </div>

          <div className="cii-pg-ftr">
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Market Intelligence Report</div>
          </div>
        </div>

        {/* Page 7: Market Challenges */}
        <div ref={page7Ref} className="cii-page">
          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">07 / 11</div>
            </div>

            <div className="cii-eyebrow">Section Four</div>
            <div className="cii-pg-title">Market Challenges &amp; Risk Factors</div>
            <div className="cii-pg-sub">Key barriers to market entry, competitive risks, and mitigation strategies for the assessed industry.</div>

            {/* Challenges Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              {(data.challenges || []).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', background: i % 2 === 0 ? '#fdf4f4' : '#fff7ed', borderRadius: '8px', border: `1px solid ${i % 2 === 0 ? '#fecaca' : '#fde68a'}` }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: i % 2 === 0 ? '#fee2e2' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>
                    {i === 0 ? '⚡' : i === 1 ? '🛡' : i === 2 ? '🌐' : '👥'}
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>Challenge {String(i + 1).padStart(2, '0')}</div>
                    <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.55 }}>{c}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Market Share visual comparison */}
            <div className="cii-sec-title">Market Share Competitive Bars</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
              {(data.competitors || []).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#334155', fontWeight: 600, width: '90px', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  <div style={{ flex: 1, height: '10px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: Math.max(2, c.share) + '%', background: ['#1a56db','#f59e0b','#ea580c','#16a34a','#94a3b8'][i] || '#94a3b8', borderRadius: '3px' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: '#0f172a', fontWeight: 700, width: '30px', textAlign: 'right' }}>{c.share}%</span>
                </div>
              ))}
            </div>

            <div className="cii-sec-title">Risk Analysis &amp; Mitigation</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {renderReportParagraphs(rep.risks)}
            </div>
          </div>

          <div className="cii-pg-ftr">
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Market Intelligence Report</div>
          </div>
        </div>

        {/* Page 8: Rating, Sentiment & Pricing */}
        <div ref={page8Ref} className="cii-page">
          <div>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">08 / 11</div>
            </div>

            <div className="cii-eyebrow">Section Five</div>
            <div className="cii-pg-title">Rating, Sentiment &amp; Pricing Landscape</div>
            <div className="cii-pg-sub">Customer satisfaction scores, brand sentiment distribution, and a detailed competitive pricing comparison.</div>

            {/* Rating & Sentiment Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#1a56db', fontFamily: '"IBM Plex Mono", monospace', lineHeight: 1 }}>{data.avgRating || '—'}</div>
                <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Avg Rating / 5.0</div>
                <div style={{ color: '#fbbf24', fontSize: '18px', marginTop: '6px' }}>{'★'.repeat(Math.round(parseFloat(data.avgRating || '0')))}</div>
              </div>
              <div style={{ background: '#eafaf1', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#16a34a', fontFamily: '"IBM Plex Mono", monospace', lineHeight: 1 }}>{sv.positive}%</div>
                <div style={{ fontSize: '9.5px', color: '#15803d', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>✅ Positive</div>
                <div style={{ fontSize: '10px', color: '#334155', marginTop: '4px' }}>Satisfied customers</div>
              </div>
              <div style={{ background: '#fdf2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 800, color: '#b91c1c', fontFamily: '"IBM Plex Mono", monospace', lineHeight: 1 }}>{sv.negative}%</div>
                <div style={{ fontSize: '9.5px', color: '#b91c1c', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>⚠ Negative</div>
                <div style={{ fontSize: '10px', color: '#334155', marginTop: '4px' }}>Dissatisfied customers</div>
              </div>
            </div>

            {/* Neutral Sentiment Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e3a8a', flexShrink: 0 }}>😐 Neutral Sentiment</span>
              <div style={{ flex: 1, height: '8px', background: '#bfdbfe', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: sv.neutral + '%', background: '#1a56db', borderRadius: '4px' }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#1a56db', fontFamily: '"IBM Plex Mono", monospace' }}>{sv.neutral}%</span>
            </div>

            {/* Pricing Comparison */}
            <div className="cii-sec-title">Competitive Pricing Landscape</div>
            <table className="cii-table" style={{ marginBottom: '12px' }}>
              <thead><tr><th>Product / Tier</th><th>Pricing</th><th>Segment</th></tr></thead>
              <tbody>
                {(data.pricing || []).map((p, i) => (
                  <tr key={i}>
                    <td>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '2px', background: p.color, marginRight: '6px', flexShrink: 0, verticalAlign: 'middle' }}></span>
                      <strong>{p.name}</strong>
                    </td>
                    <td style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '10.5px' }}>{p.note}</td>
                    <td style={{ fontSize: '10px', color: '#64748b' }}>
                      {i === 0 ? 'Value Leader' : i === 1 ? 'Pro Tier' : i === 2 ? 'Enterprise' : i === 3 ? 'Premium Legacy' : 'Budget'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="cii-sec-title">Pricing Strategy Analysis</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {renderReportParagraphs(rep.pricing)}
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
                  <p>User data is processed securely and is not shared with third parties without consent, except where required by applicable law.</p>
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

        {/* Page 10: About Infopace (CII Template Page 15 Word-for-Word) */}
        <div ref={page10Ref} className="cii-page" style={{ position: 'relative' }}>
          {waveSvg}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="cii-pg-hdr">
              <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
              <div className="cii-pg-num">10 / 11</div>
            </div>

            <div className="cii-eyebrow">Organization Profile</div>
            <div className="cii-pg-title" style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '34px', fontWeight: 700, marginBottom: '4mm', color: '#061228' }}>About <span style={{ color: '#1a56db' }}>Infopace</span></div>

            <div style={{ fontSize: '11px', color: '#000000', lineHeight: 1.6, marginBottom: '8px' }}>
              <p style={{ marginBottom: '4px' }}>Infopace Management Pvt. Ltd is a Bengaluru-based strategic change management and business transformation company established in 1999, providing advisory and technology-driven solutions that help businesses improve operational efficiency, accelerate growth and adapt to changing market conditions.</p>
              <p>Our approach combines deep sector expertise with data-driven methodology — every engagement begins with understanding the specific operational and market context a client is working within, rather than applying a generic playbook. This is the same philosophy behind the AI-powered assessment tools used to generate this report: structured, evidence-based, and built to reflect the individual, not a template.</p>
            </div>

            <div className="cii-sec-title">What We Do</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', fontSize: '9.8px', color: '#000000', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ color: '#1a56db' }}>•</span> Growth Acceleration Partner</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ color: '#1a56db' }}>•</span> AI-Enabled Solutions</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ color: '#1a56db' }}>•</span> Global Capabilities Center</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ color: '#1a56db' }}>•</span> Enabling Entrepreneurial Ecosystem</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ color: '#1a56db' }}>•</span> Strategic Change Management</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ color: '#1a56db' }}>•</span> Go To Market Strategy &amp; Research</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ color: '#1a56db' }}>•</span> Strategic Investment &amp; Funding</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ color: '#1a56db' }}>•</span> Market Access &amp; Readiness</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ color: '#1a56db' }}>•</span> Data Analytics Solutions</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ color: '#1a56db' }}>•</span> Pivoting &amp; Repurposing Businesses</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ color: '#1a56db' }}>•</span> Digital Transformation</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ color: '#1a56db' }}>•</span> Radical Innovation</div>
            </div>

            <div className="cii-sec-title">Industries We Serve</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
              {['Automobile', 'Education', 'Health Care', 'ITES', 'Information Technology', 'Manufacturing', 'Retail', 'Telecom', 'Energy', 'NGO', 'Food Processing', 'Agritech', 'Aerospace', 'Semiconductor', 'ESDM'].map((ind, i) => (
                <span key={i} style={{ fontSize: '8.8px', color: '#1a56db', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '2px 6px', fontWeight: 600 }}>{ind}</span>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '10px' }}>
              <div style={{ background: '#f8fafc', border: '1px solid rgba(17,68,160,0.14)', borderRadius: '8px', padding: '6px 8px', textAlign: 'left' }}>
                <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '20px', fontWeight: 800, color: '#1a56db' }}>200+</div>
                <div style={{ fontSize: '8.5px', color: '#000000', marginTop: '1px' }}>Specialists, avg. 7 yrs expertise</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid rgba(17,68,160,0.14)', borderRadius: '8px', padding: '6px 8px', textAlign: 'left' }}>
                <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '20px', fontWeight: 800, color: '#1a56db' }}>850+</div>
                <div style={{ fontSize: '8.5px', color: '#000000', marginTop: '1px' }}>Long-lasting client partnerships</div>
              </div>
              <div style={{ background: '#f8fafc', border: '1px solid rgba(17,68,160,0.14)', borderRadius: '8px', padding: '6px 8px', textAlign: 'left' }}>
                <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: '20px', fontWeight: 800, color: '#1a56db' }}>7000+</div>
                <div style={{ fontSize: '8.5px', color: '#000000', marginTop: '1px' }}>Projects in digital transformation</div>
              </div>
            </div>

            {/* Template Page 15 Bottom Image Banner */}
            <div style={{ height: '240px', borderRadius: '8px', overflow: 'hidden', backgroundImage: 'url("/building.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', marginTop: '12px' }}>
            </div>
          </div>

          <div className="cii-pg-ftr" style={{ position: 'relative', zIndex: 1 }}>
            <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
            <div>AI-Evaluated Report</div>
          </div>
        </div>


        {/* Page 11: Thank You & Contact (CII Template Page 16 - White Theme Word-for-Word) */}
        <div ref={page11Ref} className="cii-page" style={{ background: '#ffffff', color: '#000000', position: 'relative' }}>
          {waveSvg}
          <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="cii-pg-hdr">
                <div className="cii-brand"><img src="/logo.png" alt="Infopace" style={{ height: '32px' }} /></div>
                <div className="cii-pg-num">11 / 11</div>
              </div>

              <div style={{ position: 'relative', zIndex: 2, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '6mm 0 0' }}>
                <div style={{ fontSize: '11.5px', letterSpacing: '.2em', textTransform: 'uppercase', color: '#1a56db', fontWeight: 600, marginBottom: '5mm', fontFamily: '"IBM Plex Mono", monospace' }}>Thank You</div>
                <div style={{ fontWeight: 700, fontSize: '44px', lineHeight: 1.21, color: '#061228', marginBottom: '7mm', fontFamily: '"Playfair Display", Georgia, serif' }}>Thank you<br/>for reading.</div>
                <p style={{ fontSize: '13px', color: '#000000', lineHeight: 1.87, maxWidth: '400px', marginBottom: '9mm', fontFamily: '"Inter", sans-serif', textTransform: 'none' }}>
                  If you have any questions or would like to discuss these findings further, please don't hesitate to reach out to us.
                </p>
                <div style={{ width: '240px', height: '1px', background: '#cbd5e1', marginBottom: '7mm' }}></div>
                <div style={{ fontSize: '12px', color: '#000000', lineHeight: 2.09, fontFamily: '"Inter", sans-serif' }}>
                  <div>2nd Floor, Halkatti Icon, 14, Sankey Rd, Sadashiva Nagar, Guttahalli, Bengaluru, Karnataka 560003</div>
                  <div style={{ color: '#1a56db', fontWeight: 700, marginTop: '2mm', fontSize: '13.5px' }}>+91 9845263775</div>
                  <div style={{ marginTop: '1mm' }}>info@infopaceindia.com &nbsp;·&nbsp; infospaceindia.com</div>
                </div>
              </div>
            </div>

            <div className="cii-pg-ftr">
              <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
              <div>AI-Evaluated Report</div>
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

