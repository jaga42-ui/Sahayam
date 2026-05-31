import { createContext, useState, useEffect } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import api from "../utils/api";
import { requestFirebaseToken } from "../firebase";

const AuthContext = createContext();

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL 
  ? import.meta.env.VITE_BACKEND_URL.replace('/api', '') 
  : "https://hopelink-api.onrender.com";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);

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

    return () => {
      newSocket.off("role_updated", handleRoleUpdate);
      newSocket.off("new_message_notification");
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
    <AuthContext.Provider value={{ user, login, logout, switchRole, toggleAvailability, setUser, unreadCount, setUnreadCount, enableNotifications, socket, isDarkMode, toggleDarkMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;