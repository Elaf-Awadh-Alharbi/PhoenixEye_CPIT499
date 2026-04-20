import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import ReportsList from "./pages/reports/ReportsList";
import ReportDetails from "./pages/reports/ReportDetails";
import DronesList from "./pages/drones/DronesList";
import DroneDetails from "./pages/drones/DroneDetails";
import AnalyticsDashboard from "./pages/analytics/AnalyticsDashboard";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ReportsList />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <ReportDetails />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/drones"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <DronesList />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/drones/:id"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <DroneDetails />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <AnalyticsDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;