import React, { useState, useCallback, useEffect, useRef, Suspense, lazy } from 'react';
import LoadingScreen from './components/LoadingScreen';
import { callGemini, saveRecord, getRecord } from './services/api';

const LoginPage  = lazy(() => import('./components/LoginPage'));
const SurveyPage = lazy(() => import('./components/SurveyPage'));
const Dashboard  = lazy(() => import('./components/Dashboard'));

const SCREENS = { LOGIN: 'login', SURVEY: 'survey', LOADING: 'loading', DASHBOARD: 'dashboard' };

export default function App() {
  const [screen,  setScreen]  = useState(SCREENS.LOGIN);
  const [user,    setUser]    = useState(null);
  const [answers, setAnswers] = useState(null);
  const [dashData, setDashData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const lastSavedIdRef = useRef(null);
  const loadedDashIdRef = useRef(null);

  // Helper to parse current URL hash and sync state
  const parseHash = useCallback(async () => {
    const hash = window.location.hash || '#/login';
    const path = hash.split('?')[0];
    const params = new URLSearchParams(hash.split('?')[1] || '');
    const id = params.get('id');

    // Load active session from localStorage
    const storedUser = localStorage.getItem('infopace_user_session');
    let currentUser = null;
    if (storedUser) {
      try {
        currentUser = JSON.parse(storedUser);
      } catch (e) {
        console.warn('Failed to parse user session');
      }
    }

    if (!currentUser) {
      setUser(null);
      setScreen(SCREENS.LOGIN);
      if (window.location.hash !== '#/login') {
        window.location.hash = '#/login';
      }
      return;
    }

    setUser(currentUser);

    if (path === '#/login') {
      window.location.hash = '#/survey';
    } else if (path === '#/survey') {
      setScreen(SCREENS.SURVEY);
    } else if (path === '#/dashboard') {
      if (id) {
        // Skip query request if state is already loaded for this record or just completed (string cast prevents type mismatch)
        const isCurrentSaved = lastSavedIdRef.current && String(lastSavedIdRef.current) === String(id);
        const isCurrentLoaded = loadedDashIdRef.current && String(loadedDashIdRef.current) === String(id);
        const isStateMatching = dashData && (String(dashData.dbRecordId) === String(id) || String(dashData.id) === String(id));

        if (isCurrentSaved || isCurrentLoaded || isStateMatching) {
          setScreen(SCREENS.DASHBOARD);
          return;
        }
        setScreen(SCREENS.LOADING);
        const record = await getRecord(id);
        if (record) {
          try {
            const parsedDash = JSON.parse(record.dashboard_json);
            parsedDash.dbRecordId = record.id;

            const reconstructedAnswers = {
              businessName: record.company_name,
              industry: record.industry,
              problem: record.problem,
              customer: record.target_customer,
              geo: record.geography,
              tam: record.tam_estimate,
              competitors: record.competitors,
              pricing: record.pricing_model,
              price: record.avg_price,
              ratings: record.self_rating,
              sc: record.stage_challenges,
              rawAnswers: parsedDash.raw_survey_answers
            };

            setAnswers(reconstructedAnswers);
            setDashData(parsedDash);
            loadedDashIdRef.current = record.id;
            setScreen(SCREENS.DASHBOARD);
          } catch (err) {
            console.error('Error reconstructing dashboard from DB:', err);
            window.location.hash = '#/survey';
          }
        } else {
          alert('Requested market research report could not be found.');
          window.location.hash = '#/survey';
        }
      } else {
        if (dashData) {
          setScreen(SCREENS.DASHBOARD);
        } else {
          window.location.hash = '#/survey';
        }
      }
    }
  }, []);

  // Sync hash routing on mount and hashchange events
  useEffect(() => {
    parseHash();
    const handleHashChange = () => {
      parseHash();
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [parseHash]);

  const handleLogin = useCallback((userInfo) => {
    localStorage.setItem('infopace_user_session', JSON.stringify(userInfo));
    setUser(userInfo);
    window.location.hash = '#/survey';
  }, []);

  const handleSurveyComplete = useCallback(async (surveyAnswers) => {
    // Pre-fill industry from company + service
    const enriched = {
      ...surveyAnswers,
      industry: surveyAnswers.industry || ((user?.company || '') + ' — ' + (user?.service || '').slice(0, 80)),
    };
    setScreen(SCREENS.LOADING);

    const data = await callGemini(enriched);
    
    if (data.error) {
      setErrorMsg(data.error);
      window.location.hash = '#/survey';
      setTimeout(() => setErrorMsg(null), 8000);
      return;
    }

    let dbRecordId = null;
    // Auto-save to Supabase backend on completion
    try {
      const k = data.kpi || {};
      const payload = {
        name: user.name, phone: user.phone, email: user.email,
        company_name: surveyAnswers.businessName || user.company,
        service: user.service,
        industry: enriched.industry || '', problem: enriched.problem || '',
        target_customer: enriched.customer || '', geography: enriched.geo || '',
        tam_estimate: enriched.tam || '', competitors: enriched.competitors || '',
        pricing_model: enriched.pricing || '', avg_price: enriched.price || '',
        self_rating: enriched.ratings || '', stage_challenges: enriched.sc || '',
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
        dashboard_json: JSON.stringify({ ...data, raw_survey_answers: surveyAnswers.rawAnswers }),
        pdf_url: null,
        created_at: new Date().toISOString(),
      };
      
      const dbRecord = await saveRecord(payload);
      if (dbRecord && dbRecord.id) {
        dbRecordId = dbRecord.id;
        data.dbRecordId = dbRecord.id;
        lastSavedIdRef.current = dbRecord.id;
        loadedDashIdRef.current = dbRecord.id;
      }
    } catch (dbErr) {
      console.warn('Auto-save database failure:', dbErr);
    }

    // Clear survey answers from cache upon successful completion
    const formKey = `infopace_survey_form_answers_${user?.email || 'global'}`;
    const stepKey = `infopace_survey_current_step_${user?.email || 'global'}`;
    localStorage.removeItem(formKey);
    localStorage.removeItem(stepKey);

    setAnswers(enriched);
    setDashData(data);
    setScreen(SCREENS.DASHBOARD);
    if (dbRecordId) {
      window.location.hash = `#/dashboard?id=${dbRecordId}`;
    } else {
      window.location.hash = '#/dashboard';
    }
  }, [user]);

  const handleReset = useCallback(() => {
    localStorage.removeItem('infopace_user_session');
    if (user?.email) {
      localStorage.removeItem(`infopace_survey_form_answers_${user.email}`);
      localStorage.removeItem(`infopace_survey_current_step_${user.email}`);
    } else {
      localStorage.removeItem('infopace_survey_form_answers_global');
      localStorage.removeItem('infopace_survey_current_step_global');
    }
    lastSavedIdRef.current = null;
    loadedDashIdRef.current = null;
    setUser(null);
    setAnswers(null);
    setDashData(null);
    window.location.hash = '#/login';
  }, []);

  return (
    <>
      {errorMsg && (
        <div style={{ position:'fixed', top:'20px', left:'50%', transform:'translateX(-50%)', background:'var(--danger)', color:'#fff', padding:'12px 24px', borderRadius:'8px', fontWeight:600, fontSize:'14px', zIndex:9999, boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }}>
          System Alert: {errorMsg}
        </div>
      )}
      <Suspense fallback={<LoadingScreen />}>
        {screen === SCREENS.LOGIN && <LoginPage onLogin={handleLogin} />}
        {screen === SCREENS.SURVEY && <SurveyPage user={user} onComplete={handleSurveyComplete} />}
        {screen === SCREENS.LOADING && <LoadingScreen />}
        {screen === SCREENS.DASHBOARD && <Dashboard data={dashData} user={user} answers={answers} onReset={handleReset} />}
      </Suspense>
    </>
  );
}
