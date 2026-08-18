import React, { useState, useEffect } from 'react';
import { getUserHistory, getRazorpayKey, createRazorpayOrder, verifyRazorpayPayment, updateRecord } from '../services/api';

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

const ENABLE_PAYMENT = false; // Set to false to disable Razorpay payment requirement

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '12px',
    boxSizing: 'border-box',
    fontFamily: '"Inter", -apple-system, sans-serif'
  },
  modal: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: '650px',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '88vh',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    animation: 'modalSlideIn 0.3s ease-out'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
    background: '#f8fafc',
  },
  title: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    color: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: '#64748b',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.2s',
  },
  body: {
    padding: '16px 18px',
    overflowY: 'auto',
    flex: 1,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '14px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    backgroundColor: '#ffffff'
  },
  itemContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    minWidth: '200px',
    paddingRight: '8px'
  },
  companyName: {
    fontWeight: 600,
    fontSize: '14.5px',
    color: '#0f172a',
    margin: 0
  },
  meta: {
    fontSize: '12px',
    color: '#64748b',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  dot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: '#cbd5e1'
  },
  badgePaid: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#16a34a',
    background: '#f0fdf4',
    padding: '3px 8px',
    borderRadius: '12px',
    border: '1px solid #bbf7d0',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  badgeLocked: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#dc2626',
    background: '#fef2f2',
    padding: '3px 8px',
    borderRadius: '12px',
    border: '1px solid #fecaca',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  actionArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  btnView: {
    padding: '8px 16px',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  btnUnlock: {
    padding: '8px 16px',
    backgroundColor: '#1d4ed8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: '0 2px 4px rgba(29, 78, 216, 0.15)'
  },
  btnDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#64748b'
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px'
  },
  emptyText: {
    margin: 0,
    fontSize: '14px',
    lineHeight: 1.5
  },
  loadingSpinner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    gap: '12px',
    color: '#64748b'
  }
};

export default function HistoryModal({ user, onClose, onSelectReport }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    let active = true;
    const fetchHistory = async () => {
      if (!user?.email) return;
      const data = await getUserHistory(user.email);
      if (active) {
        setReports(data || []);
        setLoading(false);
      }
    };
    fetchHistory();
    return () => { active = false; };
  }, [user]);

  const handleUnlockReport = async (report) => {
    setProcessingId(report.id);
    try {
      // Step 1: Create order on backend securely
      const orderRes = await createRazorpayOrder(1); // ₹1.00
      if (!orderRes.success) {
        alert(`Failed to initialize transaction: ${orderRes.error}`);
        setProcessingId(null);
        return;
      }

      // Save order details to Supabase immediately in pending state
      await updateRecord(report.id, {
        razorpay_order_id: orderRes.orderId,
        payment_status: 'pending'
      });

      // Step 2: Fetch Razorpay public key ID
      const keyId = await getRazorpayKey();
      if (!keyId) {
        alert("Failed to retrieve Razorpay Key ID from the server.");
        setProcessingId(null);
        return;
      }

      // Step 3: Load Razorpay script
      const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!loaded) {
        alert("Failed to load Razorpay script. Check your internet connection.");
        setProcessingId(null);
        return;
      }

      // Step 4: Configure Razorpay Checkout options
      const options = {
        key: keyId,
        amount: "100", // ₹1.00 (in paise)
        currency: "INR",
        name: "Infopace Management Pvt Ltd",
        description: `Unlock Report: ${report.company_name}`,
        image: window.location.origin + "/logo.png",
        order_id: orderRes.orderId,
        handler: async function (response) {
          // Verify payment signature on backend
          const verifyRes = await verifyRazorpayPayment({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          });

          if (verifyRes.success) {
            // Update database record to mark as unlocked
            const ok = await updateRecord(report.id, {
              pdf_url: 'unlocked',
              payment_status: 'success',
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            if (ok) {
              // Save global paid flag in local storage to allow dashboard downloads
              const storageKey = `isPaid_${user?.email || 'global'}`;
              localStorage.setItem(storageKey, 'true');
              
              setProcessingId(null);
              onClose();
              onSelectReport(report.id);
            } else {
              alert("Payment verified, but database update failed. Please contact support.");
              setProcessingId(null);
            }
          } else {
            // Update database with payment verification failure
            await updateRecord(report.id, {
              payment_status: 'failed'
            });
            alert(`Payment verification failed: ${verifyRes.error}`);
            setProcessingId(null);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          phone: user?.phone || ""
        },
        theme: {
          color: "#1e3a8a"
        },
        modal: {
          ondismiss: async function () {
            // Update database with payment dismissal
            await updateRecord(report.id, {
              payment_status: 'dismissed'
            });
            setProcessingId(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Error in unlocking report:', err);
      alert('An unexpected error occurred during checkout.');
      setProcessingId(null);
    }
  };

  const handleViewReport = (reportId) => {
    onClose();
    onSelectReport(reportId);
  };

  const formatDate = (isoStr) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return isoStr;
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <div style={s.header}>
          <h2 style={s.title}>
            <span>📜</span> Research History
          </h2>
          <button style={s.closeBtn} onClick={onClose} aria-label="Close history">
            ✕
          </button>
        </div>

        <div style={s.body}>
          {loading ? (
            <div style={s.loadingSpinner}>
              <div className="spinner" style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#1d4ed8', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '13.5px', fontWeight: 500 }}>Fetching your previous reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>🔍</div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '15px', color: '#0f172a', fontWeight: 600 }}>No reports found</h3>
              <p style={s.emptyText}>Complete the market research survey to generate and unlock your first business dashboard.</p>
            </div>
          ) : (
            <div style={s.list}>
              {reports.map((report) => {
                const isPaid = !ENABLE_PAYMENT || report.payment_status === 'success' || !!report.pdf_url;
                const isProcessing = processingId === report.id;
                
                return (
                  <div key={report.id} style={s.item}>
                    <div style={s.itemContent}>
                      <h4 style={s.companyName}>{report.company_name}</h4>
                      <p style={s.meta}>
                        <span>{report.industry ? report.industry.split(' — ')[0] : 'General'}</span>
                        <span style={s.dot} />
                        <span>{formatDate(report.created_at)}</span>
                      </p>
                      <div style={{ marginTop: '8px' }}>
                        {isPaid ? (
                          <span style={s.badgePaid}>✓ Unlocked</span>
                        ) : (
                          <span style={s.badgeLocked}>🔒 Locked</span>
                        )}
                      </div>
                    </div>

                    <div style={s.actionArea}>
                      {isPaid ? (
                        <button 
                          style={s.btnView}
                          onClick={() => handleViewReport(report.id)}
                          onMouseOver={e => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                          onMouseOut={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        >
                          View Report
                        </button>
                      ) : (
                        <button 
                          style={{ ...s.btnUnlock, ...(isProcessing ? s.btnDisabled : {}) }}
                          disabled={isProcessing}
                          onClick={() => handleUnlockReport(report)}
                          onMouseOver={e => { if(!isProcessing) e.currentTarget.style.backgroundColor = '#1e3a8a'; }}
                          onMouseOut={e => { if(!isProcessing) e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
                        >
                          {isProcessing ? 'Processing...' : 'Unlock Report (₹1)'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
