import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import AdminLayout from './layouts/AdminLayout';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import Citizens from './pages/admin/Citizens';
import Agents from './pages/admin/Agents';
import Appointments from './pages/admin/Appointments';
import Departments from './pages/admin/Departments';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';
import AdminReclamations from './pages/admin/AdminReclamations';

import CitizenLayout from './layouts/CitizenLayout';
import DashboardCitizen from './pages/citizen/DashboardCitizen';
import BookAppointment from './pages/citizen/BookAppointment';
import MyAppointments from './pages/citizen/MyAppointments';
import RequestsHistory from './pages/citizen/RequestsHistory';
import CitizenProfile from './pages/citizen/Profile';
import AppointmentDetails from "./pages/citizen/AppointmentDetails";

import AgentLayout from './layouts/AgentLayout';
import DashboardAgent from './pages/agent/DashboardAgent';
import TodayAppointments from './pages/agent/TodayAppointments';
import Schedule from './pages/agent/Schedule';
import AgentAppointments from './pages/agent/AgentAppointments'; // ✔ FIX
import Availability from './pages/agent/Availability';
import AgentProfile from './pages/agent/Profile';
import CreateReclamation from './pages/citizen/CreateReclamation';
import Accueil from './pages/Accueil';
import ResetPassword from './pages/ResetPassword';
import { useEffect } from 'react';
import ChatPopup from './components/ChatPopup';

function App() {
  const [showChat, setShowChat] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowChat(true);
    }, 5000); // Affiche le chat après 5 secondes
    return () => clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Accueil />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardAdmin />} />
            <Route path="citizens" element={<Citizens />} />
            <Route path="agents" element={<Agents />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="departments" element={<Departments />} />
            <Route path="reclamations" element={<AdminReclamations />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route path="/citizen" element={<ProtectedRoute allowedRoles={['citizen']}><CitizenLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardCitizen />} />
            <Route path="book" element={<BookAppointment />} />
            <Route path="appointments" element={<MyAppointments />} />
            <Route path="history" element={<RequestsHistory />} />
            <Route path="profile" element={<CitizenProfile />} />
            <Route path="reclamation" element={<CreateReclamation />} />
            <Route path="/citizen/appointment/:id" element={<AppointmentDetails />}/>
          </Route>

          <Route path="/agent" element={<ProtectedRoute allowedRoles={['agent']}><AgentLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardAgent />} />
            <Route path="today" element={<TodayAppointments />} />
            <Route path="schedule" element={<Schedule />} />
            <Route path="appointments" element={<AgentAppointments />} />
            <Route path="availability" element={<Availability />} />
            <Route path="profile" element={<AgentProfile />} />
          </Route>

        </Routes>
        {showChat && <ChatPopup />}
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
