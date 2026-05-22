'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Papa from 'papaparse';
import { 
  ShieldCheck, ShieldAlert, Activity, UploadCloud, PieChart, 
  BarChart4, BrainCircuit, FileDown, LayoutDashboard, Search, 
  Bell, ChevronRight, CheckCircle2, AlertTriangle, Settings, LogOut,
  MapPin, CreditCard, Clock, FileText, Loader2, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart as RePieChart, Pie, Cell, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { Transaction, generateSampleData, analyzeTransactions } from '@/lib/fraud-model';

// Use Next.js dynamic routing or just simple state for tabs
type Tab = 'dashboard' | 'upload' | 'analytics' | 'insights' | 'reports';

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#8b5cf6', '#f59e0b'];

export default function FraudShieldApp() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Gemini Insights State
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize with sample data for demonstration
  useEffect(() => {
    const rawData = generateSampleData();
    const analyzed = analyzeTransactions(rawData);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTransactions(analyzed);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAnalyzed(true);
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Map CSV to our structure, handling potential missing fields
        const parsedData: Transaction[] = results.data.map((row: any, i) => ({
          id: row.id || row.Id || row.ID || `UP-${i}`,
          date: row.date || row.Date || new Date().toISOString(),
          amount: parseFloat(row.amount || row.Amount || '0'),
          merchant: row.merchant || row.Merchant || 'Unknown',
          category: row.category || row.Category || 'Other',
          location: row.location || row.Location || 'Unknown',
        }));
        
        // "Run ML Model"
        setTimeout(() => {
          const analyzed = analyzeTransactions(parsedData);
          setTransactions(analyzed);
          setIsAnalyzed(true);
          setIsUploading(false);
          setActiveTab('dashboard');
        }, 1500);
      },
      error: (err) => {
        console.error('Parse error:', err);
        setIsUploading(false);
      }
    });
  };

  const generateInsights = async () => {
    if (transactions.length === 0) return;
    setIsGeneratingAi(true);

    const highRisk = transactions.filter(t => (t.riskScore || 0) > 65);
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const fraudAmount = highRisk.reduce((sum, t) => sum + t.amount, 0);

    const prompt = `
      Act as a senior Data Scientist and Fraud Analyst. 
      Analyze the following summary of a recent batch of financial transactions and provide an executive "Fraud Summary & Intelligence Report".
      
      Data Summary:
      - Total Transactions: ${transactions.length}
      - Total Volume: $${totalAmount.toFixed(2)}
      - Flagged as Fraud: ${highRisk.length} transactions
      - Fraud Volume: $${fraudAmount.toFixed(2)}
      - Fraud Rate: ${((highRisk.length / transactions.length) * 100).toFixed(2)}%
      
      Top flagged categories: ${Array.from(new Set(highRisk.map(t => t.category))).join(', ')}
      Top flagged locations: ${Array.from(new Set(highRisk.map(t => t.location))).join(', ')}

      Requirements:
      1. Provide a professional, concise executive summary.
      2. Highlight the main threats / abnormal patterns observed.
      3. Recommend concrete fraud prevention strategies.
      4. Format your response cleanly using markdown (bolding, lists). DO NOT use top level headers, start directly with the content.
    `;

    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setAiInsight(data.text);
    } catch (e) {
      setAiInsight('Failed to generate insights. Check API configuration.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const loadSampleData = () => {
    setIsUploading(true);
    setTimeout(() => {
      const rawData = generateSampleData();
      const analyzed = analyzeTransactions(rawData);
      setTransactions(analyzed);
      setIsAnalyzed(true);
      setIsUploading(false);
      setAiInsight('');
    }, 800);
  };

  // --- Derived Metrics ---
  const stats = useMemo(() => {
    if (!transactions.length) return { totalTx: 0, fraudTx: 0, totalVol: 0, fraudVol: 0, safeVol: 0 };
    const fraud = transactions.filter(t => t.prediction === 'Fraud');
    const safe = transactions.filter(t => t.prediction === 'Legitimate');
    return {
      totalTx: transactions.length,
      fraudTx: fraud.length,
      totalVol: transactions.reduce((acc, t) => acc + t.amount, 0),
      fraudVol: fraud.reduce((acc, t) => acc + t.amount, 0),
      safeVol: safe.reduce((acc, t) => acc + t.amount, 0),
    };
  }, [transactions]);

  if (!isAuthenticated) {
    return <LoginView onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-md shadow-indigo-200">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-slate-900">FraudShield AI</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">Main Navigation</div>
          <nav className="space-y-1">
            <NavItem icon={<LayoutDashboard />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <NavItem icon={<UploadCloud />} label="Upload Dataset" active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} />
            <NavItem icon={<PieChart />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
            <NavItem icon={<BrainCircuit />} label="AI Insights" active={activeTab === 'insights'} onClick={() => { setActiveTab('insights'); if (!aiInsight && !isGeneratingAi) generateInsights(); }} />
          </nav>
          
          <div className="mt-8 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">System</div>
          <nav className="space-y-1">
            <NavItem icon={<Settings />} label="Settings" active={false} onClick={() => {}} />
            <NavItem icon={<LogOut />} label="Logout" active={false} onClick={() => setIsAuthenticated(false)} />
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="flex items-center space-x-3 mb-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-600">Model Status: Active</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Ensemble: RF + LogReg v2.4</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#fafafa]">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0 shadow-sm">
          <div className="w-96 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search transactions, users, or alerts..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 rounded-lg text-sm transition-all outline-none"
            />
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
              <Bell className="h-5 w-5" />
              {stats.fraudTx > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
              )}
            </button>
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-md">
              AD
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-8 scene-container">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <DashboardView key="dashboard" stats={stats} transactions={transactions} />
            )}
            {activeTab === 'upload' && (
              <UploadView 
                key="upload" 
                isUploading={isUploading} 
                onUpload={handleFileUpload} 
                onLoadSample={loadSampleData} 
              />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsView key="analytics" transactions={transactions} />
            )}
            {activeTab === 'insights' && (
              <InsightsView 
                key="insights" 
                insight={aiInsight} 
                isGenerating={isGeneratingAi} 
                onGenerate={generateInsights} 
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// --- VIEWS ---

function LoginView({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin();
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 bg-indigo-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/3 right-1/4 h-96 w-96 bg-purple-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/3 h-96 w-96 bg-emerald-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-2xl p-10 z-10">
        <div className="flex items-center justify-center mb-8">
          <div className="h-12 w-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-200">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-display font-bold text-center text-slate-900 mb-2 tracking-tight">Welcome Back</h1>
        <p className="text-sm text-center text-slate-500 mb-8">Sign in to FraudShield AI Admin Panel</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm"
              placeholder="admin@fraudshield.ai"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all text-sm"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl transition-all shadow-md shadow-purple-200 hover:shadow-lg hover:shadow-purple-300 flex justify-center items-center text-sm"
          >
            Sign In <ChevronRight className="h-4 w-4 ml-2" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function DashboardView({ stats, transactions }: { stats: any, transactions: Transaction[] }) {
  const highRisk = transactions.filter(t => t.prediction === 'Fraud').slice(0, 5);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time fraud monitoring and threat detection.</p>
        </div>
        <button className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm shadow-indigo-200">
          <FileDown className="h-4 w-4 mr-2" /> Download PDF Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard title="Total Volume" value={`$${stats.totalVol.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<Activity />} />
        <KpiCard title="Transactions Scanned" value={stats.totalTx.toLocaleString()} icon={<CheckCircle2 />} color="emerald" />
        <KpiCard title="Fraud Attempts Flagged" value={stats.fraudTx.toLocaleString()} icon={<ShieldAlert />} color="red" />
        <KpiCard title="Value at Risk (Blocked)" value={`$${stats.fraudVol.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<AlertTriangle />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-6 flex items-center">
            <BarChart4 className="h-5 w-5 mr-2 text-indigo-500" /> Transaction Volume (30 Days)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getDailyData(transactions)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `$${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                />
                <Area type="monotone" dataKey="safe" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSafe)" name="Legitimate" />
                <Area type="monotone" dataKey="fraud" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorFraud)" name="Fraudulent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High Risk List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
             <h3 className="font-semibold text-slate-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-rose-500" /> High-Risk Alerts
            </h3>
            <span className="text-xs font-semibold bg-rose-100 text-rose-700 px-2 py-1 rounded-md">{highRisk.length} Action Req.</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {highRisk.length > 0 ? highRisk.map((tx) => (
              <div key={tx.id} className="flex border border-rose-100 bg-rose-50/50 p-4 rounded-xl items-start relative overflow-hidden group hover:border-rose-300 transition-colors">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-400 to-rose-600" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs text-slate-500">{tx.id}</span>
                    <span className="font-bold text-rose-600">${tx.amount.toFixed(2)}</span>
                  </div>
                  <div className="text-sm font-medium text-slate-900 mt-1">{tx.merchant}</div>
                  <div className="flex items-center text-xs text-slate-500 mt-2 space-x-3">
                    <span className="flex items-center"><MapPin className="h-3 w-3 mr-1" /> {tx.location}</span>
                    <span className="flex items-center"><Clock className="h-3 w-3 mr-1" /> {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <ShieldCheck className="h-12 w-12 text-emerald-200 mb-2" />
                <p className="text-sm">No critical alerts detected.</p>
              </div>
            )}
          </div>
          {highRisk.length > 0 && (
             <button className="w-full mt-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors">View All {highRisk.length} Alerts</button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function UploadView({ isUploading, onUpload, onLoadSample }: { isUploading: boolean, onUpload: any, onLoadSample: any }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-3xl mx-auto mt-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-display font-bold text-slate-900">Upload Transaction Data</h1>
        <p className="text-slate-500 mt-2">Initialize the ML risk assessment pipeline with your CSV datasets.</p>
      </div>

      <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
        
        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-600">
            <Loader2 className="h-12 w-12 animate-spin mb-6" />
            <div className="text-lg font-medium animate-pulse">Running ML Ensembles...</div>
            <div className="text-sm text-slate-500 mt-2">Analyzing behavior patterns and geographic anomalies</div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 group-hover:bg-slate-100 group-hover:border-indigo-400 transition-all cursor-pointer relative">
            <input 
              type="file" 
              accept=".csv" 
              onChange={onUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100 group-hover:scale-110 transition-transform">
              <UploadCloud className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Drop your CSV file here</h3>
            <p className="text-sm text-slate-500 mt-1">or click to browse from your computer</p>
            <div className="mt-8 flex items-center space-x-2 text-xs text-slate-400 font-mono">
              <FileDown className="h-4 w-4" />
              <span>Required columns: id, date, amount, merchant, category, location</span>
            </div>
          </div>
        )}
      </div>

      {!isUploading &&(
        <div className="mt-8 text-center text-sm text-slate-500 flex items-center justify-center">
          <span className="w-12 h-px bg-slate-300 mr-4" /> Don&apos;t have a file? <span className="w-12 h-px bg-slate-300 ml-4" />
        </div>
      )}

      {!isUploading && (
        <div className="mt-8 text-center">
           <button 
             onClick={onLoadSample}
             className="px-6 py-3 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md text-slate-700 font-medium rounded-xl transition-all shadow-sm"
            >
             Load Sample Synthetic Data
           </button>
        </div>
      )}
    </motion.div>
  );
}

function AnalyticsView({ transactions }: { transactions: Transaction[] }) {
  // Aggregate data for Pie Chart
  const categoryData = useMemo(() => {
    const acc: Record<string, number> = {};
    transactions.forEach(t => {
      acc[t.category] = (acc[t.category] || 0) + 1;
    });
    return Object.entries(acc).map(([key, value]) => ({ name: key, value }));
  }, [transactions]);

  // Scatter plot data (Risk vs Amount)
  const scatterData = useMemo(() => {
    return transactions.map(t => ({
      x: t.amount,
      y: t.riskScore,
      z: 5, // size
      isFraud: t.prediction === 'Fraud'
    }));
  }, [transactions]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Deep Analytics & Behaviors</h1>
        <p className="text-slate-500 text-sm mt-1">Exploratory data analysis of transaction streams.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-6 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-indigo-500" /> Transaction Categories
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scatter Plot: Amount vs Risk */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-6 flex items-center">
            <Search className="h-5 w-5 mr-2 text-indigo-500" /> Risk Score vs. Amount
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" dataKey="x" name="Amount" tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="y" name="Risk Score" domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <ZAxis type="number" dataKey="z" range={[20, 100]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                />
                <Scatter name="Legitimate" data={scatterData.filter(d => !d.isFraud)} fill="#10b981" fillOpacity={0.6} />
                <Scatter name="Fraudulent" data={scatterData.filter(d => d.isFraud)} fill="#f43f5e" fillOpacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </motion.div>
  );
}

function InsightsView({ insight, isGenerating, onGenerate }: { insight: string, isGenerating: boolean, onGenerate: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 tracking-tight flex items-center">
            <BrainCircuit className="h-6 w-6 mr-3 text-indigo-600" /> AI Investigation Summary
          </h1>
          <p className="text-slate-500 text-sm mt-1">Generative AI analysis of transaction anomalies and risk patterns.</p>
        </div>
        <button 
          onClick={onGenerate}
          disabled={isGenerating}
          className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldAlert className="h-4 w-4 mr-2" />}
          {insight ? 'Regenerate Report' : 'Generate Assessment'}
        </button>
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 overflow-y-auto w-full relative">
        <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-indigo-500 via-purple-500 to-indigo-500 rounded-l-3xl" />
        
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
            <div className="relative">
              <BrainCircuit className="h-12 w-12 text-indigo-200 animate-pulse" />
              <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full" />
            </div>
            <p>Gemini is synthesizing behavioral patterns...</p>
          </div>
        ) : insight ? (
           <div className="prose prose-slate prose-headings:font-display prose-headings:tracking-tight max-w-none prose-a:text-indigo-600">
             {/* Simple Custom Markdown Render for the provided text. In a full app use react-markdown */}
             {insight.split('\n').map((line, i) => {
               if (line.trim() === '') return <br key={i} />;
               if (line.trim().startsWith('-')) return <li key={i} className="ml-4">{line.replace('-', '').trim()}</li>;
               if (line.trim().startsWith('**')) return <h3 key={i} className="text-lg font-bold text-slate-800 mt-4">{line.replace(/\*\*/g, '')}</h3>;
               return <p key={i} className="text-slate-600 leading-relaxed mb-2">{line.replace(/\*\*/g, '')}</p>;
             })}
           </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
             <FileText className="h-12 w-12 mb-4 opacity-50" />
             <p>No report generated. Click &quot;Generate Assessment&quot; above.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}


// --- UTILS & SMALL COMPONENTS ---

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all ${
        active 
          ? 'bg-indigo-50 text-indigo-700 font-medium' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className={`mr-3 [&>svg]:w-5 [&>svg]:h-5 ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function KpiCard({ title, value, icon, color = 'indigo' }: { title: string, value: string | number, icon: React.ReactNode, color?: 'indigo' | 'emerald' | 'red' | 'amber' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-slate-500 text-sm">{title}</h3>
        <div className={`p-2 rounded-lg [&>svg]:w-4 [&>svg]:h-4 ${colors[color]}`}>
          {icon}
        </div>
      </div>
      <div className="text-3xl font-display font-bold text-slate-900 tracking-tight">{value}</div>
    </div>
  );
}

function getDailyData(transactions: Transaction[]) {
  const map: Record<string, { safe: number, fraud: number }> = {};
  
  // Create last 30 days empty
  const now = new Date();
  for(let i=30; i>=0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    map[d] = { safe: 0, fraud: 0 };
  }

  transactions.forEach(t => {
    const d = t.date.split('T')[0];
    if(map[d]) {
      if(t.prediction === 'Fraud') map[d].fraud += t.amount;
      else map[d].safe += t.amount;
    }
  });

  return Object.entries(map).map(([date, vals]) => ({
    date: date.substring(5), // MM-DD
    safe: vals.safe,
    fraud: vals.fraud
  }));
}
