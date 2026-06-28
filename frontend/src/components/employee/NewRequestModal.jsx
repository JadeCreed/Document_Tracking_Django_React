import { useState, useEffect } from 'react';
import { fetchDocumentTypes, createDocument } from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export default function NewRequestModal({ onClose, onCreated }) {
  const { showToast } = useToast();
  const [types, setTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    application_no: '',
    applicant_name: '',
    business_name: '',
    floor_area: '',
    contact_no: '',
    address: ''
  });

  useEffect(() => {
    fetchDocumentTypes().then(res => setTypes(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTypeId) return showToast('Please select a document type', 'error');
    
    setLoading(true);
    try {
      await createDocument({
        document_type: selectedTypeId,
        form_data: formData, // This saves all our check-marked fields into JSON
      });
      showToast('Document Request Created!', 'success');
      onCreated();
    } catch (err) {
      showToast('Failed to create request', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overlay-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-8 modal-pop-in max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">New Document Request</h2>
        <p className="text-slate-500 mb-6">Select a document and fill out the details.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Select Document Type</label>
            <select 
              className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 focus:ring-2 focus:ring-blue-500"
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(e.target.value)}
              required
            >
              <option value="">-- Choose Option --</option>
              {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          {selectedTypeId && (
            <div className="border-t border-slate-100 pt-6 mt-6 space-y-4 animate-in fade-in duration-500">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Date</label>
                    <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Application No.</label>
                    <input type="text" value={formData.application_no} onChange={(e) => setFormData({...formData, application_no: e.target.value})} placeholder="2024-XXXX" className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
                  </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Name of Applicant / Owner</label>
                 <input type="text" required value={formData.applicant_name} onChange={(e) => setFormData({...formData, applicant_name: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Name of Business</label>
                 <input type="text" required value={formData.business_name} onChange={(e) => setFormData({...formData, business_name: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Floor Area</label>
                    <input type="text" value={formData.floor_area} onChange={(e) => setFormData({...formData, floor_area: e.target.value})} placeholder="sqm" className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact No.</label>
                    <input type="text" value={formData.contact_no} onChange={(e) => setFormData({...formData, contact_no: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm" />
                  </div>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Address of Establishment</label>
                 <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2 text-sm" rows="2"></textarea>
               </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-500 font-bold">Cancel</button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-bold shadow-lg shadow-blue-200"
            >
              {loading ? 'Processing...' : 'Save Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}