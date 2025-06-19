import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import Dashboard from './pages/Dashboard';
import Psychologists from './pages/Psychologists';
import Parents from './pages/Parents';
import Settings from './pages/Settings';
import LoginPage from './pages/Loginpage';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const AuthRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard" /> : children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthRoute>
              <LoginPage />
            </AuthRoute>
          }
        />
        <Route
          path="*"
          element={
            <div className="flex flex-col min-h-screen">
              <Header />
              <div className="flex flex-1">
                <Sidebar />
                <main className="flex-1">
                  <Routes>
                    <Route
                      path="/dashboard"
                      element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
                    />
                    <Route
                      path="/psychologists"
                      element={<ProtectedRoute><Psychologists /></ProtectedRoute>}
                    />
                    <Route
                      path="/parents"
                      element={<ProtectedRoute><Parents /></ProtectedRoute>}
                    />
                    <Route
                      path="/settings"
                      element={<ProtectedRoute><Settings /></ProtectedRoute>}
                    />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="*" element={<Navigate to="/dashboard" />} />
                  </Routes>
                </main>
              </div>
              <Footer />
            </div>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;