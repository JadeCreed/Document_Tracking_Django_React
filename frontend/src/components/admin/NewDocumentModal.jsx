import { useState } from 'react';
import { createDocument } from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export default function NewDocumentModal({ onClose, onCreated }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    document_type: '', description: '', requester_name: '',
    requester_contact: '', current_office: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await createDocument(form);
      showToast(`Document ${res.data.tracking_number} created.`, 'success');
      onCreated();
    } catch (err) {
      const data = err.response?.data;
      const firstError = data ? Object.values(data)[0] : null;
      setError(Array.isArray(firstError) ? firstError[0] : firstError || 'Failed to create document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4 overlay-fade-in">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7 modal-pop-in">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">New Document Request</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>
        <p className="text-sm text-slate-500 mt-1">Log a new document entering the workflow.</p>

        {error && (
          <div className="mt-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Document type</label>
            <input name="document_type" required value={form.document_type} onChange={handleChange}
              placeholder="e.g. Building Permit"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Requester name</label>
            <input name="requester_name" required value={form.requester_name} onChange={handleChange}
              placeholder="Juan Dela Cruz"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Requester contact</label>
            <input name="requester_contact" value={form.requester_contact} onChange={handleChange}
              placeholder="09171234567"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Current office</label>
            <input name="current_office" required value={form.current_office} onChange={handleChange}
              placeholder="e.g. Permits Office"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 mt-2 transition-colors">
            {loading ? 'Creating…' : 'Create document request'}
          </button>
        </form>
      </div>
    </div>
  );
}