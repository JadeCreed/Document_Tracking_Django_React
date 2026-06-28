import { useState, useEffect, useMemo } from 'react';
import { fetchDocuments } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DocumentStatusBadge from "../../components/admin/DocumentStatusBadge";
import NewRequestModal from '../../components/employee/NewRequestModal';
import DocumentDetailModal from '../../components/admin/DocumentDetailModal';
import ConfirmModal from '../../components/ConfirmModal';
import api from '../../api/axios';

export default function OfficeDocuments() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [allDocs, setAllDocs] = useState([]); // Master list mula sa API
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmReleaseId, setConfirmReleaseId] = useState(null);
  
  // --- NEW STATES FOR TABS & SEARCH ---
  const [activeTab, setActiveTab] = useState('my-requests'); 
  const [searchQuery, setSearchQuery] = useState('');

  const loadDocs = () => {
    setLoading(true);
    fetchDocuments('', 1)
      .then((res) => {
        console.log("ALL DOCUMENTS FROM API:", res.data.results); 
        setAllDocs(res.data.results || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDocs(); }, []);

  // --- LOGIC: FILTER BY TAB + FILTER BY SEARCH ---
  const filteredDocuments = useMemo(() => {
    // Siguraduhin na may laman ang office at gawing uppercase para pantay ang comparison
    const myOffice = user.office?.toUpperCase();
    
    let tabFiltered = allDocs.filter(d => {
      const docOrigin = d.origin_office?.toUpperCase();
      const nextOffice = d.route[d.route_position + 1]?.toUpperCase();

      if (activeTab === 'my-requests') {
        // Ipakita kung ako ang gumawa AT hindi pa released
        // Dagdag check: kung walang origin_office (old data), ipakita nalang muna sa BPLO
        return (docOrigin === myOffice || (!docOrigin && myOffice === 'BPLO')) && d.status !== 'released';
      } 
      
      else if (activeTab === 'to-scan') {
        // Ipakita kung ang susunod na office sa route ay ang office ko
        return nextOffice === myOffice;
      } 
      
      else if (activeTab === 'released') {
        // Ipakita ang mga records na nare-release ko na (History)
        // Fallback: Kung walang origin_office (old data), ipakita sa BPLO tab kung status ay released
        return (docOrigin === myOffice || (!docOrigin && myOffice === 'BPLO')) && d.status === 'released';
      }
      return false;
    });

    if (!searchQuery) return tabFiltered;
    
    return tabFiltered.filter(d => 
      d.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.requested_by_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allDocs, activeTab, searchQuery, user.office]);

  const executeRelease = async () => {
    try {
      await api.patch(`/documents/${confirmReleaseId}/release/`);
      showToast("Document Released successfully!", "success");
      setConfirmReleaseId(null);
      loadDocs();
    } catch (err) {
      showToast("Error releasing document", "error");
    }
  };

  return (
    <div className="p-2">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{user.office} Portal</h1>
          <p className="text-slate-500 text-sm">Manage, scan, and release office documents.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all">
          + New Request
        </button>
      </div>

      {/* SEARCH AND TABS BAR */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8">
        {/* TABS */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-full md:w-fit">
          {['my-requests', 'to-scan', 'released'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* SEARCH BAR */}
        <div className="relative w-full md:w-80">
          <input 
            type="text"
            placeholder="Search tracking # or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
          />
          <span className="absolute right-4 top-3 opacity-30 text-xs">🔍</span>
        </div>
      </div>

      {/* CONTENT */}
      {loading ? (
        <p className="text-center py-10 text-slate-400 animate-pulse font-bold">Loading document queue...</p>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-16 text-center">
          <p className="text-slate-400 font-bold">No documents found in this view.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => (
            <div key={doc.id} onClick={() => setSelectedId(doc.id)} className="cursor-pointer bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-100 hover:border-blue-400 hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">{doc.tracking_number}</span>
                <DocumentStatusBadge doc={doc} />
              </div>
              <h3 className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors leading-tight mb-1">{doc.document_type_name}</h3>
              <p className="text-xs text-slate-500 mb-4">Requester: <span className="font-bold text-slate-700">{doc.requested_by_name}</span></p>
              
              <div className="border-t border-slate-50 pt-4 mt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Current Desk</span>
                  <span className="text-xs font-black text-blue-600 bg-blue-50/50 px-2 py-1 rounded-md">{doc.current_office}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-bold">{new Date(doc.updated_at).toLocaleDateString()}</span>
                  
                  {activeTab === 'my-requests' && doc.status === 'completed' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setConfirmReleaseId(doc.id); }}
                      className="bg-green-600 hover:bg-green-700 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-green-100 transition-all uppercase"
                    >
                      Release to Citizen
                    </button>
                  )}
                  {activeTab === 'to-scan' && (
                    <div className="flex items-center gap-1.5 text-amber-600 text-[10px] font-black uppercase tracking-wider animate-pulse">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                      Needs Scan
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALS */}
      {selectedId && <DocumentDetailModal documentId={selectedId} onClose={() => setSelectedId(null)} onUpdated={loadDocs} />}
      {showModal && <NewRequestModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); loadDocs(); }} />}
      {confirmReleaseId && (
        <ConfirmModal
          title="Confirm Release"
          message="Is the physical document ready and the citizen present for collection?"
          confirmLabel="Yes, Release Now"
          confirmColor="bg-green-600 hover:bg-green-700"
          onCancel={() => setConfirmReleaseId(null)}
          onConfirm={executeRelease}
        />
      )}
    </div>
  );
}