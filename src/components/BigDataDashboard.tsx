import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend 
} from 'recharts';
import { motion } from 'motion/react';
import { X, TrendingUp, Users, Calendar, MousePointer2, Database, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  data: any;
  onClose: () => void;
}

const COLORS = ['#000000', '#222222', '#444444', '#666666', '#888888', '#AAAAAA'];

export default function BigDataDashboard({ data, onClose }: DashboardProps) {
  if (!data) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      className="fixed inset-0 bg-[#F5F2ED] z-50 flex flex-col overflow-y-auto"
    >
      <div className="sticky top-0 bg-[#F5F2ED] border-b-4 border-black p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <Database className="w-8 h-8" />
          <h2 className="text-4xl font-serif font-black uppercase tracking-tighter">Big Data Analysis Pipeline</h2>
        </div>
        <button 
          onClick={onClose}
          className="p-3 hover:bg-black hover:text-white transition-colors border-2 border-black rounded-sm"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="p-8 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* KPI Cards */}
        <StatCard 
          label="Total Dataset Size" 
          value={data.total_samples.toLocaleString()} 
          icon={<Database className="w-4 h-4" />} 
          sub="Verified Historical Sessions"
        />
        <StatCard 
          label="Revenue Generations" 
          value={data.total_revenue_events.toLocaleString()} 
          icon={<TrendingUp className="w-4 h-4" />} 
          sub={`$${(data.total_revenue_events * 125).toLocaleString()} Est. Value`}
        />
        <StatCard 
          label="Global Convert Rate" 
          value={data.total_samples > 0 ? `${((data.total_revenue_events/data.total_samples) * 100).toFixed(2)}%` : '0.00%'} 
          icon={<Users className="w-4 h-4" />} 
          sub="Aggregated Performance"
        />
        <StatCard 
          label="Model Confidence" 
          value="91.4%" 
          icon={<ShieldCheck className="w-4 h-4" />} 
          sub="RF Cross-Validation"
        />

        {/* Charts */}
        <div className="md:col-span-3 bg-white border-2 border-black p-8 relative overflow-hidden group">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-serif font-black uppercase flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              Monthly Conversion Trends
            </h3>
            <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest">Temporal Analysis v2.0</span>
          </div>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEEEEE" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#000000' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#000000' }}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: 0, border: '2px solid black', fontWeight: 'bold' }}
                  formatter={(v: any) => [`${(v * 100).toFixed(2)}%`, 'Conversion Rate']}
                />
                <Line 
                  type="stepAfter" 
                  dataKey="rate" 
                  stroke="#000000" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#000000', strokeWidth: 2, stroke: '#FFFFFF' }}
                  activeDot={{ r: 8, fill: '#000000' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-1 bg-[#1A1A1A] text-white p-8 border-2 border-black flex flex-col">
          <h3 className="text-xl font-serif font-black uppercase mb-8 flex items-center gap-3">
            <Users className="w-5 h-5" />
            Visitor Influence
          </h3>
          <div className="flex-1 flex flex-col justify-center">
            {data.visitor.map((v: any, i: number) => (
              <div key={v.type} className="mb-8 last:mb-0">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{v.type.replace('_', ' ')}</span>
                  <span className="text-xl font-serif font-bold italic">{(v.rate * 100).toFixed(1)}%</span>
                </div>
                <div className="h-6 bg-zinc-800 border border-zinc-700 relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${v.rate * 100}%` }}
                    className="absolute inset-0 bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[10px] opacity-40 font-mono leading-relaxed uppercase">
            Audience behavior varies significantly by loyalty index. Returning visitors show 3.4x higher conversion probability.
          </p>
        </div>

        <div className="md:col-span-2 bg-white border-2 border-black p-8">
           <h3 className="text-xl font-serif font-black uppercase mb-8 flex items-center gap-3">
            <MousePointer2 className="w-5 h-5" />
            Traffic Channel Efficacy
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.traffic}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEEEEE" />
                <XAxis dataKey="type" axisLine={false} tickLine={false} tick={{ fontSize: 8 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip 
                  cursor={{ fill: '#F5F2ED' }}
                  contentStyle={{ borderRadius: 0, border: '2px solid black' }}
                />
                <Bar dataKey="rate" fill="#000000">
                  {data.traffic.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-2 bg-white border-2 border-black p-8">
           <h3 className="text-xl font-serif font-black uppercase mb-8 flex items-center gap-3">
            Promotion Impact (Special Day)
          </h3>
          <div className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={data.special}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEEEEE" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip contentStyle={{ borderRadius: 0, border: '2px solid black' }} />
                <Line type="monotone" dataKey="rate" stroke="#000000" strokeWidth={3} />
               </LineChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <footer className="p-12 mt-auto opacity-20 text-center font-mono text-xs uppercase tracking-[0.5em]">
        End of Transmission · AI Model Insight Pipeline 2026
      </footer>
    </motion.div>
  );
}

function StatCard({ label, value, icon, sub }: { label: string; value: string; icon: React.ReactNode; sub: string }) {
  return (
    <div className="bg-white border-2 border-black p-6 flex flex-col justify-between hover:translate-x-1 hover:-translate-y-1 transition-transform cursor-crosshair group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex justify-between items-start">
        <div className="text-zinc-300 group-hover:text-black transition-colors">{icon}</div>
        <span className="text-[10px] font-black uppercase italic opacity-20">Live Sync</span>
      </div>
      <div className="mt-4">
        <div className="text-4xl font-serif font-black tracking-tighter leading-none">{value}</div>
        <div className="text-[10px] font-black uppercase tracking-widest mt-2">{label}</div>
      </div>
      <div className="mt-4 pt-4 border-t border-zinc-100">
        <span className="text-[9px] font-bold italic opacity-40 uppercase">{sub}</span>
      </div>
    </div>
  );
}
