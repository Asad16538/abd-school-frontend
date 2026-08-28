import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function BalanceSheet({ BASE_URL }) {
  const [data, setData] = useState({ items: [], total_assets: 0, total_liabilities: 0, net_worth: 0 });
  const [form, setForm] = useState({ id: null, category: 'Asset', item_name: '', amount: '', remarks: '' });
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('yearly');

  const fetchBalanceSheet = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/accounting/balance-sheet?period=${reportType}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Error fetching balance sheet:", err);
    }
  };

  useEffect(() => {
    fetchBalanceSheet();
  }, [reportType]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/api/accounting/balance-sheet/save`, form);
      if (res.data.success) {
        setForm({ id: null, category: 'Asset', item_name: '', amount: '', remarks: '' });
        fetchBalanceSheet();
      }
    } catch (err) {
      alert("Error saving item");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Kya aap ise delete karna chahte hain?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/accounting/balance-sheet/delete/${id}`);
      fetchBalanceSheet();
    } catch (err) {
      alert("Error deleting item");
    }
  };

  const downloadExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,Category,Item Name,Amount,Remarks\n";
    data.items.forEach(row => {
      csvContent += `"${row.category}","${row.item_name}",${row.amount},"${row.remarks || ''}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Balance_Sheet_${reportType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 no-print">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-gray-800">📊 Balance Sheet</h2>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            className="p-2 border rounded-lg text-sm font-bold bg-gray-50 cursor-pointer"
          >
            <option value="monthly">Monthly View</option>
            <option value="yearly">Yearly View</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
            📥 Download Excel
          </button>
          <button onClick={handlePrintPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <span className="text-sm font-bold text-gray-600 uppercase">Net Worth / Capital Position</span>
        <span className="text-xl font-black text-indigo-900">₹{data.net_worth.toLocaleString()}</span>
      </div>

      <form onSubmit={handleSave} className="no-print bg-white p-5 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">Type</label>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full p-2.5 border rounded-lg font-medium text-sm">
            <option value="Asset">Asset (संपत्ति)</option>
            <option value="Liability">Liability (देयता/कर्ज़)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">Item Name</label>
          <input type="text" placeholder="e.g. Lab Equipment" value={form.item_name} onChange={e => setForm({...form, item_name: e.target.value})} required className="w-full p-2.5 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">Amount (₹)</label>
          <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required className="w-full p-2.5 border rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">Remarks</label>
          <input type="text" placeholder="Optional notes" value={form.remarks} onChange={e => setForm({...form, remarks: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" />
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-lg text-sm transition cursor-pointer">
            {form.id ? 'Update' : 'Add Item'}
          </button>
          {form.id && (
            <button type="button" onClick={() => setForm({ id: null, category: 'Asset', item_name: '', amount: '', remarks: '' })} className="bg-gray-300 px-3 py-2.5 rounded-lg text-sm font-bold cursor-pointer">Cancel</button>
          )}
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-emerald-50 px-5 py-3 border-b border-emerald-100 flex justify-between items-center">
            <h3 className="font-bold text-emerald-800">🟢 Assets (संपत्ति)</h3>
            <span className="font-black text-emerald-900">Total: ₹{data.total_assets.toLocaleString()}</span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                <th className="p-3">Item Name</th>
                <th className="p-3">Remarks</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {data.items.filter(i => i.category === 'Asset').map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 font-semibold text-gray-800">{item.item_name}</td>
                  <td className="p-3 text-gray-500 text-xs">{item.remarks}</td>
                  <td className="p-3 text-right font-bold text-emerald-600">₹{item.amount.toLocaleString()}</td>
                  <td className="p-3 text-center space-x-2 no-print">
                    <button onClick={() => setForm(item)} className="text-blue-600 font-bold text-xs hover:underline cursor-pointer">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 font-bold text-xs hover:underline cursor-pointer">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-rose-50 px-5 py-3 border-b border-rose-100 flex justify-between items-center">
            <h3 className="font-bold text-rose-800">🔴 Liabilities (देयता / कर्ज़)</h3>
            <span className="font-black text-rose-900">Total: ₹{data.total_liabilities.toLocaleString()}</span>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                <th className="p-3">Item Name</th>
                <th className="p-3">Remarks</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center no-print">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {data.items.filter(i => i.category === 'Liability').map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="p-3 font-semibold text-gray-800">{item.item_name}</td>
                  <td className="p-3 text-gray-500 text-xs">{item.remarks}</td>
                  <td className="p-3 text-right font-bold text-rose-600">₹{item.amount.toLocaleString()}</td>
                  <td className="p-3 text-center space-x-2 no-print">
                    <button onClick={() => setForm(item)} className="text-blue-600 font-bold text-xs hover:underline cursor-pointer">Edit</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 font-bold text-xs hover:underline cursor-pointer">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}