import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
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
import AIAssistantPage from './pages/AIAssistantPage.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/devices/new" element={<AddDevice />} />
          <Route path="/devices/edit/:id" element={<AddDevice />} />
          <Route path="/ai" element={<AIAssistantPage />} />
          
          <Route path="/devices/:id" element={<DeviceDetails />}>
            <Route index element={<DeviceOverview />} />
            <Route path="ssl" element={<DeviceSSL />} />
            <Route path="ports" element={<DevicePorts />} />
            <Route path="logs" element={<DeviceLogs />} />
          </Route>

          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;