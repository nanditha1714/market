import React, { useState, useCallback, Suspense, lazy } from 'react';
import LoadingScreen from './components/LoadingScreen';
import { callGemini, saveRecord } from './services/api';

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

  const handleLogin = useCallback((userInfo) => {
    setUser(userInfo);
    setScreen(SCREENS.SURVEY);
  }, []);

  const handleSurveyComplete = useCallback(async (surveyAnswers) => {
    // Pre-fill industry from company + service
    const enriched = {
      ...surveyAnswers,
      industry: surveyAnswers.industry || ((user?.company || '') + ' — ' + (user?.service || '').slice(0, 80)),
    };
    setAnswers(enriched);
    setScreen(SCREENS.LOADING);

    const data = await callGemini(enriched);
    
    if (data.error) {
      setErrorMsg(data.error);
      setScreen(SCREENS.SURVEY);
      setTimeout(() => setErrorMsg(null), 8000);
      return;
    }

    // Auto-save to Supabase backend on completion
    try {
      const k = data.kpi || {};
      const payload = {
        name: user.name, phone: user.phone, email: user.email,
        company_name: user.company, service: user.service,
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
        dashboard_json: JSON.stringify(data),
        pdf_url: null,
        created_at: new Date().toISOString(),
      };
      
      const dbRecord = await saveRecord(payload);
      if (dbRecord && dbRecord.id) {
        data.dbRecordId = dbRecord.id;
      }
    } catch (dbErr) {
      console.warn('Auto-save database failure:', dbErr);
    }

    setDashData(data);
    setScreen(SCREENS.DASHBOARD);
  }, [user]);

  const handleReset = useCallback(() => {
    setScreen(SCREENS.LOGIN);
    setUser(null);
    setAnswers(null);
    setDashData(null);
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
        {screen === SCREENS.SURVEY && <SurveyPage onComplete={handleSurveyComplete} />}
        {screen === SCREENS.LOADING && <LoadingScreen />}
        {screen === SCREENS.DASHBOARD && <Dashboard data={dashData} user={user} answers={answers} onReset={handleReset} />}
      </Suspense>
    </>
  );
}
