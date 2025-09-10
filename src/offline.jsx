import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { v4 as uuidv4 } from "uuid";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Plus, Trash2, Wallet, TrendingDown, TrendingUp, PieChart as PieChartIcon } from "lucide-react";

// --- Types ---
/** @typedef {{ id: string; type: 'income'|'expense'; amount: number; category: string; note?: string; date: string }} Txn */

const STORAGE_KEY = "offline_budget_tracker_v1";

function currency(n) {
  if (Number.isNaN(n) || n == null) return "₹0";
  return n.toLocaleString(undefined, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}

function todayISO() {
  const d = new Date();
  const tzOffset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - tzOffset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export default function Offline() {
  const [transactions, setTransactions] = useState(/** @type {Txn[]} */([]));
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setTransactions(parsed);
      }
    } catch (e) {
      console.warn("Failed to load data", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.warn("Failed to save data", e);
    }
  }, [transactions]);

  const addTxn = () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return alert("Enter a positive amount");
    const cat = category.trim() || (type === "income" ? "General" : "Misc");
    const newTxn = { id: uuidv4(), type, amount: amt, category: cat, note: note.trim(), date };
    setTransactions((t) => [newTxn, ...t]);
    setAmount("");
    setCategory("");
    setNote("");
    setDate(todayISO());
  };

  const deleteTxn = (id) => setTransactions((txns) => txns.filter((t) => t.id !== id));
  const clearAll = () => {
    if (confirm("Clear all transactions? This cannot be undone.")) {
      setTransactions([]);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesType = filterType === "all" || t.type === filterType;
      const s = search.trim().toLowerCase();
      const matchesSearch = !s || [t.category, t.note, t.amount + "", t.date].some((x) => (x || "").toLowerCase().includes(s));
      return matchesType && matchesSearch;
    });
  }, [transactions, search, filterType]);

  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((a, b) => a + b.amount, 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((a, b) => a + b.amount, 0);
    const balance = income - expense;
    return { income, expense, balance };
  }, [transactions]);

  const lineData = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    let running = 0;
    return sorted.map((t) => {
      running += t.type === "income" ? t.amount : -t.amount;
      return { date: t.date, balance: running };
    });
  }, [transactions]);

  const barData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const map = new Map();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const d = new Date(t.date);
      if (d < cutoff) continue;
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    }
    return Array.from(map.entries()).map(([category, amount]) => ({ category, amount }));
  }, [transactions]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"> 
            <Wallet className="h-8 w-8 text-black" />
            <h1 className="text-2xl md:text-3xl font-semibold text-black">Budget Tracker</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={clearAll} className="px-4 py-2 bg-rose-500 text-white rounded-2xl flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Clear All
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-2xl shadow">
            <p className="text-xl font-bold text-black">Income</p>
            <div className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-black" /> 
              <div className={`text-2xl font-bold text-black ${totals.balance >= 0 ? "text-black-600" : "text-rose-600"}`}>
              {currency(totals.income)}
            </div>
    
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl shadow">
            <p className="text-xl font-bold text-black">Expenses</p>
            <div className="text-2xl font-bold flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" /> 
              <div className={`text-2xl font-bold text-black ${totals.balance >= 0 ? "text-red-400" : "text-rose-600"}`}>
              {currency(totals.expense)}
            </div>
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl shadow">
            <p className="text-xl font-bold text-black">Balance</p>
            <div className={`text-2xl font-bold text-black ${totals.balance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {currency(totals.balance)}
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow">
          <h2 className="text-black text-lg font-semibold mb-3">Add Income / Expense</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select value={type} onChange={(e) => setType(e.target.value)} className="border rounded-2xl px-3 py-2">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              
            </select>
            <input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="border rounded-2xl px-3 py-2" />
            <input placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} className="border rounded-2xl px-3 py-2" />
            <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} className="border rounded-2xl px-3 py-2" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-2xl px-3 py-2" />
            <div className="md:col-span-5">
              <button onClick={addTxn} className="px-4 py-2 bg-blue-500 text-white rounded-2xl flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="border rounded-2xl px-3 py-2" />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border rounded-2xl px-3 py-2">
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 bg-white rounded-2xl shadow">
            <h2 className="text-lg text-black font-semibold mb-3 flex items-center gap-2"><PieChartIcon className="h-5 w-5" /> Balance Over Time</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => currency(Number(v))} />
                  <Legend />
                  <Line type="monotone" dataKey="balance" stroke="#2563eb" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl shadow">
            <h2 className="text-lg text-black font-semibold mb-3">Expenses by Category (Last 30 days)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => currency(Number(v))} />
                  <Legend />
                  <Bar dataKey="amount" name="Amount" fill="#f43f5e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl shadow">
          <h2 className="text-lg text-black font-semibold mb-3">Transactions ({filtered.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-black">
              <thead>
                <tr className="text-left border-b text-black">
                  <th className="py-2">Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Note</th>
                  <th className="text-right pr-2 text-black ">Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {filtered.map((t) => (
                    <motion.tr key={t.id} layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} className="border-b">
                      <td className="py-2">{t.date}</td>
                      <td className={t.type === "income" ? "text-emerald-600" : "text-rose-600"}>{t.type}</td>
                      <td>{t.category}</td>
                      <td className="max-w-[24ch] truncate" title={t.note}>{t.note}</td>
                      <td className="text-right pr-2 font-medium">{t.type === "income" ? "+" : "-"}{currency(t.amount)}</td>
                      <td className="text-right">
                        <button onClick={() => deleteTxn(t.id)} className="text-rose-500 hover:text-rose-700">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center text-sm text-slate-500 py-8">No transactions yet. Add your first entry above.</div>
            )}
          </div>
        </div>

        <div className="text-xs text-slate-500 text-black text-center pt-4">
          Data is stored locally in your browser (offline). Clear cache/storage to reset.
        </div>
      </div>
    </div>
  );
}
