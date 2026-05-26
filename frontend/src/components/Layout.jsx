import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import {
  FaHome, FaUser, FaSignOutAlt, FaExchangeAlt, FaShieldAlt,
  FaTrophy, FaBoxOpen, FaEnvelope, FaMapMarkerAlt,
  FaWifi, FaExclamationTriangle, FaTimes, FaCommentAlt,
} from "react-icons/fa";
import logo from "../assets/logo.png";
import FeedbackModal from "./FeedbackModal";
import OnboardingModal from "./OnboardingModal";

const Layout = ({ children }) => {
  const { user, logout, switchRole } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [isOffline, setIsOffline]       = useState(!navigator.onLine);
  const [hasUnread, setHasUnread]       = useState(false);
  const [isFeedbackOpen, setIsFeedback] = useState(false);

  useEffect(() => {
    const up   = () => setIsOffline(false);
    const down = () => setIsOffline(true);
    window.addEventListener("online",  up);
    window.addEventListener("offline", down);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); };
  }, []);

  useEffect(() => {
    const handler = () => { if (!location.pathname.includes("/chat")) setHasUnread(true); };
    window.addEventListener("new_unread_message", handler);
    return () => window.removeEventListener("new_unread_message", handler);
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname.includes("/chat")) setHasUnread(false);
  }, [location.pathname]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL || "https://hopelink-api.onrender.com", {
      transports: ["websocket", "polling"],
    });
    socket.on("global_alert", (data) => {
      toast.custom(
        (t) => (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`w-full max-w-sm border-l-4 p-4 rounded-2xl shadow-2xl flex items-start gap-3 bg-surface ${
              data.level === "critical" ? "border-blazing-flame" : "border-pine-teal"
            }`}
          >
            <div className={`mt-0.5 ${data.level === "critical" ? "text-blazing-flame animate-pulse" : "text-pine-teal"}`}>
              <FaExclamationTriangle className="text-lg" />
            </div>
            <div className="flex-1">
              <h3 className={`font-black uppercase tracking-widest text-[10px] mb-1 ${data.level === "critical" ? "text-blazing-flame" : "text-pine-teal"}`}>
                Sahayam Broadcast
              </h3>
              <p className="text-sm font-medium leading-relaxed text-pine-teal/75">{data.message}</p>
            </div>
            <button onClick={() => toast.dismiss(t.id)} className="text-dusty-lavender hover:text-dark-raspberry transition-colors mt-0.5">
              <FaTimes />
            </button>
          </motion.div>
        ),
        { duration: data.level === "critical" ? 20000 : 8000, position: "top-center" },
      );
    });
    return () => socket.disconnect();
  }, []);

  const isDonor        = user?.activeRole === "donor";
  const accentText     = isDonor ? "text-blazing-flame" : "text-dark-raspberry";
  const accentBg       = isDonor ? "bg-blazing-flame"   : "bg-dark-raspberry";

  const menuItems = [
    { name: "Feed",     path: "/dashboard",  icon: <FaHome /> },
    { name: "Radar",    path: "/radar",       icon: <FaMapMarkerAlt />, isSpecial: true },
    { name: isDonor ? "Post" : "Request", path: "/donations", icon: <FaBoxOpen />, hideOnMobileBottom: true },
    { name: "Ranks",    path: "/leaderboard", icon: <FaTrophy /> },
    { name: "Inbox",    path: "/chat/inbox",  icon: <FaEnvelope /> },
    { name: "Profile",  path: "/profile",     icon: <FaUser /> },
  ];

  const NavLink = ({ item }) => {
    const isActive = location.pathname === item.path;
    const isRadar  = item.path === "/radar";

    const base = "flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200";
    const active   = isRadar
      ? "bg-blazing-flame/12 text-blazing-flame border border-blazing-flame/25"
      : "bg-surface-2 text-pine-teal shadow-sm border border-pine-teal/10";
    const inactive = isRadar
      ? "text-blazing-flame/60 hover:bg-surface-2 hover:text-blazing-flame border border-transparent"
      : "text-dusty-lavender hover:bg-surface-2 hover:text-pine-teal border border-transparent";

    return (
      <Link to={item.path} className={`${base} ${isActive ? active : inactive}`}>
        <div className="relative shrink-0">
          <span className={`text-base ${
            isActive ? (isRadar ? "text-blazing-flame" : accentText) :
            isRadar ? "text-blazing-flame/60 animate-pulse" : "text-dusty-lavender"
          }`}>
            {item.icon}
          </span>
          {item.name === "Inbox" && hasUnread && !isActive && (
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-blazing-flame opacity-75" />
              <span className="relative h-2 w-2 rounded-full bg-blazing-flame" />
            </span>
          )}
        </div>
        {item.name}
      </Link>
    );
  };

  return (
    <div className="h-screen bg-pearl-beige flex flex-col md:flex-row font-sans selection:bg-dark-raspberry selection:text-white overflow-hidden">

      {/* Offline banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -48, opacity: 0 }}
            className="fixed top-0 left-0 w-full bg-blazing-flame z-[9999] px-4 py-2.5 flex items-center justify-center gap-3"
          >
            <FaWifi className="text-white animate-pulse" />
            <p className="text-white font-black text-xs uppercase tracking-widest">Signal Lost — waiting for network…</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOBILE TOP BAR ── */}
      <div className="md:hidden bg-surface/85 backdrop-blur-xl border-b border-pine-teal/10 px-4 py-3 flex justify-between items-center z-50 shrink-0 shadow-sm">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="Sahayam" className="h-8 w-auto" />
          <span className="text-xl font-black italic tracking-tighter text-pine-teal">
            SAHA<span className={accentText}>YAM.</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {user && !user.isAdmin && (
            <motion.button whileTap={{ scale: 0.88 }} onClick={switchRole}
              className="p-2.5 rounded-xl bg-surface-2 border border-pine-teal/10 text-pine-teal hover:border-pine-teal/25 transition-all">
              <FaExchangeAlt className="text-xs" />
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.88 }} onClick={() => setIsFeedback(true)}
            className="p-2.5 rounded-xl bg-surface-2 border border-pine-teal/10 text-pine-teal hover:border-pine-teal/25 transition-all">
            <FaCommentAlt className="text-xs" />
          </motion.button>
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-64 bg-surface/85 backdrop-blur-xl border-r border-pine-teal/10 shrink-0 z-40 shadow-lg">
        <div className="flex flex-col h-full px-5 py-6">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 mb-7 group">
            <img src={logo} alt="Sahayam" className="h-9 w-auto group-hover:scale-110 transition-transform duration-300" />
            <span className="text-2xl font-black italic tracking-tighter text-pine-teal">
              SAHA<span className={accentText}>YAM.</span>
            </span>
          </Link>

          {/* Profile card */}
          {user && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/profile")}
              className="mb-6 w-full flex items-center gap-3 p-3.5 rounded-2xl border border-pine-teal/10 bg-surface-2 hover:border-pine-teal/20 hover:shadow-sm transition-all text-left"
            >
              {user.profilePic ? (
                <img src={user.profilePic} alt="Profile" referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-xl object-cover border border-pine-teal/10 shrink-0" />
              ) : (
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base uppercase shrink-0 ${accentBg}`}>
                  {user.name?.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-pine-teal truncate leading-tight">{user.name}</p>
                <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${accentText}`}>
                  {user.activeRole} mode
                </p>
              </div>
            </motion.button>
          )}

          {/* Admin link */}
          {user?.isAdmin && (
            <div className="mb-4 pb-4 border-b border-pine-teal/10">
              <Link to="/admin"
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all border ${
                  location.pathname === "/admin"
                    ? "bg-dark-raspberry/10 text-dark-raspberry border-dark-raspberry/20"
                    : "text-dusty-lavender hover:bg-surface-2 hover:text-pine-teal border-transparent"
                }`}>
                <FaShieldAlt /> Admin Console
              </Link>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
            {menuItems.map((item) => <NavLink key={item.name} item={item} />)}
          </nav>

          {/* Bottom actions */}
          <div className="mt-4 pt-4 border-t border-pine-teal/10 space-y-1">
            <button onClick={() => setIsFeedback(true)}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold text-dusty-lavender hover:bg-surface-2 hover:text-pine-teal transition-all border border-transparent">
              <FaCommentAlt /> Feedback
            </button>
            <button onClick={() => { logout(); navigate("/"); }}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold text-dusty-lavender hover:bg-surface-2 hover:text-blazing-flame transition-all border border-transparent">
              <FaSignOutAlt /> Log Out
            </button>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative w-full h-full bg-pearl-beige">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/92 backdrop-blur-xl border-t border-pine-teal/10 z-50 shadow-[0_-8px_24px_rgba(29,74,66,0.08)]">
        <nav className="flex justify-around items-center h-16 px-2">
          {menuItems.filter((i) => !i.hideOnMobileBottom).map((item) => {
            const isActive = location.pathname === item.path;
            const isRadar  = item.path === "/radar";
            return (
              <Link key={item.name} to={item.path}
                className="flex flex-col items-center justify-center w-full h-full gap-1 relative">
                {isActive && !isRadar && (
                  <motion.div layoutId="mobileNavBar"
                    className={`absolute -top-px w-6 h-0.5 rounded-b-full ${accentBg}`} />
                )}
                <motion.div whileTap={{ scale: 0.8 }}
                  className={`text-xl transition-all duration-200 ${
                    isActive ? (isRadar ? "text-blazing-flame" : accentText) :
                    isRadar ? "text-blazing-flame/60 animate-pulse" : "text-dusty-lavender"
                  }`}>
                  <div className="relative">
                    {item.icon}
                    {item.name === "Inbox" && hasUnread && !isActive && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-blazing-flame opacity-75" />
                        <span className="relative h-2 w-2 rounded-full bg-blazing-flame" />
                      </span>
                    )}
                  </div>
                </motion.div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${
                  isActive ? (isRadar ? "text-blazing-flame" : "text-pine-teal") : "text-dusty-lavender"
                }`}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          {user?.isAdmin && (
            <Link to="/admin" className="flex flex-col items-center justify-center w-full h-full gap-1 relative">
              {location.pathname === "/admin" && (
                <motion.div layoutId="mobileNavBar" className="absolute -top-px w-6 h-0.5 rounded-b-full bg-dark-raspberry" />
              )}
              <div className={`text-xl ${location.pathname === "/admin" ? "text-dark-raspberry" : "text-dusty-lavender"}`}>
                <FaShieldAlt />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider ${location.pathname === "/admin" ? "text-pine-teal" : "text-dusty-lavender"}`}>
                Admin
              </span>
            </Link>
          )}
        </nav>
      </div>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedback(false)} />
      <OnboardingModal />
    </div>
  );
};

export default Layout;
