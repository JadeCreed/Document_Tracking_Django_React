import { useState, useEffect } from 'react';
import { fetchDocumentTypes } from '../../api/axios';

export default function DocumentTypePicker({ onClose, onSelect }) {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocumentTypes()
      .then((res) => setTypes(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4 overlay-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-7 modal-pop-in">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">New Document Request</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <p className="text-sm text-slate-500 mt-1">Select the type of document to process.</p>

        <div className="mt-5 space-y-2">
          {loading ? (
            <p className="text-slate-400 text-sm text-center py-6">Loading…</p>
          ) : (
            types.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-colors font-medium text-slate-800"
              >
                {t.name}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}