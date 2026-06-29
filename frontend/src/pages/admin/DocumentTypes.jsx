import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export default function DocumentTypes() {
  const { showToast } = useToast();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowTypeForm] = useState(false);
  const [newType, setNewType] = useState({ name: '', route: '' });

  const loadTypes = () => {
    setLoading(true);
    api.get('/documents/types/').then(res => {
      setTypes(res.data);
      setLoading(false);
    });
  };

  useEffect(() => { loadTypes(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // I-convert ang route string (Office1, Office2) into array ["Office1", "Office2"]
      const routeArray = newType.route.split(',').map(s => s.trim().toUpperCase());
      await api.post('/documents/types/create/', { 
        name: newType.name, 
        route: routeArray 
      });
      showToast("Document Type added!", "success");
      setShowTypeForm(false);
      setNewType({ name: '', route: '' });
      loadTypes();
    } catch (err) {
      showToast("Error creating type", "error");
    }
  };

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Document Management</h1>
          <p className="text-slate-500 text-sm">Define the name and office route for various documents.</p>
        </div>
        <button 
          onClick={() => setShowTypeForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold"
        >
          + Add New Type
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black">
            <tr>
              <th className="px-6 py-4">Document Name</th>
              <th className="px-6 py-4">Workflow Route</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {types.map(t => (
              <tr key={t.id}>
                <td className="px-6 py-4 font-bold text-slate-700">{t.name}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {t.route.map((step, i) => (
                      <span key={i} className="flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-bold">{step}</span>
                        {i < t.route.length - 1 && <span className="text-slate-300">→</span>}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className="text-green-600 text-[10px] font-black uppercase">● Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overlay-fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full modal-pop-in">
            <h2 className="text-xl font-bold mb-4">Create New Document Type</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Document Name</label>
                <input 
                  required value={newType.name} 
                  onChange={e => setNewType({...newType, name: e.target.value})}
                  placeholder="e.g., Senior Citizen ID"
                  className="w-full border border-slate-200 rounded-xl p-3" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Office Route (Comma separated)</label>
                <textarea 
                  required value={newType.route} 
                  onChange={e => setNewType({...newType, route: e.target.value})}
                  placeholder="e.g., OSCA, MSWD, MAYOR, OSCA"
                  className="w-full border border-slate-200 rounded-xl p-3" 
                  rows="3"
                />
                <p className="text-[10px] text-slate-400 mt-1 italic">*Important: The last office should be the origin office to enable the release button.</p>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowTypeForm(false)} className="flex-1 font-bold text-slate-400">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-100">Create Type</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}