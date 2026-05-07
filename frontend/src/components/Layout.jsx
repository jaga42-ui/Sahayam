// Developed by guruprasad and team
import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import {
  FaHome,
  FaUser,
  FaSignOutAlt,
  FaExchangeAlt,
  FaShieldAlt,
  FaTrophy,
  FaBoxOpen,
  FaEnvelope,
  FaMapMarkerAlt,
  FaWifi,
  FaExclamationTriangle,
  FaTimes,
  FaCommentAlt, // 👉 Imported Feedback Icon
} from "react-icons/fa";

import logo from "../assets/logo.png";
import FeedbackModal from "./FeedbackModal"; // 👉 Imported the Modal
import OnboardingModal from "./OnboardingModal"; // 👉 Imported the Onboarding Modal

const Layout = ({ children }) => {
  const { user, logout, switchRole } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasUnread, setHasUnread] = useState(false);

  // 👉 THE FIX: Added Feedback State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleNewMessage = () => {
      if (!location.pathname.includes("/chat")) setHasUnread(true);
    };
    window.addEventListener("new_unread_message", handleNewMessage);
    return () =>
      window.removeEventListener("new_unread_message", handleNewMessage);
  }, [location.pathname]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`w-full max-w-sm border-l-4 p-4 rounded-xl shadow-[0_10px_30px_rgba(41,82,74,0.1)] flex items-start gap-3 bg-surface ${data.level === "critical"
                ? "border-blazing-flame"
                : "border-pine-teal"
              }`}
          >
            <div
              className={`mt-1 ${data.level === "critical" ? "text-blazing-flame animate-pulse" : "text-pine-teal"}`}
            >
              <FaExclamationTriangle className="text-xl" />
            </div>
            <div className="flex-1">
              <h3
                className={`font-black uppercase tracking-widest text-[10px] mb-1 ${data.level === "critical" ? "text-blazing-flame" : "text-pine-teal"}`}
              >
                Sahayam Broadcast
              </h3>
              <p className="text-sm font-medium leading-relaxed text-pine-teal/80">
                {data.message}
              </p>
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="text-dusty-lavender hover:text-dark-raspberry transition-colors"
            >
              <FaTimes />
            </button>
          </motion.div>
        ),
        {
          duration: data.level === "critical" ? 20000 : 8000,
          position: "top-center",
        },
      );
    });
    return () => socket.disconnect();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isDonor = user?.activeRole === "donor";
  const themeTextAccent = isDonor
    ? "text-blazing-flame"
    : "text-dark-raspberry";
  const themeBgAccent = isDonor ? "bg-blazing-flame" : "bg-dark-raspberry";

  const menuItems = [
    { name: "Feed", path: "/dashboard", icon: <FaHome /> },
    {
      name: "Radar",
      path: "/radar",
      icon: <FaMapMarkerAlt />,
      isSpecial: true,
    },
    {
      name: isDonor ? "Post" : "Request",
      path: "/donations",
      icon: <FaBoxOpen />,
      hideOnMobileBottom: true,
    },
    {
      name: "Ranks",
      path: "/leaderboard",
      icon: <FaTrophy />,
    },
    { name: "Inbox", path: "/chat/inbox", icon: <FaEnvelope /> },
    { name: "Profile", path: "/profile", icon: <FaUser /> },
  ];

  return (
    <div className="h-screen bg-pearl-beige flex flex-col md:flex-row font-sans selection:bg-dark-raspberry selection:text-white overflow-hidden">
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-0 left-0 w-full bg-blazing-flame z-[9999] px-4 py-3 shadow-2xl flex items-center justify-center gap-3"
          >
            <div className="w-8 h-8 bg-surface/20 rounded-full flex items-center justify-center shrink-0">
              <FaWifi className="text-white text-sm animate-pulse" />
            </div>
            <div>
              <p className="text-white font-black text-xs uppercase tracking-widest leading-tight">
                Signal Lost
              </p>
              <p className="text-white/80 text-[10px] font-bold">
                Waiting for network to refresh local emergencies...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- MOBILE TOP BAR ---------------- */}
      <div className="md:hidden bg-surface/80 backdrop-blur-md border-b border-dusty-lavender/30 px-4 py-3 flex justify-between items-center z-50 shrink-0 shadow-sm">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img
            src={logo}
            alt="Sahayam Logo"
            className="h-8 w-auto object-contain drop-shadow-sm"
          />
          <span className="text-xl font-black text-pine-teal italic tracking-tighter">
            SAHA<span className={themeTextAccent}>YAM.</span>
          </span>
        </Link>

        {/* 👉 THE FIX: Added Feedback Button to Mobile Header */}
        <div className="flex items-center gap-2">
          {user && !user.isAdmin && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={switchRole}
              className="p-2.5 rounded-xl bg-pearl-beige border border-dusty-lavender/30 text-pine-teal hover:text-dark-raspberry transition-all shadow-sm"
            >
              <FaExchangeAlt className="text-xs" />
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsFeedbackOpen(true)}
            className="p-2.5 rounded-xl bg-pearl-beige border border-dusty-lavender/30 text-pine-teal hover:text-pine-teal transition-all shadow-sm"
          >
            <FaCommentAlt className="text-xs" />
          </motion.button>
        </div>
      </div>

      {/* ---------------- DESKTOP SIDEBAR ---------------- */}
      <aside className="hidden md:flex flex-col w-72 bg-surface/60 backdrop-blur-xl border-r border-dusty-lavender/30 shrink-0 relative z-40 shadow-xl">
        <div className="h-full flex flex-col pt-8 pb-8 px-6">
          <div className="mb-10 flex justify-center">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <img
                src={logo}
                alt="Sahayam Logo"
                className="h-12 w-auto object-contain group-hover:scale-110 transition-transform duration-500"
              />
              <span className="text-3xl font-black text-pine-teal italic tracking-tighter">
                SAHA<span className={themeTextAccent}>YAM.</span>
              </span>
            </Link>
          </div>

          {user && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="mb-8 bg-surface border border-dusty-lavender/30 rounded-[2rem] p-4 flex items-center gap-4 cursor-pointer shadow-sm"
              onClick={() => navigate("/profile")}
            >
              {user.profilePic ? (
                <img
                  src={user.profilePic}
                  alt="Profile"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-2xl object-cover shadow-sm"
                />
              ) : (
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl uppercase shadow-sm ${themeBgAccent}`}
                >
                  {user.name ? user.name.charAt(0) : "?"}
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-pine-teal font-bold truncate text-sm">
                  {user.name}
                </p>
                <p
                  className={`text-[9px] uppercase font-black tracking-widest mt-0.5 ${themeTextAccent}`}
                >
                  {user.activeRole} Mode
                </p>
              </div>
            </motion.div>
          )}

          <nav className="flex-1 space-y-2 overflow-y-auto no-scrollbar pb-6">
            {user?.isAdmin && (
              <div className="mb-6 pb-6 border-b border-dusty-lavender/20">
                <Link
                  to="/admin"
                  className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all duration-300 border ${location.pathname === "/admin" ? "bg-dark-raspberry/10 text-dark-raspberry border-dark-raspberry/30 shadow-inner" : "bg-transparent text-dusty-lavender border-transparent hover:bg-surface hover:text-pine-teal"}`}
                >
                  <span
                    className={
                      location.pathname === "/admin"
                        ? "text-dark-raspberry"
                        : "text-dusty-lavender"
                    }
                  >
                    <FaShieldAlt />
                  </span>
                  Command Center
                </Link>
              </div>
            )}

            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isRadar = item.path === "/radar";

              let linkClass =
                "bg-transparent border-transparent text-dusty-lavender hover:bg-surface hover:text-pine-teal hover:shadow-sm";
              if (isActive) {
                if (isRadar) {
                  linkClass =
                    "bg-blazing-flame/10 border-blazing-flame/30 text-blazing-flame shadow-inner";
                } else {
                  linkClass = `bg-surface text-pine-teal border-dusty-lavender/30 shadow-md`;
                }
              } else if (isRadar) {
                linkClass =
                  "bg-transparent border-transparent text-blazing-flame/70 hover:bg-surface hover:text-blazing-flame";
              }

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all duration-300 border ${linkClass}`}
                >
                  <div className="relative">
                    <span
                      className={`text-lg ${isActive && !isRadar ? themeTextAccent : isActive ? "text-blazing-flame" : isRadar ? "text-blazing-flame/70" : "text-dusty-lavender"} ${isRadar && !isActive ? "animate-pulse" : ""}`}
                    >
                      {item.icon}
                    </span>
                    {item.name === "Inbox" && hasUnread && !isActive && (
                      <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blazing-flame opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blazing-flame shadow-[0_0_8px_rgba(255,74,28,0.8)]"></span>
                      </span>
                    )}
                  </div>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* 👉 THE FIX: Added Feedback Button to Desktop Sidebar */}
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="mt-auto flex items-center gap-4 px-5 py-3 mb-2 rounded-2xl font-bold text-dusty-lavender hover:bg-surface hover:text-pine-teal transition-all"
          >
            <FaCommentAlt /> Feedback
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-5 py-4 rounded-2xl font-bold text-dusty-lavender hover:bg-surface hover:text-blazing-flame transition-all"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative w-full h-full bg-pearl-beige">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ---------------- MOBILE BOTTOM NAVIGATION ---------------- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-md border-t border-dusty-lavender/30 z-50 px-2 pb-safe shadow-[0_-10px_30px_rgba(132,107,138,0.1)]">
        <nav className="flex justify-around items-center h-16">
          {menuItems
            .filter((item) => !item.hideOnMobileBottom)
            .map((item) => {
              const isActive = location.pathname === item.path;
              const isRadar = item.path === "/radar";

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className="flex flex-col items-center justify-center w-full h-full space-y-1 relative"
                >
                  {isActive && !isRadar && (
                    <motion.div
                      layoutId="mobileNavIndicator"
                      className={`absolute -top-px w-8 h-1 rounded-b-full ${themeBgAccent} shadow-[0_0_10px_currentColor]`}
                    />
                  )}

                  <div className="relative">
                    <motion.div
                      whileTap={{ scale: 0.8 }}
                      className={`text-xl transition-transform duration-300 ${isActive
                          ? isRadar
                            ? "text-blazing-flame scale-110"
                            : `${themeTextAccent} scale-110`
                          : isRadar
                            ? "text-blazing-flame/70 animate-pulse"
                            : "text-dusty-lavender"
                        }`}
                    >
                      {item.icon}
                    </motion.div>
                    {item.name === "Inbox" && hasUnread && !isActive && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blazing-flame opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blazing-flame shadow-[0_0_8px_rgba(255,74,28,0.8)]"></span>
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase tracking-wider ${isActive ? (isRadar ? "text-blazing-flame" : "text-pine-teal") : "text-dusty-lavender"}`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}

          {user?.isAdmin && (
            <Link
              to="/admin"
              className="flex flex-col items-center justify-center w-full h-full space-y-1 relative"
            >
              {location.pathname === "/admin" && (
                <motion.div
                  layoutId="mobileNavIndicator"
                  className="absolute -top-px w-8 h-1 rounded-b-full bg-dark-raspberry shadow-[0_0_10px_currentColor]"
                />
              )}
              <div
                className={`text-xl transition-transform duration-300 ${location.pathname === "/admin" ? "text-dark-raspberry scale-110" : "text-dusty-lavender"}`}
              >
                <FaShieldAlt />
              </div>
              <span
                className={`text-[9px] font-black uppercase tracking-wider ${location.pathname === "/admin" ? "text-pine-teal" : "text-dusty-lavender"}`}
              >
                Admin
              </span>
            </Link>
          )}
        </nav>
      </div>

      {/* 👉 THE FIX: Added Feedback Modal Component */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      <OnboardingModal />
    </div>
  );
};

export default Layout;