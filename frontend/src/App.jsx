import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LogIn from './pages/LogIn';
import SignUp from './pages/SignUp.jsx';
import Dashboard from './pages/Dashboard';
import BudgetSetup from './pages/BudgetSetup';
import BudgetEdit from './pages/BudgetEdit';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LogIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/budget/setup"
            element={
              <ProtectedRoute>
                <BudgetSetup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/budget/edit"
            element={
              <ProtectedRoute>
                <BudgetEdit />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 Page */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;