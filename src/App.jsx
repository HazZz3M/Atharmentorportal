import React, { useState, useEffect } from 'react';
import { useApp, AppProvider } from './context/AppContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Loading from './components/Loading';

const AppContent = () => {
  const { user, setUser, t, lang } = useApp();
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('mentor_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.warn("Session recovery blocked or failed:", e);
    }
    setLoading(false);
  }, [setUser]);

  if (loading) return <Loading />;

  // Admin routing
  if (user?.isAdmin) return <Admin />;
  
  // Dashboard routing
  if (user) return <Dashboard />;

  // Default to Login
  return <Login />;
};

function App() {
  return (
    <AppProvider>
      <div className="app">
        <AppContent />
      </div>
    </AppProvider>
  )
}

export default App
