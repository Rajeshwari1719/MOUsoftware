import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '../pages/auth/Login';
import DashboardPage from '../pages/Dashboard';
import MOUsPage from '../pages/MOUs';
import CreateMOUPage from '../pages/CreateMOU';
import EditMOUPage from '../pages/EditMOU';
import MOUDetailsPage from '../pages/MOUDetails';
import InternsPage from '../pages/Interns';
import ProjectsPage from '../pages/Projects';
import DocumentsPage from '../pages/Documents';
import ReportsPage from '../pages/Reports';
import ProfilePage from '../pages/Profile';
import NotFoundPage from '../pages/NotFound';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/mous" element={<MOUsPage />} />
          <Route path="/mous/new" element={<CreateMOUPage />} />
          <Route path="/mous/:id" element={<MOUDetailsPage />} />
          <Route path="/mous/:id/edit" element={<EditMOUPage />} />
          <Route path="/interns" element={<InternsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/notifications" element={<ReportsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
