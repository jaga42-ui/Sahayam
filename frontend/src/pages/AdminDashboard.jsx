import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  FaShieldAlt,
  FaChartPie,
  FaUsers,
  FaBoxOpen,
  FaTrash,
  FaSpinner,
  FaBan,
  FaUserShield,
  FaUserTimes,
  FaEnvelope,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaBullhorn,
  FaFlag,
  FaCheck,
  FaCheckCircle,
  FaCommentAlt, // 👉 Added icon for feedback
  FaStar, // 👉 Added icon for ratings
  FaMapMarkerAlt, // 👉 Added icon for heatmap
} from "react-icons/fa";
import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";
import EngineMetrics from "../components/EngineMetrics";
import AdminReports from "../components/AdminReports";
import { FaBolt } from "react-icons/fa";

const Admin = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [listings, setListings] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [heatmapData, setHeatmapData] = useState(null);
  const [camps, setCamps] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastLevel, setBroadcastLevel] = useState("info");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    if (user && !user.isAdmin) {
      toast.error("Unauthorized Area", {
        style: {
          background: "#ffffff",
          color: "#6e4fa0",
          border: "1px solid #6e4fa0",
        },
      });
      navigate("/dashboard");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    const fetchAdminData = async () => {
      try {
        // 👉 Added the feedback endpoint to the initial data fetch
        const [statsRes, usersRes, listingsRes, eventsRes, feedbackRes, heatmapRes, campsRes, kycRes] =
          await Promise.all([
            api.get("/admin/stats"),
            api.get("/admin/users"),
            api.get("/admin/listings"),
            api.get("/events"),
            api.get("/admin/feedback"),
            api.get("/admin/heatmap"),
            api.get("/admin/camps").catch(() => ({ data: [] })),
            api.get("/admin/kyc").catch(() => ({ data: [] })),
          ]);
        setStats(statsRes.data);
        setUsersList(usersRes.data);
        setListings(listingsRes.data);
        setEventsList(eventsRes.data);
        setFeedbacks(feedbackRes.data);
        setHeatmapData(heatmapRes.data);
        setCamps(campsRes.data);
        setKycRequests(kycRes.data);
        setLoading(false);
      } catch (error) {
        toast.error("Failed to load admin data");
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [user]);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;
    setIsBroadcasting(true);
    try {
      await api.post("/admin/broadcast", {
        message: broadcastMsg,
        level: broadcastLevel,
      });
      toast.success("Broadcast deployed globally!");
      setBroadcastMsg("");
    } catch (error) {
      toast.error("Broadcast failed.");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleReportAction = async (id, action) => {
    try {
      await api.patch(`/admin/resolve-report/${id}`, { action });
      toast.success(
        action === "delete" ? "Post removed." : "Post approved.",
      );
      setStats((prev) => ({
        ...prev,
        reportedPosts: prev.reportedPosts.filter((p) => p._id !== id),
      }));
      if (action === "delete")
        setListings((prev) => prev.filter((l) => l._id !== id));
    } catch (error) {
      toast.error("Moderation action failed.");
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (window.confirm(`PERMANENTLY DELETE ${name} and all their history?`)) {
      try {
        await api.delete(`/admin/users/${id}`);
        setUsersList(usersList.filter((u) => u._id !== id));
        toast.success("User permanently deleted.");
      } catch (error) {
        toast.error("Failed to delete user");
      }
    }
  };

  const handleToggleRole = async (id, name, currentStatus) => {
    if (
      window.confirm(
        `Are you sure you want to ${currentStatus ? "REVOKE Admin rights from" : "PROMOTE"} ${name}?`,
      )
    ) {
      try {
        const { data } = await api.patch(`/admin/users/${id}/role`);
        setUsersList(
          usersList.map((u) =>
            u._id === id ? { ...u, isAdmin: data.isAdmin } : u,
          ),
        );
        toast.success(data.message);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to update user role",
        );
      }
    }
  };

  const handleDeleteListing = async (id) => {
    if (window.confirm(`Force delete this listing from the database?`)) {
      try {
        await api.delete(`/admin/listings/${id}`);
        setListings(listings.filter((l) => l._id !== id));
        toast.success("Listing obliterated.");
      } catch (error) {
        toast.error("Failed to delete listing");
      }
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (window.confirm(`Force delete the event: "${title}"?`)) {
      try {
        await api.delete(`/events/${id}`);
        setEventsList(eventsList.filter((e) => e._id !== id));
        toast.success("Event permanently removed.");
      } catch (error) {
        toast.error("Failed to delete event");
      }
    }
  };

  const handleCampStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/admin/camps/${id}/status`, { status });
      setCamps((p) => p.map((c) => c._id === id ? data : c));
      toast.success(`Camp marked as ${status}.`);
    } catch { toast.error("Failed to update camp status."); }
  };

  const handleKYC = async (userId, approved) => {
    try {
      await api.patch(`/admin/kyc/${userId}`, { approved });
      setKycRequests((p) => p.map((u) =>
        u._id === userId ? { ...u, kycStatus: { ...u.kycStatus, documentVerified: approved } } : u
      ));
      toast.success(approved ? "KYC approved." : "KYC rejected.");
    } catch { toast.error("Failed to update KYC."); }
  };

  const handleExportCSV = async (type) => {
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://hopelink-api.onrender.com";
      const token = JSON.parse(localStorage.getItem("user") || "{}")?.token;
      const res = await fetch(`${BACKEND_URL}/admin/export?type=${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `sahayam-${type}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${type} CSV downloaded.`);
    } catch {
      toast.error("Export failed.");
    }
  };

  if (!user || !user.isAdmin) return null;

  const COLORS = ["#3b6b54", "#8a6fb0", "#6e4fa0"];
  const pieData = stats
    ? [
        { name: "Donations", value: stats.totalDonations },
        { name: "Requests", value: stats.totalRequests },
        { name: "Active SOS", value: stats.activeSOS || 0 },
      ]
    : [];

  const TABS = [
    { id: "overview",   label: "Overview",   icon: <FaChartPie /> },
    { id: "engine",     label: "Engine",     icon: <FaBolt /> },
    { id: "users",      label: "Users",      icon: <FaUsers /> },
    { id: "listings",   label: "Content",    icon: <FaBoxOpen /> },
    { id: "events",     label: "Events",     icon: <FaCalendarAlt /> },
    { id: "moderation", label: "Moderation", icon: <FaFlag /> },
    { id: "reports",    label: "Safety",     icon: <FaBan /> },
    { id: "camps",      label: "Camps",      icon: <FaCalendarAlt /> },
    { id: "kyc",        label: "KYC",        icon: <FaShieldAlt /> },
    { id: "feedback",   label: "Feedback",   icon: <FaCommentAlt /> },
    { id: "heatmap",    label: "Heatmap",    icon: <FaMapMarkerAlt /> },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-pearl-beige font-sans pb-32 md:pb-16">

        {/* ── AURORA HEADER ── */}
        <div className="aurora-header relative px-4 pt-8 pb-20 overflow-hidden">
          <div className="dark-dot-grid absolute inset-0 opacity-20" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex flex-col items-center text-center"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className="mb-3"
            >
              <FaShieldAlt className="text-4xl text-dark-raspberry drop-shadow-[0_0_20px_rgba(110,79,160,0.8)]" />
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">
              Sahayam <span className="gradient-text-aurora">Admin</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mt-1">System Administrator</p>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 26 }}
            className="relative z-10 mt-5 overflow-x-auto no-scrollbar"
          >
            <div className="flex bg-white/10 p-1 rounded-2xl border border-white/15 min-w-max mx-auto w-full max-w-2xl">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 flex-1 ${
                    activeTab === tab.id
                      ? "text-white"
                      : "text-white/50 hover:text-white/80"
                  } ${tab.id === "moderation" && stats?.reportedPosts?.length > 0 ? "text-blazing-flame" : ""}`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="adminTabBg"
                      className="absolute inset-0 rounded-xl bg-dark-raspberry shadow-md"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.icon}</span>
                  <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="max-w-6xl mx-auto px-4 -mt-10">

        {loading ? (
          <div className="flex justify-center py-20">
            <FaSpinner className="animate-spin text-4xl text-dark-raspberry" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && stats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { title: "Total Users",      value: stats.totalUsers,                         color: "text-pine-teal" },
                    { title: "Active SOS",        value: stats.activeSOS || 0,                     color: "text-blazing-flame", icon: <FaExclamationTriangle className="animate-pulse" /> },
                    { title: "Support Fulfilled", value: stats.fulfilledItems,                     color: "text-[#1a3630]" },
                    { title: "Total Content",     value: stats.totalDonations + stats.totalRequests, color: "text-dark-raspberry" },
                  ].map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 26, delay: i * 0.07 }}
                      className="bg-surface rounded-3xl border border-pine-teal/8 p-5 md:p-8 relative overflow-hidden shadow-sm flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {stat.icon && <span className={stat.color}>{stat.icon}</span>}
                        <p className="text-dusty-lavender text-[8px] md:text-[10px] uppercase font-black tracking-widest">
                          {stat.title}
                        </p>
                      </div>
                      <h3 className={`text-4xl md:text-6xl font-black ${stat.color} drop-shadow-sm`}>
                        {stat.value}
                      </h3>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/70 backdrop-blur-lg border border-white rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(59,107,84,0.08)] h-[350px] flex flex-col">
                      <h3 className="text-sm font-black uppercase tracking-widest text-pine-teal mb-6 drop-shadow-sm">
                        30-Day Community Growth
                      </h3>
                      <div className="flex-1 w-full h-full">
                        {stats.growthData && stats.growthData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={stats.growthData}
                              margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                              }}
                            >
                              <defs>
                                <linearGradient
                                  id="colorUsers"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="5%"
                                    stopColor="#3b6b54"
                                    stopOpacity={0.4}
                                  />
                                  <stop
                                    offset="95%"
                                    stopColor="#3b6b54"
                                    stopOpacity={0}
                                  />
                                </linearGradient>
                              </defs>
                              <XAxis
                                dataKey="date"
                                stroke="#9a8db5"
                                tick={{ fontSize: 10, fill: "#9a8db5" }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                stroke="#9a8db5"
                                tick={{ fontSize: 10, fill: "#9a8db5" }}
                                tickLine={false}
                                axisLine={false}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: "#ffffff",
                                  border: "1px solid #9a8db5",
                                  borderRadius: "12px",
                                  color: "#3b6b54",
                                }}
                                itemStyle={{
                                  color: "#3b6b54",
                                  fontWeight: "bold",
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey="Users"
                                stroke="#3b6b54"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorUsers)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-dusty-lavender text-xs font-bold uppercase tracking-widest">
                            Awaiting Intel...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white/70 backdrop-blur-lg border border-dark-raspberry/30 rounded-[2rem] p-6 shadow-[0_10px_40px_rgba(110,79,160,0.1)] relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pine-teal to-dark-raspberry" />
                      <h2 className="text-sm font-black uppercase tracking-widest text-dark-raspberry mb-6 flex items-center gap-2">
                        <FaBullhorn /> Global Broadcast
                      </h2>
                      <form onSubmit={handleBroadcast} className="space-y-4">
                        <select
                          value={broadcastLevel}
                          onChange={(e) => setBroadcastLevel(e.target.value)}
                          className="w-full bg-pearl-beige/30 border border-dusty-lavender/40 text-pine-teal text-xs font-bold uppercase tracking-wider rounded-xl p-3 outline-none focus:border-blazing-flame focus:bg-white shadow-inner"
                        >
                          <option value="info">Standard Info Update</option>
                          <option value="critical">Important Update</option>
                        </select>
                        <textarea
                          required
                          rows="2"
                          placeholder="Type message to blast to all screens..."
                          value={broadcastMsg}
                          onChange={(e) => setBroadcastMsg(e.target.value)}
                          className="w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-xl p-3 text-sm text-pine-teal resize-none outline-none focus:border-dark-raspberry focus:bg-white shadow-inner"
                        />
                        <button
                          disabled={isBroadcasting}
                          className="w-full py-3 bg-dark-raspberry hover:bg-[#5e4585] text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isBroadcasting
                            ? "Broadcasting..."
                            : "Initiate Broadcast"}
                        </button>
                      </form>
                    </div>

                    <div className="bg-white/70 backdrop-blur-lg border border-white rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(59,107,84,0.08)] h-[250px] flex flex-col">
                      <h3 className="text-[10px] font-black uppercase tracking-widest text-pine-teal mb-2 drop-shadow-sm text-center">
                        Activity Distribution
                      </h3>
                      <div className="flex-1 w-full h-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={60}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                            >
                              {pieData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#ffffff",
                                border: "1px solid #9a8db5",
                                borderRadius: "8px",
                                color: "#3b6b54",
                              }}
                              itemStyle={{ fontWeight: "bold" }}
                            />
                            <Legend
                              verticalAlign="bottom"
                              height={20}
                              iconType="circle"
                              wrapperStyle={{
                                fontSize: "10px",
                                fontWeight: "bold",
                                color: "#9a8db5",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ROUTING ENGINE METRICS TAB */}
            {activeTab === "engine" && <EngineMetrics />}

            {activeTab === "reports" && <AdminReports />}

            {/* MODERATION QUEUE TAB */}
            {activeTab === "moderation" && (
              <div className="bg-white/70 backdrop-blur-lg border border-white rounded-[2rem] p-6 md:p-8 shadow-[0_20px_40px_rgba(59,107,84,0.08)] min-h-[60vh]">
                <div className="flex items-center justify-between mb-8 border-b border-dusty-lavender/30 pb-4">
                  <h2 className="text-sm font-black uppercase tracking-widest text-blazing-flame flex items-center gap-2">
                    <FaFlag /> Community Reports
                  </h2>
                  <span className="bg-blazing-flame/10 text-blazing-flame px-3 py-1 rounded-lg text-xs font-bold border border-blazing-flame/20">
                    {stats?.reportedPosts?.length || 0} Flags
                  </span>
                </div>

                <div className="space-y-4">
                  {!stats?.reportedPosts || stats.reportedPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-dusty-lavender opacity-80">
                      <FaCheckCircle className="text-6xl mb-4 text-pine-teal" />
                      <p className="font-bold tracking-widest uppercase text-xs">
                        Grid is Secure. No active reports.
                      </p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {stats.reportedPosts.map((post) => (
                        <motion.div
                          key={post._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-white border border-dusty-lavender/30 p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-blazing-flame/10 text-blazing-flame border border-blazing-flame/20 rounded-[4px] text-[8px] font-black uppercase tracking-widest animate-pulse">
                                {post.reports.length} Reports
                              </span>
                              <span className="text-[10px] text-dusty-lavender font-bold uppercase tracking-wider">
                                Author: {post.donorId?.name || "Unknown"}
                              </span>
                            </div>
                            <h3 className="font-bold text-pine-teal text-base mb-1">
                              {post.title}
                            </h3>
                            <p className="text-xs text-dusty-lavender line-clamp-2 leading-relaxed">
                              {post.description}
                            </p>
                          </div>
                          <div className="flex w-full md:w-auto gap-3 shrink-0 mt-2 md:mt-0">
                            <button
                              onClick={() =>
                                handleReportAction(post._id, "whitelist")
                              }
                              className="flex-1 md:flex-none px-6 py-3 bg-white hover:bg-pearl-beige border border-dusty-lavender/40 text-pine-teal font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                              <FaCheck /> Whitelist
                            </button>
                            <button
                              onClick={() =>
                                handleReportAction(post._id, "delete")
                              }
                              className="flex-1 md:flex-none px-6 py-3 bg-blazing-flame hover:bg-[#6e4fa0] text-white font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
                            >
                              <FaTrash /> Purge
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            )}

            {/* 👉 NEW FEEDBACK TAB */}
            {activeTab === "feedback" && (
              <div className="bg-white/70 backdrop-blur-lg border border-white rounded-[2rem] p-6 md:p-8 shadow-[0_20px_40px_rgba(59,107,84,0.08)] min-h-[60vh]">
                <div className="flex items-center justify-between mb-8 border-b border-dusty-lavender/30 pb-4">
                  <h2 className="text-sm font-black uppercase tracking-widest text-pine-teal flex items-center gap-2">
                    <FaCommentAlt /> User Feedback
                  </h2>
                  <span className="bg-pine-teal/10 text-pine-teal px-3 py-1 rounded-lg text-xs font-bold border border-pine-teal/20">
                    {feedbacks.length} Submissions
                  </span>
                </div>

                {feedbacks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-dusty-lavender opacity-80">
                    <FaCommentAlt className="text-6xl mb-4 text-pine-teal/50" />
                    <p className="font-bold tracking-widest uppercase text-xs">
                      No feedback received yet.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {feedbacks.map((fb) => (
                      <div
                        key={fb._id}
                        className="bg-white border border-dusty-lavender/30 p-5 rounded-3xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            {fb.user?.profilePic ? (
                              <img
                                src={fb.user.profilePic}
                                alt="User"
                                className="w-10 h-10 rounded-xl object-cover border border-dusty-lavender/30"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-pine-teal/10 text-pine-teal border border-pine-teal/20 rounded-xl flex items-center justify-center font-black uppercase">
                                {fb.user?.name?.charAt(0) || "?"}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-pine-teal leading-tight">
                                {fb.user?.name || "Unknown User"}
                              </p>
                              <p className="text-[10px] text-dusty-lavender uppercase tracking-widest font-bold mt-0.5">
                                {new Date(fb.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <FaStar
                                key={i}
                                className={`text-sm ${i < fb.rating ? "text-[#f59e0b]" : "text-dusty-lavender/30"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="bg-pearl-beige/50 p-4 rounded-2xl border border-dusty-lavender/20 mt-2">
                          <p className="text-pine-teal/90 text-sm leading-relaxed italic">
                            "{fb.message}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 👉 NEW HEATMAP TAB */}
            {activeTab === "heatmap" && heatmapData && (
              <div className="bg-white/70 backdrop-blur-lg border border-white rounded-[2rem] p-6 md:p-8 shadow-[0_20px_40px_rgba(59,107,84,0.08)] min-h-[70vh] flex flex-col">
                <div className="flex items-center justify-between mb-6 border-b border-dusty-lavender/30 pb-4">
                  <h2 className="text-sm font-black uppercase tracking-widest text-pine-teal flex items-center gap-2">
                    <FaMapMarkerAlt /> Global Activity Grid
                  </h2>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">
                      <div className="w-2.5 h-2.5 rounded-full bg-pine-teal"></div> Donors ({heatmapData.donors.length})
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">
                      <div className="w-2.5 h-2.5 rounded-full bg-blazing-flame animate-pulse"></div> Emergencies ({heatmapData.emergencies.length})
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 w-full bg-pearl-beige rounded-2xl overflow-hidden shadow-inner border border-dusty-lavender/30 relative min-h-[500px]">
                  <MapContainer 
                    center={[20.5937, 78.9629]} 
                    zoom={5} 
                    style={{ height: "100%", width: "100%", background: "#f4efe5" }}
                  >
                    <TileLayer 
                      url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" 
                      attribution='&copy; CARTO' 
                    />
                    
                    {heatmapData.donors.map((donor) => (
                      donor.location?.coordinates && (
                        <CircleMarker 
                          key={donor._id}
                          center={[donor.location.coordinates[1], donor.location.coordinates[0]]}
                          radius={5}
                          fillColor="#3b6b54"
                          color="#3b6b54"
                          weight={1}
                          opacity={0.8}
                          fillOpacity={0.6}
                        />
                      )
                    ))}

                    {heatmapData.emergencies.map((em) => (
                      em.location?.coordinates && (
                        <CircleMarker 
                          key={em._id}
                          center={[em.location.coordinates[1], em.location.coordinates[0]]}
                          radius={12}
                          fillColor="#6e4fa0"
                          color="#6e4fa0"
                          weight={2}
                          opacity={1}
                          fillOpacity={0.8}
                          className="animate-pulse"
                        />
                      )
                    ))}
                  </MapContainer>
                </div>
              </div>
            )}

            {/* CAMPS TAB */}
            {activeTab === "camps" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-black uppercase tracking-widest text-pine-teal">Blood Camps ({camps.length})</h2>
                </div>
                {camps.length === 0 ? (
                  <div className="bg-white/70 rounded-[2rem] p-10 text-center border border-white">
                    <p className="text-pine-teal/40 font-semibold">No camps registered yet.</p>
                  </div>
                ) : camps.map((camp) => {
                  const statusColor = {
                    upcoming: "bg-pine-teal/10 text-pine-teal border-pine-teal/20",
                    ongoing: "bg-blue-50 text-blue-600 border-blue-200",
                    completed: "bg-gray-50 text-gray-500 border-gray-200",
                    cancelled: "bg-red-50 text-red-500 border-red-200",
                  }[camp.status] || "bg-gray-50 text-gray-400 border-gray-100";
                  return (
                    <motion.div key={camp._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-white/70 backdrop-blur rounded-[2rem] p-5 border border-white shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest rounded-full border px-2.5 py-1 ${statusColor}`}>
                              {camp.status}
                            </span>
                            {camp.bloodGroupsNeeded?.slice(0,4).map((bg) => (
                              <span key={bg} className="text-[10px] font-black text-dark-raspberry bg-dark-raspberry/8 border border-dark-raspberry/15 rounded-md px-1.5 py-0.5">{bg}</span>
                            ))}
                          </div>
                          <h3 className="font-bold text-pine-teal text-base leading-snug">{camp.title}</h3>
                          <p className="text-[12px] text-dusty-lavender mt-0.5">
                            {camp.venue} · {new Date(camp.date).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" })}
                          </p>
                          <p className="text-[11px] text-pine-teal/40 mt-0.5">
                            By {camp.organizer?.organizationName || camp.organizer?.name || "Unknown"} · {camp.registrations?.length || 0} registered
                          </p>
                        </div>
                        <div className="shrink-0 flex flex-col gap-1.5">
                          {camp.status !== "upcoming" && (
                            <button onClick={() => handleCampStatus(camp._id, "upcoming")}
                              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-pine-teal/10 text-pine-teal border border-pine-teal/20 hover:bg-pine-teal hover:text-white transition-all">
                              Approve
                            </button>
                          )}
                          {camp.status !== "cancelled" && (
                            <button onClick={() => handleCampStatus(camp._id, "cancelled")}
                              className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white transition-all">
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* KYC TAB */}
            {activeTab === "kyc" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-black uppercase tracking-widest text-pine-teal">KYC Requests ({kycRequests.length})</h2>
                  <span className="text-[11px] text-pine-teal/40">
                    {kycRequests.filter((u) => !u.kycStatus?.documentVerified).length} pending
                  </span>
                </div>
                {kycRequests.length === 0 ? (
                  <div className="bg-white/70 rounded-[2rem] p-10 text-center border border-white">
                    <p className="text-pine-teal/40 font-semibold">No KYC submissions yet.</p>
                  </div>
                ) : kycRequests.map((u) => (
                  <motion.div key={u._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white/70 backdrop-blur rounded-[2rem] p-5 border border-white shadow-sm">
                    <div className="flex items-start gap-4">
                      {/* Document preview */}
                      {u.kycStatus?.kycDocumentUrl && (
                        <a href={u.kycStatus.kycDocumentUrl} target="_blank" rel="noopener noreferrer"
                          className="shrink-0 h-20 w-20 rounded-2xl overflow-hidden border border-pine-teal/10 shadow-sm hover:opacity-80 transition-opacity">
                          <img src={u.kycStatus.kycDocumentUrl} alt="KYC doc"
                            className="w-full h-full object-cover" />
                        </a>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-pine-teal">{u.name}</p>
                          {u.kycStatus?.documentVerified ? (
                            <span className="text-[10px] font-black text-pine-teal bg-pine-teal/10 border border-pine-teal/20 rounded-full px-2 py-0.5">Verified</span>
                          ) : (
                            <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Pending</span>
                          )}
                        </div>
                        <p className="text-[12px] text-dusty-lavender">{u.email} · {u.bloodGroup || "—"}</p>
                        <p className="text-[11px] text-pine-teal/40 mt-0.5">
                          {u.kycStatus?.documentType?.replace("_", " ")} ·{" "}
                          Submitted {u.kycStatus?.kycSubmittedAt
                            ? new Date(u.kycStatus.kycSubmittedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short" })
                            : "—"}
                        </p>
                        {!u.kycStatus?.documentVerified && (
                          <div className="flex gap-2 mt-3">
                            <button onClick={() => handleKYC(u._id, true)}
                              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-pine-teal/10 text-pine-teal border border-pine-teal/20 hover:bg-pine-teal hover:text-white transition-all">
                              <FaCheck className="text-[9px]" /> Approve
                            </button>
                            <button onClick={() => handleKYC(u._id, false)}
                              className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white transition-all">
                              <FaBan className="text-[9px]" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === "users" && (
              <>
                <div className="flex justify-end mb-3">
                  <button onClick={() => handleExportCSV("users")}
                    className="flex items-center gap-2 rounded-xl border border-pine-teal/25 bg-pine-teal/8 px-4 py-2 text-[12px] font-bold text-pine-teal hover:bg-pine-teal/15 transition-colors">
                    ↓ Export CSV
                  </button>
                </div>
                <div className="hidden md:block bg-white/70 backdrop-blur-lg border border-white rounded-[2rem] overflow-hidden shadow-[0_20px_40px_rgba(59,107,84,0.08)]">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white/50 text-dusty-lavender text-[10px] uppercase tracking-widest border-b border-dusty-lavender/30">
                      <tr>
                        <th className="px-6 py-4 font-black">User</th>
                        <th className="px-6 py-4 font-black">Email</th>
                        <th className="px-6 py-4 font-black">Points</th>
                        <th className="px-6 py-4 font-black">Joined</th>
                        <th className="px-6 py-4 font-black text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dusty-lavender/20">
                      {usersList.map((u) => (
                        <tr
                          key={u._id}
                          className="hover:bg-pearl-beige/30 transition-colors"
                        >
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-pearl-beige/50 border border-dusty-lavender/30 flex items-center justify-center font-black text-pine-teal">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-pine-teal">
                                {u.name}
                              </p>
                              {u.isAdmin && (
                                <span className="text-[8px] bg-dark-raspberry text-white px-2 py-0.5 rounded font-black uppercase shadow-sm">
                                  Admin
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-pine-teal/80">
                            {u.email}
                          </td>
                          <td className="px-6 py-4 font-black text-dark-raspberry drop-shadow-sm">
                            {u.points} Points
                          </td>
                          <td className="px-6 py-4 text-dusty-lavender">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-2">
                            {u._id !== user._id && (
                              <>
                                <button
                                  onClick={() =>
                                    handleToggleRole(u._id, u.name, u.isAdmin)
                                  }
                                  className={`p-2 rounded-xl transition-all border ${u.isAdmin ? "bg-dark-raspberry/10 text-dark-raspberry border-dark-raspberry/20 hover:bg-dark-raspberry hover:text-white" : "bg-pine-teal/10 text-pine-teal border-pine-teal/20 hover:bg-pine-teal hover:text-white"}`}
                                  title={
                                    u.isAdmin ? "Revoke Admin" : "Make Admin"
                                  }
                                >
                                  {u.isAdmin ? (
                                    <FaUserTimes />
                                  ) : (
                                    <FaUserShield />
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteUser(u._id, u.name)
                                  }
                                  className="bg-blazing-flame/10 text-blazing-flame border border-blazing-flame/20 hover:bg-blazing-flame hover:text-white p-2 rounded-xl transition-all"
                                  title="Delete User"
                                >
                                  <FaTrash />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {usersList.map((u) => (
                    <div
                      key={u._id}
                      className="bg-white/70 backdrop-blur-lg border border-white rounded-[1.5rem] p-5 flex flex-col gap-4 shadow-md"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-pearl-beige/50 border border-dusty-lavender/30 flex items-center justify-center font-black text-pine-teal text-lg">
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-pine-teal leading-tight">
                              {u.name}
                            </p>
                            <p className="text-dusty-lavender text-[10px] flex items-center gap-1 mt-1">
                              <FaEnvelope /> {u.email}
                            </p>
                          </div>
                        </div>
                        {u.isAdmin && (
                          <span className="text-[8px] bg-dark-raspberry text-white px-2 py-1 rounded font-black uppercase shadow-sm">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center py-2 border-y border-dusty-lavender/20">
                        <div>
                          <p className="text-[8px] text-dusty-lavender uppercase font-black">
                            Points
                          </p>
                          <p className="text-dark-raspberry font-black text-xs">
                            {u.points} Points
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-dusty-lavender uppercase font-black">
                            Joined
                          </p>
                          <p className="text-pine-teal/80 font-bold text-xs">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {u._id !== user._id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handleToggleRole(u._id, u.name, u.isAdmin)
                            }
                            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95 border ${u.isAdmin ? "bg-dark-raspberry/10 text-dark-raspberry border-dark-raspberry/20" : "bg-pine-teal/10 text-pine-teal border-pine-teal/20"}`}
                          >
                            {u.isAdmin ? (
                              <>
                                <FaUserTimes /> Demote
                              </>
                            ) : (
                              <>
                                <FaUserShield /> Promote
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id, u.name)}
                            className="flex-1 bg-blazing-flame/10 text-blazing-flame border border-blazing-flame/20 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all active:scale-95"
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* LISTINGS TAB */}
            {activeTab === "listings" && (
              <>
                <div className="flex justify-end mb-3">
                  <button onClick={() => handleExportCSV("donations")}
                    className="flex items-center gap-2 rounded-xl border border-pine-teal/25 bg-pine-teal/8 px-4 py-2 text-[12px] font-bold text-pine-teal hover:bg-pine-teal/15 transition-colors">
                    ↓ Export CSV
                  </button>
                </div>
                <div className="hidden md:block bg-white/70 backdrop-blur-lg border border-white rounded-[2rem] overflow-hidden shadow-[0_20px_40px_rgba(59,107,84,0.08)]">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-white/50 text-dusty-lavender text-[10px] uppercase tracking-widest border-b border-dusty-lavender/30">
                      <tr>
                        <th className="px-6 py-4 font-black">Type</th>
                        <th className="px-6 py-4 font-black">Title</th>
                        <th className="px-6 py-4 font-black">Owner</th>
                        <th className="px-6 py-4 font-black">Status</th>
                        <th className="px-6 py-4 font-black text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dusty-lavender/20">
                      {listings.map((l) => (
                        <tr
                          key={l._id}
                          className="hover:bg-pearl-beige/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            {l.isEmergency ? (
                              <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md border bg-blazing-flame/10 text-blazing-flame border-blazing-flame/30">
                                SOS
                              </span>
                            ) : (
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${l.listingType === "request" ? "bg-dark-raspberry/10 text-dark-raspberry border-dark-raspberry/30" : "bg-pine-teal/10 text-pine-teal border-pine-teal/30"}`}
                              >
                                {l.listingType}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-pine-teal max-w-[200px] truncate">
                            {l.title}
                          </td>
                          <td className="px-6 py-4 text-pine-teal/80">
                            {l.donorId?.name || "Deleted User"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${l.status === "fulfilled" ? "bg-pine-teal/10 text-[#1a3630] border-[#1a3630]/30" : l.status === "hidden" ? "bg-dusty-lavender/10 text-dusty-lavender border-dusty-lavender/30" : "bg-dark-raspberry/10 text-dark-raspberry border-dark-raspberry/30"}`}
                            >
                              {l.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDeleteListing(l._id)}
                              className="bg-blazing-flame/10 text-blazing-flame border border-blazing-flame/20 hover:bg-blazing-flame hover:text-white p-2 rounded-xl transition-all"
                              title="Force Delete"
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 gap-4 md:hidden">
                  {listings.map((l) => (
                    <div
                      key={l._id}
                      className="bg-white/70 backdrop-blur-lg border border-white rounded-3xl p-5 space-y-3 shadow-md"
                    >
                      <div className="flex justify-between items-center">
                        {l.isEmergency ? (
                          <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md border bg-blazing-flame/10 text-blazing-flame border-blazing-flame/30">
                            SOS
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${l.listingType === "request" ? "bg-dark-raspberry/10 text-dark-raspberry border-dark-raspberry/30" : "bg-pine-teal/10 text-pine-teal border-pine-teal/30"}`}
                          >
                            {l.listingType}
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-black uppercase ${l.status === "fulfilled" ? "text-[#1a3630]" : l.status === "hidden" ? "text-dusty-lavender" : "text-dark-raspberry"}`}
                        >
                          {l.status}
                        </span>
                      </div>
                      <h4 className="text-pine-teal font-bold leading-snug drop-shadow-sm">
                        {l.title}
                      </h4>
                      <div className="flex justify-between items-center pt-3 border-t border-dusty-lavender/20">
                        <div>
                          <p className="text-[8px] text-dusty-lavender uppercase font-black">
                            Owner
                          </p>
                          <p className="text-pine-teal/80 text-xs font-bold">
                            {l.donorId?.name || "Deleted User"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteListing(l._id)}
                          className="bg-blazing-flame/10 border border-blazing-flame/20 text-blazing-flame p-3 rounded-xl active:bg-blazing-flame active:text-white transition-all active:scale-95"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* EVENTS TAB */}
            {activeTab === "events" && (
              <>
                {eventsList.length === 0 ? (
                  <div className="text-center py-20 bg-white/70 backdrop-blur-lg rounded-[2rem] border border-white shadow-md">
                    <p className="text-dusty-lavender text-sm font-bold uppercase tracking-widest">
                      No Active Events
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="hidden md:block bg-white/70 backdrop-blur-lg border border-white rounded-[2rem] overflow-hidden shadow-[0_20px_40px_rgba(59,107,84,0.08)]">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-white/50 text-dusty-lavender text-[10px] uppercase tracking-widest border-b border-dusty-lavender/30">
                          <tr>
                            <th className="px-6 py-4 font-black">Category</th>
                            <th className="px-6 py-4 font-black">
                              Event Title
                            </th>
                            <th className="px-6 py-4 font-black">Organizer</th>
                            <th className="px-6 py-4 font-black">Date</th>
                            <th className="px-6 py-4 font-black text-right">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dusty-lavender/20">
                          {eventsList.map((e) => (
                            <tr
                              key={e._id}
                              className="hover:bg-pearl-beige/30 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md border bg-pine-teal/10 text-pine-teal border-pine-teal/20">
                                  {e.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-pine-teal max-w-[200px] truncate">
                                {e.title}
                              </td>
                              <td className="px-6 py-4 text-pine-teal/80">
                                {e.organizationId?.name || "Unknown"}
                              </td>
                              <td className="px-6 py-4 text-dusty-lavender">
                                {new Date(e.eventDate).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() =>
                                    handleDeleteEvent(e._id, e.title)
                                  }
                                  className="bg-blazing-flame/10 text-blazing-flame border border-blazing-flame/20 hover:bg-blazing-flame hover:text-white p-2 rounded-xl transition-all"
                                  title="Delete Event"
                                >
                                  <FaTrash />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:hidden">
                      {eventsList.map((e) => (
                        <div
                          key={e._id}
                          className="bg-white/70 backdrop-blur-lg border border-white rounded-3xl p-5 space-y-3 shadow-md"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase px-2 py-1 rounded-md border bg-pine-teal/10 text-pine-teal border-pine-teal/20">
                              {e.category}
                            </span>
                          </div>
                          <h4 className="text-pine-teal font-bold leading-snug drop-shadow-sm">
                            {e.title}
                          </h4>
                          <div className="flex justify-between items-center pt-3 border-t border-dusty-lavender/20">
                            <div>
                              <p className="text-[8px] text-dusty-lavender uppercase font-black">
                                Date
                              </p>
                              <p className="text-pine-teal/80 text-xs font-bold">
                                {new Date(e.eventDate).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteEvent(e._id, e.title)}
                              className="bg-blazing-flame/10 border border-blazing-flame/20 text-blazing-flame p-3 rounded-xl active:bg-blazing-flame active:text-white transition-all active:scale-95"
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
