// src/components/ExpenseTracker.jsx ke top imports badlein
import React, { useState, useEffect } from 'react';
import { Filter, FileSpreadsheet, PlusCircle, Wallet, ArrowDownRight, Tag, IndianRupee } from 'lucide-react'; // 👈 DollarSign hatakar IndianRupee jadd diya
import * as XLSX from 'xlsx';

const BASE_URL = 'https://erp-api.aapschool.in';

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [uiMessage, setUiMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Form States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Maintenance');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [vendorName, setVendorName] = useState('');
  const [remarks, setRemarks] = useState('');

  // Financial Summary States
  const [summary, setSummary] = useState({ total_income: 0, total_expenses: 0, net_profit: 0 });

  useEffect(() => {
    fetchExpensesList();
    fetchFinancialSummary();
  }, [filterCategory]);

  const fetchFinancialSummary = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/accounting/fetch-financial-summary`); // 🎯 Fixed endpoint
      const data = await res.json();
      if (data.success) {
        setSummary({
          total_income: data.total_income,
          total_expenses: data.total_expenses,
          net_profit: data.net_profit
        });
      }
    } catch (err) {
      console.error("Failed to sync financial counters safely.");
    }
  };

  const fetchExpensesList = async () => {
    try {
      const res = await fetch(`https://erp-api.aapschool.in/api/accounting/fetch-expenses-list?category=${filterCategory}`); // 🎯 Fixed endpoint
      const data = await res.json();
      if (data.success && Array.isArray(data.expenses)) {
        setExpenses(data.expenses);
      }
    } catch (err) {
      console.error("Failed fetching ledger streams.");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!title || !amount) {
      alert("⚠️ Kripya Title aur Amount zaroor bharein!");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('https://erp-api.aapschool.in/api/accounting/save-new-expense', { // 🎯 Fixed endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, amount: parseFloat(amount), date, payment_mode: paymentMode, vendor_name: vendorName, remarks })
      });
      const data = await res.json();
      if (data.success) {
        setUiMessage('🎉 Kharcha successfully record ho gaya hai!');
        // Form Reset
        setTitle('');
        setAmount('');
        setVendorName('');
        setRemarks('');
        // Reload Live Data Grid
        fetchExpensesList();
        fetchFinancialSummary();
        setTimeout(() => setUiMessage(''), 3000);
      }
    } catch (err) {
      alert("Network routing channel failed.");
    } finally {
      setLoading(false);
    }
  };

  // 🎯 ACCOUNTS LEDGER EXCEL GENERATOR WITH DUAL-LANGUAGE HEADERS
  const downloadExpenseExcelReport = () => {
    if (expenses.length === 0) {
      alert("⚠️ Excel nikalne ke liye ledger grid me records ka hona zaroori hai!");
      return;
    }

    const excelRows = [];
    excelRows.push(["🏫 SCHOOL CASHFLOW & EXPENSE LEDGER RECORD"]);
    excelRows.push([`📊 Filter Category Scope: ${filterCategory}`]);
    excelRows.push([]); // Space buffer

    // Bilingual Column Formats
    excelRows.push([
      "S.No. (क्रम)",
      "Expense Title (विवरण)",
      "Category (श्रेणी)",
      "Amount (राशि)",
      "Date (दिनांक)",
      "Payment Mode (भुगतान का प्रकार)",
      "Vendor/Paid To (विक्रेता का नाम)",
      "Remarks (टिप्पणी)"
    ]);

    let calculatedTotal = 0;

    expenses.forEach((exp, index) => {
      const amt = parseFloat(exp.amount) || 0;
      calculatedTotal += amt;

      excelRows.push([
        index + 1,
        exp.title,
        exp.category,
        amt,
        exp.date,
        exp.payment_mode,
        exp.vendor_name || 'N/A',
        exp.remarks || ''
      ]);
    });

    excelRows.push([]); // Spacer row
    excelRows.push([
      "KUL KHARCHA YOG (कुल व्यय)", "", "", calculatedTotal, "", "", "", ""
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet(excelRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses Roster");
    XLSX.writeFile(workbook, `School_Expense_Report_${filterCategory}.xlsx`);
  };

  const cardStyle = { backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
  const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' };
  const inpStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', boxSizing: 'border-box', marginTop: '4px', fontSize: '14px', fontWeight: '600', backgroundColor: '#fff', outline: 'none' };
  const submitBtnStyle = { width: '100%', padding: '11px', backgroundColor: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', marginTop: '10px' };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', boxSizing: 'border-box' }}>
      
      {/* 📊 TOP LIVE ACCOUNTING DASHBOARD COUNTERS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.9 }}>Total Collected Income (कुल आय)</div>
          <div style={{ fontSize: '28px', fontUnderline: 'none', fontWeight: '900', marginTop: '8px' }}>₹{summary.total_income}</div>
        </div>
        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.9 }}>Total Expenses (कुल खर्च)</div>
          <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '8px' }}>₹{summary.total_expenses}</div>
        </div>
        <div style={{ ...cardStyle, background: summary.net_profit >= 0 ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.9 }}>Net Operational Balance (शुद्ध लाभ)</div>
          <div style={{ fontSize: '28px', fontWeight: '900', marginTop: '8px' }}>₹{summary.net_profit}</div>
        </div>
      </div>

      {uiMessage && <div style={{ padding: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px dashed #10b981', borderRadius: '8px', marginBottom: '16px', fontWeight: 'bold' }}>{uiMessage}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: ADD LOG ENTRY FORM */}
        <div style={cardStyle}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: 'bold', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b' }}><PlusCircle size={18} color="#4f46e5"/> Log New School Expense</h3>
          <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Expense Title (खर्च का विवरण)</label>
              <input type="text" placeholder="e.g., Generator Diesel Refil" value={title} onChange={(e) => setTitle(e.target.value)} style={inpStyle} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} style={inpStyle}>
                  {['Maintenance', 'Fuel/Transport', 'Stationary', 'Electricity Bill', 'Staff Salary Out', 'Event/Function', 'Other Expense'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Amount (₹)</label>
                <input type="number" placeholder="4500" value={amount} onChange={(e) => setAmount(e.target.value)} style={inpStyle} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inpStyle} required />
              </div>
              <div>
                <label style={labelStyle}>Payment Mode</label>
                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} style={inpStyle}>
                  <option value="Cash">Cash (नकद)</option>
                  <option value="UPI">UPI / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Vendor / Paid To Name (वेंडर का नाम)</label>
              <input type="text" placeholder="e.g., Balaji Petroleum Tikamgarh" value={vendorName} onChange={(e) => setVendorName(e.target.value)} style={inpStyle} />
            </div>
            <div>
              <label style={labelStyle}>Remarks (टिप्पणी)</label>
              <input type="text" placeholder="Optional notes" value={remarks} onChange={(e) => setRemarks(e.target.value)} style={inpStyle} />
            </div>
            <button type="submit" disabled={loading} style={{ ...submitBtnStyle, backgroundColor: '#4f46e5' }}>
              {loading ? "⏳ Recording Entry..." : "Record Expense Entry ⚡"}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: REVENUE LEDGER GRID LIST */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', color: '#1e293b' }}><Tag size={18} color="#059669"/> Expense Ledger Stream</h3>
            <button onClick={downloadExpenseExcelReport} style={{ padding: '8px 14px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileSpreadsheet size={14}/> 📥 Download Expense Excel
            </button>
          </div>

          <div style={{ marginBottom: '16px', maxWidth: '200px' }}>
            <label style={labelStyle}>Filter Category</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={inpStyle}>
              <option value="All">All Categories</option>
              {['Maintenance', 'Fuel/Transport', 'Stationary', 'Electricity Bill', 'Staff Salary Out', 'Event/Function', 'Other Expense'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 'bold' }}>
                  <th style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                  <th style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0' }}>Description</th>
                  <th style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0' }}>Category</th>
                  <th style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0' }}>Vendor</th>
                  <th style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0' }}>Mode</th>
                  <th style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontWeight: '600' }}>No expense records registered under this category scope.</td></tr>
                ) : (
                  expenses.map(exp => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 10px', fontFamily: 'monospace' }}>{exp.date}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 'bold', color: '#0f172a' }}>{exp.title}</td>
                      <td style={{ padding: '12px 10px' }}><span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#f1f5f9', borderRadius: '4px', fontWeight: '600' }}>{exp.category}</span></td>
                      <td style={{ padding: '12px 10px', color: '#475569' }}>{exp.vendor_name || '-'}</td>
                      <td style={{ padding: '12px 10px', fontSize: '12px', fontWeight: 'bold' }}>{exp.payment_mode}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'right', color: '#ef4444', fontWeight: 'bold', fontSize: '14px' }}>- ₹{exp.amount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>

    </div>
  );
};

export default ExpenseTracker;