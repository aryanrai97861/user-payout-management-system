import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const API_URL = 'http://localhost:3000/api';

export default function UserDashboard({ token }: { token: string }) {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [productName, setProductName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [showWithdrawError, setShowWithdrawError] = useState(false);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const fetchUserData = async () => {
    try {
      const res = await fetch(`${API_URL}/users/dashboard`, { headers: authHeaders });
      if (!res.ok) {
        if (res.status === 401 || res.status === 400 || res.status === 404) {
           localStorage.removeItem('token');
           window.location.reload();
           return;
        }
        throw new Error('Failed to fetch data');
      }
      const data = await res.json();
      setUserData(data);
    } catch (e) {
      console.error(e);
      setUserData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, [token]);

  useEffect(() => {
    if (!userData?.lastWithdrawalAt) {
      setTimeLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const nextTime = new Date(userData.lastWithdrawalAt).getTime() + 24 * 60 * 60 * 1000;
      const now = new Date().getTime();
      const diff = nextTime - now;

      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userData?.lastWithdrawalAt]);

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/sales`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ amount, productName, customerName }),
      });
      const data = await res.json();
      if (res.ok) {
        setAmount('');
        setProductName('');
        setCustomerName('');
        setMessage('Sale created successfully!');
        fetchUserData();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (timeLeft) {
      setShowWithdrawError(true);
      return;
    }
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/withdrawals`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ amount: withdrawAmount }),
      });
      const data = await res.json();
      if (res.ok) {
        setWithdrawAmount('');
        setMessage('Withdrawal successful!');
        fetchUserData();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    }
  };

  const handleResetTimer = async () => {
    await fetch(`${API_URL}/users/reset-timer`, { method: 'POST', headers: authHeaders });
    fetchUserData();
  };

  if (loading) return <div className="text-fuchsia-300">Loading user data...</div>;
  if (!userData) return <div className="text-red-400">Failed to load data.</div>;

  return (
    <div className="space-y-8 fade-in">
      {message && (
        <div className="bg-fuchsia-900/50 text-fuchsia-200 p-4 rounded-xl border border-fuchsia-800/50 text-center">
          {message}
        </div>
      )}

      {/* BALANCE CARD */}
      <div className="glass-dark rounded-3xl p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-40 transition-opacity">
          <svg className="w-24 h-24 text-fuchsia-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"></path></svg>
        </div>
        <h2 className="text-lg text-fuchsia-300 uppercase tracking-widest font-semibold mb-2">Available Balance</h2>
        <div className={`text-6xl font-black ${userData.balance < 0 ? 'text-red-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-fuchsia-500'}`}>
          ${userData.balance.toFixed(2)}
        </div>
        {userData.balance < 0 && (
          <p className="mt-2 text-red-300 text-sm font-medium">
            Your balance is negative due to a previous sale being rejected after an advance payout was issued.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* CREATE SALE */}
        <div className="glass-dark rounded-3xl p-6">
          <h3 className="text-xl font-bold text-fuchsia-100 mb-6 flex items-center gap-2">
             New Sale
          </h3>
          <form onSubmit={handleCreateSale} className="space-y-4">
            <div>
              <label className="text-xs text-fuchsia-300 uppercase tracking-wide block mb-1">Product Name</label>
              <input type="text" value={productName} onChange={e => setProductName(e.target.value)} required className="w-full bg-black/50 border border-fuchsia-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500" placeholder="e.g. Pro Subscription" />
            </div>
            <div>
              <label className="text-xs text-fuchsia-300 uppercase tracking-wide block mb-1">Customer Name</label>
              <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required className="w-full bg-black/50 border border-fuchsia-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500" placeholder="e.g. John Doe" />
            </div>
            <div>
              <label className="text-xs text-fuchsia-300 uppercase tracking-wide block mb-1">Amount ($)</label>
              <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full bg-black/50 border border-fuchsia-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500" placeholder="0.00" />
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-pink-600 to-fuchsia-700 hover:from-pink-500 hover:to-fuchsia-600 text-white font-bold py-3 rounded-xl shadow-lg transition-all">
              Record Sale
            </button>
          </form>
        </div>

        {/* WITHDRAW */}
        <div className="glass-dark rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-fuchsia-100">Request Withdrawal</h3>
              {timeLeft && (
                <span className="text-xs font-mono bg-red-950/50 text-red-300 px-2 py-1 rounded-md border border-red-900/50">
                  Resets in: {timeLeft}
                </span>
              )}
            </div>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-xs text-fuchsia-300 uppercase tracking-wide block mb-1">Amount ($)</label>
                <input type="number" step="0.01" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} required className="w-full bg-black/50 border border-fuchsia-900/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500" placeholder="0.00" />
              </div>
              <button type="submit" className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl border border-white/10 transition-all">
                Withdraw Funds
              </button>
            </form>
          </div>
          
          <div className="mt-6 pt-6 border-t border-fuchsia-900/30">
            <p className="text-xs text-fuchsia-300/70 mb-3 text-center">For testing purposes, bypass the 24h limit:</p>
            <button onClick={handleResetTimer} className="w-full bg-fuchsia-950 hover:bg-fuchsia-900 text-fuchsia-300 py-2 rounded-xl border border-fuchsia-800 text-sm transition-colors">
              Reset 24h Timer
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* SALES HISTORY */}
        <div className="glass-dark rounded-3xl p-6">
          <h3 className="text-xl font-bold text-fuchsia-100 mb-6">Your Sales</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {userData.sales.length === 0 ? (
              <div className="text-fuchsia-300/50 text-center py-8">No sales recorded yet.</div>
            ) : (
              userData.sales.map((sale: any) => (
                <div key={sale.id} className="bg-black/40 border border-fuchsia-900/20 p-4 rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-bold text-white text-lg">${sale.amount.toFixed(2)}</span>
                      <div className="text-xs text-fuchsia-300/70 mt-1">{sale.productName} • {sale.customerName}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                      sale.status === 'APPROVED' ? 'bg-green-900/50 text-green-300' :
                      sale.status === 'REJECTED' ? 'bg-red-900/50 text-red-300' :
                      'bg-yellow-900/50 text-yellow-300'
                    }`}>
                      {sale.status}
                    </span>
                  </div>
                  {sale.advancePaid && sale.status === 'PENDING' && (
                    <div className="mt-3 text-xs bg-fuchsia-900/30 text-fuchsia-200 p-2 rounded-lg border border-fuchsia-800/30 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse"></span>
                       10% Advance Paid
                    </div>
                  )}
                  {sale.status === 'REJECTED' && sale.advancePaid && (
                    <div className="mt-3 text-xs bg-red-950 text-red-200 p-2 rounded-lg border border-red-900 flex items-center gap-2">
                       <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                       Sale rejected! A -10% deduction was explicitly applied to your balance to recover the advance.
                    </div>
                  )}
                  {sale.status === 'APPROVED' && sale.advancePaid && (
                    <div className="mt-3 text-xs bg-green-950 text-green-200 p-2 rounded-lg border border-green-900 flex items-center gap-2">
                       <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                       Sale approved! The remaining 90% was credited to your balance.
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* TRANSACTION HISTORY */}
        <div className="glass-dark rounded-3xl p-6">
          <h3 className="text-xl font-bold text-fuchsia-100 mb-6">Transactions</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {userData.transactions.length === 0 ? (
              <div className="text-fuchsia-300/50 text-center py-8">No transactions yet.</div>
            ) : (
              userData.transactions.map((tx: any) => {
                const isNegative = tx.amount < 0 || tx.type === 'WITHDRAWAL';
                const isAdjustment = tx.type === 'ADJUSTMENT';
                return (
                  <div key={tx.id} className={`p-4 rounded-2xl border ${isAdjustment ? 'bg-red-950/30 border-red-900/30' : 'bg-black/40 border-fuchsia-900/20'} flex justify-between items-center`}>
                    <div>
                      <div className={`font-bold ${isAdjustment ? 'text-red-300' : 'text-white'}`}>
                        {tx.type.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-fuchsia-300/60 mt-1">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                      </div>
                      {isAdjustment && (
                        <div className="text-xs text-red-400 mt-1 italic">
                          Advance recovery charge
                        </div>
                      )}
                    </div>
                    <div className={`font-black text-lg ${isNegative ? 'text-red-400' : 'text-green-400'}`}>
                      {isNegative ? '' : '+'}${Math.abs(tx.amount).toFixed(2)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showWithdrawError && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 fade-in">
          <div className="glass-dark p-8 rounded-3xl max-w-sm w-full border-red-900/50 text-center relative shadow-2xl shadow-red-900/20">
            <div className="w-16 h-16 bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-900">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Withdrawal Locked</h3>
            <p className="text-fuchsia-200/80 mb-6">
              You can only withdraw funds once every 24 hours. Please wait until the timer expires.
            </p>
            <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500 mb-6 font-mono">
              {timeLeft}
            </div>
            <button onClick={() => setShowWithdrawError(false)} className="w-full bg-red-950 hover:bg-red-900 text-red-200 font-bold py-3 rounded-xl transition-colors border border-red-800">
              Understood
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
