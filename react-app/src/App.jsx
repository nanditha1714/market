import React, { useState, useCallback, Suspense, lazy } from 'react';
import LoadingScreen from './components/LoadingScreen';
import { callGemini } from './services/api';

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
