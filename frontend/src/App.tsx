import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import './global.css';
import { MantineProvider, createTheme, MantineTheme } from '@mantine/core';
import { Routes, Route } from 'react-router-dom';
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
import { TestFileUploadPage } from './pages/TestFileUploadPage';

const glassStyle = {
  backgroundColor: 'rgba(10, 20, 40, 0.65)',
  backdropFilter: 'blur(10px) saturate(120%)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
};

const inputGlassStyle = (theme: MantineTheme) => ({
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  border: `1px solid ${theme.colors.blue[9]}`,
  color: 'white',
  '&::placeholder': {
    color: theme.colors.gray[5],
  },
});

const theme = createTheme({
  components: {
    Paper: {
      styles: { root: glassStyle },
    },
    Card: {
      styles: { root: glassStyle },
    },
    Modal: {
      styles: {
        content: glassStyle,
        header: { backgroundColor: 'transparent' },
      },
    },
    Table: {
      styles: (theme: MantineTheme) => ({
        thead: {
          backgroundColor: 'rgba(10, 20, 40, 0.75)',
          backdropFilter: 'blur(10px)',
        },
        tr: {
          borderBottom: `1px solid ${theme.colors.dark[4]}`,
        },
        th: {
          color: theme.colors.gray[3],
        },
      }),
    },
    TextInput: {
      styles: (theme: MantineTheme) => ({
        input: inputGlassStyle(theme),
        label: { color: theme.colors.gray[3] },
      }),
    },
    PasswordInput: {
      styles: (theme: MantineTheme) => ({
        input: inputGlassStyle(theme),
        label: { color: theme.colors.gray[3] },
      }),
    },
    Select: {
      styles: (theme: MantineTheme) => ({
        input: inputGlassStyle(theme),
        label: { color: theme.colors.gray[3] },
      }),
    },
    Textarea: {
      styles: (theme: MantineTheme) => ({
        input: inputGlassStyle(theme),
        label: { color: theme.colors.gray[3] },
      }),
    },
  },
});

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/activate/:uid/:token" element={<ActivationPage />} />
        <Route path="/set-initial-password/:uid/:token" element={<SetInitialPasswordPage />} />
        <Route path="/test-file-upload" element={<TestFileUploadPage />} />

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
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="requests" element={<ServiceRequestsPage />} />
            <Route path="services" element={<ManageServicesPage />} />
            <Route path="manage-admins" element={<ManageAdminsPage />} />
            <Route path="profile" element={<AdminProfilePage />} />
            <Route path="test-file-upload" element={<TestFileUploadPage />} />
          </Route>
        </Route>
      </Routes>
    </MantineProvider>
  );
}

export default App;
