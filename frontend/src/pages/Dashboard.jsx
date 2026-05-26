import { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  FaHeartbeat, FaMapMarkerAlt, FaCommentDots, FaSpinner, FaTimes,
  FaExclamationTriangle, FaTrash, FaBoxOpen, FaLocationArrow,
  FaCheckCircle, FaCheck, FaLock, FaUsers, FaRunning, FaHandsHelping,
  FaShareAlt, FaMedal, FaUtensils, FaTshirt, FaBook, FaBell, FaShieldAlt,
  FaMicrophone, FaMoon, FaSun, FaPlus, FaClock, FaArrowRight,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";

/* ── Constants ── */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace("/api", "")
  : "https://hopelink-api.onrender.com";

const FILTER_OPTIONS = [
  { label: "All",     icon: FaBoxOpen },
  { label: "Blood",   icon: FaHeartbeat },
  { label: "Food",    icon: FaUtensils },
  { label: "Clothes", icon: FaTshirt },
  { label: "Book",    icon: FaBook },
  { label: "General", icon: FaHandsHelping },
];

const CATEGORY_META = {
  blood:   { label: "Blood",   icon: FaHeartbeat,   color: "text-blazing-flame", bg: "bg-blazing-flame",   soft: "bg-blazing-flame/12 text-blazing-flame border-blazing-flame/25" },
  food:    { label: "Food",    icon: FaUtensils,    color: "text-pine-teal",     bg: "bg-pine-teal",       soft: "bg-pine-teal/12 text-pine-teal border-pine-teal/25" },
  clothes: { label: "Clothes", icon: FaTshirt,      color: "text-dark-raspberry",bg: "bg-dark-raspberry",  soft: "bg-dark-raspberry/12 text-dark-raspberry border-dark-raspberry/25" },
  book:    { label: "Book",    icon: FaBook,        color: "text-dusty-lavender",bg: "bg-dusty-lavender",  soft: "bg-dusty-lavender/12 text-dusty-lavender border-dusty-lavender/25" },
  general: { label: "General", icon: FaHandsHelping,color: "text-pine-teal",     bg: "bg-pine-teal/80",    soft: "bg-pine-teal/8 text-pine-teal border-pine-teal/20" },
};

const getCategoryMeta = (c) => CATEGORY_META[c?.toLowerCase()] || CATEGORY_META.general;

const optimizeImageUrl = (url) => {
  if (!url) return "";
  if (!url.includes("cloudinary.com")) return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_900/");
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return "Late night watch";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
};

/* ── Variants ── */
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  show: (i) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 26, delay: Math.min(i * 0.04, 0.2) },
  }),
  exit: { opacity: 0, y: -12, scale: 0.97, transition: { duration: 0.16 } },
};

/* ── Skeleton ── */
const SkeletonCard = () => (
  <div className="relative overflow-hidden rounded-3xl border border-pine-teal/8 bg-surface">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent z-10" />
    <div className="h-52 w-full bg-pearl-beige/60" />
    <div className="p-5 space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-pearl-beige/70" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-1/2 rounded-full bg-pearl-beige/70" />
          <div className="h-2 w-1/3 rounded-full bg-pearl-beige/50" />
        </div>
      </div>
      <div className="h-4 w-4/5 rounded-full bg-pearl-beige/70" />
      <div className="h-3 w-full rounded-full bg-pearl-beige/50" />
      <div className="h-3 w-2/3 rounded-full bg-pearl-beige/50" />
      <div className="h-11 w-full rounded-2xl bg-pearl-beige/60 mt-2" />
    </div>
  </div>
);

