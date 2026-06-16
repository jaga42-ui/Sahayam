import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import {
  FaHome, FaUser, FaSignOutAlt, FaExchangeAlt, FaShieldAlt,
  FaEnvelope, FaMapMarkerAlt,
  FaWifi, FaExclamationTriangle, FaTimes, FaCommentAlt,
} from "react-icons/fa";
import logo from "../assets/logo.png";
import FeedbackModal from "./FeedbackModal";
import OnboardingModal from "./OnboardingModal";

const NAV_ITEMS = [
  { name: "Feed",     path: "/dashboard",  icon: FaHome },
  { name: "Radar",    path: "/radar",       icon: FaMapMarkerAlt, isSpecial: true },
  { name: "Inbox",    path: "/chat/inbox",  icon: FaEnvelope },
  { name: "Profile",  path: "/profile",     icon: FaUser },
];

const springTransition = { type: "spring", stiffness: 320, damping: 28 };

const Layout = ({ children }) => {
  const { user, logout, switchRole } = useContext(AuthContext);
  const location  = useLocation();
  const navigate  = useNavigate();

  const [isOffline,     setIsOffline]     = useState(!navigator.onLine);
  const [hasUnread,     setHasUnread]     = useState(false);
  const [isFeedbackOpen, setIsFeedback]   = useState(false);

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
    const socket = io(import.meta.env.VITE_BACKEND_URL || "https://sahayam-api.onrender.com", {
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

  const isDonor    = user?.activeRole === "donor";
  const accentText = isDonor ? "text-blazing-flame" : "text-dark-raspberry";
  const accentBg   = isDonor ? "bg-blazing-flame"   : "bg-dark-raspberry";

  /* ── Sidebar NavLink ── */
  const SideNavLink = ({ item }) => {
    const isActive  = location.pathname === item.path;
    const isRadar   = item.path === "/radar";
    const Icon      = item.icon;

    return (
      <Link to={item.path}>
        <motion.div
          whileHover={{ x: 3 }}
          whileTap={{ scale: 0.96 }}
          className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-colors relative overflow-hidden ${
            isActive
              ? isRadar
                ? "bg-blazing-flame/15 text-blazing-flame"
                : "text-pine-teal"
              : isRadar
                ? "text-blazing-flame/70 hover:bg-surface-2 hover:text-blazing-flame"
                : "text-pine-teal/55 hover:bg-surface-2 hover:text-pine-teal"
          }`}
        >
          {isActive && !isRadar && (
            <motion.div
              layoutId="sidebarActive"
              className="absolute inset-0 rounded-2xl bg-pine-teal/10 border border-pine-teal/15"
              transition={springTransition}
            />
          )}
          <div className="relative shrink-0">
            <Icon className={`text-base ${
              isActive ? (isRadar ? "text-blazing-flame" : "text-pine-teal") :
              isRadar ? "text-blazing-flame/50 animate-pulse" : "text-pine-teal/40"
            }`} />
            {item.name === "Inbox" && hasUnread && !isActive && (
              <span className="absolute -top-1 -right-1 flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-blazing-flame opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-blazing-flame" />
              </span>
            )}
          </div>
          <span className="relative">{item.name}</span>
          {isActive && !isRadar && (
            <motion.div layoutId="sidebarDot" className="ml-auto w-1.5 h-1.5 rounded-full bg-pine-teal/50" transition={springTransition} />
          )}
        </motion.div>
      </Link>
    );
  };

  return (
    <div className="h-screen bg-pearl-beige flex flex-col md:flex-row font-sans selection:bg-dark-raspberry selection:text-white overflow-hidden">

      {/* ── Offline banner ── */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -48, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -48, opacity: 0 }}
            className="fixed top-0 left-0 w-full bg-blazing-flame z-[9999] px-4 py-2.5 flex items-center justify-center gap-3"
          >
            <FaWifi className="text-white animate-pulse" />
            <p className="text-white font-semibold text-xs tracking-wide">You're offline — we'll reconnect you automatically</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════
          MOBILE TOP BAR
      ══════════════════════════════════ */}
      <div className="md:hidden bg-surface/90 backdrop-blur-xl border-b border-pine-teal/10 px-4 py-3 flex justify-between items-center z-50 shrink-0 shadow-sm">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="Sahayam" className="h-8 w-auto" />
          <span className="font-display text-xl font-semibold italic tracking-tightest text-pine-teal">
            Saha<span className={accentText}>yam</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {user && !user.isAdmin && (
            <motion.button whileTap={{ scale: 0.85 }} onClick={switchRole}
              className="h-9 w-9 flex items-center justify-center rounded-xl bg-surface-2 border border-pine-teal/10 text-pine-teal">
              <FaExchangeAlt className="text-xs" />
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => setIsFeedback(true)}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-surface-2 border border-pine-teal/10 text-pine-teal">
            <FaCommentAlt className="text-xs" />
          </motion.button>
        </div>
      </div>

      {/* ══════════════════════════════════
          DESKTOP SIDEBAR (dark aurora)
      ══════════════════════════════════ */}
      <aside className="hidden md:flex flex-col w-60 bg-surface border-r border-border shrink-0 z-40 shadow-[0_0_40px_rgba(59,107,84,0.06)]">
        <div className="relative z-10 flex flex-col h-full px-4 py-6">

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 mb-7 group px-1">
            <motion.img
              whileHover={{ scale: 1.08, rotate: -3 }}
              src={logo} alt="Sahayam"
              className="h-9 w-auto"
            />
            <span className="font-display text-2xl font-semibold italic tracking-tightest text-pine-teal">
              Saha<span className="text-dark-raspberry">yam</span>
            </span>
          </Link>

          {/* Profile chip */}
          {user && (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/profile")}
              className="mb-5 w-full flex items-center gap-3 p-3 rounded-2xl border border-border bg-surface-2 hover:bg-pearl-beige transition-all text-left"
            >
              {user.profilePic ? (
                <img src={user.profilePic} alt="Profile" referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-xl object-cover border border-border shrink-0" />
              ) : (
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm uppercase shrink-0 ${accentBg}`}>
                  {user.name?.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-pine-teal truncate leading-tight">{user.name}</p>
                <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${accentText}`}>
                  {user.activeRole} mode
                </p>
              </div>
              {!user.isAdmin && (
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={(e) => { e.stopPropagation(); switchRole(); }}
                  className="ml-auto shrink-0 h-7 w-7 flex items-center justify-center rounded-lg bg-pearl-beige hover:bg-surface-2 text-pine-teal/50 hover:text-pine-teal transition-all"
                >
                  <FaExchangeAlt className="text-[10px]" />
                </motion.button>
              )}
            </motion.button>
          )}

          {/* Admin link */}
          {user?.isAdmin && (
            <div className="mb-4 pb-4 border-b border-border">
              <Link to="/admin">
                <motion.div whileHover={{ x: 3 }} whileTap={{ scale: 0.96 }}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold transition-all ${
                    location.pathname === "/admin"
                      ? "bg-dark-raspberry/12 text-dark-raspberry border border-dark-raspberry/25"
                      : "text-pine-teal/55 hover:bg-surface-2 hover:text-pine-teal"
                  }`}>
                  <FaShieldAlt /> Admin Console
                </motion.div>
              </Link>
            </div>
          )}

          {/* Nav */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto no-scrollbar">
            {NAV_ITEMS.map((item) => <SideNavLink key={item.name} item={item} />)}
          </nav>

          {/* Subtle dot grid overlay */}
          <div className="pointer-events-none absolute inset-0 landing-dot-grid opacity-40 rounded-none" />

          {/* Bottom actions */}
          <div className="relative z-10 mt-4 pt-4 border-t border-border space-y-0.5">
            <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.96 }}
              onClick={() => setIsFeedback(true)}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold text-pine-teal/45 hover:bg-surface-2 hover:text-pine-teal transition-all">
              <FaCommentAlt className="text-base" /> Feedback
            </motion.button>
            <motion.button whileHover={{ x: 3 }} whileTap={{ scale: 0.96 }}
              onClick={() => { logout(); navigate("/"); }}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-sm font-bold text-pine-teal/45 hover:bg-blazing-flame/10 hover:text-blazing-flame transition-all">
              <FaSignOutAlt className="text-base" /> Log Out
            </motion.button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════ */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative w-full h-full bg-pearl-beige">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ══════════════════════════════════
          MOBILE BOTTOM NAV
      ══════════════════════════════════ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Frosted glass bar */}
        <div className="bg-surface/94 backdrop-blur-2xl border-t border-pine-teal/8 shadow-[0_-12px_40px_rgba(59,107,84,0.10)]">
          <nav className="flex justify-around items-center h-16 px-1 relative">
            {NAV_ITEMS.filter((i) => !i.hideOnMobileBottom).map((item) => {
              const isActive = location.pathname === item.path;
              const isRadar  = item.path === "/radar";
              const Icon     = item.icon;

              return (
                <Link key={item.name} to={item.path}
                  className="flex flex-col items-center justify-center w-full h-full gap-1 relative">

                  {/* Active top bar indicator */}
                  {isActive && !isRadar && (
                    <motion.div
                      layoutId="mobileNavIndicator"
                      className={`absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full ${accentBg}`}
                      transition={springTransition}
                    />
                  )}

                  {/* Icon with spring tap */}
                  <motion.div
                    whileTap={{ scale: 0.72, rotate: isRadar ? 15 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="relative"
                  >
                    <Icon className={`text-xl transition-all duration-200 ${
                      isActive
                        ? isRadar ? "text-blazing-flame" : (isDonor ? "text-blazing-flame" : "text-dark-raspberry")
                        : isRadar ? "text-blazing-flame/50 animate-pulse" : "text-dusty-lavender"
                    }`} />
                    {item.name === "Inbox" && hasUnread && !isActive && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute h-full w-full rounded-full bg-blazing-flame opacity-75" />
                        <span className="relative h-2 w-2 rounded-full bg-blazing-flame" />
                      </span>
                    )}
                  </motion.div>

                  <span className={`text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                    isActive
                      ? isRadar ? "text-blazing-flame" : "text-pine-teal"
                      : "text-dusty-lavender/70"
                  }`}>
                    {item.name}
                  </span>
                </Link>
              );
            })}

            {user?.isAdmin && (
              <Link to="/admin" className="flex flex-col items-center justify-center w-full h-full gap-1 relative">
                {location.pathname === "/admin" && (
                  <motion.div layoutId="mobileNavIndicator" className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-dark-raspberry" transition={springTransition} />
                )}
                <motion.div whileTap={{ scale: 0.72 }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                  <FaShieldAlt className={`text-xl ${location.pathname === "/admin" ? "text-dark-raspberry" : "text-dusty-lavender"}`} />
                </motion.div>
                <span className={`text-[9px] font-black uppercase tracking-wider ${location.pathname === "/admin" ? "text-pine-teal" : "text-dusty-lavender/70"}`}>
                  Admin
                </span>
              </Link>
            )}
          </nav>
        </div>
      </div>

      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedback(false)} />
      <OnboardingModal />
    </div>
  );
};

export default Layout;
