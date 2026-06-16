import { createContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { FaHeart } from "react-icons/fa";
import api from "../utils/api";
import { requestFirebaseToken } from "../firebase";

const AuthContext = createContext();

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL 
  ? import.meta.env.VITE_BACKEND_URL.replace('/api', '') 
  : "https://sahayam-api.onrender.com";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [thankYouPrompt, setThankYouPrompt] = useState(null); // { donationId, donationTitle, donorName }

  useEffect(() => {
    if (!user) return;

    api.get("/chat/inbox")
      .then((res) => {
        if (Array.isArray(res.data)) {
          const count = res.data.reduce((acc, chat) => acc + chat.unreadCount, 0);
          setUnreadCount(count);
        }
      })
      .catch(console.error);

    const newSocket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      auth: { token: user.token },
    });

    setSocket(newSocket);
    newSocket.emit("setup", user._id);

    newSocket.on("new_message_notification", () => {
      setUnreadCount((prev) => prev + 1);
      window.dispatchEvent(new Event("new_unread_message"));
      toast("💬 Secure Transmission Received!", {
        style: { background: "#ffffff", color: "#3b6b54", border: "1px solid #9a8db5" },
      });
    });

    const handleRoleUpdate = (data) => {
      if (data.userId === user._id) {
        const updatedUser = { ...user, isAdmin: data.isAdmin };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        if (!data.isAdmin) {
          toast.error("SECURITY ALERT: Your Admin privileges have been revoked.", {
            style: { background: "#ffffff", color: "#8a6fb0", border: "1px solid #8a6fb0" },
          });
        } else {
          toast.success("You have been promoted to System Admin!", {
            style: { background: "#ffffff", color: "#3b6b54", border: "1px solid #9a8db5" },
          });
        }
      }
    };

    newSocket.on("role_updated", handleRoleUpdate);

    newSocket.on("thank_you_received", (data) => {
      toast.custom(
        () => (
          <div style={{ display:"flex", alignItems:"center", gap:12, background:"#fff", border:"1px solid rgba(167,60,100,0.25)", borderRadius:16, padding:"12px 16px", boxShadow:"0 8px 24px -8px rgba(107,50,140,0.25)" }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"rgba(167,60,100,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <FaHeart style={{ color:"#a73c64", fontSize:14 }} />
            </div>
            <div>
              <p style={{ fontSize:13, fontWeight:800, color:"#a73c64", margin:0 }}>Someone you helped just said thanks!</p>
              <p style={{ fontSize:12, color:"#3b6b54", margin:"2px 0 0" }}>{data.from}: &ldquo;{data.message}&rdquo;</p>
            </div>
          </div>
        ),
        { duration: 8000 },
      );
    });

    newSocket.on("donation_fulfilled_prompt", (data) => {
      setThankYouPrompt(data);
    });

    newSocket.on("milestone_reached", (data) => {
      const labels = {
        1:   "First donation! You saved a life.",
        5:   "5 donations — you're a true hero!",
        10:  "10 donations — Bronze Hero unlocked!",
        25:  "25 donations — Silver Legend status!",
        50:  "50 donations — Gold Lifesaver!",
        100: "100 donations — Platinum Champion!",
      };
      toast.success(labels[data.count] || `${data.count} donations milestone reached!`, {
        duration: 7000,
        style: { background: "#fff", color: "#3b6b54", border: "1px solid rgba(59,107,84,0.25)", fontWeight: 700 },
      });
    });

    newSocket.on("request_reset", (data) => {
      toast(`Your matched donor dropped out for "${data.donationTitle}". We've re-opened the listing.`, {
        icon: "🔄",
        duration: 9000,
        style: { background: "#fff", color: "#3b6b54", border: "1px solid rgba(59,107,84,0.15)" },
      });
    });

    return () => {
      newSocket.off("role_updated", handleRoleUpdate);
      newSocket.off("new_message_notification");
      newSocket.off("thank_you_received");
      newSocket.off("donation_fulfilled_prompt");
      newSocket.off("milestone_reached");
      newSocket.off("request_reset");
      newSocket.disconnect();
    };
  }, [user]);

  const toggleAvailability = async () => {
    if (!user) return;
    try {
      const { data } = await api.put("/auth/toggle-availability");
      setUser(data);
      localStorage.setItem("user", JSON.stringify(data));
      if (data.isAvailable) {
        toast.success("Snooze Disabled: You are now On-Duty for SOS alerts.");
      } else {
        toast.success("Snooze Enabled: You will not receive SOS alerts.");
      }
    } catch (error) {
      toast.error("Failed to toggle availability status.");
    }
  };

  const switchRole = async () => {
    if (!user) return;
    try {
      const { data } = await api.put("/auth/role", {});
      const updatedUser = { ...user, activeRole: data.activeRole };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success(`Switched to ${data.activeRole.charAt(0).toUpperCase() + data.activeRole.slice(1)} Mode`);
    } catch (error) {
      toast.error("Failed to switch roles in the system.");
    }
  };

  const enableNotifications = async () => {
    const toastId = toast.loading("Requesting secure channel...", {
      style: { background: "#ffffff", color: "#3b6b54" },
    });

    try {
      const fcmToken = await requestFirebaseToken();
      if (fcmToken) {
        await api.post("/auth/fcm-token", { fcmToken });
        toast.success("Lock-Screen Alerts Enabled! 🚀", { id: toastId });
      } else {
        toast.error("Permission denied. Please check your browser site settings.", { id: toastId });
      }
    } catch (error) {
      toast.error("Failed to establish secure channel. Check console.", { id: toastId });
    }
  };

  const login = async (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));

    setTimeout(async () => {
        try {
          const fcmToken = await requestFirebaseToken();
          if (fcmToken) {
            await api.post("/auth/fcm-token", { fcmToken });
          }
        } catch (error) {
          console.error("FCM Token process failed on login:", error);
        }
    }, 500);
  };

  const logout = () => {
    setUser(null);
    setUnreadCount(0);
    setSocket(null);
    localStorage.removeItem("user");
  };

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("isDarkMode") === "true";
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("isDarkMode", isDarkMode);
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, toggleAvailability, setUser, unreadCount, setUnreadCount, enableNotifications, socket, isDarkMode, toggleDarkMode, thankYouPrompt, setThankYouPrompt }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;