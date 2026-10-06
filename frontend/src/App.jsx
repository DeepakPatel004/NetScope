import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
const Landing = lazy(() => import('./pages/Landing.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Devices = lazy(() => import('./pages/Devices.jsx'));
const AddDevice = lazy(() => import('./pages/AddDevice.jsx')); 
const DeviceDetails = lazy(() => import('./pages/DeviceDetails.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

const DeviceOverview = lazy(() => import('./pages/device-tabs/DeviceOverview.jsx'));
const DevicePerformance = lazy(() => import('./pages/device-tabs/DevicePerformance.jsx'));
const DeviceSecurity = lazy(() => import('./pages/device-tabs/DeviceSecurity.jsx'));
const DeviceLogs = lazy(() => import('./pages/device-tabs/DeviceLogs.jsx'));

const IncidentsPage = lazy(() => import('./pages/IncidentsPage.jsx'));
const AlertsPage = lazy(() => import('./pages/AlertsPage.jsx'));
const ReportsPage = lazy(() => import('./pages/ReportsPage.jsx'));
const LogsPage = lazy(() => import('./pages/LogsPage.jsx'));
const ProbesPage = lazy(() => import('./pages/ProbesPage.jsx'));
const Documentation = lazy(() => import('./pages/Documentation.jsx'));

import { ToastProvider } from './context/ToastContext.jsx';
import { authService } from './services/auth.service.js';

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
          <Suspense fallback={<div role="status" className="p-8 text-sm text-slate-600">Loading page…</div>}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />

            {/* Protected Routes inside MainLayout */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/devices" element={<Devices />} />
              <Route path="/devices/new" element={<AddDevice />} />
              <Route path="/devices/edit/:id" element={<AddDevice />} />
              <Route path="/monitoring" element={<Navigate to="/dashboard" replace />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/incidents" element={<IncidentsPage />} />
              <Route path="/probes" element={<ProbesPage />} />
              <Route path="/ai" element={<Navigate to="/incidents" replace />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/docs" element={<Documentation />} />
              <Route path="/settings" element={<Settings />} />
              
              <Route path="/devices/:id" element={<DeviceDetails />}>
                <Route index element={<DeviceOverview />} />
                <Route path="host" element={<Navigate to=".." relative="path" replace />} />
                <Route path="performance" element={<DevicePerformance />} />
                <Route path="ai" element={<Navigate to=".." relative="path" replace />} />
                <Route path="security" element={<DeviceSecurity />} />
                <Route path="logs" element={<DeviceLogs />} />
              </Route>
            </Route>

            {/* Wildcard Fallback Route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </Suspense>
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
