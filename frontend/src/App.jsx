// Developed by guruprasad and team
import { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { HelmetProvider } from "react-helmet-async";

import Loader from "./components/Loader";
import ErrorBoundary from "./components/ErrorBoundary";

// LAZY LOADED PAGES
const CreateDonation = lazy(() => import("./pages/CreateDonation"));
const Landing = lazy(() => import("./pages/Landing"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Chat = lazy(() => import("./pages/Chat"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Donations = lazy(() => import("./pages/Donations"));
const BloodBank = lazy(() => import("./pages/BloodBank"));
const Inbox = lazy(() => import("./pages/Inbox"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const BloodRadar = lazy(() => import("./pages/BloodRadar"));
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
              className: 'font-sans font-black tracking-widest', // Forces Sahayam typography
              style: {
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                color: '#29524a', // Pine Teal text
                border: '1px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '2rem', // Pill shape
                padding: '16px 28px',
                boxShadow: '0 20px 40px rgba(41, 82, 74, 0.12)',
                fontSize: '11px',
                textTransform: 'uppercase',
              },
              success: {
                iconTheme: {
                  primary: '#29524a', // Pine Teal
                  secondary: '#ffffff',
                },
                style: {
                  border: '1px solid rgba(41, 82, 74, 0.2)',
                }
              },
              error: {
                iconTheme: {
                  primary: '#ff4a1c', // Blazing Flame
                  secondary: '#ffffff',
                },
                style: {
                  border: '1px solid rgba(255, 74, 28, 0.2)',
                  color: '#ff4a1c',
                }
              }
            }} 
          />

          <ErrorBoundary>
            <Suspense fallback={<Loader fullScreen={true} text="Connecting to Sahayam..." />}>
              <Routes>
                {/* Public & Auth Routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Auth Recovery Routes */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:id/:token" element={<ResetPassword />} />

                {/* Main App Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/radar" element={<BloodRadar />} />
                <Route path="/profile" element={<Profile />} />
                
                {/* Form / Posting Routes */}
                <Route path="/donate" element={<CreateDonation />} /> 
                <Route path="/donations" element={<Donations />} /> 
                <Route path="/blood-bank" element={<BloodBank />} />
                
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