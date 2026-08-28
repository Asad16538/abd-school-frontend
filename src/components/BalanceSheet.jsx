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
    let csvContent = "data:text/csv;charset=utf-8,Category,Item Name,Amount (INR),Remarks\n";
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

  const assetsList = data.items.filter(i => i.category === 'Asset');
  const liabilitiesList = data.items.filter(i => i.category === 'Liability');
  const maxRows = Math.max(assetsList.length, liabilitiesList.length, 1);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      
      {/* 🖨️ PRINT ISOLATION CSS: Sirf print ke waqt baaki cheezein hide hongi */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-balance-sheet, #printable-balance-sheet * {
            visibility: visible;
          }
          #printable-balance-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 5mm;
            background: white;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* 🛑 ACTION BAR (Screen par dikhega, print me hide ho jayega) */}
      <div className="no-print flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-black text-gray-800">📊 Balance Sheet Control Hub</h2>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            className="p-2 border rounded-lg text-sm font-bold bg-gray-50 cursor-pointer"
          >
            <option value="monthly">Monthly Statement</option>
            <option value="yearly">Yearly Statement (Financial Year)</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm">
            📥 Download Excel
          </button>
          <button onClick={handlePrintPDF} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm">
            🖨️ Print CA-Style A4 PDF
          </button>
        </div>
      </div>

      {/* 🛑 FORM INPUT FOR ADD/EDIT (Screen par dikhega, print me hide ho jayega) */}
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

      {/* ========================================================== */}
      {/* 📄 PROFESSIONAL CA-STYLE A4 PRINTABLE BALANCE SHEET FORMAT  */}
      {/* ========================================================== */}
      <div id="printable-balance-sheet" className="bg-white p-6 md:p-10 rounded-2xl shadow-md border border-gray-200 text-gray-900">
        
        {/* Header Title */}
        <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider text-gray-900">ADITYA ARMY PUBLIC SCHOOL</h1>
          <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mt-1">STATEMENT OF ASSETS AND LIABILITIES ({reportType.toUpperCase()} VIEW)</p>
          <p className="text-[10px] text-gray-500 font-semibold mt-0.5">As on: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Dual Side CA Table Structure */}
        <div className="overflow-x-auto border-2 border-gray-800">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-800 text-gray-900 font-black text-center">
                <th className="border-r border-gray-800 p-2.5 w-1/2" colSpan="2">LIABILITIES & CAPITAL</th>
                <th className="p-2.5 w-1/2" colSpan="2">ASSETS</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-800 text-gray-700 font-bold text-[11px]">
                <th className="border-r border-gray-800 p-2 text-left">Particulars</th>
                <th className="border-r border-gray-800 p-2 text-right w-28">Amount (₹)</th>
                <th className="border-r border-gray-800 p-2 text-left">Particulars</th>
                <th className="p-2 text-right w-28">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: maxRows }).map((_, index) => {
                const liab = liabilitiesList[index];
                const ast = assetsList[index];
                return (
                  <tr key={index} className="border-b border-gray-300 hover:bg-gray-50/50">
                    {/* Liability Side */}
                    <td className="border-r border-gray-300 p-2 font-medium">
                      {liab ? (
                        <div>
                          <span>{liab.item_name}</span>
                          {liab.remarks && <span className="block text-[9px] text-gray-400 italic">[{liab.remarks}]</span>}
                        </div>
                      ) : null}
                    </td>
                    <td className="border-r border-gray-800 p-2 text-right font-semibold">
                      {liab ? Number(liab.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}
                      {liab && (
                        <span className="no-print ml-2 text-[10px] text-blue-600 cursor-pointer font-bold" onClick={() => setForm(liab)}>[Edit]</span>
                      )}
                      {liab && (
                        <span className="no-print ml-1 text-[10px] text-red-600 cursor-pointer font-bold" onClick={() => handleDelete(liab.id)}>[Del]</span>
                      )}
                    </td>

                    {/* Asset Side */}
                    <td className="border-r border-gray-300 p-2 font-medium">
                      {ast ? (
                        <div>
                          <span>{ast.item_name}</span>
                          {ast.remarks && <span className="block text-[9px] text-gray-400 italic">[{ast.remarks}]</span>}
                        </div>
                      ) : null}
                    </td>
                    <td className="p-2 text-right font-semibold">
                      {ast ? Number(ast.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : ''}
                      {ast && (
                        <span className="no-print ml-2 text-[10px] text-blue-600 cursor-pointer font-bold" onClick={() => setForm(ast)}>[Edit]</span>
                      )}
                      {ast && (
                        <span className="no-print ml-1 text-[10px] text-red-600 cursor-pointer font-bold" onClick={() => handleDelete(ast.id)}>[Del]</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {/* Capital / Net Worth Row */}
              <tr className="border-b border-gray-800 bg-gray-50 font-bold">
                <td className="border-r border-gray-800 p-2 text-gray-900">Capital / Net Worth</td>
                <td className="border-r border-gray-800 p-2 text-right text-indigo-700">
                  {Number(data.net_worth).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="border-r border-gray-800 p-2"></td>
                <td className="p-2"></td>
              </tr>
            </tbody>

            {/* Grand Total Footer Row */}
            <tfoot>
              <tr className="bg-gray-200 border-t-2 border-gray-800 font-black text-sm text-gray-900">
                <td className="border-r border-gray-800 p-2.5">TOTAL LIABILITIES</td>
                <td className="border-r border-gray-800 p-2.5 text-right text-rose-700">
                  ₹{Number(data.total_liabilities + (data.net_worth > 0 ? data.net_worth : 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="border-r border-gray-800 p-2.5">TOTAL ASSETS</td>
                <td className="p-2.5 text-right text-emerald-700">
                  ₹{Number(data.total_assets).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signature & Verification Block for Print */}
        <div className="mt-16 pt-8 flex justify-between items-end text-xs font-bold text-gray-800 print:mt-24">
          <div className="text-center">
            <div className="border-t border-gray-800 w-40 pt-1">Prepared By (Accountant)</div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-800 w-40 pt-1">Audited By (CA / Auditor)</div>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-800 w-40 pt-1">Principal / Manager Stamp</div>
          </div>
        </div>

      </div>
    </div>
  );
}
