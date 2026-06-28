import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import PlaceholderPage from './pages/PlaceholderPage';
import Users from './pages/admin/Users';
import Archive from './pages/admin/Archive';
import Officials from './pages/admin/Officials';


function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Landing />} />

      {/* ADMIN */}
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin/dashboard" element={<PlaceholderPage title="Admin Dashboard" />} />
          <Route path="/admin/document-request" element={<PlaceholderPage title="Document Request" />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/officials" element={<Officials />} />
          <Route path="/admin/archive" element={<Archive />} />
          <Route path="/admin/qr-scan" element={<PlaceholderPage title="QR Code Scan" />} />
        </Route>
      </Route>

      {/* EMPLOYEE */}
      <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/employee/dashboard" element={<PlaceholderPage title="Employee Dashboard" />} />
          <Route path="/employee/qr-scan" element={<PlaceholderPage title="QR Code Scan" />} />
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