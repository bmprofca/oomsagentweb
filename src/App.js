import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";

import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import ServerUnreachable from "./pages/ServerUnreachable";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Ledger from "./pages/Ledger";
import Support from "./pages/Support";
import Task from "./pages/Tasks";
import Services from "./pages/Services";
import Clients from "./pages/Clients";
import ClientCreate from "./pages/ClientCreate";
import ClientProfile from "./pages/ClientProfile";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              {/* Redirect Root to Login */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />

              <Route path="/login" element={<Login />} />

              {/* Server Unreachable Route */}
              <Route path="/server-error" element={<ServerUnreachable />} />

              {/* Routes with MainLayout protected by auth */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/ledger" element={<Ledger />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/task" element={<Task />} />
                  <Route path="/task/ongoing" element={<Task />} />
                  <Route path="/task/completed" element={<Task />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/clients/create" element={<ClientCreate />} />
                  <Route path="/clients/:username" element={<ClientProfile />} />
                </Route>
              </Route>

              {/* 404 Not Found Route */}
              <Route path="/404" element={<NotFound />} />

              {/* Catch all route - redirect to 404 */}
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
