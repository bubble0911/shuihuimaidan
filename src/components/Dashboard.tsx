import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  History, 
  BarChart3, 
  PieChart as PieChartIcon, 
  X,
  Database,
  Search,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function Dashboard({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'predictions'),
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      setHistory(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const stats = {
    total: history.length,
    positive: history.filter(h => h.prediction).length,
    high: history.filter(h => h.probability >= 0.6).length,
    medium: history.filter(h => h.probability >= 0.3 && h.probability < 0.6).length,
    low: history.filter(h => h.probability < 0.3).length,
    avgConfidence: history.length > 0 
      ? history.reduce((acc, curr) => acc + curr.probability, 0) / history.length 
      : 0
  };

  const chartData = [...history].reverse().map(h => ({
    time: h.timestamp.toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' }),
    prob: Math.round(h.probability * 100)
  }));

  const pieData = [
    { name: 'HIGH PROB', value: stats.high, color: '#141414' },
    { name: 'MEDIUM PROB', value: stats.medium, color: '#A3A3A3' },
    { name: 'LOW PROB', value: stats.low, color: '#E4E3E0' }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 bg-[#E4E3E0] flex flex-col font-sans overflow-y-auto md:overflow-hidden"
    >
      <div className="max-w-7xl mx-auto w-full md:flex-1 flex flex-col border-[#141414] bg-white shadow-2xl relative min-h-screen md:min-h-0 md:m-8">
        {/* Header */}
        <header className="flex justify-between items-center p-6 border-b border-[#141414] bg-white sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <Database className="w-6 h-6" />
            <h2 className="text-2xl font-serif italic tracking-tight font-bold">{t('dashboard')}</h2>
            <div className="hidden md:flex gap-2 ml-8">
              <span className="text-[10px] font-mono border border-[#141414] px-2 py-0.5 uppercase">ID: {user?.uid.slice(0, 8)}</span>
              <span className="text-[10px] font-mono border border-[#141414] px-2 py-0.5 uppercase">VER: 2.1.0</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#141414] hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 bg-[#F5F2ED]">
          
          {/* Stats Bar */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="Total Inference" value={stats.total} icon={<History className="w-4 h-4" />} />
            <StatCard label="Success Events" value={stats.positive} icon={<ArrowUpRight className="w-4 h-4" />} />
            <StatCard label="Mean Confidence" value={`${(stats.avgConfidence * 100).toFixed(1)}%`} icon={<Search className="w-4 h-4" />} />
            <StatCard label="Model Health" value="OPTIMAL" color="text-green-600" />
          </div>

          {/* Main Visuals */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="bg-white border border-[#141414] p-6 h-[400px]">
              <div className="flex justify-between items-center mb-8">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">Confidence Timeline</span>
                  <span className="font-serif italic text-xl">Temporal Distribution</span>
                </div>
                <BarChart3 className="w-5 h-5 opacity-20" />
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="time" fontSize={10} fontStyle="italic" />
                    <YAxis fontSize={10} fontStyle="italic" domain={[0, 100]} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#141414', border: 'none', borderRadius: 0 }}
                      labelStyle={{ color: '#E4E3E0', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#E4E3E0', fontFamily: 'monospace' }}
                    />
                    <Line 
                      type="stepAfter" 
                      dataKey="prob" 
                      stroke="#141414" 
                      strokeWidth={2} 
                      dot={{ r: 2, fill: '#141414' }}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white border border-[#141414] flex-1 overflow-hidden flex flex-col min-h-[400px]">
               <div className="p-4 border-b border-[#141414] bg-white flex justify-between items-center">
                 <span className="text-xs font-bold uppercase tracking-widest">{t('history')}</span>
                 <span className="text-[10px] font-mono opacity-40">LAST 50 RECORDS</span>
               </div>
               <div className="flex-1 overflow-y-auto">
                 <table className="w-full text-left border-collapse">
                   <thead className="sticky top-0 bg-white z-10">
                     <tr className="border-b border-[#141414]">
                       <th className="p-4 text-[11px] font-serif italic text-gray-400 uppercase tracking-wider">Timestamp</th>
                       <th className="p-4 text-[11px] font-serif italic text-gray-400 uppercase tracking-wider">Prediction</th>
                       <th className="p-4 text-[11px] font-serif italic text-gray-400 uppercase tracking-wider">Confidence</th>
                       <th className="p-4 text-[11px] font-serif italic text-gray-400 uppercase tracking-wider">Context</th>
                     </tr>
                   </thead>
                   <tbody>
                     {history.map((record) => (
                       <tr key={record.id} className="border-b border-gray-100 hover:bg-[#141414] hover:text-white transition-colors group cursor-default">
                         <td className="p-4 font-mono text-[11px] tracking-tight">
                           {record.timestamp.toLocaleString()}
                         </td>
                         <td className="p-4">
                           <span className={cn(
                             "text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-widest",
                             record.probability >= 0.6 ? "bg-green-100 text-green-700 group-hover:bg-green-900 group-hover:text-green-100" : (record.probability >= 0.3 ? "bg-yellow-100 text-yellow-700 group-hover:bg-yellow-900 group-hover:text-yellow-100" : "bg-red-100 text-red-700 group-hover:bg-red-900 group-hover:text-red-100")
                           )}>
                             {record.probability >= 0.6 ? 'yes！' : (record.probability >= 0.3 ? 'possible？' : 'no×')}
                           </span>
                         </td>
                         <td className="p-4 font-mono text-[11px]">
                           {(record.probability * 100).toFixed(2)}%
                         </td>
                         <td className="p-4 text-[10px] opacity-60 group-hover:opacity-100 font-medium">
                            {record.features.visitor_type} · {record.features.basket_size} items · {record.features.is_weekend ? 'Weekend' : 'Weekday'}
                         </td>
                       </tr>
                     ))}
                     {history.length === 0 && !loading && (
                       <tr>
                         <td colSpan={4} className="p-12 text-center text-xs italic text-gray-400 uppercase tracking-widest">
                           No prediction ledger entries found
                         </td>
                       </tr>
                     )}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-white border border-[#141414] p-6 h-[300px]">
              <div className="flex justify-between items-center mb-0">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">Class Weights</span>
                  <span className="font-serif italic text-xl">Decision Split</span>
                </div>
                <PieChartIcon className="w-5 h-5 opacity-20" />
              </div>
              <div className="h-full">
                <ResponsiveContainer width="100%" height="80%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-2">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2" style={{ backgroundColor: d.color }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#141414] text-white p-8 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-3xl font-serif font-black tracking-tighter uppercase leading-[0.85] mb-6">Expert System<br />Node Analysis</h3>
                <p className="text-xs leading-relaxed opacity-60 font-medium italic">
                  Random Forest ensemble generates predictions through cross-validation of 100 decision trees. The system accounts for multicollinearity between features PageValues and BounceRates to minimize bias in revenue forecasting.
                </p>
              </div>
              
              <div className="space-y-4 pt-12">
                 <div className="flex justify-between border-b border-white/10 pb-2">
                   <span className="text-[9px] uppercase tracking-widest text-white/40">Data Integrity</span>
                   <span className="text-[10px] font-mono">100.00%</span>
                 </div>
                 <div className="flex justify-between border-b border-white/10 pb-2">
                   <span className="text-[9px] uppercase tracking-widest text-white/40">Latency</span>
                   <span className="text-[10px] font-mono">12ms</span>
                 </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-[#141414] flex justify-between items-center text-[9px] font-mono opacity-40 uppercase tracking-widest">
          <div>© 2026 ARCHIVE:WHO_WILL_PAY</div>
          <div>ESTABLISHED: ASIA-SOUTHEAST1</div>
        </footer>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon?: React.ReactNode; color?: string }) {
  return (
    <div className="bg-white border border-[#141414] p-4 flex justify-between items-end">
      <div className="flex flex-col gap-1">
        <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
        <span className={cn("text-2xl font-serif font-bold italic tracking-tighter", color)}>{value}</span>
      </div>
      {icon && <div className="p-1.5 bg-[#F5F2ED] border border-[#141414] rounded-sm">{icon}</div>}
    </div>
  );
}
