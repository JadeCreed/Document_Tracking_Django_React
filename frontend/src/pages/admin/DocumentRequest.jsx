import { useState, useEffect, useCallback } from 'react';
import { fetchDocuments } from '../../api/axios';
import DocumentStatusBadge from '../../components/admin/DocumentStatusBadge';
import NewDocumentModal from '../../components/admin/NewDocumentModal';
import DocumentDetailModal from '../../components/admin/DocumentDetailModal';

const STATUS_TABS = ['all', 'released', 'received', 'returned', 'completed', 'missing'];

export default function DocumentRequest() {
  const [statusTab, setStatusTab] = useState('all');
  const [documents, setDocuments] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const loadDocuments = useCallback(() => {
    setLoading(true);
    fetchDocuments(statusTab === 'all' ? '' : statusTab, page)
      .then((res) => {
        setDocuments(res.data.results);
        setCount(res.data.count);
      })
      .finally(() => setLoading(false));
  }, [statusTab, page]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleTabChange = (tab) => {
    setStatusTab(tab);
    setPage(1);
  };

  return (
    <div>
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflow Monitoring</h1>
          <p className="text-slate-500 mt-1">View and audit all document movements across offices.</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
              statusTab === tab ? 'bg-white shadow text-blue-700' : 'text-slate-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-5 bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-5 py-3">Tracking #</th>
              <th className="text-left px-5 py-3">Type</th>
              <th className="text-left px-5 py-3">Requester</th>
              <th className="text-left px-5 py-3">Office</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Handler</th>
              <th className="text-left px-5 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="7" className="text-center py-8 text-slate-400">Loading…</td></tr>
            ) : documents.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-8 text-slate-400">No documents found.</td></tr>
            ) : (
              documents.map((doc) => (
                <tr
                  key={doc.id}
                  onClick={() => setSelectedId(doc.id)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td className="px-5 py-3 font-mono text-blue-600 text-xs">{doc.tracking_number}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{doc.document_type_name}</td>
                  <td className="px-5 py-3 text-slate-600">{doc.requested_by_name}</td>
                  <td className="px-5 py-3 text-slate-600">{doc.current_office}</td>
                  <td className="px-5 py-3"><DocumentStatusBadge doc={doc} /></td>
                  <td className="px-5 py-3 text-slate-600">
                    {doc.current_handler ? doc.current_handler.full_name : '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-xs">
                    {new Date(doc.updated_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <p className="text-slate-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40">Previous</button>
            <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {showNewModal && (
        <NewDocumentModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => { setShowNewModal(false); setPage(1); loadDocuments(); }}
        />
      )}

      {selectedId && (
        <DocumentDetailModal
          documentId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdated={loadDocuments}
        />
      )}
    </div>
  );
}