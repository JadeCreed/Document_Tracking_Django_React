import { useState, useEffect, useMemo } from 'react';
import { fetchDocuments } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DocumentStatusBadge from "../../components/admin/DocumentStatusBadge";
import DocumentTypePicker from '../../components/employee/DocumentTypePicker';
import BusinessPermitWizard from '../../components/employee/BusinessPermitWizard';

import DocumentDetailModal from '../../components/admin/DocumentDetailModal';
import ConfirmModal from '../../components/ConfirmModal';
import api, { exportDocumentExcel } from '../../api/axios';



export default function OfficeDocuments() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [allDocs, setAllDocs] = useState([]); // Master list mula sa API
  const [loading, setLoading] = useState(true);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [wizardTypeId, setWizardTypeId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmReleaseId, setConfirmReleaseId] = useState(null);
  
  // --- NEW STATES FOR TABS & SEARCH ---
  const [activeTab, setActiveTab] = useState('my-requests'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [docTypes, setDocTypes] = useState([]);
  const [filterType, setFilterType] = useState('all'); 

  const loadDocs = () => {
    setLoading(true);
    fetchDocuments('', 1)
      .then((res) => {
        console.log("ALL DOCUMENTS FROM API:", res.data.results); 
        setAllDocs(res.data.results || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { 
    loadDocs(); 
    // Kunin ang listahan ng types para sa filter dropdown
    api.get('/documents/types/').then(res => setDocTypes(res.data));
  }, []);

  // --- LOGIC: FILTER BY TAB + FILTER BY SEARCH ---
  const filteredDocuments = useMemo(() => {
    const myOffice = user.office?.toUpperCase();
    
    // 1. Filter base sa Tab
    let result = allDocs.filter(d => {
      const docOrigin = d.origin_office?.toUpperCase();
      const nextOffice = d.route[d.route_position + 1]?.toUpperCase();

      if (activeTab === 'my-requests') {
        return (docOrigin === myOffice || (!docOrigin && myOffice === 'BPLO')) && d.status !== 'released';
      } else if (activeTab === 'to-scan') {
        return nextOffice === myOffice;
      } else if (activeTab === 'released') {
        return (docOrigin === myOffice || (!docOrigin && myOffice === 'BPLO')) && d.status === 'released';
      }
      return false;
    });

    // 2. BAGONG DAGDAG: Filter base sa Document Type Dropdown
    if (filterType !== 'all') {
      result = result.filter(d => d.document_type.toString() === filterType);
    }

    // 3. Filter base sa Search Query
    if (searchQuery) {
      result = result.filter(d => 
        d.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.requested_by_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return result;
  }, [allDocs, activeTab, searchQuery, filterType, user.office]); 
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
        <button onClick={() => setShowTypePicker(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-100 transition-all">
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

        {/* FILTERS & SEARCH BAR */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-fit">
          {/* Document Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500 shadow-sm h-[42px]"
          >
            <option value="all">ALL TYPES</option>
            {docTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name.toUpperCase()}</option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative w-full md:w-64">
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
            <span className="absolute right-4 top-3 opacity-30 text-xs">🔍</span>
          </div>
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
                  {/* Tracking Number Badge */}
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg uppercase tracking-widest shadow-sm border border-blue-100">
                    {doc.tracking_number}
                  </span>

                  {/* Improved Excel Export Button */}
                  <button
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      exportDocumentExcel(doc.id, doc.tracking_number); 
                    }}
                    title="Export to Excel"
                    className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-2 py-1.5 rounded-lg border border-emerald-100 transition-all shadow-sm group/btn active:scale-90"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-3.5 w-3.5 transition-transform group-hover/btn:-translate-y-0.5" 
                      fill="none" viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="text-[9px] font-black uppercase tracking-tighter">EXCEL</span>
                  </button>
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
      {showTypePicker && (
          <DocumentTypePicker
            onClose={() => setShowTypePicker(false)}
            onSelect={(typeId) => { setShowTypePicker(false); setWizardTypeId(typeId); }}
          />
        )}
        {wizardTypeId && (
          <BusinessPermitWizard
            documentTypeId={wizardTypeId}
            onClose={() => setWizardTypeId(null)}
            onCreated={() => { setWizardTypeId(null); loadDocs(); }}
          />
        )}
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