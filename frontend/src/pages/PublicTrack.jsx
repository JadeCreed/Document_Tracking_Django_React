import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DocumentStatusBadge from '../components/admin/DocumentStatusBadge';
import { CheckCircle2Icon, Clock4Icon, HandshakeIcon, MapPinIcon } from '../components/Icons';

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
           {/* --- 1. MASTER STATUS CARD (Dynamic Color & Text) --- */}
           <div className={`mb-10 p-1 rounded-[2rem] border-2 shadow-2xl shadow-slate-200/50 transition-all duration-500 ${
              doc.status === 'completed' ? 'border-green-500 bg-green-50' : 
              doc.status === 'released' ? 'border-slate-800 bg-slate-50' : 'border-blue-500 bg-blue-50'
           }`}>
              <div className="bg-white rounded-[1.8rem] p-8 text-center relative overflow-hidden">
                 
                 {/* Background Accent Decor */}
                 <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 ${
                    doc.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'
                 }`} />

                 {/* Status Icon & Badge */}
                 <div className="flex flex-col items-center">
                    <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
                       doc.status === 'completed' ? 'bg-green-600 text-white' : 
                       doc.status === 'released' ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white'
                    }`}>
                       {doc.status === 'completed' ? <HandshakeIcon className="w-10 h-10" /> : 
                        doc.status === 'released' ? <CheckCircle2Icon className="w-10 h-10" /> : 
                        <MapPinIcon className="w-10 h-10" />}
                    </div>
                    
                    <DocumentStatusBadge doc={doc} />
                    
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-6 mb-1">
                       {doc.status === 'released' ? 'Final Destination' : 'Current Desk'}
                    </p>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{doc.current_office}</h2>
                    
                    {/* Action Instruction */}
                    {doc.status === 'completed' && (
                       <div className="mt-6 py-2 px-6 bg-green-600 text-white text-[11px] font-black rounded-full animate-bounce-short">
                          READY FOR PICKUP AT {doc.origin_office}
                       </div>
                    )}
                    {doc.status === 'released' && (
                       <div className="mt-6 py-2 px-6 bg-slate-200 text-slate-600 text-[11px] font-black rounded-full">
                          TRANSACTION FINALIZED
                       </div>
                    )}
                 </div>
              </div>
           </div>

           {/* --- 2. WORKFLOW HISTORY SECTION --- */}
           <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 bg-slate-100"></div>
              <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Workflow History</h2>
              <div className="h-px flex-1 bg-slate-100"></div>
           </div>

           <div className="space-y-8 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 mb-10">
              {doc.logs.map((log, idx) => (
                <div key={idx} className="relative pl-10 group text-left">
                   {/* Timeline Dot */}
                   <div className={`absolute left-0 top-1 w-8 h-8 rounded-full z-10 flex items-center justify-center text-[10px] font-bold border-4 border-white shadow-sm transition-colors ${
                      idx === doc.logs.length - 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                   }`}>
                      {idx + 1}
                   </div>

                   {/* Log Content */}
                   <div className="bg-white group-hover:translate-x-1 transition-transform">
                      <p className="font-black text-slate-900 leading-tight">
                        {log.action === 'scanned_advance' ? 'Arrived at' : 
                         log.action === 'scanned_complete' ? 'Ready for Pickup at' : 
                         log.action === 'released' ? 'Claimed from' : 
                         log.action === 'created' ? 'Requested at' : log.action} {log.office}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                         By: <span className="font-bold">{log.acted_by.full_name}</span> 
                         <span className="mx-1 opacity-30">|</span> 
                         {log.acted_by.position || log.acted_by.role}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                         <p className="text-[10px] text-slate-400 font-medium">
                            {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </p>
                         {log.duration_display && (
                           <span className="inline-flex items-center gap-1 text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md shadow-sm border border-amber-200">
                               <Clock4Icon className="w-2.5 h-2.5" /> STAYED {log.duration_display.toUpperCase()}
                           </span>
                         )}
                      </div>
                   </div>
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