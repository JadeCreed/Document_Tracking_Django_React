import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import DocumentStatusBadge from '../../components/admin/DocumentStatusBadge';
import { Clock4Icon, MapPinIcon, CheckCircle2Icon, FileTextIcon } from '../../components/Icons';


export default function CitizenHome() {
  const [myDocs, setMyDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null); // Para sa detailed view
  const { showToast } = useToast();

  const loadMyDocs = () => {
    setLoading(true);
    api.get('/documents/my-requests/')
      .then(res => setMyDocs(res.data.results || res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadMyDocs(); }, []);

  const handleConfirmReceived = async (docId) => {
    if (!window.confirm("Confirm that you have physically received this document?")) return;
    try {
      await api.patch(`/documents/${docId}/release/`);
      showToast("Thank you! Transaction finalized.", "success");
      loadMyDocs();
      setSelectedDoc(null);
    } catch (err) {
      showToast("Error updating status", "error");
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Requests</h1>
        <p className="text-slate-500 text-sm">Monitor your applications and confirm collection.</p>
      </div>

      {loading ? <p className="animate-pulse text-slate-400">Loading your documents...</p> : 
       myDocs.length === 0 ? (
        <div className="bg-white p-12 rounded-[2rem] text-center border-2 border-dashed border-slate-100">
           <p className="text-slate-400">No documents linked to your account.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {myDocs.map(doc => (
            <div key={doc.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all">
               <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">{doc.tracking_number}</span>
                  <DocumentStatusBadge doc={doc} />
               </div>
               <h3 className="font-black text-slate-900 text-lg mb-4">{doc.document_type_name}</h3>
               
               <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl mb-6">
                  <MapPinIcon className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Current Location</p>
                    <p className="text-sm font-bold text-slate-700">{doc.current_office}</p>
                  </div>
               </div>

               <button 
                 onClick={() => setSelectedDoc(doc)}
                 className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-50 text-blue-600 text-xs font-black uppercase tracking-widest hover:bg-blue-100 transition-all"
               >
                 <FileTextIcon className="w-4 h-4" /> View Full Progress
               </button>
            </div>
          ))}
        </div>
      )}

      {/* --- DETAILED PROGRESS MODAL --- */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overlay-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col modal-pop-in">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
               <div>
                  <h2 className="text-2xl font-black text-slate-900">{selectedDoc.document_type_name}</h2>
                  <p className="text-xs font-mono text-blue-600">{selectedDoc.tracking_number}</p>
               </div>
               <button onClick={() => setSelectedDoc(null)} className="text-slate-300 hover:text-slate-500 text-2xl">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">Movement History</h4>
               <div className="space-y-8 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                  {selectedDoc.logs?.map((log, idx) => (
                    <div key={idx} className="relative pl-10">
                       <div className={`absolute left-0 top-1 w-8 h-8 rounded-full z-10 flex items-center justify-center text-[10px] font-bold border-4 border-white shadow-sm ${idx === selectedDoc.logs.length - 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {idx + 1}
                       </div>
                       <p className="font-black text-slate-800 leading-tight">
                         {log.action === 'scanned_advance' ? 'Arrived at' : 
                          log.action === 'scanned_complete' ? 'Ready for Pickup at' : 
                          log.action === 'released' ? 'Claimed from' : 'Requested at'} {log.office}
                       </p>
                       <p className="text-[11px] text-slate-500 mt-1">Processed by: <strong>{log.acted_by.full_name}</strong> | {log.acted_by.position || log.acted_by.role}</p>
                       <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString()}</span>
                          {log.duration_display && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">
                               <Clock4Icon className="w-2.5 h-2.5" /> STAYED {log.duration_display.toUpperCase()}
                            </span>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100">
               {selectedDoc.status === 'released' ? (
                  // STATE 1: TAPOS NA ANG LAHAT
                  <div className="flex items-center justify-center gap-2 py-4 text-slate-400 font-black uppercase text-xs">
                     <CheckCircle2Icon className="w-5 h-5 text-green-500" /> Transaction Finalized
                  </div>
               ) : (
                  // STATE 2: PENDING (IN PROGRESS O COMPLETED)
                  <div className="space-y-3">
                    <button 
                      onClick={() => handleConfirmReceived(selectedDoc.id)}
                      disabled={selectedDoc.status !== 'completed'}
                      className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all 
                        ${selectedDoc.status === 'completed' 
                          ? 'bg-green-600 text-white shadow-xl shadow-green-100 hover:bg-green-700 animate-bounce-short active:scale-95' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                      {selectedDoc.status === 'completed' ? 'Confirm Received' : 'Processing...'}
                    </button>
                    
                    {selectedDoc.status !== 'completed' && (
                      <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                         * You can only confirm once the document returns to {selectedDoc.origin_office}
                      </p>
                    )}
                  </div>
               )}
            </div>


          </div>
        </div>
      )}
    </div>
  );
}