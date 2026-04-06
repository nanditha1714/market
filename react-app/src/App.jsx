import React, { useState, useCallback } from 'react';
import LoginPage    from './components/LoginPage';
import SurveyPage   from './components/SurveyPage';
import LoadingScreen from './components/LoadingScreen';
import Dashboard    from './components/Dashboard';
import { callGemini } from './api';

const SCREENS = { LOGIN: 'login', SURVEY: 'survey', LOADING: 'loading', DASHBOARD: 'dashboard' };

export default function App() {
  const [screen,  setScreen]  = useState(SCREENS.LOGIN);
  const [user,    setUser]    = useState(null);
  const [answers, setAnswers] = useState(null);
  const [dashData, setDashData] = useState(null);

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
      alert("AI Validation Failed: " + data.error);
      setScreen(SCREENS.SURVEY);
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

  if (screen === SCREENS.LOGIN)     return <LoginPage    onLogin={handleLogin} />;
  if (screen === SCREENS.SURVEY)    return <SurveyPage   onComplete={handleSurveyComplete} />;
  if (screen === SCREENS.LOADING)   return <LoadingScreen />;
  if (screen === SCREENS.DASHBOARD) return <Dashboard data={dashData} user={user} answers={answers} onReset={handleReset} />;

  return null;
}
