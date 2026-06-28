import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { transitionDocument, lookupDocumentByTracking } from '../../api/axios';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import DocumentStatusBadge from '../../components/admin/DocumentStatusBadge';
import { CameraIcon, CheckCircle2Icon, ScanLineIcon } from '../../components/Icons';

export default function QRScan() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [scannedDoc, setScannedDoc] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // This initialized the scanner
    const scanner = new Html5QrcodeScanner('reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(onScanSuccess, onScanError);

    async function onScanSuccess(decodedText) {
      // decodedText might be "http://localhost:5173/track/QRT-XXXX" 
      // or just "QRT-XXXX"
      
      let trackingNumber = decodedText;
      
      // If it's a URL, extract the part after the last slash
      if (decodedText.includes('/track/')) {
        trackingNumber = decodedText.split('/track/').pop();
      }

      console.log("Extracted Tracking Number:", trackingNumber);
      
      await scanner.clear(); 
      handleProcessScan(trackingNumber);
    }

    function onScanError(err) {
      // Ignore errors during scanning
    }

    return () => {
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, []);

  const handleProcessScan = async (trackingNumber) => {
    setLoading(true);
    try {
      // 1. Find the document by tracking number
      const res = await lookupDocumentByTracking(trackingNumber); 
      const doc = res.data;

      // 2. Perform the scan transition
      const updated = await transitionDocument(doc.id, {
        office: user.office, 
        notes: `Scanned at ${user.office} by ${user.full_name}`
      });

      setScannedDoc(updated.data);
      showToast('Document processed successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error processing QR code.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100">
            <ScanLineIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">QR Scanner</h1>
            <p className="text-slate-500 text-sm">Align the QR code within the frame and scan it automatically.</p>
          </div>
        </div>
        {!scannedDoc && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            Live Camera
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl shadow-blue-900/5 border border-slate-100 overflow-hidden">
        {!scannedDoc ? (
          <div className="p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                <CameraIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Scan a document QR code</p>
                <p className="text-sm text-slate-500">The camera will process the code automatically once it is centered.</p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-blue-600 rounded-tl-xl z-10"></div>
              <div className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-blue-600 rounded-tr-xl z-10"></div>
              <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-blue-600 rounded-bl-xl z-10"></div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-blue-600 rounded-br-xl z-10"></div>

              <div id="reader" className="overflow-hidden rounded-2xl bg-slate-50 min-h-[320px]"></div>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-blue-600 font-semibold">
                <ScanLineIcon className="w-5 h-5 animate-pulse" /> Processing scan...
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8 sm:p-10 modal-pop-in">
            <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-200">
              <CheckCircle2Icon className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Handoff Success</h2>
            <p className="text-blue-600 font-mono font-bold mt-1 tracking-wider bg-blue-50 inline-block px-3 py-1 rounded-lg">
              {scannedDoc.tracking_number}
            </p>

            <div className="mt-8 p-6 bg-slate-50 rounded-3xl text-left border border-slate-100">
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Document</span>
                  <span className="text-slate-900 font-bold text-sm">{scannedDoc.document_type_name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Current Desk</span>
                  <span className="text-blue-700 font-bold text-sm">{scannedDoc.current_office}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Status</span>
                  <DocumentStatusBadge doc={scannedDoc} />
                </div>
              </div>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="mt-10 w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
            >
              <CameraIcon className="w-5 h-5" /> Scan Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
}