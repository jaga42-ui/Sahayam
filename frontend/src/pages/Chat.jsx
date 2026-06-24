import { useState, useEffect, useContext, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import EmojiPicker from "emoji-picker-react";
import {
  FaPaperPlane,
  FaArrowLeft,
  FaSpinner,
  FaSmile,
  FaCheckDouble,
  FaCheck,
  FaChevronDown,
  FaTimes,
  FaEdit,
  FaTrash,
  FaShieldAlt,
  FaMapMarkerAlt,
  FaQrcode,
  FaEllipsisV,
  FaBan,
  FaFlag,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";

const Chat = () => {
  const { user, socket } = useContext(AuthContext);
  const { donationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const otherUserId = location.state?.otherUserId;
  const otherUserName = location.state?.otherUserName || "Community Member";
  const itemTitle = location.state?.itemTitle || "Sahayam Listing";

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEmojis, setShowEmojis] = useState(false);

  const [editingMessage, setEditingMessage] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [showHandshake, setShowHandshake] = useState(false);
  const [handshake, setHandshake] = useState(null); // { role, code, status }
  const [pinInput, setPinInput] = useState("");
  const [completing, setCompleting] = useState(false);

  const isDirectChat = String(donationId || "").startsWith("direct");
  const realDonationId = String(donationId || "").includes("_")
    ? String(donationId).split("_")[0]
    : donationId;
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reporting, setReporting] = useState(false);

  const messagesEndRef = useRef(null);

  const localRole = user?.activeRole || "donor";
  const isDonor = localRole === "donor";
  const roleTheme = {
    primaryGradient: isDonor
      ? "from-pine-teal to-[#1a3630]"
      : "from-dark-raspberry to-[#5e4585]",
    buttonBg: isDonor
      ? "bg-pine-teal hover:bg-[#1a3630]"
      : "bg-dark-raspberry hover:bg-[#5e4585]",
    text: isDonor ? "text-pine-teal" : "text-dark-raspberry",
    border: isDonor ? "border-pine-teal/30" : "border-dark-raspberry/30",
    shadow: isDonor
      ? "shadow-[0_10px_25px_rgba(59,107,84,0.3)]"
      : "shadow-[0_10px_25px_rgba(110,79,160,0.3)]",
    avatarBg: isDonor
      ? "bg-pine-teal/10 text-pine-teal"
      : "bg-dark-raspberry/10 text-dark-raspberry",
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    if (!user || !otherUserId || !socket) {
      if (!socket) return;
      navigate("/dashboard");
      return;
    }

    socket.emit("join_chat", { userId: user._id, donationId });

    const fetchHistoryAndMarkRead = async () => {
      try {
        const { data } = await api.get(`/chat/${donationId}`);
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
        await api.put(`/chat/${donationId}/read`);
        socket.emit("mark_as_read", {
          donationId,
          receiverId: otherUserId,
          readerId: user._id,
        });
        scrollToBottom();
      } catch (error) {
        setMessages([]);
        setLoading(false);
      }
    };

    fetchHistoryAndMarkRead();

    socket.on("receive_message", (message) => {
      setMessages((prev) => {
        if (Array.isArray(prev) && prev.some((m) => m._id === message._id))
          return prev;
        return [...(Array.isArray(prev) ? prev : []), message];
      });
      if (message.sender !== user._id)
        socket.emit("mark_as_read", {
          donationId,
          receiverId: otherUserId,
          readerId: user._id,
        });
      scrollToBottom();
    });

    socket.on("messages_read", ({ readerId }) => {
      if (readerId !== user._id) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === user._id ? { ...msg, read: true } : msg,
          ),
        );
      }
    });

    socket.on("message_edited", (updatedMsg) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === updatedMsg._id ? updatedMsg : msg)),
      );
    });

    socket.on("message_deleted", (deletedId) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== deletedId));
    });

    socket.on("chat_terminated", (data) => {
      toast.success(
        data.message || "Support completed. Closing chat...",
        {
          duration: 4000,
          icon: "✅",
          style: {
            background: "#ffffff",
            color: "#3b6b54",
            border: "1px solid #3b6b54",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          },
        },
      );
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    });

    return () => {
      socket.off("receive_message");
      socket.off("messages_read");
      socket.off("message_edited");
      socket.off("message_deleted");
      socket.off("chat_terminated");
    };
  }, [user, donationId, otherUserId, navigate, socket]);

  const onEmojiClick = (emojiObject) => {
    setNewMessage((prevInput) => prevInput + emojiObject.emoji);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setShowEmojis(false);

    if (editingMessage) {
      const tempEditedMsg = { ...editingMessage, content: messageContent };
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === editingMessage._id ? tempEditedMsg : msg,
        ),
      );
      setEditingMessage(null);

      try {
        const { data } = await api.put(`/chat/${editingMessage._id}`, {
          content: messageContent,
        });
        socket.emit("edit_message", data);
        setMessages((prev) =>
          prev.map((msg) => (msg._id === data._id ? data : msg)),
        );
      } catch (error) {
        toast.error("Failed to edit message");
      }
    } else {
      const tempId = `temp_${Date.now()}`;
      const tempMsg = {
        _id: tempId,
        content: messageContent,
        sender: user._id,
        receiver: otherUserId,
        createdAt: new Date().toISOString(),
        read: false,
        isSending: true,
      };

      setMessages((prev) => [...(Array.isArray(prev) ? prev : []), tempMsg]);
      scrollToBottom();

      try {
        const messageData = {
          receiverId: otherUserId,
          donationId,
          content: messageContent,
        };
        const { data } = await api.post("/chat", messageData);
        socket.emit("send_message", {
          ...data,
          donationId,
          receiver: otherUserId,
          senderName: user.name,
        });
        setMessages((prev) =>
          prev.map((msg) => (msg._id === tempId ? data : msg)),
        );
      } catch (error) {
        toast.error("Network unstable. Message failed to send.");
        setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      }
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (window.confirm("Delete this message?")) {
      setMessages((prev) => prev.filter((msg) => msg._id !== msgId));
      try {
        await api.delete(`/chat/${msgId}`);
        socket.emit("delete_message", { id: msgId, donationId, receiver: otherUserId });
      } catch (error) {
        toast.error("Failed to delete message");
      }
    }
  };

  const handleBlock = async () => {
    setShowMenu(false);
    if (!window.confirm(`Block ${otherUserName}? They won't be able to message you, and you won't see their messages.`)) return;
    try {
      await api.post(`/chat/block/${otherUserId}`);
      toast.success(`${otherUserName} blocked.`);
      navigate("/chat/inbox");
    } catch {
      toast.error("Couldn't block this user.");
    }
  };

  const handleReport = async (reason) => {
    setReporting(true);
    try {
      await api.post("/chat/report", { reportedUserId: otherUserId, reason, donationId });
      setShowReport(false);
      toast.success("Reported — we'll review it. They've also been blocked.");
      navigate("/chat/inbox");
    } catch {
      toast.error("Couldn't submit the report.");
    } finally {
      setReporting(false);
    }
  };

  const openHandshake = async () => {
    if (isDirectChat) return;
    setShowHandshake(true);
    setHandshake(null);
    setPinInput("");
    try {
      const { data } = await api.get(`/donations/${realDonationId}/handshake`);
      setHandshake(data);
    } catch {
      toast.error("Couldn't open the confirmation.");
      setShowHandshake(false);
    }
  };

  const completeHandoff = async () => {
    if (!pinInput.trim()) return;
    setCompleting(true);
    try {
      await api.patch(`/donations/${realDonationId}/fulfill`, { pin: pinInput.trim() });
      toast.success("Donation confirmed — thank you for helping. 🤝");
      setShowHandshake(false);
      navigate("/chat/inbox");
    } catch (err) {
      const m = err.response?.data?.message;
      toast.error(m === "Incorrect OTP" ? "That code didn't match. Check it with the requester." : "Couldn't confirm. Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  if (!user) return null;

  const activeConversation = Array.isArray(messages)
    ? messages.filter(
        (msg) =>
          (msg.sender === user._id && msg.receiver === otherUserId) ||
          (msg.sender === otherUserId && msg.receiver === user._id),
      )
    : [];

  const formatTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Layout>
      <main className="w-full h-[calc(100dvh-80px)] md:h-[85vh] md:max-w-4xl md:mx-auto md:my-4 flex flex-col bg-pearl-beige md:border md:border-pine-teal/10 md:rounded-[2.5rem] overflow-hidden md:shadow-[0_20px_60px_rgba(8,20,16,0.18)] relative font-sans">
        <header className="bg-[#081410]/90 backdrop-blur-md p-3 md:p-5 flex items-center justify-between z-20 border-b border-white/8 shrink-0 shadow-[0_4px_20px_rgba(8,20,16,0.3)]">
          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={() => navigate("/chat/inbox")}
              className="text-white/60 hover:text-white transition-colors p-2.5 active:scale-90 bg-white/8 hover:bg-white/15 border border-white/15 rounded-full"
            >
              <FaArrowLeft className="text-sm md:text-base" />
            </button>
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate(`/profile/${otherUserId}`)}
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-lg uppercase border border-white/15 bg-white/10 text-white group-hover:scale-105 transition-transform">
                {otherUserName.charAt(0)}
              </div>
              <div className="flex flex-col">
                <h2 className="text-[15px] md:text-[17px] font-black text-white leading-tight truncate max-w-[150px] sm:max-w-xs">
                  {otherUserName}
                </h2>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5 text-white/50 truncate max-w-[150px] sm:max-w-xs">
                  <FaShieldAlt className="text-[8px]" /> {itemTitle}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {!isDirectChat && (
              <button
                onClick={openHandshake}
                className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 rounded-xl border border-pine-teal bg-pine-teal text-white text-[9px] font-black uppercase tracking-widest transition-all shadow-md hover:bg-[#1a3630]"
              >
                <FaQrcode /> Confirm
              </button>
            )}
            <div className="relative">
              <button
                onClick={() => setShowMenu((v) => !v)}
                aria-label="More options"
                className="h-[30px] w-[30px] flex items-center justify-center rounded-xl border border-white/15 bg-white/8 text-white/70 hover:bg-white/15 transition-all"
              >
                <FaEllipsisV className="text-xs" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-10 z-40 w-40 rounded-2xl bg-surface border border-dusty-lavender/30 shadow-xl overflow-hidden py-1">
                    <button
                      onClick={() => { setShowMenu(false); setShowReport(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-pine-teal hover:bg-pearl-beige transition-colors"
                    >
                      <FaFlag className="text-dark-raspberry" /> Report
                    </button>
                    <button
                      onClick={handleBlock}
                      className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-[#c0392b] hover:bg-[#d6453f]/8 transition-colors border-t border-dusty-lavender/20"
                    >
                      <FaBan /> Block
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>


        <section
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 z-10 no-scrollbar relative bg-pearl-beige/30"
          onClick={() => {
            setDropdownOpen(null);
            setShowEmojis(false);
          }}
        >
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <FaSpinner
                className={`animate-spin text-4xl ${roleTheme.text}`}
              />
            </div>
          ) : activeConversation.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-dusty-lavender space-y-3">
              <div className="w-20 h-20 bg-surface border border-surface rounded-full flex items-center justify-center mb-2 shadow-sm">
                <FaShieldAlt
                  className={`text-4xl ${roleTheme.text} animate-pulse opacity-70`}
                />
              </div>
              <p className="font-black text-xs uppercase tracking-[0.3em] text-pine-teal">
                Chat Started
              </p>
              <p className="text-[10px] text-center max-w-[250px] font-medium text-dusty-lavender leading-relaxed">
                Your messages are secure and private.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {activeConversation.map((msg, index) => {
                const isMe = msg.sender === user._id;
                return (
                  <motion.div
                    key={msg._id || index}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isMe ? "justify-end" : "justify-start"} w-full`}
                  >
                    <div
                      className={`relative max-w-[85%] md:max-w-[70%] px-5 py-3.5 shadow-md flex flex-col group transition-all duration-300 ${isMe ? `bg-gradient-to-br ${roleTheme.primaryGradient} text-white rounded-[2rem] rounded-tr-md ${roleTheme.shadow}` : "bg-surface border border-dusty-lavender/20 text-pine-teal rounded-[2rem] rounded-tl-md"} ${msg.isSending ? "opacity-60" : "opacity-100"}`}
                    >
                      {isMe && !msg.isSending && (
                        <div className="absolute top-1 right-1 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDropdownOpen(
                                dropdownOpen === msg._id ? null : msg._id,
                              );
                            }}
                            className="text-white/80 hover:text-white p-2 md:p-1.5 md:opacity-0 md:group-hover:opacity-100 transition-all active:bg-black/10 rounded-full"
                          >
                            <FaChevronDown className="text-[10px]" />
                          </button>
                          {dropdownOpen === msg._id && (
                            <div className="absolute right-0 top-8 bg-surface border border-dusty-lavender/30 rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden w-36 py-1">
                              <button
                                onClick={() => {
                                  setEditingMessage(msg);
                                  setNewMessage(msg.content);
                                  setDropdownOpen(null);
                                }}
                                className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-pine-teal hover:bg-pearl-beige text-left flex items-center gap-3 transition-colors"
                              >
                                <FaEdit className="text-sm" /> Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleDeleteMessage(msg._id);
                                  setDropdownOpen(null);
                                }}
                                className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-dark-raspberry hover:bg-dark-raspberry hover:text-white text-left flex items-center gap-3 border-t border-dusty-lavender/20 transition-colors"
                              >
                                <FaTrash className="text-sm" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      <p
                        className={`text-[14px] md:text-[15px] leading-relaxed whitespace-pre-wrap break-words font-medium ${isMe ? "pr-5" : ""}`}
                      >
                        {msg.content}
                      </p>
                      <div
                        className={`flex justify-end items-center gap-1.5 mt-2 ${isMe ? "opacity-90" : "opacity-50"}`}
                      >
                        <span className="text-[9px] font-bold tracking-wider">
                          {formatTime(msg.createdAt)}
                        </span>
                        {isMe &&
                          (msg.isSending ? (
                            <FaSpinner className="text-white/60 text-[8px] animate-spin" />
                          ) : msg.read ? (
                            <FaCheckDouble className="text-white text-[10px]" />
                          ) : (
                            <FaCheck className="text-white/80 text-[10px]" />
                          ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </section>

        <AnimatePresence>
          {showEmojis && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-[90px] left-2 right-2 md:left-4 md:right-auto z-50 shadow-2xl flex justify-center md:block"
            >
              <div className="w-full md:w-[320px] rounded-3xl overflow-hidden border border-dusty-lavender/30 bg-surface shadow-[0_10px_40px_rgba(59,107,84,0.15)]">
                <EmojiPicker
                  onEmojiClick={onEmojiClick}
                  theme="light"
                  width="100%"
                  height={350}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {editingMessage && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="bg-surface px-5 py-3 flex justify-between items-center border-t border-dusty-lavender/30 z-20 shadow-inner overflow-hidden"
            >
              <span
                className={`${roleTheme.text} text-[10px] font-black uppercase tracking-widest flex items-center gap-2`}
              >
                <FaEdit /> Editing message...
              </span>
              <button
                onClick={() => {
                  setEditingMessage(null);
                  setNewMessage("");
                }}
                className="text-dusty-lavender hover:text-pine-teal p-2 bg-pearl-beige rounded-full transition-colors border border-dusty-lavender/30"
              >
                <FaTimes className="text-xs" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-surface/80 backdrop-blur-md px-3 py-3 md:p-4 z-20 border-t border-surface shrink-0 pb-6 md:pb-4 shadow-[0_-10px_20px_rgba(59,107,84,0.03)]">
          <form
            onSubmit={handleSendMessage}
            className="max-w-3xl mx-auto flex items-end gap-2 bg-surface border border-dusty-lavender/30 rounded-3xl p-1.5 shadow-sm transition-all focus-within:border-pine-teal focus-within:ring-1 focus-within:ring-pine-teal/30"
          >
            <button
              type="button"
              onClick={() => setShowEmojis(!showEmojis)}
              className={`p-3 rounded-full transition-colors flex shrink-0 items-center justify-center self-end mb-0.5 ${showEmojis ? roleTheme.text + " bg-pearl-beige shadow-sm" : "text-dusty-lavender hover:text-pine-teal hover:bg-pearl-beige"}`}
            >
              <FaSmile className="text-xl" />
            </button>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onFocus={() => setShowEmojis(false)}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 bg-transparent py-3.5 px-2 text-pine-teal font-medium text-[15px] outline-none placeholder-dusty-lavender resize-none max-h-32 overflow-y-auto"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className={`w-11 h-11 rounded-full flex shrink-0 items-center justify-center text-white transition-all shadow-md self-end mb-1 mr-1 ${editingMessage ? "bg-pine-teal shadow-[0_10px_25px_rgba(59,107,84,0.3)] hover:bg-[#1a3630]" : `${roleTheme.buttonBg} ${roleTheme.shadow}`} disabled:opacity-30 disabled:scale-100 active:scale-95`}
            >
              {editingMessage ? (
                <FaCheckDouble className="text-[14px]" />
              ) : (
                <FaPaperPlane className="text-[13px] -ml-1 mt-0.5" />
              )}
            </button>
          </form>
        </div>

        {/* ── COMPLETION HANDSHAKE (real) ── */}
        <AnimatePresence>
          {showHandshake && (
            <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0a0a0a]/85 backdrop-blur-md"
                onClick={() => !completing && setShowHandshake(false)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-sm rounded-[2rem] bg-surface p-6 shadow-2xl"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-xl bg-pine-teal/10 flex items-center justify-center text-pine-teal"><FaShieldAlt /></div>
                    <h2 className="font-display text-xl font-semibold text-pine-teal">Confirm donation</h2>
                  </div>
                  <button onClick={() => !completing && setShowHandshake(false)} className="h-8 w-8 flex items-center justify-center rounded-full border border-dusty-lavender/30 text-dusty-lavender hover:text-pine-teal transition-colors"><FaTimes className="text-xs" /></button>
                </div>

                {!handshake ? (
                  <div className="py-10 flex justify-center"><FaSpinner className="animate-spin text-2xl text-pine-teal" /></div>
                ) : handshake.status === "fulfilled" ? (
                  <div className="py-8 text-center">
                    <FaCheckDouble className="text-4xl text-pine-teal mx-auto mb-3" />
                    <p className="text-[15px] font-semibold text-pine-teal">Already completed</p>
                    <p className="text-[13px] text-pine-teal/55 mt-1">This request has been fulfilled. Thank you.</p>
                  </div>
                ) : handshake.role === "owner" ? (
                  <>
                    <p className="text-[14px] text-pine-teal/60 leading-relaxed mb-4">
                      Share this code with your donor <span className="font-semibold text-pine-teal">after they've helped</span> — they enter it to confirm the donation.
                    </p>
                    <div className="rounded-2xl border border-pine-teal/15 bg-pearl-beige/60 py-5 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-pine-teal/45 mb-1">Completion code</p>
                      <p className="font-display text-4xl font-bold tracking-[0.18em] text-pine-teal">{handshake.code}</p>
                    </div>
                    <p className="mt-3 text-[12px] text-pine-teal/45 text-center">Only share it once the donation has actually happened.</p>
                  </>
                ) : (
                  <>
                    <p className="text-[14px] text-pine-teal/60 leading-relaxed mb-4">
                      After you've donated, ask the requester for their <span className="font-semibold text-pine-teal">completion code</span> and enter it here.
                    </p>
                    <input
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      placeholder="------"
                      className="w-full rounded-xl border border-pine-teal/20 bg-pearl-beige px-4 py-4 text-center font-display text-2xl tracking-[0.3em] text-pine-teal outline-none focus:border-pine-teal/50 placeholder-pine-teal/25"
                    />
                    <button
                      onClick={completeHandoff}
                      disabled={completing || pinInput.length < 4}
                      className="mt-4 w-full rounded-xl bg-pine-teal py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2f5a47] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {completing ? <FaSpinner className="animate-spin" /> : "Confirm donation"}
                    </button>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── REPORT MODAL ── */}
        <AnimatePresence>
          {showReport && (
            <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-md"
                onClick={() => !reporting && setShowReport(false)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-sm rounded-[2rem] bg-surface p-6 shadow-2xl"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h2 className="font-display text-xl font-semibold text-pine-teal leading-tight">
                    Report {otherUserName}
                  </h2>
                  <button
                    onClick={() => !reporting && setShowReport(false)}
                    className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full border border-dusty-lavender/30 text-dusty-lavender hover:text-pine-teal transition-colors"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </div>
                <p className="text-[13px] text-pine-teal/55 mb-4">
                  They'll be blocked and our team will review this.
                </p>
                <div className="space-y-2">
                  {[
                    ["harassment", "Harassment or abuse"],
                    ["spam", "Spam"],
                    ["scam", "Scam or fraud"],
                    ["fake", "Fake / impersonation"],
                    ["other", "Something else"],
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      disabled={reporting}
                      onClick={() => handleReport(val)}
                      className="w-full text-left rounded-xl border border-pine-teal/12 bg-surface-2 px-4 py-3 text-[14px] font-medium text-pine-teal hover:border-dark-raspberry/40 hover:bg-dark-raspberry/5 transition-colors disabled:opacity-50"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {reporting && (
                  <p className="mt-3 text-center text-[12px] text-pine-teal/50">Submitting…</p>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </Layout>
  );
};

export default Chat;