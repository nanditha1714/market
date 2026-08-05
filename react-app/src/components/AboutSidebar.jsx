import React, { useEffect } from 'react';

const s = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    justifyContent: 'flex-end',
    zIndex: 10000,
    fontFamily: '"Inter", -apple-system, sans-serif'
  },
  panel: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: '520px',
    height: '100%',
    boxShadow: '-10px 0 25px -5px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    background: 'linear-gradient(135deg, #0e5caa 0%, #1e3a8a 100%)',
    padding: '30px 24px 20px 24px',
    color: '#ffffff',
    textAlign: 'center',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  logoContainer: {
    background: '#ffffff',
    padding: '12px 24px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '64px',
    boxSizing: 'border-box'
  },
  logo: {
    height: '42px',
    objectFit: 'contain'
  },
  headerSub: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.15em',
    color: 'rgba(255, 255, 255, 0.85)',
    textTransform: 'uppercase',
    margin: 0,
    marginTop: '4px'
  },
  closeBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    color: '#ffffff',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  body: {
    padding: '24px',
    overflowY: 'auto',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  blueTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#0e5caa',
    lineHeight: 1.4,
    margin: 0,
    letterSpacing: '-0.01em',
    textTransform: 'uppercase'
  },
  descText: {
    fontSize: '13.5px',
    color: '#334155',
    lineHeight: 1.6,
    margin: 0
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px'
  },
  statCard: {
    background: '#eff6ff',
    border: '1px solid #dbeafe',
    borderRadius: '12px',
    padding: '16px 8px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  statNum: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#1e40af',
    margin: 0
  },
  statLabel: {
    fontSize: '11px',
    color: '#475569',
    fontWeight: 600,
    margin: 0
  },
  cardPanel: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px'
  },
  cardTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    margin: '0 0 10px 0'
  },
  socialGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  socialBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'all 0.2s',
    cursor: 'pointer',
    border: 'none'
  },
  footer: {
    padding: '18px 24px',
    borderTop: '1px solid #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '11.5px',
    color: '#64748b',
    fontWeight: 500,
    background: '#f8fafc'
  },
  webLink: {
    color: '#0e5caa',
    textDecoration: 'none',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'color 0.2s'
  }
};

export default function AboutSidebar({ onClose }) {
  useEffect(() => {
    const styleId = 'about-sidebar-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .about-sidebar-overlay {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .about-sidebar-panel {
          animation: slideInFromRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <div style={s.overlay} className="about-sidebar-overlay" onClick={onClose}>
      <div style={s.panel} className="about-sidebar-panel" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={s.header}>
          <button 
            style={s.closeBtn} 
            onClick={onClose} 
            aria-label="Close sidebar"
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          >
            ✕
          </button>
          
          <div style={s.logoContainer}>
            <img src="/logo.png" alt="Infopace Logo" style={s.logo} />
          </div>
          
          <h3 style={s.headerSub}>Creative Innovation Index</h3>
        </div>

        {/* Body Content */}
        <div style={s.body}>
          
          <div>
            <h4 style={s.blueTitle}>India's First Strategic Change Management Company</h4>
            <p style={{ ...s.descText, marginTop: '12px' }}>
              <strong>Infopace Management Pvt. Ltd.</strong> has been a trusted partner for organizations navigating transformation, delivering value through deep expertise, behavioural science, AI-driven innovation, people-centric solutions, and scalable SaaS platforms. We assist organizations accelerate innovation, build leadership capability, streamline operations with intelligent technologies, and achieve measurable business outcomes while empowering individuals and strengthening organizations.
            </p>
          </div>

          {/* Stats Section */}
          <div style={s.statsRow}>
            <div style={s.statCard}>
              <span style={s.statNum}>25+</span>
              <span style={s.statLabel}>Years of Impact</span>
            </div>
            <div style={s.statCard}>
              <span style={s.statNum}>850+</span>
              <span style={s.statLabel}>Delighted Clients</span>
            </div>
            <div style={s.statCard}>
              <span style={s.statNum}>7000+</span>
              <span style={s.statLabel}>Business Projects</span>
            </div>
          </div>

          {/* About Tool Card */}
          <div style={s.cardPanel}>
            <h5 style={s.cardTitle}>About This Tool</h5>
            <p style={{ ...s.descText, fontSize: '13px', color: '#475569' }}>
              The <strong>Creative Innovation Index (CII)</strong> is Infopace's proprietary AI-scored psychometric assessment. It measures creative potential across 5 dimensions — Divergent Thinking, Remote Association, Risk & Openness, Creative Vision, and Real-world Behaviour — generating a personalised innovation profile in ~12 minutes.
            </p>
          </div>

          {/* Connect Section */}
          <div>
            <h5 style={s.cardTitle}>Connect With Us</h5>
            <div style={s.socialGrid}>
              <a 
                href="https://infopaceindia.com" 
                target="_blank" 
                rel="noreferrer" 
                style={{ ...s.socialBtn, backgroundColor: '#0077b5' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                LinkedIn
              </a>
              <a 
                href="https://www.youtube.com/@infopace8174" 
                target="_blank" 
                rel="noreferrer" 
                style={{ ...s.socialBtn, backgroundColor: '#ff0000' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                YouTube
              </a>
              <a 
                href="https://www.instagram.com/infopace_india/" 
                target="_blank" 
                rel="noreferrer" 
                style={{ ...s.socialBtn, backgroundColor: '#c13584' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Instagram
              </a>
              <a 
                href="https://www.facebook.com/Infopace/" 
                target="_blank" 
                rel="noreferrer" 
                style={{ ...s.socialBtn, backgroundColor: '#1877f2' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Facebook
              </a>
              <a 
                href="https://x.com/InfopaceL31094" 
                target="_blank" 
                rel="noreferrer" 
                style={{ ...s.socialBtn, backgroundColor: '#000000' }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                X (Twitter)
              </a>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={s.footer}>
          <span>© 2026 INFOPACE MANAGEMENT PVT LTD</span>
          <a 
            href="https://infopaceindia.com" 
            target="_blank" 
            rel="noreferrer" 
            style={s.webLink}
            onMouseOver={e => e.currentTarget.style.color = '#1e3a8a'}
            onMouseOut={e => e.currentTarget.style.color = '#0e5caa'}
          >
            infopaceindia.com →
          </a>
        </div>

      </div>
    </div>
  );
}
