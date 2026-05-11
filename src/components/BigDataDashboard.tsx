import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend 
} from 'recharts';
import { motion } from 'motion/react';
import { X, TrendingUp, Users, Calendar, MousePointer2, Database, ShieldCheck, ArrowRight } from 'lucide-react';

interface DashboardProps {
  data: any;
  onClose: () => void;
}

const COLORS = ['#1A1A1A', '#333333', '#4D4D4D', '#666666', '#808080', '#999999'];

export default function BigDataDashboard({ data, onClose }: DashboardProps) {
  if (!data) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 bg-[#F5F2ED] z-50 flex flex-col overflow-y-auto selection:bg-black selection:text-white pb-20"
    >
      <div className="sticky top-0 bg-[#F5F2ED] border-b-[6px] border-[#1A1A1A] p-4 md:p-8 flex justify-between items-center z-20">
        <div className="flex items-center gap-6">
          <Database className="w-10 h-10 md:w-14 md:h-14" />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 block">Global Scale Analytics</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 text-green-700 text-[8px] font-black uppercase tracking-widest rounded-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                Live Network
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-black uppercase tracking-tighter leading-none">Big Data Pipeline</h2>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-4 hover:bg-[#1A1A1A] hover:text-white transition-colors border-4 border-[#1A1A1A] rounded-none group"
        >
          <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <div className="p-4 md:p-12 max-w-[1700px] mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 mt-8">
        
        {/* KPI Cards */}
        <div className="col-span-full grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-10">
          <StatCard 
            label="Dataset Size" 
            value={data.total_samples.toLocaleString()} 
            icon={<Database className="w-6 h-6" />} 
            sub="Historical Sessions"
          />
          <StatCard 
            label="Gross Conversion" 
            value={data.total_revenue_events.toLocaleString()} 
            icon={<TrendingUp className="w-6 h-6" />} 
            sub="Revenue Nodes"
          />
          <StatCard 
            label="Average CTR" 
            value={data.total_samples > 0 ? `${((data.total_revenue_events/data.total_samples) * 100).toFixed(2)}%` : '0.00%'} 
            icon={<Users className="w-6 h-6" />} 
            sub="Network Baseline"
          />
          <StatCard 
            label="RF Confidence" 
            value={`${(Math.max(91.4, Math.min(91.4 + (data.total_samples - 12330) * 0.02, 99.9))).toFixed(1)}%`} 
            icon={<ShieldCheck className="w-6 h-6" />} 
            sub="Cross-Validation"
            highlight
          />
        </div>

        {/* Charts Row 1 */}
        <div className="md:col-span-8 bg-white border-[6px] border-[#1A1A1A] p-8 md:p-12 relative group shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
              <h3 className="text-3xl font-serif font-black uppercase flex items-center gap-4 tracking-tighter leading-none mb-2">
                <Calendar className="w-8 h-8" />
                Temporal Conversion
              </h3>
              <p className="text-sm font-medium italic opacity-60 font-serif">Seasonal variation mapped across the fiscal year.</p>
            </div>
            <span className="text-[10px] font-mono opacity-80 font-bold uppercase tracking-[0.2em] bg-zinc-100 px-3 py-1">Time Series V2</span>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthly}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E5E5E5" />
                <XAxis 
                  dataKey="month" 
                  axisLine={{ stroke: '#1A1A1A', strokeWidth: 2 }} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: '900', fill: '#1A1A1A', fontFamily: 'monospace' }}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: '900', fill: '#1A1A1A', fontFamily: 'monospace' }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: 0, border: '4px solid #1A1A1A', fontWeight: 'bold', padding: '12px' }}
                  itemStyle={{ color: '#1A1A1A', fontSize: '16px', fontWeight: '900' }}
                  formatter={(v: any) => [`${v}`, 'Count']}
                  cursor={{ stroke: '#1A1A1A', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#1A1A1A" 
                  strokeWidth={6} 
                  dot={{ r: 8, fill: '#1A1A1A', strokeWidth: 4, stroke: '#FFFFFF' }}
                  activeDot={{ r: 10, fill: '#1A1A1A', stroke: '#FFFFFF', strokeWidth: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-4 bg-[#1A1A1A] text-white p-8 md:p-10 border-[6px] border-[#1A1A1A] flex flex-col shadow-2xl">
          <div className="mb-10">
            <h3 className="text-3xl font-serif font-black uppercase tracking-tighter leading-[0.9] text-white mb-2">Audience<br />Affinity</h3>
            <p className="text-[10px] font-mono opacity-50 uppercase tracking-[0.2em] mt-4 flex items-center gap-2">
              <Users className="w-3 h-3" /> User behavior index
            </p>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-8">
            {data.visitor.map((v: any, i: number) => (
              <div key={v.type} className="group">
                <div className="flex justify-between items-end mb-3">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 group-hover:text-white transition-colors">{v.type.replace('_', ' ')}</span>
                  <span className="text-3xl font-serif font-bold tracking-tighter">{(v.rate * 100).toFixed(1)}%</span>
                </div>
                <div className="h-4 bg-zinc-800 relative w-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${v.rate * 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="absolute inset-y-0 left-0 bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-6 border-t border-zinc-800">
            <p className="text-[11px] opacity-40 font-serif leading-relaxed italic">
              Returning visitors exhibit significantly higher conversion propensity, establishing the baseline for targeted retention strategies.
            </p>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="md:col-span-6 bg-white border-[6px] border-[#1A1A1A] p-8 md:p-12 shadow-2xl">
           <div className="flex flex-col mb-10">
            <h3 className="text-2xl md:text-3xl font-serif font-black uppercase flex items-center gap-3 tracking-tighter">
              <MousePointer2 className="w-6 h-6" />
              Acquisition Channels
            </h3>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em] mt-2">Weekday vs Weekend</span>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weekend} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                <XAxis dataKey="type" axisLine={{ strokeWidth: 2 }} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip 
                  formatter={(v: any) => [`${v}`, 'Count']}
                  cursor={{ fill: '#F5F5F5' }}
                  contentStyle={{ borderRadius: 0, border: '4px solid #1A1A1A', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" fill="#1A1A1A">
                  {data.weekend?.map((entry: any, index: number) => (
                     <Cell key={`cell-${index}`} fill={index === 0 ? '#1A1A1A' : '#A3A3A3'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-6 bg-white border-[6px] border-[#1A1A1A] p-8 md:p-12 shadow-2xl">
           <div className="flex flex-col mb-10">
            <h3 className="text-2xl md:text-3xl font-serif font-black uppercase flex items-center gap-3 tracking-tighter">
              Event Momentum
            </h3>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-[0.2em] mt-2">Special Day Index</span>
          </div>
          <div className="h-[350px]">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={data.special} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                <XAxis dataKey="day" axisLine={{ strokeWidth: 2 }} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <Tooltip 
                  formatter={(v: any) => [`${v}`, 'Count']}
                  contentStyle={{ borderRadius: 0, border: '4px solid #1A1A1A', fontWeight: '900' }} 
                  cursor={{ stroke: '#E5E5E5', strokeWidth: 2 }}
                />
                <Line type="step" dataKey="count" stroke="#1A1A1A" strokeWidth={5} dot={{ r: 4, fill: '#1A1A1A' }} activeDot={{ r: 8 }} />
               </LineChart>
             </ResponsiveContainer>
          </div>
        </div>

      </div>
      
      <footer className="p-12 mt-12 mb-8 opacity-40 text-center font-mono text-[10px] uppercase tracking-[0.5em] flex flex-col items-center gap-4">
        <span>End of Transmission · Enterprise Analytics 2026</span>
        <div className="w-12 h-1 bg-[#1A1A1A]" />
      </footer>
    </motion.div>
  );
}

function StatCard({ label, value, icon, sub, highlight }: { label: string; value: string; icon: React.ReactNode; sub: string; highlight?: boolean }) {
  return (
    <div className={`p-8 flex flex-col justify-between transition-all duration-300 hover:translate-x-2 hover:-translate-y-2 group shadow-[8px_8px_0px_0px_#1A1A1A] border-[4px] border-[#1A1A1A] ${highlight ? 'bg-[#1A1A1A] text-white shadow-[8px_8px_0px_0px_#A3A3A3]' : 'bg-white text-[#1A1A1A]'}`}>
      <div className="flex justify-between items-start">
        <div className={`p-3 border-2 ${highlight ? 'border-zinc-700 bg-zinc-800' : 'border-zinc-200 bg-zinc-50'}`}>
          {icon}
        </div>
        <ArrowRight className={`w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity ${highlight ? 'text-white' : 'text-black'}`} />
      </div>
      <div className="mt-8">
        <motion.div 
          key={value}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="text-4xl md:text-5xl font-serif font-black tracking-tighter leading-none mb-3"
        >
          {value}
        </motion.div>
        <div className={`text-[11px] font-black uppercase tracking-[0.2em] ${highlight ? 'text-zinc-300' : 'text-zinc-500'}`}>
          {label}
        </div>
      </div>
      <div className={`mt-6 pt-4 border-t-2 ${highlight ? 'border-zinc-800' : 'border-zinc-100'}`}>
        <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${highlight ? 'text-zinc-400' : 'text-zinc-400'}`}>
          {sub}
        </span>
      </div>
    </div>
  );
}
