import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import AuthPage from './AuthPage';
import DashboardPage from './DashboardPage';
import PlatformSetupPage from './PlatformSetupPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/platform-setup" element={<PlatformSetupPage />} />
      </Routes>
    </BrowserRouter>
  );
}
