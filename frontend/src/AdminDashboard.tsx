import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3000/api';

export default function AdminDashboard({ token }: { token: string }) {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const fetchSales = async () => {
    try {
      const res = await fetch(`${API_URL}/sales`, { headers: authHeaders });
      if (!res.ok) {
        if (res.status === 401 || res.status === 400 || res.status === 403) {
           localStorage.removeItem('token');
           window.location.reload();
           return;
        }
        throw new Error('Failed to fetch data');
      }
      const data = await res.json();
      setSales(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSales();
  }, [token]);



  const handleReconcile = async (saleId: string, status: string) => {
    setMessage('');
    try {
      const res = await fetch(`${API_URL}/sales/${saleId}/reconcile`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setMessage(`Sale ${status.toLowerCase()} successfully.`);
        fetchSales();
      } else {
        const data = await res.json();
        setMessage(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    }
  };

  if (loading) return <div className="text-fuchsia-300">Loading admin data...</div>;

  return (
    <div className="space-y-8 fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">System Administration</h2>
          <p className="text-fuchsia-300/70 text-sm mt-1">Manage global sales and reconcile payouts.</p>
        </div>
      </div>

      {message && (
        <div className="bg-fuchsia-900/50 text-fuchsia-200 p-4 rounded-xl border border-fuchsia-800/50">
          {message}
        </div>
      )}

      <div className="glass-dark rounded-3xl p-6 overflow-hidden">
        <h3 className="text-xl font-bold text-fuchsia-100 mb-6">Global Sales Directory</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-fuchsia-900/50 text-xs text-fuchsia-300 uppercase tracking-wider">
                <th className="pb-4 font-semibold">User</th>
                <th className="pb-4 font-semibold">Product & Customer</th>
                <th className="pb-4 font-semibold">Amount</th>
                <th className="pb-4 font-semibold">Status</th>
                <th className="pb-4 font-semibold">Advance</th>
                <th className="pb-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fuchsia-900/20 text-sm">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-fuchsia-300/50">No sales exist in the system.</td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-4">
                      <div className="font-medium text-white">{sale.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-fuchsia-300/60">{sale.user?.email || 'N/A'}</div>
                    </td>
                    <td className="py-4">
                      <div className="text-white">{sale.productName || 'Legacy Sale'}</div>
                      <div className="text-xs text-fuchsia-300/60">{sale.customerName || 'N/A'}</div>
                    </td>
                    <td className="py-4 font-bold text-white">${sale.amount.toFixed(2)}</td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                        sale.status === 'APPROVED' ? 'bg-green-900/50 text-green-300' :
                        sale.status === 'REJECTED' ? 'bg-red-900/50 text-red-300' :
                        'bg-yellow-900/50 text-yellow-300'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-4">
                      {sale.advancePaid ? (
                        <span className="text-green-400 font-bold text-xs bg-green-950 px-2 py-1 rounded-md">Paid ($ {(sale.amount * 0.1).toFixed(2)})</span>
                      ) : (
                        <span className="text-fuchsia-300/50 text-xs">Unpaid</span>
                      )}
                    </td>
                    <td className="py-4">
                      {sale.status === 'PENDING' ? (
                        <div className="flex gap-2">
                          <button onClick={() => handleReconcile(sale.id, 'APPROVED')} className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg transition-colors">Approve</button>
                          <button onClick={() => handleReconcile(sale.id, 'REJECTED')} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors">Reject</button>
                        </div>
                      ) : (
                        <span className="text-fuchsia-300/30 text-xs italic">Locked</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