/* ══════════════════════════════════════════════
   DASHBOARD COMPONENT
══════════════════════════════════════════════ */
const Dashboard = () => {
  const { user, switchRole, socket, enableNotifications, isDarkMode, toggleDarkMode } = useContext(AuthContext);
  const navigate = useNavigate();

  const [localRole, setLocalRole]       = useState(user?.activeRole || "donor");
  const [feed, setFeed]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [responders, setResponders]     = useState([]);
  const [filterCategory, setFilter]     = useState("All");
  const [page, setPage]                 = useState(1);
  const [hasMore, setHasMore]           = useState(false);
  const [loadingMore, setLoadingMore]   = useState(false);
  const [showSOS, setShowSOS]           = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvingId, setApprovingId]   = useState(null);
  const [requestsModal, setRequestsModal] = useState({ isOpen: false, donation: null });
  const [suggestions, setSuggestions]   = useState([]);
  const [isFetchingLoc, setFetchingLoc] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [isListening, setIsListening]   = useState(false);

  const isDonor = localRole === "donor";

  const [sosData, setSosData] = useState({
    bloodGroup: "", quantity: "", hospital: "", roomNumber: "",
    patientName: "", patientAge: "", addressText: "", description: "",
    lat: null, lng: null,
  });

  /* ── Effects ── */
  useEffect(() => { if (user?.activeRole) setLocalRole(user.activeRole); }, [user?.activeRole]);

  useEffect(() => {
    if (!user?.token) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/donations/feed?page=1&limit=12");
        setFeed(data.donations || (Array.isArray(data) ? data : []));
        setHasMore(data.hasMore || false);
        setPage(1);
      } catch { toast.error("Failed to load feed"); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (!user || !socket) return;
    const onDonorComing = (d) => {
      setResponders((p) => [...p, d]);
      toast.success(`${d.donorName} is on the way!`);
      setTimeout(() => setResponders((p) => p.filter((r) => r.blastId !== d.blastId)), 10000);
    };
    const onNew     = (d) => setFeed((p) => [d, ...p]);
    const onUpdated = (d) => setFeed((p) => p.map((i) => (i._id === d._id ? d : i)));
    const onDeleted = (id) => setFeed((p) => p.filter((i) => i._id !== id));
    socket.on("donor_coming",     onDonorComing);
    socket.on("new_listing",      onNew);
    socket.on("listing_updated",  onUpdated);
    socket.on("listing_deleted",  onDeleted);
    return () => {
      socket.off("donor_coming",    onDonorComing);
      socket.off("new_listing",     onNew);
      socket.off("listing_updated", onUpdated);
      socket.off("listing_deleted", onDeleted);
    };
  }, [user, socket]);

  useEffect(() => () => { if (typingTimeout) clearTimeout(typingTimeout); }, [typingTimeout]);

  /* ── Computed ── */
  const processedFeed = useMemo(
    () => feed.filter((i) => filterCategory === "All" || i.category?.toLowerCase() === filterCategory.toLowerCase()),
    [feed, filterCategory],
  );

  const stats = useMemo(() => [
    { label: "Live Posts",   value: processedFeed.length, icon: FaBoxOpen,          color: "text-pine-teal",      ring: "ring-pine-teal/20",      bg: "bg-pine-teal/8" },
    { label: "SOS Alerts",   value: feed.filter((i) => i.isEmergency).length, icon: FaHeartbeat, color: "text-blazing-flame", ring: "ring-blazing-flame/20", bg: "bg-blazing-flame/8" },
    { label: "Responders",   value: feed.reduce((t, i) => t + (i.requestedBy?.length || 0), 0), icon: FaUsers, color: "text-dark-raspberry", ring: "ring-dark-raspberry/20", bg: "bg-dark-raspberry/8" },
    { label: "Completed",    value: feed.filter((i) => i.status === "fulfilled").length, icon: FaCheckCircle, color: "text-dusty-lavender", ring: "ring-dusty-lavender/20", bg: "bg-dusty-lavender/8" },
  ], [feed, processedFeed.length]);

  /* ── Handlers ── */
  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const { data } = await api.get(`/donations/feed?page=${page + 1}&limit=12`);
      setFeed((p) => [...p, ...(data.donations || [])]);
      setHasMore(data.hasMore);
      setPage((p) => p + 1);
    } catch { toast.error("Failed to fetch more."); }
    finally { setLoadingMore(false); }
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported.");
    setFetchingLoc(true);
    const tid = toast.loading("Locating you…");
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
          if (!apiKey) throw new Error("Mapbox token missing");
          const { data } = await axios.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${apiKey}`,
          );
          if (data?.features?.length) {
            const f = data.features.find((f) => f.id.startsWith("place.") || f.id.startsWith("locality.")) || data.features[0];
            setSosData((p) => ({ ...p, addressText: f.text, lat: latitude, lng: longitude }));
            setSuggestions([]);
            toast.success(`Location: ${f.text}`, { id: tid });
          }
        } catch { toast.error("Could not resolve address.", { id: tid }); }
        finally { setFetchingLoc(false); }
      },
      () => { setFetchingLoc(false); toast.error("Location access denied.", { id: tid }); },
      { enableHighAccuracy: true },
    );
  };

  const startVoiceRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return toast.error("Voice SOS not supported in this browser.");
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = "en-US";
    r.onstart  = () => { setIsListening(true); toast.loading("Listening…", { id: "voice" }); };
    r.onresult = ({ results }) => {
      const t = results[0][0].transcript;
      toast.success("Voice captured! Review the form.", { id: "voice" });
      let d = { ...sosData, description: t };
      const low = t.toLowerCase();
      for (const bg of ["a+","a-","b+","b-","ab+","ab-","o+","o-"]) {
        if (low.includes(bg)) { d.bloodGroup = bg.toUpperCase(); break; }
      }
      const m = low.match(/(\d+)\s*units?/);
      if (m) d.quantity = m[1];
      setSosData(d);
    };
    r.onerror  = ({ error }) => { toast.error(`Voice error: ${error}`, { id: "voice" }); setIsListening(false); };
    r.onend    = () => setIsListening(false);
    r.start();
  };

  const handleSOSSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const tid = toast.loading("Analyzing emergency…");
      await new Promise((res) => setTimeout(res, 1800));
      const text = (sosData.description + " " + sosData.title).toLowerCase();
      const sev  = ["critical","urgent","accident","dying","icu"].some((w) => text.includes(w)) ? "Code Red" : "Code Yellow";
      toast.success(`Classified as ${sev}. Broadcasting…`, { id: tid });

      const fd = new FormData();
      fd.append("listingType",  "request");
      fd.append("category",     "blood");
      fd.append("isEmergency",  "true");
      fd.append("severityLevel", sev);
      fd.append("bloodGroup",   sosData.bloodGroup);
      fd.append("quantity",     `${sosData.quantity} Units`);
      fd.append("title",        `URGENT: ${sosData.bloodGroup} Needed!`);
      fd.append("description",  sosData.description);
      fd.append("addressText",  `${sosData.hospital}, ${sosData.addressText}`);
      if (sosData.roomNumber) fd.append("hospitalRoomNumber", sosData.roomNumber);
      fd.append("patientDetails", JSON.stringify({ name: sosData.patientName, age: sosData.patientAge ? +sosData.patientAge : undefined }));
      fd.append("criticalDeadline", new Date(Date.now() + (sev === "Code Red" ? 4 : 12) * 3600000).toISOString());
      if (sosData.lat) fd.append("lat", sosData.lat);
      if (sosData.lng) fd.append("lng", sosData.lng);

      const { data } = await api.post("/donations", fd);
      setFeed((p) => [data, ...p]);
      setShowSOS(false);
      setSosData({ bloodGroup:"",quantity:"",hospital:"",roomNumber:"",patientName:"",patientAge:"",addressText:"",description:"",lat:null,lng:null });
      toast.success("SOS broadcast sent!");
    } catch { toast.error("Failed to broadcast SOS."); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete  = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try { await api.delete(`/donations/${id}`); setFeed((p) => p.filter((i) => i._id !== id)); toast.success("Deleted."); }
    catch { toast.error("Delete failed."); }
  };

  const handleRequest = async (id) => {
    try {
      await api.post(`/donations/${id}/request`, {});
      setFeed((p) => p.map((i) => i._id === id ? { ...i, requestedBy: [...(i.requestedBy||[]), { _id: user._id, name: user.name }] } : i));
      toast.success("Request sent!");
    } catch { toast.error("Failed to send request."); }
  };

  const handleApprove = async (donationId, receiverId) => {
    setApprovingId(receiverId);
    try {
      await api.patch(`/donations/${donationId}/approve`, { receiverId });
      setRequestsModal({ isOpen: false, donation: null });
      setFeed((p) => p.map((i) => i._id === donationId ? { ...i, status: "pending", receiverId } : i));
      toast.success("Approved!");
    } catch { toast.error("Approval failed."); }
    finally { setApprovingId(null); }
  };

  const handleShare = async (item) => {
    const text = item.isEmergency
      ? `URGENT: ${item.bloodGroup} blood needed at ${item.addressText?.split(",")[0] || "nearby"}. Can you help?`
      : `${item.title} available near you on Sahayam.`;
    if (navigator.share) {
      try { await navigator.share({ title: item.title, text, url: window.location.origin }); }
      catch { /* cancelled */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} → ${window.location.origin}`)}`);
    }
  };

  if (!user) return null;

  /* ── Field styling helper ── */
  const sosField = "w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3.5 text-sm font-medium text-white placeholder-white/30 outline-none focus:border-blazing-flame/60 focus:bg-blazing-flame/6 transition-all";

  return (
    <Layout>
      <div className="min-h-screen bg-pearl-beige font-sans text-pine-teal relative overflow-x-hidden">

        {/* ── Ambient background ── */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="dashboard-grid absolute inset-0 opacity-50" />
          <div className="dashboard-sheen absolute -top-32 left-[-20%] h-[70vh] w-[140%] opacity-50" />
        </div>

        {/* ── Responder toasts ── */}
        <div className="pointer-events-none fixed left-1/2 top-16 z-[200] -translate-x-1/2 flex flex-col gap-2">
          <AnimatePresence>
            {responders.map((r, i) => (
              <motion.div key={`${r.blastId}-${i}`}
                initial={{ y: -16, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -16 }}
                className="pointer-events-auto flex items-center gap-3 rounded-full border border-blazing-flame/25 bg-surface/95 px-5 py-3 shadow-xl backdrop-blur-xl"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blazing-flame/12">
                  <FaRunning className="text-xs text-blazing-flame" />
                </div>
                <span className="text-xs font-bold text-pine-teal">{r.donorName} is on their way</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ══════════════ MAIN CONTENT ══════════════ */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-28 md:pb-16">

          {/* ── HERO HEADER ── */}
          <header className="pt-8 pb-8 md:pt-10 md:pb-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">

              {/* Left: greeting */}
              <div>
                <motion.p
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="mb-1 text-[11px] font-black uppercase tracking-[0.3em] text-dusty-lavender"
                >
                  {getGreeting()} ·{" "}
                  <span className={isDonor ? "text-blazing-flame" : "text-dark-raspberry"}>
                    {isDonor ? "Donor Mode" : "Receiver Mode"}
                  </span>
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-pine-teal leading-[1.1]"
                >
                  {user?.name?.split(" ")[0]}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.10 }}
                  className="mt-2 hidden max-w-md text-sm font-medium leading-relaxed text-pine-teal/55 sm:block"
                >
                  {isDonor
                    ? "Your community is watching. A single post can change someone's day."
                    : "You're not alone. Ask — and someone nearby will show up."}
                </motion.p>
              </div>

              {/* Right: action bar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08, type: "spring", stiffness: 240 }}
                className="flex flex-wrap gap-2"
              >
                {/* Post / Request */}
                <motion.button
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/donations")}
                  className={`flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all ${
                    isDonor ? "bg-pine-teal shadow-pine-teal/25" : "bg-dark-raspberry shadow-dark-raspberry/25"
                  }`}
                >
                  <FaPlus className="text-[10px]" />
                  {isDonor ? "Post" : "Request"}
                </motion.button>

                {/* Alerts */}
                <motion.button
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                  onClick={enableNotifications}
                  className="flex items-center gap-2 rounded-xl border border-pine-teal/12 bg-surface px-4 py-3 text-xs font-bold text-pine-teal shadow-sm hover:border-pine-teal/25 transition-all"
                >
                  <FaBell className="text-blazing-flame" />
                  <span className="hidden sm:inline">Alerts</span>
                </motion.button>

                {/* Dark mode */}
                <motion.button
                  whileHover={{ y: -2 }} whileTap={{ scale: 0.95 }}
                  onClick={toggleDarkMode}
                  className="flex items-center gap-2 rounded-xl border border-pine-teal/12 bg-surface px-4 py-3 text-xs font-bold text-pine-teal shadow-sm hover:border-pine-teal/25 transition-all"
                >
                  {isDarkMode ? <FaSun className="text-yellow-500" /> : <FaMoon className="text-dusty-lavender" />}
                </motion.button>

                {/* SOS — premium red button */}
                <motion.button
                  whileHover={{ y: -2, scale: 1.03 }} whileTap={{ scale: 0.94 }}
                  onClick={() => setShowSOS(true)}
                  className="relative flex items-center gap-2.5 rounded-xl bg-blazing-flame px-5 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blazing-flame/30 transition-all overflow-hidden"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                  <FaHeartbeat className="animate-pulse" />
                  SOS
                </motion.button>
              </motion.div>
            </div>
          </header>

          {/* ── STATS ROW ── */}
          <motion.div
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
            className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4"
          >
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.label}
                  variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                  className={`relative overflow-hidden rounded-2xl border border-pine-teal/8 bg-surface p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default`}
                >
                  <div className={`absolute -top-4 -right-4 h-20 w-20 rounded-full ${s.bg} blur-xl`} />
                  <p className="relative text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-2">{s.label}</p>
                  <div className="relative flex items-end justify-between">
                    <p className={`text-3xl font-black tracking-tight ${s.color}`}>{s.value}</p>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.bg} ring-1 ${s.ring}`}>
                      <Icon className={`text-sm ${s.color}`} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* ── INVITE BANNER ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            onClick={() => {
              const link = encodeURIComponent(`${window.location.origin}/?ref=${user?.referralCode}`);
              window.open(`https://wa.me/?text=I%20just%20joined%20Sahayam.%20Come%20join%20me%3A%20${link}`, "_blank");
            }}
            className="mb-8 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-pine-teal to-[#122820] p-7 md:p-8 shadow-xl shadow-pine-teal/20 cursor-pointer hover:-translate-y-0.5 hover:shadow-pine-teal/30 transition-all"
          >
            <div className="pointer-events-none absolute -top-16 -right-12 h-48 w-48 rounded-full bg-dark-raspberry/15 blur-3xl group-hover:bg-dark-raspberry/20 transition-colors duration-700" />
            <div className="pointer-events-none absolute -bottom-12 left-0 h-32 w-48 rounded-full bg-blazing-flame/8 blur-2xl" />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Community · Referral</p>
                <h3 className="text-xl md:text-2xl font-black text-white tracking-tight leading-snug">
                  Every person you invite<br className="hidden md:block" /> could save a life.
                </h3>
              </div>
              <button className="shrink-0 flex items-center gap-2 bg-white/12 hover:bg-white/20 border border-white/15 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl transition-all">
                <FaShareAlt /> Invite Friends <FaArrowRight className="text-[10px] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* ── FILTER TABS ── */}
          <div className="sticky top-0 z-30 -mx-4 mb-6 px-4 py-2.5 bg-pearl-beige/90 backdrop-blur-xl border-b border-pine-teal/8 md:static md:mx-0 md:bg-transparent md:backdrop-blur-none md:border-0 md:py-0 md:mb-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {FILTER_OPTIONS.map(({ label, icon: Icon }) => {
                const active = filterCategory === label;
                return (
                  <motion.button
                    key={label}
                    whileHover={{ y: -1 }} whileTap={{ scale: 0.95 }}
                    onClick={() => setFilter(label)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                      active
                        ? "bg-pine-teal text-white shadow-md shadow-pine-teal/20"
                        : "border border-pine-teal/10 bg-surface text-dusty-lavender hover:text-pine-teal hover:border-pine-teal/20"
                    }`}
                  >
                    <Icon className={active ? "text-white" : ""} />
                    {label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* ── FEED ── */}
          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {[1,2,3,4,5,6].map((n) => <SkeletonCard key={n} />)}
            </div>
          ) : processedFeed.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-pine-teal/8 text-pine-teal border border-pine-teal/12">
                <FaBoxOpen className="text-2xl" />
              </div>
              <h3 className="text-lg font-black text-pine-teal tracking-tight">Nothing here yet</h3>
              <p className="mt-2 max-w-xs text-sm font-medium text-pine-teal/50 leading-relaxed">
                Be the first to post in this category, or try a different filter.
              </p>
              <button onClick={() => navigate("/donations")}
                className="mt-6 flex items-center gap-2 rounded-xl bg-pine-teal px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-pine-teal/25">
                <FaPlus /> New Listing
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {processedFeed.map((item, idx) => {
                  const donorId     = item.donorId?._id || item.donorId;
                  const receiverId  = item.receiverId?._id || item.receiverId;
                  const isMine      = donorId === user._id;
                  const alreadyReq  = item.requestedBy?.some((r) => (r._id || r) === user._id);
                  const isApproved  = item.status === "pending" && receiverId === user._id;
                  const meta        = getCategoryMeta(item.category);
                  const CategoryIcon= meta.icon;
                  const avatarName  = encodeURIComponent(item.donorId?.name || "Sahayam");
                  const dateStr     = item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recently";

                  return (
                    <motion.article
                      layout
                      custom={idx}
                      variants={cardVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      whileHover={{ y: -4 }}
                      key={item._id}
                      className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-surface shadow-sm hover:shadow-xl transition-all duration-400 ${
                        item.isEmergency ? "border-blazing-flame/30" : "border-pine-teal/8"
                      }`}
                    >
                      {/* Emergency top stripe */}
                      {item.isEmergency && (
                        <div className="h-1 w-full bg-gradient-to-r from-blazing-flame via-[#ff7a4a] to-blazing-flame" />
                      )}

                      {/* Image / Category visual */}
                      <div className="relative h-48 w-full shrink-0 overflow-hidden bg-pearl-beige/60">
                        {item.image ? (
                          <img
                            src={optimizeImageUrl(item.image)}
                            alt={item.title}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : item.category?.toLowerCase() === "blood" ? (
                          <div className={`flex h-full w-full flex-col items-center justify-center gap-1 text-white ${
                            item.isEmergency
                              ? "bg-gradient-to-br from-blazing-flame to-[#c73200]"
                              : "bg-gradient-to-br from-dark-raspberry to-[#720b47]"
                          }`}>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_60%)]" />
                            <FaHeartbeat className="relative text-5xl drop-shadow-lg" />
                            <span className="relative text-5xl font-black drop-shadow-lg">{item.bloodGroup || "Blood"}</span>
                          </div>
                        ) : (
                          <div className={`flex h-full w-full flex-col items-center justify-center gap-2 border-b ${meta.soft}`}>
                            <CategoryIcon className="text-4xl" />
                            <span className="text-xs font-black uppercase tracking-[0.2em]">{meta.label}</span>
                          </div>
                        )}

                        {/* Overlay badges */}
                        <div className="absolute top-3 right-3 flex gap-2">
                          {item.verifiedByInstitution && (
                            <span className="flex items-center gap-1 rounded-xl bg-[#2b7fff]/90 backdrop-blur px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-md">
                              <FaShieldAlt className="text-[8px]" /> Verified
                            </span>
                          )}
                          {item.isEmergency ? (
                            <span className="flex items-center gap-1 rounded-xl bg-blazing-flame/90 backdrop-blur px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-md">
                              <FaExclamationTriangle className="text-[8px]" /> SOS
                            </span>
                          ) : (
                            <span className="rounded-xl bg-surface/85 backdrop-blur px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-pine-teal shadow-sm">
                              {meta.label}
                            </span>
                          )}
                        </div>

                        {/* Gradient fade at bottom of image */}
                        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-surface/80 to-transparent" />
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 flex-col p-5">

                        {/* Donor row */}
                        <div className="flex items-center gap-2.5 mb-3">
                          <img
                            src={item.donorId?.profilePic || `https://ui-avatars.com/api/?name=${avatarName}&background=ece8df&color=1d4a42&bold=true`}
                            alt="Donor"
                            className="h-9 w-9 shrink-0 rounded-xl border border-pine-teal/10 object-cover shadow-sm"
                          />
                          <div className="min-w-0">
                            <p className="flex items-center gap-1 text-sm font-bold text-pine-teal truncate leading-tight">
                              <span className="truncate">{item.donorId?.name || "Community Member"}</span>
                              {item.donorId?.points >= 50 && <FaMedal className="shrink-0 text-[10px] text-blazing-flame" />}
                            </p>
                            <p className="text-[10px] font-medium text-dusty-lavender">{dateStr}</p>
                          </div>
                          {/* Status chip */}
                          <span className={`ml-auto shrink-0 rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border ${
                            item.status === "fulfilled" ? "bg-pine-teal/8 text-pine-teal border-pine-teal/20"
                            : item.status === "pending" ? "bg-dark-raspberry/8 text-dark-raspberry border-dark-raspberry/20"
                            : "bg-pearl-beige text-dusty-lavender border-pine-teal/10"
                          }`}>
                            {item.status || "active"}
                          </span>
                        </div>

                        {/* Title + desc */}
                        <h3 className="mb-1.5 line-clamp-2 text-[15px] font-black leading-snug tracking-tight text-pine-teal group-hover:text-blazing-flame transition-colors duration-300">
                          {item.title}
                        </h3>
                        <p className="mb-3 line-clamp-2 text-sm font-medium leading-relaxed text-pine-teal/55 flex-1">
                          {item.description}
                        </p>

                        {/* Patient details block */}
                        {item.patientDetails?.name && (
                          <div className="mb-3 rounded-xl border-l-2 border-blazing-flame bg-blazing-flame/5 px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-blazing-flame mb-0.5">Patient</p>
                            <p className="text-sm font-bold text-pine-teal">
                              {item.patientDetails.name}
                              {item.patientDetails.age && <span className="text-pine-teal/50 font-medium ml-1.5">· {item.patientDetails.age} yrs</span>}
                            </p>
                            {item.hospitalRoomNumber && (
                              <p className="text-[11px] font-medium text-pine-teal/60 mt-0.5">Ward: <span className="font-bold text-dark-raspberry">{item.hospitalRoomNumber}</span></p>
                            )}
                          </div>
                        )}

                        {/* Tags row */}
                        <div className="mb-3 flex flex-wrap gap-2">
                          {item.quantity && (
                            <span className="rounded-lg border border-pine-teal/12 bg-pine-teal/6 px-2.5 py-1 text-[10px] font-bold text-pine-teal">
                              {item.quantity}
                            </span>
                          )}
                          {item.severityLevel && item.severityLevel !== "Unverified" && (
                            <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${
                              item.severityLevel === "Code Red"
                                ? "border-blazing-flame/30 bg-blazing-flame/8 text-blazing-flame"
                                : "border-yellow-400/30 bg-yellow-400/8 text-yellow-600"
                            }`}>
                              {item.severityLevel}
                            </span>
                          )}
                          {item.criticalDeadline && (
                            <span className="flex items-center gap-1 rounded-lg border border-blazing-flame/20 bg-blazing-flame/6 px-2.5 py-1 text-[10px] font-bold text-blazing-flame">
                              <FaClock className="text-[8px] animate-pulse" />
                              {new Date(item.criticalDeadline).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>

                        {/* Location */}
                        <div className="mb-4 flex items-center gap-1.5 text-[11px] font-medium text-dusty-lavender">
                          <FaMapMarkerAlt className="shrink-0 text-[10px] text-dark-raspberry" />
                          <span className="truncate">{item.addressText || item.location?.addressText || "Location pending"}</span>
                        </div>

                        {/* ── CTA buttons ── */}
                        <div className="mt-auto flex gap-2.5 border-t border-pine-teal/6 pt-4">
                          {isMine ? (
                            item.status === "fulfilled" ? (
                              <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-pine-teal/12 bg-surface-2 py-3 text-[11px] font-bold text-pine-teal/50">
                                <FaCheckCircle className="text-pine-teal/40" /> Completed
                              </div>
                            ) : (
                              <>
                                <motion.button
                                  whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}
                                  onClick={() => setRequestsModal({ isOpen: true, donation: item })}
                                  disabled={!item.requestedBy?.length}
                                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[11px] font-bold transition-all border ${
                                    item.requestedBy?.length
                                      ? "border-pine-teal/20 bg-pine-teal/6 text-pine-teal hover:bg-pine-teal/12"
                                      : "border-pine-teal/8 bg-surface-2 text-dusty-lavender cursor-not-allowed"
                                  }`}
                                >
                                  <FaUsers className="text-[10px]" />
                                  Requests ({item.requestedBy?.length || 0})
                                </motion.button>
                                <motion.button
                                  whileHover={{ y: -1 }} whileTap={{ scale: 0.94 }}
                                  onClick={() => handleDelete(item._id)}
                                  className="flex w-11 items-center justify-center rounded-xl border border-blazing-flame/15 bg-blazing-flame/6 text-blazing-flame hover:bg-blazing-flame hover:text-white transition-all"
                                >
                                  <FaTrash className="text-xs" />
                                </motion.button>
                              </>
                            )
                          ) : item.status === "fulfilled" ? (
                            <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-pine-teal/10 bg-surface-2 py-3 text-[11px] font-bold text-dusty-lavender">
                              <FaLock className="text-[10px]" /> Closed
                            </div>
                          ) : isApproved ? (
                            <motion.button
                              whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}
                              onClick={() => navigate(`/chat/${item._id}_${user._id}`)}
                              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-dark-raspberry to-[#750a4c] py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-md shadow-dark-raspberry/20"
                            >
                              <FaCommentDots /> Connect Now
                            </motion.button>
                          ) : alreadyReq ? (
                            <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-pine-teal/15 bg-pine-teal/6 py-3 text-[11px] font-bold text-pine-teal">
                              <FaCheck className="text-[10px]" /> Request Sent
                            </div>
                          ) : (
                            <>
                              <motion.button
                                whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}
                                onClick={() => handleRequest(item._id)}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-md transition-all ${
                                  item.isEmergency
                                    ? "bg-gradient-to-r from-blazing-flame to-[#c73200] shadow-blazing-flame/25"
                                    : "bg-gradient-to-r from-pine-teal to-[#122820] shadow-pine-teal/20"
                                }`}
                              >
                                <FaHandsHelping className="text-[10px]" />
                                {item.isEmergency ? "Respond to SOS" : "Claim"}
                              </motion.button>
                              <motion.button
                                whileHover={{ y: -1 }} whileTap={{ scale: 0.94 }}
                                onClick={() => handleShare(item)}
                                className="flex w-11 items-center justify-center rounded-xl border border-pine-teal/12 bg-surface-2 text-pine-teal hover:border-pine-teal/25 transition-all"
                              >
                                <FaShareAlt className="text-xs" />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Load more */}
          {hasMore && !loading && (
            <div className="mt-10 flex justify-center">
              <motion.button
                whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
                onClick={loadMore} disabled={loadingMore}
                className="flex items-center gap-2.5 rounded-full border border-pine-teal/15 bg-surface px-8 py-3.5 text-xs font-bold text-pine-teal shadow-sm hover:shadow-md hover:border-pine-teal/25 transition-all disabled:opacity-50"
              >
                {loadingMore ? <FaSpinner className="animate-spin" /> : <><FaBoxOpen /> Load more</>}
              </motion.button>
            </div>
          )}
        </div>

        {/* ══════════════ SOS MODAL ══════════════ */}
        <AnimatePresence>
          {showSOS && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center p-4 sm:items-center">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/75 backdrop-blur-md"
                onClick={() => setShowSOS(false)}
              />

              {/* Modal */}
              <motion.div
                initial={{ y: "100%", opacity: 0, scale: 0.96 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 28, stiffness: 220 }}
                className="relative w-full max-w-md max-h-[92vh] overflow-y-auto no-scrollbar rounded-[2rem] bg-[#100d0d] border border-white/8 shadow-[0_0_80px_rgba(255,74,28,0.18)] p-6 sm:p-8"
              >
                {/* Ambient glow */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
                  <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-80 rounded-full bg-blazing-flame/12 blur-3xl" />
                  <div className="absolute -bottom-10 right-0 h-40 w-40 rounded-full bg-dark-raspberry/10 blur-2xl" />
                </div>

                {/* Header */}
                <div className="relative mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blazing-flame/40 bg-blazing-flame/15">
                      <FaExclamationTriangle className="text-xl text-blazing-flame animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-white">Emergency SOS</h2>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-blazing-flame/70">Broadcast to nearby donors</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSOS(false)}
                    className="rounded-full border border-white/10 bg-white/6 p-2.5 text-white/50 hover:text-white hover:bg-white/12 transition-all"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                </div>

                {/* Voice button */}
                <button
                  type="button" onClick={startVoiceRecognition}
                  className={`relative mb-5 w-full flex items-center justify-center gap-3 rounded-2xl border py-4 text-sm font-black uppercase tracking-widest text-white transition-all overflow-hidden ${
                    isListening
                      ? "border-blazing-flame bg-blazing-flame/20 animate-pulse"
                      : "border-white/12 bg-white/6 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <FaMicrophone className={isListening ? "animate-bounce" : ""} />
                  {isListening ? "Listening… Speak clearly" : "Tap to speak your emergency"}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">or fill form</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                {/* Form */}
                <form onSubmit={handleSOSSubmit} className="relative space-y-3">
                  <div className="flex gap-3">
                    <select required value={sosData.bloodGroup}
                      onChange={(e) => setSosData({ ...sosData, bloodGroup: e.target.value })}
                      className={`flex-1 cursor-pointer appearance-none ${sosField}`}
                    >
                      <option value="" disabled className="text-black">Blood Type *</option>
                      {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((bg) => (
                        <option key={bg} value={bg} className="text-black">{bg}</option>
                      ))}
                    </select>
                    <input
                      required type="number" min="1"
                      placeholder="Units *"
                      value={sosData.quantity}
                      onChange={(e) => setSosData({ ...sosData, quantity: e.target.value })}
                      className={`w-24 text-center ${sosField}`}
                    />
                  </div>

                  <input required placeholder="Hospital / Facility *" value={sosData.hospital}
                    onChange={(e) => setSosData({ ...sosData, hospital: e.target.value })}
                    className={sosField} />

                  <div className="flex gap-3">
                    <input required placeholder="Patient Name *" value={sosData.patientName}
                      onChange={(e) => setSosData({ ...sosData, patientName: e.target.value })}
                      className={`flex-1 ${sosField}`} />
                    <input type="number" placeholder="Age" value={sosData.patientAge}
                      onChange={(e) => setSosData({ ...sosData, patientAge: e.target.value })}
                      className={`w-20 text-center ${sosField}`} />
                  </div>

                  <input placeholder="Ward / Room No. (optional)" value={sosData.roomNumber}
                    onChange={(e) => setSosData({ ...sosData, roomNumber: e.target.value })}
                    className={sosField} />

                  {/* Location */}
                  <div className="flex gap-2">
                    <input required readOnly placeholder="Location *" value={sosData.addressText}
                      className={`flex-1 cursor-not-allowed opacity-70 ${sosField}`} />
                    <button type="button" onClick={handleGetLocation} disabled={isFetchingLoc}
                      className="flex w-12 items-center justify-center rounded-xl border border-white/12 bg-white/6 text-white hover:bg-blazing-flame hover:border-blazing-flame disabled:opacity-50 transition-all">
                      {isFetchingLoc ? <FaSpinner className="animate-spin text-sm" /> : <FaLocationArrow className="text-sm" />}
                    </button>
                  </div>

                  <textarea required rows={2} placeholder="Describe the emergency *"
                    value={sosData.description}
                    onChange={(e) => setSosData({ ...sosData, description: e.target.value })}
                    className={`resize-none ${sosField}`} />

                  <motion.button
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    type="submit" disabled={isSubmitting}
                    className="mt-2 w-full flex items-center justify-center gap-2.5 rounded-2xl bg-blazing-flame py-4 text-sm font-black uppercase tracking-widest text-white shadow-[0_8px_30px_rgba(255,74,28,0.35)] disabled:opacity-50 transition-all"
                  >
                    {isSubmitting
                      ? <FaSpinner className="animate-spin text-lg" />
                      : <><FaHeartbeat className="animate-pulse" /> Broadcast SOS</>
                    }
                  </motion.button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ══════════════ REQUESTS MODAL ══════════════ */}
        <AnimatePresence>
          {requestsModal.isOpen && requestsModal.donation && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-md"
                onClick={() => setRequestsModal({ isOpen: false, donation: null })}
              />
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 16 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="relative w-full max-w-sm rounded-3xl border border-pine-teal/12 bg-surface shadow-2xl p-6"
              >
                <div className="mb-5 flex items-center justify-between border-b border-pine-teal/8 pb-4">
                  <div>
                    <h2 className="text-lg font-black text-pine-teal tracking-tight">Incoming Requests</h2>
                    <p className="text-[11px] font-medium text-dusty-lavender mt-0.5">Select who receives this item</p>
                  </div>
                  <button
                    onClick={() => setRequestsModal({ isOpen: false, donation: null })}
                    className="rounded-full border border-pine-teal/12 bg-surface-2 p-2.5 text-dusty-lavender hover:text-pine-teal transition-colors"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                </div>

                <div className="max-h-[50vh] space-y-2.5 overflow-y-auto no-scrollbar">
                  {requestsModal.donation.requestedBy.map((req) => (
                    <div key={req._id} className="flex items-center justify-between rounded-2xl border border-pine-teal/10 bg-surface-2 p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-xl bg-pine-teal/10 border border-pine-teal/15 flex items-center justify-center text-sm font-black text-pine-teal uppercase">
                          {req.name?.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-pine-teal truncate max-w-[120px]">{req.name}</span>
                      </div>
                      <motion.button
                        whileHover={{ y: -1 }} whileTap={{ scale: 0.94 }}
                        onClick={() => handleApprove(requestsModal.donation._id, req._id)}
                        disabled={approvingId === req._id}
                        className="flex items-center gap-1.5 rounded-xl bg-pine-teal px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-sm disabled:opacity-50"
                      >
                        {approvingId === req._id ? <FaSpinner className="animate-spin text-xs" /> : <><FaCheck className="text-[10px]" /> Approve</>}
                      </motion.button>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
};

export default Dashboard;
