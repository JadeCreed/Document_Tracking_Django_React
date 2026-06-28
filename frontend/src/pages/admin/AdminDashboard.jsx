import { useState, useEffect } from 'react';
import { fetchDashboardStats } from '../../api/axios';
import { CheckCircle2Icon, Clock3Icon, FileTextIcon, HandshakeIcon } from '../../components/Icons';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0, released: 0 });

  useEffect(() => {
    fetchDashboardStats().then(res => setStats(res.data));
  }, []);

  const cards = [
    { label: 'Total Documents', value: stats.total, icon: FileTextIcon, color: 'bg-blue-500' },
    { label: 'In Progress', value: stats.pending, icon: Clock3Icon, color: 'bg-amber-500' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2Icon, color: 'bg-green-500' },
    { label: 'Released', value: stats.released, icon: HandshakeIcon, color: 'bg-indigo-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
      <p className="text-slate-500 text-sm">Real-time statistics of all municipal documents.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
             <div className={`${card.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-${card.color.split('-')[1]}-100`}>
                <card.icon className="w-6 h-6" />
             </div>
             <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                <p className="text-3xl font-black text-slate-900">{card.value}</p>
             </div>
          </div>
        ))}
      </div>
      
      {/* We will build the Heatmap Graph below this later */}
      <div className="mt-10 bg-white p-10 rounded-3xl border border-slate-100 text-center text-slate-300 italic">
         Analytics Chart / Heatmap visual will go here...
      </div>
    </div>
  );
}