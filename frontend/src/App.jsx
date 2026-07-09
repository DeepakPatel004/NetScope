import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Devices from './pages/Devices.jsx';
import AddDevice from './pages/AddDevice.jsx'; 
import DeviceDetails from './pages/DeviceDetails.jsx';
import Settings from './pages/Settings.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/devices/new" element={<AddDevice />} />
          <Route path="/devices/edit/:id" element={<AddDevice />} />
          <Route path="/devices/:id" element={<DeviceDetails />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;