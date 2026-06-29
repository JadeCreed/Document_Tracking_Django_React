import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import PlaceholderPage from './pages/PlaceholderPage';
import Users from './pages/admin/Users';
import Archive from './pages/admin/Archive';
import Officials from './pages/admin/Officials';
import DocumentRequest from './pages/admin/DocumentRequest';
import QRScan from './pages/admin/QRScan';
import OfficeDocuments from './pages/employee/OfficeDocuments';
import PublicTrack from './pages/PublicTrack';
import AdminDashboard from './pages/admin/AdminDashboard';
import Heatmap from './pages/admin/Heatmap';
import DocumentTypes from './pages/admin/DocumentTypes';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Landing />} />
      <Route path="/track/:trackingNumber" element={<PublicTrack />} />

      {/* ADMIN */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/heatmap" element={<Heatmap />} /> 

          <Route path="/admin/document-types" element={<DocumentTypes />} />
          
          <Route path="/admin/document-request" element={<DocumentRequest />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/officials" element={<Officials />} />
          <Route path="/admin/archive" element={<Archive />} />
          <Route path="/admin/qr-scan" element={<QRScan />} />
        </Route>
      </Route>

      {/* EMPLOYEE */}
      <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/employee/dashboard" element={<PlaceholderPage title="Employee Dashboard" />} />
           <Route path="/employee/documents" element={<OfficeDocuments />} />
          <Route path="/employee/qr-scan" element={<QRScan />} />
        </Route>
      </Route>

      {/* CITIZEN */}
      <Route element={<ProtectedRoute allowedRoles={['citizen']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/citizen/home" element={<PlaceholderPage title="Home" />} />
          <Route path="/citizen/history" element={<PlaceholderPage title="History" />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;