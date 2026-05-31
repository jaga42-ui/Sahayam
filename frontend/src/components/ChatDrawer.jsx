import { useState, useEffect, useRef, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaPaperPlane, FaTimes, FaShieldAlt, FaLock, FaCheckDouble, FaCheck, FaSpinner,
} from "react-icons/fa";
import toast from "react-hot-toast";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";

const ChatDrawer = ({ isOpen, onClose, currentUser, chatPartner, donationId }) => {
  const { socket } = useContext(AuthContext);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const chatRoomId = (chatPartner && donationId) ? `${donationId}_${chatPartner._id}` : null;

  const scrollToBottom = () => {
    setTimeout(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, 50);
  };

  useEffect(() => {
    if (isOpen && chatPartner && chatRoomId && socket) {
      socket.emit("join_chat", { userId: currentUser._id, donationId: chatRoomId });

      const fetchMessages = async () => {
        setLoading(true);
        try {
          const { data } = await api.get(`/chat/${chatRoomId}`);
          setMessages(Array.isArray(data) ? data : []);
          await api.put(`/chat/${chatRoomId}/read`);
          socket.emit("mark_as_read", { donationId: chatRoomId, readerId: currentUser._id });
          scrollToBottom();
        } catch (error) { setMessages([]); } finally { setLoading(false); }
      };

      fetchMessages();

      socket.on("receive_message", (msg) => {
        setMessages((prev) => {
          if (Array.isArray(prev) && prev.some((m) => m._id === msg._id)) return prev;
          return [...(Array.isArray(prev) ? prev : []), msg];
        });
        if (msg.sender !== currentUser._id) socket.emit("mark_as_read", { donationId: chatRoomId, readerId: currentUser._id });
        scrollToBottom();
      });

      socket.on("messages_read", ({ readerId }) => {
        if (readerId !== currentUser._id) {
          setMessages((prev) => prev.map((msg) => (msg.sender === currentUser._id ? { ...msg, read: true } : msg)));
        }
      });

      return () => { 
        socket.off("receive_message");
        socket.off("messages_read");
      };
    }
  }, [isOpen, chatPartner, chatRoomId, currentUser, socket]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim() || !chatRoomId || !socket) return;

    const messageContent = newMessage.trim();
    setNewMessage("");

    const tempId = `temp_${Date.now()}`;
    const tempMsg = { _id: tempId, content: messageContent, sender: currentUser._id, receiver: chatPartner._id, createdAt: new Date().toISOString(), read: false, isSending: true };

    setMessages((prev) => [...prev, tempMsg]);
    scrollToBottom();

    try {
      const messageData = { receiverId: chatPartner._id, content: messageContent, donationId: chatRoomId };
      const { data } = await api.post("/chat", messageData);

      socket.emit("send_message", { ...data, donationId: chatRoomId, receiver: chatPartner._id, senderName: currentUser.name });
      setMessages((prev) => prev.map((msg) => (msg._id === tempId ? data : msg)));
    } catch (error) {
      toast.error("Transmission failed. Check connection.");
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-pine-teal/60 backdrop-blur-sm z-[100]" />

          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed right-0 top-0 h-[100dvh] w-full max-w-md bg-pearl-beige border-l border-white z-[101] shadow-2xl flex flex-col font-sans">
            
            <div className="p-4 bg-white/80 backdrop-blur-md border-b border-white flex justify-between items-center shrink-0 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="relative">
                  {chatPartner?.profilePic ? (
                    <img src={chatPartner.profilePic} alt="User" className="w-11 h-11 rounded-2xl object-cover border border-dusty-lavender/30 shadow-sm" />
                  ) : (
                    <div className="w-11 h-11 bg-blazing-flame/10 text-blazing-flame border border-blazing-flame/20 rounded-2xl flex items-center justify-center font-black text-lg uppercase shadow-sm">
                      {chatPartner?.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-blazing-flame border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-black text-pine-teal text-[15px] leading-tight truncate max-w-[180px]">
                    {chatPartner?.name || "Unknown User"}
                  </h3>
                  <span className="text-[10px] text-dark-raspberry font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5 opacity-80">
                    <FaLock className="text-[8px]" /> Secure Session
                  </span>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-dusty-lavender hover:text-pine-teal hover:bg-white border border-transparent hover:border-dusty-lavender/30 rounded-full transition-all active:scale-90 shadow-sm">
                <FaTimes className="text-sm" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-pearl-beige/30 space-y-5 relative no-scrollbar">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-blazing-flame border-t-transparent rounded-full animate-spin opacity-80"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-dusty-lavender space-y-3">
                  <div className="w-16 h-16 bg-white border border-white rounded-full flex items-center justify-center mb-1 shadow-sm">
                    <FaShieldAlt className="text-2xl text-dark-raspberry/50 animate-pulse" />
                  </div>
                  <p className="font-black text-[10px] uppercase tracking-[0.2em] text-pine-teal">Encrypted Channel</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg, idx) => {
                    const isMe = msg.sender === currentUser._id || msg.sender?._id === currentUser._id;
                    return (
                      <motion.div key={msg._id || idx} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}>
                        <div className={`relative max-w-[85%] px-4 py-3 shadow-sm flex flex-col transition-opacity duration-300 ${isMe ? "bg-gradient-to-br from-dark-raspberry to-[#5e4585] text-white rounded-[1.5rem] rounded-tr-md" : "bg-white border border-dusty-lavender/20 text-pine-teal rounded-[1.5rem] rounded-tl-md"} ${msg.isSending ? "opacity-60" : "opacity-100"}`}>
                          <span className="text-[14px] leading-relaxed break-words font-medium pr-2">{msg.content}</span>
                          <div className={`flex justify-end items-center gap-1.5 mt-1.5 ${isMe ? "opacity-90" : "opacity-50"}`}>
                            <span className="text-[9px] font-bold tracking-wider">
                              {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {isMe && (msg.isSending ? <FaSpinner className="text-white/60 text-[8px] animate-spin" /> : msg.read ? <FaCheckDouble className="text-white text-[10px]" /> : <FaCheck className="text-white/80 text-[10px]" />)}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            <div className="bg-white/80 backdrop-blur-md px-3 py-3 md:p-4 z-20 border-t border-white shrink-0 pb-6 md:pb-4">
              <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-end gap-2 bg-white border border-dusty-lavender/30 rounded-3xl p-1.5 shadow-sm transition-all focus-within:border-pine-teal focus-within:ring-1 focus-within:ring-pine-teal/30">
                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." rows={1} className="flex-1 bg-transparent py-3.5 px-4 text-pine-teal text-[14px] outline-none placeholder-dusty-lavender resize-none max-h-32 overflow-y-auto" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} />
                <button type="submit" disabled={!newMessage.trim()} className="w-10 h-10 rounded-full flex shrink-0 items-center justify-center text-white transition-all shadow-md self-end mb-1 mr-1 bg-blazing-flame hover:bg-[#6e4fa0] disabled:opacity-30 disabled:scale-100 active:scale-95">
                  <FaPaperPlane className="text-[12px] -ml-1 mt-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ChatDrawer;