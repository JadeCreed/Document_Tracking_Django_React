import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DocumentStatusBadge from '../components/admin/DocumentStatusBadge';
import { Clock4Icon, MapPinIcon } from '../components/Icons';

export default function PublicTrack() {
  const { trackingNumber } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We use the tracking number from the URL
    api.get(`/documents/track/${trackingNumber}/`)
      .then(res => {
        setDoc(res.data);
      })
      .catch(err => {
        console.error("Tracking Error:", err.response);
        setDoc(null);
      })
      .finally(() => setLoading(false));
  }, [trackingNumber]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!doc) return <div className="min-h-screen flex items-center justify-center">Document not found.</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-8 text-white">
          <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Document Tracking</p>
          <h1 className="text-3xl font-extrabold">{doc.document_type_name}</h1>
          <p className="font-mono text-sm mt-2 opacity-90">{doc.tracking_number}</p>
        </div>

        <div className="p-8">
           {/* Progress Section */}
           <div className="mb-8">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Current Location</h2>
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                 <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white">
                   <MapPinIcon className="w-5 h-5" />
                 </div>
                 <div>
                    <p className="font-bold text-blue-900 text-lg">{doc.current_office}</p>
                    <DocumentStatusBadge doc={doc} />
                 </div>
              </div>
           </div>

           {/* Flow / History */}
           <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Workflow History</h2>
           <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {doc.logs.map((log, idx) => (
                <div key={idx} className="relative pl-10">
                   <div className="absolute left-0 top-1 w-8 h-8 bg-white border-4 border-blue-600 rounded-full z-10 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                   </div>
                   <p className="font-bold text-slate-900 capitalize">{log.action} at {log.office}</p>
                   <p className="text-xs text-slate-500">
                      Processed by: <span className="font-medium">{log.acted_by.full_name}</span> 
                      ({log.acted_by.position || log.acted_by.role})
                   </p>
                   <p className="text-[10px] text-slate-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                    {log.duration_display && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                        <Clock4Icon className="w-3 h-3" /> Stayed {log.duration_display} in previous office
                    </span>
                    )}
                </div>
              ))}
           </div>

           {/* Login Redirect */}
           <div className="mt-12 pt-8 border-t border-slate-100 text-center">
              <p className="text-sm text-slate-500 mb-4 font-medium">Want to save this to your account and get alerts?</p>
              <button 
                onClick={() => navigate('/login')}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all"
              >
                Log In / Register
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}