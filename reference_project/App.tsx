
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import JobDetails from './components/JobDetails';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen text-slate-800 antialiased selection:bg-violet-200 selection:text-violet-900">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/job/:id" element={<JobDetails />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
