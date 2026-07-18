import React, { useState } from 'react';

const API_URL = 'http://localhost:3000/api';

export default function Auth({ onLogin }: { onLogin: (token: string, user: any) => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const body = isLogin ? { email, password } : { name, email, password };
    
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      onLogin(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center fade-in">
      <div className="glass-dark p-8 rounded-3xl w-full max-w-md border border-fuchsia-900/50">
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-fuchsia-500 mb-6 text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        {error && <div className="bg-red-950 text-red-300 p-3 rounded-xl mb-4 text-sm text-center border border-red-800/50">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="text-xs text-fuchsia-300/70 uppercase tracking-wide block mb-1">Full Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-black/50 border border-fuchsia-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-colors" />
            </div>
          )}
          <div>
            <label className="text-xs text-fuchsia-300/70 uppercase tracking-wide block mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-black/50 border border-fuchsia-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-fuchsia-300/70 uppercase tracking-wide block mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-black/50 border border-fuchsia-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500 transition-colors" />
          </div>
          
          <button disabled={loading} className="w-full mt-6 bg-gradient-to-r from-pink-600 to-fuchsia-700 hover:from-pink-500 hover:to-fuchsia-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-fuchsia-900/50 transition-all">
            {loading ? 'Processing...' : isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-fuchsia-200/60">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-fuchsia-400 font-semibold hover:text-pink-300 transition-colors">
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </div>
        
        <div className="mt-8 pt-4 border-t border-fuchsia-900/30 text-xs text-center text-fuchsia-300/40">
          Admin access: admin@payoutflow.com / admin123
        </div>
      </div>
    </div>
  );
}
