import { useState, useEffect } from 'react';
import { fetchHeatmapData } from '../../api/axios';
import { TrendingDownIcon, TrendingUpIcon } from '../../components/Icons';

export default function Heatmap() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeatmapData().then(res => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  // Sort data for rankings
  const fastest = [...data].sort((a, b) => a.avg_hours - b.avg_hours).slice(0, 10);
  const slowest = [...data].sort((a, b) => b.avg_hours - a.avg_hours).slice(0, 10);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Office Performance Heatmap</h1>
      <p className="text-slate-500 text-sm">Ranking offices based on processing speed (Average Hours).</p>

      <div className="grid lg:grid-cols-2 gap-8 mt-8">
        {/* FASTEST OFFICES */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-green-600 flex items-center gap-2 mb-6">
            <TrendingUpIcon className="w-5 h-5" /> Top 10 Fastest Offices
          </h2>
          <div className="space-y-4">
            {fastest.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-green-50 rounded-2xl border border-green-100">
                <div>
                  <p className="font-bold text-green-900">{item.office}</p>
                  <p className="text-[10px] text-green-600 uppercase font-bold">{item.count} Documents Processed</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-green-700">{item.avg_hours}h</p>
                  <p className="text-[10px] text-green-500 uppercase font-bold">Avg. Time</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SLOWEST OFFICES */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-6">
            <TrendingDownIcon className="w-5 h-5" /> Top 10 Slowest Offices
          </h2>
          <div className="space-y-4">
            {slowest.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-red-50 rounded-2xl border border-red-100">
                <div>
                  <p className="font-bold text-red-900">{item.office}</p>
                  <p className="text-[10px] text-red-600 uppercase font-bold">{item.count} Documents Processed</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-red-700">{item.avg_hours}h</p>
                  <p className="text-[10px] text-red-500 uppercase font-bold">Avg. Time</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}