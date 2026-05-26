import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import { FaSpinner, FaCommentAlt, FaShieldAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";

const springIn = { type: "spring", stiffness: 300, damping: 26 };

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: springIn },
};

const Inbox = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [inboxChats, setInboxChats] = useState([]);
  const [loading,    setLoading]    = useState(true);

  const isDonor = (user?.activeRole || "donor") === "donor";

  useEffect(() => {
    if (!user) { navigate("/dashboard"); return; }

    const fetchInbox = async (bg = false) => {
      if (!bg) setLoading(true);
      try {
        const { data } = await api.get("/chat/inbox");
        setInboxChats(Array.isArray(data) ? data : []);
      } catch {
        toast.error("Failed to load messages");
      } finally {
        if (!bg) setLoading(false);
      }
    };

    fetchInbox();
    const onPush = () => fetchInbox(true);
    window.addEventListener("new_unread_message", onPush);
    return () => window.removeEventListener("new_unread_message", onPush);
  }, [user, navigate]);

  if (!user) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-pearl-beige font-sans pb-32 md:pb-16">

        {/* ── AURORA HEADER ── */}
        <div className="aurora-header relative px-4 pt-8 pb-16 text-center overflow-hidden">
          <div className="dark-dot-grid absolute inset-0 opacity-20" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 mb-4">
              <FaCommentAlt className="text-white/60 text-[10px]" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Conversations</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
              Your<br />
              <span className="gradient-text-aurora">Inbox</span>
            </h1>
            {inboxChats.length > 0 && !loading && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="mt-3 text-[11px] font-bold text-white/40 uppercase tracking-widest"
              >
                {inboxChats.length} conversation{inboxChats.length !== 1 ? "s" : ""}
              </motion.p>
            )}
          </motion.div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <FaSpinner className="animate-spin text-3xl text-dark-raspberry" />
          </div>
        ) : inboxChats.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="-mt-10 flex flex-col items-center justify-center py-24 text-center px-4"
          >
            <div className="w-20 h-20 rounded-3xl bg-surface border border-dusty-lavender/20 flex items-center justify-center mb-4 shadow-sm">
              <FaCommentAlt className="text-2xl text-dusty-lavender/40" />
            </div>
            <h3 className="text-lg font-black text-pine-teal">No messages yet</h3>
            <p className="text-sm text-dusty-lavender/60 mt-2 max-w-[240px]">
              Your conversations will appear here when you connect with someone.
            </p>
          </motion.div>
        ) : (
          <div className="-mt-10 px-4">
            <div className="bg-surface rounded-3xl border border-pine-teal/8 shadow-sm overflow-hidden">
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="divide-y divide-pine-teal/6">
                <AnimatePresence>
                  {inboxChats.map((chat, idx) => {
                    const hasUnread = chat.unreadCount > 0;
                    return (
                      <motion.div
                        key={idx}
                        variants={rowVariants}
                        onClick={() =>
                          navigate(`/chat/${chat.donationId}_${chat.otherUserId}`, {
                            state: {
                              otherUserId: chat.otherUserId,
                              otherUserName: chat.otherUserName,
                              itemTitle: chat.donationTitle,
                            },
                          })
                        }
                        className="flex items-center gap-3.5 p-4 cursor-pointer hover:bg-surface-2/50 active:bg-surface-2 transition-colors group"
                      >
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-lg uppercase border overflow-hidden transition-transform group-hover:scale-105 ${
                          isDonor
                            ? "bg-pine-teal/10 text-pine-teal border-pine-teal/20"
                            : "bg-dark-raspberry/10 text-dark-raspberry border-dark-raspberry/20"
                        }`}>
                          {chat.otherUserProfilePic ? (
                            <img src={chat.otherUserProfilePic} alt="User" className="w-full h-full object-cover" />
                          ) : chat.otherUserName.charAt(0)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <h3 className={`font-black text-sm truncate pr-2 ${hasUnread ? "text-pine-teal" : "text-pine-teal/80"}`}>
                              {chat.otherUserName}
                            </h3>
                            <span className={`text-[9px] font-bold uppercase tracking-widest shrink-0 ${
                              hasUnread
                                ? isDonor ? "text-pine-teal" : "text-dark-raspberry"
                                : "text-dusty-lavender"
                            }`}>
                              {new Date(chat.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                            </span>
                          </div>

                          <p className="text-[9px] uppercase font-bold text-dusty-lavender tracking-widest flex items-center gap-1 mb-0.5 truncate">
                            <FaShieldAlt className="text-[8px]" /> {chat.donationTitle}
                          </p>

                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-[13px] truncate ${hasUnread ? "text-pine-teal font-bold" : "text-pine-teal/60 font-medium"}`}>
                              {chat.latestMessage}
                            </p>
                            {hasUnread && (
                              <span className={`shrink-0 text-white text-[10px] font-black min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center ${
                                isDonor ? "bg-pine-teal" : "bg-dark-raspberry"
                              }`}>
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Inbox;
