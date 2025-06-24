import '@mantine/core/styles.css';
import { AppShell } from '@mantine/core';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import ActivationPage from './pages/ActivationPage';
import { ServiceRequestPage } from './pages/ServiceRequestPage';
import { MyRequestsPage } from './pages/MyRequestsPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentFailurePage } from './pages/PaymentFailurePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoggedInLayout } from './components/LoggedInLayout';
import { AdminLayout } from './components/AdminLayout';

import { AdminRoute } from './components/AdminRoute';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import ManageServicesPage from './pages/ManageServicesPage';
import { ManageAdminsPage } from './pages/admin/ManageAdminsPage';
import { DashboardPage } from './pages/DashboardPage';
import { RequestServiceListPage } from './pages/RequestServiceListPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { ServiceRequestsPage } from './pages/ServiceRequestsPage';
import { AdminProfilePage } from './pages/AdminProfilePage';
import { SetInitialPasswordPage } from './pages/SetInitialPasswordPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/activate/:uid/:token" element={<ActivationPage />} />
      <Route path="/set-initial-password/:uid/:token" element={<SetInitialPasswordPage />} />
      
      {/* User routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<LoggedInLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/request-service" element={<RequestServiceListPage />} />
          <Route path="/service-request/:serviceId" element={<ServiceRequestPage />} />
          <Route path="/my-requests" element={<MyRequestsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="/payment/success" element={<PaymentSuccessPage />} />
        <Route path="/payment/failure" element={<PaymentFailurePage />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/requests" element={<ServiceRequestsPage />} />
          <Route path="/admin/services" element={<ManageServicesPage />} />
          <Route path="/admin/manage-admins" element={<ManageAdminsPage />} />
          <Route path="/admin/profile" element={<AdminProfilePage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
