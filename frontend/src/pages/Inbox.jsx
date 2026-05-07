import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import { FaArrowLeft, FaSpinner, FaCommentAlt, FaShieldAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import api from "../utils/api";

const Inbox = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [inboxChats, setInboxChats] = useState([]);
  const [loading, setLoading] = useState(true);

  const localRole = user?.activeRole || "donor";
  const isDonor = localRole === "donor";
  const roleTheme = {
    text: isDonor ? "text-blazing-flame" : "text-dark-raspberry",
    bg: isDonor ? "bg-blazing-flame" : "bg-dark-raspberry",
    border: isDonor ? "border-blazing-flame/30" : "border-dark-raspberry/30",
    shadow: isDonor ? "shadow-[0_10px_25px_rgba(255,74,28,0.3)]" : "shadow-[0_10px_25px_rgba(159,17,100,0.3)]",
    avatarBg: isDonor ? "bg-blazing-flame/10 text-blazing-flame border-blazing-flame/20" : "bg-dark-raspberry/10 text-dark-raspberry border-dark-raspberry/20",
  };

  useEffect(() => {
    if (!user) { navigate("/dashboard"); return; }

    const fetchInbox = async (isBackgroundRefresh = false) => {
      if (!isBackgroundRefresh) setLoading(true);
      try {
        const { data } = await api.get("/chat/inbox");
        setInboxChats(Array.isArray(data) ? data : []);
      } catch (error) { toast.error("Failed to load messages"); } finally {
        if (!isBackgroundRefresh) setLoading(false);
      }
    };

    fetchInbox();

    // 👉 THE INBOX FIX IN ACTION: Instantly re-fetch data upon background push notification 
    const handleRealTimeUpdate = () => fetchInbox(true);
    window.addEventListener("new_unread_message", handleRealTimeUpdate);
    
    return () => window.removeEventListener("new_unread_message", handleRealTimeUpdate);
  }, [user, navigate]);

  if (!user) return null;

  return (
    <Layout>
      <main className="max-w-3xl mx-auto md:px-4 pb-32 md:pb-24 font-sans">
        <header className="mb-6 md:mb-8 pt-6 px-4 md:px-0 flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="text-dusty-lavender hover:text-pine-teal transition-colors bg-surface hover:bg-pearl-beige p-3 md:p-3.5 rounded-full border border-dusty-lavender/30 active:scale-90 shadow-sm">
            <FaArrowLeft className="text-lg md:text-sm" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-pine-teal tracking-tight uppercase leading-none">
              SECURE <span className={roleTheme.text}>INBOX.</span>
            </h1>
          </div>
        </header>

        <section className="bg-surface/70 backdrop-blur-lg border-y md:border border-surface md:rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_rgba(41,82,74,0.08)] min-h-[60vh] relative">
          <div className="relative z-10">
            {loading ? (
              <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
                <FaSpinner className={`animate-spin text-4xl ${roleTheme.text} opacity-80`} />
                <p className="text-dusty-lavender text-[10px] font-black uppercase tracking-[0.3em]">Decrypting...</p>
              </div>
            ) : inboxChats.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-[60vh] text-dusty-lavender px-6 text-center">
                <div className="w-20 h-20 bg-pearl-beige/50 border border-dusty-lavender/30 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <FaCommentAlt className="text-3xl opacity-30 text-pine-teal" />
                </div>
                <p className="font-black uppercase tracking-[0.2em] text-xs text-pine-teal">No Active Comms</p>
                <p className="text-[11px] mt-2 max-w-[250px] font-medium leading-relaxed">
                  Your secure Sahayam communications will appear here once a signal is approved.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-dusty-lavender/20">
                <AnimatePresence>
                  {inboxChats.map((chat, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={idx}
                      onClick={() => navigate(`/chat/${chat.donationId}_${chat.otherUserId}`, {
                        state: { otherUserId: chat.otherUserId, otherUserName: chat.otherUserName, itemTitle: chat.donationTitle },
                      })}
                      className="flex items-center gap-4 p-4 md:p-6 cursor-pointer hover:bg-surface/90 active:bg-pearl-beige transition-colors group"
                    >
                      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-xl overflow-hidden uppercase border ${roleTheme.avatarBg} group-hover:scale-105 transition-transform shadow-sm`}>
                        {chat.otherUserProfilePic ? (
                          <img src={chat.otherUserProfilePic} alt="User" className="w-full h-full object-cover" />
                        ) : ( chat.otherUserName.charAt(0) )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-pine-teal font-black text-[15px] md:text-lg truncate pr-2 leading-tight">
                            {chat.otherUserName}
                          </h3>
                          <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest shrink-0 mt-0.5 ${chat.unreadCount > 0 ? roleTheme.text : "text-dusty-lavender"}`}>
                            {new Date(chat.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>

                        <div className="flex justify-between items-center gap-3">
                          <div className="flex flex-col truncate pr-2">
                            <p className="text-[9px] md:text-[10px] uppercase font-bold text-dusty-lavender tracking-widest flex items-center gap-1 mb-0.5 truncate">
                              <FaShieldAlt className="text-[8px]" /> {chat.donationTitle}
                            </p>
                            <p className={`text-[13px] md:text-sm truncate ${chat.unreadCount > 0 ? "text-pine-teal font-bold" : "text-pine-teal/70 font-medium"}`}>
                              {chat.latestMessage}
                            </p>
                          </div>

                          {chat.unreadCount > 0 && (
                            <span className={`${roleTheme.bg} text-white text-[10px] md:text-[11px] font-black min-w-[24px] h-6 px-1.5 rounded-full flex items-center justify-center flex-shrink-0 ${roleTheme.shadow}`}>
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default Inbox;