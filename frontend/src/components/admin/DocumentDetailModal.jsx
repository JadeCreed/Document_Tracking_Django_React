import { useState, useEffect } from 'react';
import { fetchDocumentDetail, transitionDocument } from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import DocumentStatusBadge from './DocumentStatusBadge';

const NEXT_ACTIONS = {
  released: [{ action: 'received', label: 'Mark as Received' }, { action: 'flagged_missing', label: 'Flag as Missing' }],
  received: [{ action: 'returned', label: 'Mark as Returned' }, { action: 'completed', label: 'Mark as Completed' }],
  returned: [{ action: 'released', label: 'Release to Next Office' }, { action: 'completed', label: 'Mark as Completed' }, { action: 'flagged_missing', label: 'Flag as Missing' }],
  completed: [],
  missing: [{ action: 'received', label: 'Mark as Found / Received' }],
};

export default function DocumentDetailModal({ documentId, onClose, onUpdated }) {
  const { showToast } = useToast();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionForm, setActionForm] = useState({ action: '', office: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    fetchDocumentDetail(documentId)
      .then((res) => setDoc(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [documentId]);

  const handleTransition = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await transitionDocument(documentId, actionForm);
      showToast('Document status updated.', 'success');
      setActionForm({ action: '', office: '', notes: '' });
      load();
      onUpdated();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to update status.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4 overlay-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-7 modal-pop-in max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Document Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>

        {loading || !doc ? (
          <p className="text-slate-400 text-center py-10">Loading…</p>
        ) : (
          <>
            <div className="mt-4">
              <p className="font-mono text-sm text-blue-600">{doc.tracking_number}</p>
              <p className="font-semibold text-slate-900 text-lg mt-1">{doc.document_type_name}</p>
              {doc.description && <p className="text-sm text-slate-500 mt-1">{doc.description}</p>}
              <div className="mt-2"><DocumentStatusBadge doc={doc} /></div>
            </div>

            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Requested by</span>
                <span className="text-slate-800">{doc.requested_by_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Current office</span>
                <span className="text-slate-800">{doc.current_office}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Current handler</span>
                <span className="text-slate-800">
                  {doc.current_handler ? `${doc.current_handler.full_name} (${doc.current_handler.position || doc.current_handler.role})` : '—'}
                </span>
              </div>
            </div>

            {/* Action form — only shown if there are valid next actions */}
            {NEXT_ACTIONS[doc.status]?.length > 0 && (
              <form onSubmit={handleTransition} className="mt-5 bg-slate-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-slate-700">Update status</p>
                <select
                  required
                  value={actionForm.action}
                  onChange={(e) => setActionForm({ ...actionForm, action: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select action…</option>
                  {NEXT_ACTIONS[doc.status].map((a) => (
                    <option key={a.action} value={a.action}>{a.label}</option>
                  ))}
                </select>
                <input
                  placeholder="Office (optional — defaults to current)"
                  value={actionForm.office}
                  onChange={(e) => setActionForm({ ...actionForm, office: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <textarea
                  placeholder="Notes (optional)"
                  rows={2}
                  value={actionForm.notes}
                  onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 text-sm transition-colors">
                  {submitting ? 'Updating…' : 'Apply update'}
                </button>
              </form>
            )}
            <div className="mt-6 flex flex-col items-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6">
                {doc.qr_code ? (
                    <img 
                        /* If the backend gave a full URL, use it. If not, add the domain. */
                        src={doc.qr_code.startsWith('http') ? doc.qr_code : `http://127.0.0.1:8000${doc.qr_code}`} 
                        alt="QR Code" 
                        className="w-44 h-44 shadow-md rounded-lg mb-3 bg-white p-2"
                        onError={(e) => {
                            console.error("Path error on image:", e.target.src);
                            e.target.src = "https://via.placeholder.com/150?text=Check+Console";
                        }}
                    />
                ) : (
                    <p className="text-xs text-slate-400">No QR Code Generated</p>
                )}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Official Tracking QR</p>
                <p className="text-xs text-slate-400 mt-1">Scan to advance or track status</p>
            </div>


            {/* History log */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-700 mb-2">History</p>
              <div className="space-y-3">
                {doc.logs.map((log) => (
                  <div key={log.id} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-slate-800">
                        <span className="font-medium capitalize">{log.action}</span> at {log.office}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {log.acted_by ? `${log.acted_by.full_name} (${log.acted_by.position || log.acted_by.role})` : 'Unknown'}
                        {' · '}
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                      {log.notes && <p className="text-slate-500 text-xs mt-0.5">{log.notes}</p>}
                      {log.duration_display && (
                        <p className="text-blue-600 text-[10px] font-bold mt-1">
                            Time taken: {log.duration_display}
                        </p>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}