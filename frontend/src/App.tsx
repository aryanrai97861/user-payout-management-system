import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import Auth from './Auth';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (e) {
        handleLogout();
      }
    }
  }, [token]);

  const handleLogin = (newToken: string, newUser: any) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (!token || !user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen p-6 md:p-12">
      <header className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row items-center justify-between fade-in">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-fuchsia-500 tracking-tight flex items-center gap-2">
          Payout<span className="text-white">Flow</span>
          {user.role === 'ADMIN' && <span className="text-xs bg-fuchsia-900 text-fuchsia-200 px-2 py-1 rounded-full ml-2">ADMIN</span>}
        </h1>
        
        <div className="mt-6 md:mt-0 flex items-center gap-4">
          <div className="text-sm text-fuchsia-200/80">
            Welcome, <span className="font-bold text-white">{user.name || user.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full font-medium transition-colors text-sm text-fuchsia-200"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {user.role === 'ADMIN' ? (
          <AdminDashboard token={token} />
        ) : (
          <UserDashboard token={token} />
        )}
      </main>
    </div>
  );
}

export default App;
