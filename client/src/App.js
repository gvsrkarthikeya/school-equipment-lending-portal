import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './AuthPage';
import RoleBasedDashboard from './RoleBasedDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/dashboard" element={<RoleBasedDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;