// Developed by guruprasad and team
import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { HelmetProvider } from "react-helmet-async";

import Loader from "./components/Loader";
import ErrorBoundary from "./components/ErrorBoundary";
import RouteTransition from "./components/RouteTransition";
import InstallPrompt from "./components/InstallPrompt";

// LAZY LOADED PAGES
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Chat = lazy(() => import("./pages/Chat"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Inbox = lazy(() => import("./pages/Inbox"));
const BloodRadar = lazy(() => import("./pages/BloodRadar"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
          {/* 👉 PREMIUM SAHAYAM TOAST ALERTS */}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(252, 250, 245, 0.94)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                color: '#3b6b54',
                border: '1px solid rgba(59, 107, 84, 0.12)',
                borderRadius: '14px',
                padding: '12px 20px',
                boxShadow: '0 10px 30px rgba(59, 107, 84, 0.10), 0 2px 8px rgba(0,0,0,0.04)',
                fontSize: '13px',
                fontWeight: '600',
                fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif",
                maxWidth: '420px',
              },
              success: {
                iconTheme: { primary: '#3b6b54', secondary: '#ffffff' },
                style: { borderLeft: '3px solid #3b6b54' },
              },
              error: {
                iconTheme: { primary: '#6e4fa0', secondary: '#ffffff' },
                style: { borderLeft: '3px solid #6e4fa0', color: '#5e4585' },
              },
              loading: {
                iconTheme: { primary: '#9a8db5', secondary: '#ffffff' },
              },
            }}
          />

          <RouteTransition />
          <InstallPrompt />
          <ErrorBoundary>
            <Suspense fallback={<Loader fullScreen={true} text="Getting things ready" />}>
              <Routes>
                {/* Public & Auth Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Auth Recovery Routes */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:id/:token" element={<ResetPassword />} />
                <Route path="/verify-email" element={<VerifyEmail />} />

                {/* Main App Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/radar" element={<BloodRadar />} />
                <Route path="/profile" element={<Profile />} />
                
                {/* Chat Routes */}
                <Route path="/chat/inbox" element={<Inbox />} />
                <Route path="/chat/:donationId" element={<Chat />} />
                
                {/* Admin Command Center */}
                <Route path="/admin" element={<AdminDashboard />} />

                {/* Legal Pages */}
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                
                {/* 404 CATCH-ALL ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;