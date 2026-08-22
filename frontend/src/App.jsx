import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Devices from './pages/Devices.jsx';
import AddDevice from './pages/AddDevice.jsx'; 
import DeviceDetails from './pages/DeviceDetails.jsx';
import Settings from './pages/Settings.jsx';

import DeviceOverview from './pages/device-tabs/DeviceOverview.jsx';
import DeviceSSL from './pages/device-tabs/DeviceSSL.jsx';
import DevicePorts from './pages/device-tabs/DevicePorts.jsx';
import DeviceLogs from './pages/device-tabs/DeviceLogs.jsx';
import DeviceAI from './pages/device-tabs/DeviceAI.jsx';

import AIAssistantPage from './pages/AIAssistantPage.jsx';
import IncidentsPage from './pages/IncidentsPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import MonitoringPage from './pages/MonitoringPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import LogsPage from './pages/LogsPage.jsx';
import IntegrationsPage from './pages/IntegrationsPage.jsx';
import Documentation from './pages/Documentation.jsx';

import { ToastProvider } from './context/ToastContext.jsx';
import { authService } from './services/auth.service.js';

// Helper component for public routes (redirects logged-in users to /dashboard)
function PublicOnlyRoute({ children }) {
  if (authService.isAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public Routes (Redirect to /dashboard if logged in) */}
            <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

            {/* Protected Routes inside MainLayout */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/devices/new" element={<AddDevice />} />
              <Route path="/devices/edit/:id" element={<AddDevice />} />
              <Route path="/monitoring" element={<MonitoringPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/incidents" element={<IncidentsPage />} />
              <Route path="/ai" element={<AIAssistantPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/integrations" element={<IntegrationsPage />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/settings" element={<Settings />} />
              
              <Route path="/devices/:id" element={<DeviceDetails />}>
                <Route index element={<DeviceOverview />} />
                <Route path="ssl" element={<DeviceSSL />} />
                <Route path="ports" element={<DevicePorts />} />
                <Route path="logs" element={<DeviceLogs />} />
              </Route>
            </Route>

            {/* Wildcard Fallback Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;