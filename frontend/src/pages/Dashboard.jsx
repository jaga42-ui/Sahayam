import { useState, useEffect, useContext, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import {
  FaHeartbeat,
  FaMapMarkerAlt,
  FaCommentDots,
  FaSpinner,
  FaTimes,
  FaExclamationTriangle,
  FaTrash,
  FaBoxOpen,
  FaLocationArrow,
  FaCheckCircle,
  FaCheck,
  FaUsers,
  FaRunning,
  FaHandsHelping,
  FaShareAlt,
  FaMedal,
  FaUtensils,
  FaTshirt,
  FaBook,
  FaBell,
  FaShieldAlt,
  FaMicrophone,
  FaMoon,
  FaSun,
  FaPlus,
  FaClock,
  FaArrowRight,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../utils/api";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace("/api", "")
  : "https://hopelink-api.onrender.com";

const FILTER_OPTIONS = [
  { label: "All", icon: FaBoxOpen },
  { label: "Blood", icon: FaHeartbeat },
  { label: "Food", icon: FaUtensils },
  { label: "Clothes", icon: FaTshirt },
  { label: "Book", icon: FaBook },
  { label: "General", icon: FaHandsHelping },
];

const CATEGORY_META = {
  blood:   { label: "Blood",   icon: FaHeartbeat,   color: "text-blazing-flame",  bg: "bg-blazing-flame",  soft: "bg-blazing-flame/12 text-blazing-flame border-blazing-flame/25" },
  food:    { label: "Food",    icon: FaUtensils,    color: "text-pine-teal",      bg: "bg-pine-teal",      soft: "bg-pine-teal/12 text-pine-teal border-pine-teal/25" },
  clothes: { label: "Clothes", icon: FaTshirt,      color: "text-dark-raspberry", bg: "bg-dark-raspberry", soft: "bg-dark-raspberry/12 text-dark-raspberry border-dark-raspberry/25" },
  book:    { label: "Book",    icon: FaBook,        color: "text-dusty-lavender", bg: "bg-dusty-lavender", soft: "bg-dusty-lavender/12 text-dusty-lavender border-dusty-lavender/25" },
  general: { label: "General", icon: FaHandsHelping, color: "text-pine-teal",    bg: "bg-pine-teal/80",   soft: "bg-pine-teal/8 text-pine-teal border-pine-teal/20" },
};

const getCategoryMeta = (c) => CATEGORY_META[c?.toLowerCase()] || CATEGORY_META.general;

const optimizeImageUrl = (url) => {
  if (!url) return "";
  if (!url.includes("cloudinary.com"))
    return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_600/");
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return "Late night watch";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show:   (i) => ({ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28, delay: Math.min(i * 0.04, 0.2) } }),
  exit:   { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

const SkeletonCard = () => (
  <div className="relative overflow-hidden rounded-2xl border border-pine-teal/8 bg-surface">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-10" />
    <div className="h-36 w-full bg-pearl-beige/60" />
    <div className="p-4 space-y-2.5">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-pearl-beige/70" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-1/2 rounded-full bg-pearl-beige/70" />
          <div className="h-2 w-1/3 rounded-full bg-pearl-beige/50" />
        </div>
      </div>
      <div className="h-3.5 w-4/5 rounded-full bg-pearl-beige/70" />
      <div className="h-3 w-full rounded-full bg-pearl-beige/50" />
      <div className="h-10 w-full rounded-xl bg-pearl-beige/60 mt-1" />
    </div>
  </div>
);

const Dashboard = () => {
  const { user, socket, enableNotifications, isDarkMode, toggleDarkMode } = useContext(AuthContext);
  const navigate = useNavigate();

  const [localRole,      setLocalRole]      = useState(user?.activeRole || "donor");
  const [feed,           setFeed]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [responders,     setResponders]     = useState([]);
  const [filterCategory, setFilter]         = useState("All");
  const [page,           setPage]           = useState(1);
  const [hasMore,        setHasMore]        = useState(false);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [showSOS,        setShowSOS]        = useState(false);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [approvingId,    setApprovingId]    = useState(null);
  const [requestsModal,  setRequestsModal]  = useState({ isOpen: false, donation: null });
  const [suggestions,    setSuggestions]    = useState([]);
  const [isFetchingLoc,  setFetchingLoc]    = useState(false);
  const [typingTimeout,  setTypingTimeout]  = useState(null);
  const [isListening,    setIsListening]    = useState(false);

  const isDonor = localRole === "donor";

  const [sosData, setSosData] = useState({
    bloodGroup: "", quantity: "", hospital: "", roomNumber: "",
    patientName: "", patientAge: "", addressText: "", description: "", lat: null, lng: null,
  });

  useEffect(() => {
    if (user?.activeRole) setLocalRole(user.activeRole);
  }, [user?.activeRole]);

  useEffect(() => {
    if (!user?.token) return;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/donations/feed?page=1&limit=12");
        setFeed(data.donations || (Array.isArray(data) ? data : []));
        setHasMore(data.hasMore || false);
        setPage(1);
      } catch {
        toast.error("Failed to load feed");
      } finally {
        setLoading(false);
      }
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
    const onNew     = (d)  => setFeed((p) => [d, ...p]);
    const onUpdated = (d)  => setFeed((p) => p.map((i) => (i._id === d._id ? d : i)));
    const onDeleted = (id) => setFeed((p) => p.filter((i) => i._id !== id));
    socket.on("donor_coming",    onDonorComing);
    socket.on("new_listing",     onNew);
    socket.on("listing_updated", onUpdated);
    socket.on("listing_deleted", onDeleted);
    return () => {
      socket.off("donor_coming",    onDonorComing);
      socket.off("new_listing",     onNew);
      socket.off("listing_updated", onUpdated);
      socket.off("listing_deleted", onDeleted);
    };
  }, [user, socket]);

  useEffect(() => () => { if (typingTimeout) clearTimeout(typingTimeout); }, [typingTimeout]);

  const processedFeed = useMemo(
    () => feed.filter((i) => filterCategory === "All" || i.category?.toLowerCase() === filterCategory.toLowerCase()),
    [feed, filterCategory],
  );

  const stats = useMemo(() => [
    { label: "Live",       value: processedFeed.length,                                      icon: FaBoxOpen,     color: "text-pine-teal",      bg: "bg-pine-teal/10" },
    { label: "SOS",        value: feed.filter((i) => i.isEmergency).length,                   icon: FaHeartbeat,   color: "text-blazing-flame",  bg: "bg-blazing-flame/10" },
    { label: "Responders", value: feed.reduce((t, i) => t + (i.requestedBy?.length || 0), 0), icon: FaUsers,       color: "text-dark-raspberry", bg: "bg-dark-raspberry/10" },
    { label: "Done",       value: feed.filter((i) => i.status === "fulfilled").length,         icon: FaCheckCircle, color: "text-dusty-lavender", bg: "bg-dusty-lavender/10" },
  ], [feed, processedFeed.length]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const { data } = await api.get(`/donations/feed?page=${page + 1}&limit=12`);
      setFeed((p) => [...p, ...(data.donations || [])]);
      setHasMore(data.hasMore);
      setPage((p) => p + 1);
    } catch {
      toast.error("Failed to fetch more.");
    } finally {
      setLoadingMore(false);
    }
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
        } catch {
          toast.error("Could not resolve address.", { id: tid });
        } finally {
          setFetchingLoc(false);
        }
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
    r.onerror = ({ error }) => { toast.error(`Voice error: ${error}`, { id: "voice" }); setIsListening(false); };
    r.onend   = () => setIsListening(false);
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
      setSosData({ bloodGroup:"", quantity:"", hospital:"", roomNumber:"", patientName:"", patientAge:"", addressText:"", description:"", lat:null, lng:null });
      toast.success("SOS broadcast sent!");
    } catch {
      toast.error("Failed to broadcast SOS.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/donations/${id}`);
      setFeed((p) => p.filter((i) => i._id !== id));
      toast.success("Deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  };

  const handleRequest = async (id) => {
    try {
      await api.post(`/donations/${id}/request`, {});
      setFeed((p) => p.map((i) => i._id === id ? { ...i, requestedBy: [...(i.requestedBy || []), { _id: user._id, name: user.name }] } : i));
      toast.success("Request sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Request failed.");
    }
  };

  const handleApprove = async (donationId, receiverId) => {
    setApprovingId(receiverId);
    try {
      await api.post(`/donations/${donationId}/approve`, { receiverId });
      setRequestsModal({ isOpen: false, donation: null });
      setFeed((p) => p.map((i) => i._id === donationId ? { ...i, status: "pending", receiverId } : i));
      toast.success("Approved!");
    } catch {
      toast.error("Approval failed.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleShare = async (item) => {
    const text = item.isEmergency
      ? `URGENT: ${item.bloodGroup} blood needed at ${item.addressText?.split(",")[0] || "nearby"}. Can you help?`
      : `${item.title} available near you on Sahayam.`;
    if (navigator.share) {
      try { await navigator.share({ title: item.title, text, url: window.location.origin }); } catch { /* cancelled */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} → ${window.location.origin}`)}`);
    }
  };

  if (!user) return null;

  const sosField = "w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3.5 text-sm font-medium text-white placeholder-white/30 outline-none focus:border-blazing-flame/60 transition-all";

  return (
    <Layout>
      <div className="min-h-screen bg-pearl-beige font-sans text-pine-teal">

        {/* Donor-coming toasts */}
        <div className="pointer-events-none fixed top-16 inset-x-0 z-[200] flex flex-col items-center gap-2 px-4">
          <AnimatePresence>
            {responders.map((r, i) => (
              <motion.div key={`${r.blastId}-${i}`}
                initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, y: -16 }}
                className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-blazing-flame/25 bg-surface/96 px-4 py-2.5 shadow-xl backdrop-blur-xl">
                <FaRunning className="text-xs text-blazing-flame shrink-0" />
                <span className="text-xs font-bold text-pine-teal">{r.donorName} is on their way</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ── HEADER ── */}
        <header className="px-4 pt-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-dusty-lavender">
                {getGreeting()}
              </p>
              <h1 className="text-[28px] font-black tracking-tight text-pine-teal leading-tight mt-0.5 truncate">
                {user?.name?.split(" ")[0]}
              </h1>
              <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                isDonor
                  ? "border-blazing-flame/30 bg-blazing-flame/10 text-blazing-flame"
                  : "border-dark-raspberry/30 bg-dark-raspberry/10 text-dark-raspberry"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${isDonor ? "bg-blazing-flame" : "bg-dark-raspberry"}`} />
                {isDonor ? "Donor" : "Receiver"}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 mt-1">
              <motion.button whileTap={{ scale: 0.85 }} onClick={enableNotifications}
                className="h-10 w-10 flex items-center justify-center rounded-2xl border border-pine-teal/12 bg-surface shadow-sm">
                <FaBell className="text-sm text-dusty-lavender" />
              </motion.button>
              <motion.button whileTap={{ scale: 0.85 }} onClick={toggleDarkMode}
                className="h-10 w-10 flex items-center justify-center rounded-2xl border border-pine-teal/12 bg-surface shadow-sm">
                {isDarkMode ? <FaSun className="text-sm text-yellow-500" /> : <FaMoon className="text-sm text-dusty-lavender" />}
              </motion.button>
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => setShowSOS(true)}
                className="flex items-center gap-1.5 rounded-2xl bg-blazing-flame px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-blazing-flame/30">
                <FaHeartbeat className="animate-pulse text-xs" /> SOS
              </motion.button>
            </div>
          </div>
        </header>

        {/* ── STAT CHIPS ── */}
        <div className="px-4 mb-4">
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-0.5">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="shrink-0 flex items-center gap-2.5 rounded-2xl border border-pine-teal/8 bg-surface px-3.5 py-3 shadow-sm">
                  <div className={`h-8 w-8 flex items-center justify-center rounded-xl ${s.bg}`}>
                    <Icon className={`text-sm ${s.color}`} />
                  </div>
                  <div>
                    <p className={`text-lg font-black leading-none ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] font-bold text-dusty-lavender mt-0.5">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="px-4 mb-5 flex gap-2">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate("/donations")}
            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[11px] font-black uppercase tracking-widest text-white shadow-md ${
              isDonor ? "bg-pine-teal shadow-pine-teal/20" : "bg-dark-raspberry shadow-dark-raspberry/20"
            }`}>
            <FaPlus className="text-[10px]" />
            {isDonor ? "New Post" : "New Request"}
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => {
              const link = encodeURIComponent(`${window.location.origin}/?ref=${user?.referralCode}`);
              window.open(`https://wa.me/?text=I%20just%20joined%20Sahayam.%20Come%20join%20me%3A%20${link}`, "_blank");
            }}
            className="flex items-center justify-center gap-2 rounded-2xl border border-pine-teal/12 bg-surface px-5 py-3.5 text-[11px] font-bold text-pine-teal shadow-sm">
            <FaShareAlt className="text-xs" /> Invite
          </motion.button>
        </div>

        {/* ── FILTER PILLS ── */}
        <div className="sticky top-0 z-30 bg-pearl-beige/92 backdrop-blur-xl border-b border-pine-teal/8 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {FILTER_OPTIONS.map(({ label, icon: Icon }) => {
              const active = filterCategory === label;
              return (
                <motion.button key={label} whileTap={{ scale: 0.92 }} onClick={() => setFilter(label)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider transition-all ${
                    active
                      ? "bg-pine-teal text-white shadow-md shadow-pine-teal/20"
                      : "border border-pine-teal/10 bg-surface text-dusty-lavender"
                  }`}>
                  <Icon className={`text-[10px] ${active ? "text-white" : ""}`} />
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── FEED ── */}
        <div className="px-4 pt-4 pb-32 space-y-4">
          {loading ? (
            [...Array(3)].map((_, n) => <SkeletonCard key={n} />)
          ) : processedFeed.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 h-16 w-16 flex items-center justify-center rounded-3xl bg-pine-teal/8 border border-pine-teal/12">
                <FaBoxOpen className="text-2xl text-pine-teal" />
              </div>
              <h3 className="text-lg font-black text-pine-teal">Nothing here yet</h3>
              <p className="mt-2 max-w-xs text-sm text-pine-teal/50 leading-relaxed">
                Be the first to post, or try a different filter.
              </p>
              <button onClick={() => navigate("/donations")}
                className="mt-6 flex items-center gap-2 rounded-xl bg-pine-teal px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg">
                <FaPlus /> New Listing
              </button>
            </motion.div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {processedFeed.map((item, idx) => {
                  const donorId    = item.donorId?._id || item.donorId;
                  const receiverId = item.receiverId?._id || item.receiverId;
                  const isMine     = donorId === user._id;
                  const alreadyReq = item.requestedBy?.some((r) => (r._id || r) === user._id);
                  const isApproved = item.status === "pending" && receiverId === user._id;
                  const meta       = getCategoryMeta(item.category);
                  const CategoryIcon = meta.icon;
                  const dateStr    = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "Recently";

                  return (
                    <motion.article key={item._id} layout custom={idx}
                      variants={cardVariants} initial="hidden" animate="show" exit="exit"
                      className={`overflow-hidden rounded-2xl border bg-surface shadow-sm ${
                        item.isEmergency ? "border-blazing-flame/35" : "border-pine-teal/8"
                      }`}>

                      {item.isEmergency && (
                        <div className="h-0.5 w-full bg-gradient-to-r from-blazing-flame via-[#ff7a4a] to-blazing-flame" />
                      )}

                      {/* ── Visual ── */}
                      <div className="relative h-40 w-full overflow-hidden bg-pearl-beige/60">
                        {item.image ? (
                          <img src={optimizeImageUrl(item.image)} alt={item.title}
                            className="h-full w-full object-cover" />
                        ) : item.category?.toLowerCase() === "blood" ? (
                          <div className={`flex h-full w-full flex-col items-center justify-center gap-1 text-white ${
                            item.isEmergency
                              ? "bg-gradient-to-br from-blazing-flame to-[#c73200]"
                              : "bg-gradient-to-br from-dark-raspberry to-[#720b47]"
                          }`}>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.12),transparent_60%)]" />
                            <FaHeartbeat className="relative text-4xl drop-shadow-lg" />
                            <span className="relative text-4xl font-black drop-shadow-lg">{item.bloodGroup || "Blood"}</span>
                          </div>
                        ) : (
                          <div className={`flex h-full w-full flex-col items-center justify-center gap-2 ${meta.soft}`}>
                            <CategoryIcon className="text-3xl" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{meta.label}</span>
                          </div>
                        )}

                        <div className="absolute top-2.5 right-2.5 flex gap-1.5">
                          {item.verifiedByInstitution && (
                            <span className="flex items-center gap-1 rounded-lg bg-[#2b7fff]/90 backdrop-blur px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                              <FaShieldAlt className="text-[8px]" /> Verified
                            </span>
                          )}
                          {item.isEmergency ? (
                            <span className="flex items-center gap-1 rounded-lg bg-blazing-flame/90 backdrop-blur px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white">
                              <FaExclamationTriangle className="text-[8px]" /> SOS
                            </span>
                          ) : (
                            <span className="rounded-lg bg-surface/85 backdrop-blur px-2 py-1 text-[9px] font-black uppercase tracking-widest text-pine-teal">
                              {meta.label}
                            </span>
                          )}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface/40 to-transparent" />
                      </div>

                      {/* ── Body ── */}
                      <div className="p-4">
                        {/* Donor row */}
                        <div className="flex items-center gap-2 mb-3">
                          <img
                            src={item.donorId?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.donorId?.name || "S")}&background=1d4a42&color=fff&bold=true&size=64`}
                            alt="" referrerPolicy="no-referrer"
                            className="h-8 w-8 shrink-0 rounded-xl object-cover border border-pine-teal/10" />
                          <div className="flex-1 min-w-0 flex items-center gap-1.5">
                            <span className="text-xs font-bold text-pine-teal truncate">{item.donorId?.name || "Anonymous"}</span>
                            {item.donorId?.points >= 50 && <FaMedal className="text-[9px] text-yellow-500 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-dusty-lavender shrink-0">{dateStr}</span>
                          {isMine && (
                            <button onClick={() => handleDelete(item._id)} className="ml-1 text-dusty-lavender active:text-blazing-flame p-1">
                              <FaTrash className="text-xs" />
                            </button>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-pine-teal leading-snug line-clamp-2 mb-2.5">
                          {item.title}
                        </h3>

                        {/* Patient */}
                        {item.patientDetails?.name && (
                          <div className="mb-2.5 rounded-xl border-l-2 border-blazing-flame bg-blazing-flame/5 px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-widest text-blazing-flame mb-0.5">Patient</p>
                            <p className="text-xs font-bold text-pine-teal">
                              {item.patientDetails.name}
                              {item.patientDetails.age ? `, ${item.patientDetails.age}yrs` : ""}
                            </p>
                          </div>
                        )}

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {item.quantity && (
                            <span className="rounded-lg border border-pine-teal/12 bg-surface-2 px-2 py-1 text-[10px] font-bold text-pine-teal">
                              {item.quantity}
                            </span>
                          )}
                          {item.severityLevel && item.severityLevel !== "Unverified" && (
                            <span className={`rounded-lg border px-2 py-1 text-[10px] font-black ${
                              item.severityLevel === "Code Red"
                                ? "border-blazing-flame/25 bg-blazing-flame/10 text-blazing-flame"
                                : "border-yellow-500/25 bg-yellow-500/10 text-yellow-600"
                            }`}>
                              {item.severityLevel}
                            </span>
                          )}
                          {item.criticalDeadline && (
                            <span className="flex items-center gap-1 rounded-lg border border-dusty-lavender/20 bg-surface-2 px-2 py-1 text-[10px] font-bold text-dusty-lavender">
                              <FaClock className="text-[8px]" />
                              {new Date(item.criticalDeadline) > new Date()
                                ? `${Math.round((new Date(item.criticalDeadline) - Date.now()) / 3600000)}h left`
                                : "Expired"}
                            </span>
                          )}
                        </div>

                        {/* Location */}
                        {(item.addressText || item.location?.addressText) && (
                          <div className="flex items-center gap-1.5 mb-3">
                            <FaMapMarkerAlt className="text-[10px] shrink-0 text-dark-raspberry" />
                            <p className="text-xs text-dusty-lavender truncate">
                              {item.addressText || item.location?.addressText}
                            </p>
                          </div>
                        )}

                        {/* CTAs */}
                        <div className="flex gap-2">
                          {item.status === "fulfilled" ? (
                            <div className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-pine-teal/8 py-2.5 text-[11px] font-black uppercase tracking-widest text-pine-teal border border-pine-teal/15">
                              <FaCheckCircle className="text-xs" /> Fulfilled
                            </div>
                          ) : isMine && localRole === "donor" ? (
                            <motion.button whileTap={{ scale: 0.95 }}
                              onClick={() => setRequestsModal({ isOpen: true, donation: item })}
                              disabled={!item.requestedBy?.length}
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-pine-teal py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-sm disabled:opacity-40">
                              <FaUsers className="text-xs" />
                              {item.requestedBy?.length
                                ? `${item.requestedBy.length} Request${item.requestedBy.length > 1 ? "s" : ""}`
                                : "No Requests"}
                            </motion.button>
                          ) : isApproved ? (
                            <motion.button whileTap={{ scale: 0.95 }}
                              onClick={() => navigate(`/chat/${item._id}`)}
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-dark-raspberry py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-sm">
                              <FaCommentDots className="text-xs" /> Chat Now
                            </motion.button>
                          ) : alreadyReq ? (
                            <div className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-pine-teal/15 py-2.5 text-[11px] font-black uppercase tracking-widest text-pine-teal">
                              <FaCheck className="text-xs" /> Requested
                            </div>
                          ) : (
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleRequest(item._id)}
                              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-sm ${
                                item.isEmergency
                                  ? "bg-blazing-flame shadow-blazing-flame/25"
                                  : isDonor ? "bg-pine-teal shadow-pine-teal/20" : "bg-dark-raspberry shadow-dark-raspberry/20"
                              }`}>
                              <FaHandsHelping className="text-xs" />
                              {item.isEmergency ? "Respond" : isDonor ? "I Can Help" : "Request"}
                            </motion.button>
                          )}

                          <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleShare(item)}
                            className="h-10 w-10 shrink-0 flex items-center justify-center rounded-xl border border-pine-teal/10 bg-surface-2 text-dusty-lavender">
                            <FaShareAlt className="text-xs" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>

              {hasMore && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={loadMore} disabled={loadingMore}
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-pine-teal/12 bg-surface py-4 text-sm font-bold text-pine-teal shadow-sm disabled:opacity-60">
                  {loadingMore ? <FaSpinner className="animate-spin" /> : <>Load More <FaArrowRight className="text-xs" /></>}
                </motion.button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ══ SOS BOTTOM SHEET ══ */}
      <AnimatePresence>
        {showSOS && (
          <motion.div className="fixed inset-0 z-[100] flex flex-col justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSOS(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="relative z-10 bg-[#100d0d] rounded-t-[28px] max-h-[92vh] overflow-y-auto no-scrollbar shadow-2xl">

              <div className="sticky top-0 z-20 bg-[#100d0d] flex flex-col items-center pt-3 pb-3 border-b border-white/8">
                <div className="h-1 w-10 rounded-full bg-white/20 mb-3" />
                <div className="w-full flex items-center justify-between px-5">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <FaHeartbeat className="text-blazing-flame animate-pulse" /> SOS Blood Alert
                    </h2>
                    <p className="text-[10px] text-white/40 mt-0.5">Broadcast to nearby donors instantly</p>
                  </div>
                  <button onClick={() => setShowSOS(false)}
                    className="h-9 w-9 flex items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/60">
                    <FaTimes className="text-sm" />
                  </button>
                </div>
              </div>

              <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-blazing-flame/15 blur-3xl" />

              <form onSubmit={handleSOSSubmit} className="relative px-5 pt-4 pb-10 space-y-3.5">
                <motion.button type="button" whileTap={{ scale: 0.94 }} onClick={startVoiceRecognition}
                  className={`w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-black uppercase tracking-widest transition-all ${
                    isListening
                      ? "bg-blazing-flame/20 border border-blazing-flame text-blazing-flame"
                      : "border border-white/12 bg-white/6 text-white/70"
                  }`}>
                  <FaMicrophone className={isListening ? "animate-pulse" : ""} />
                  {isListening ? "Listening…" : "Speak your emergency"}
                </motion.button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">or type</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Blood Group *</label>
                    <select value={sosData.bloodGroup}
                      onChange={(e) => setSosData((p) => ({ ...p, bloodGroup: e.target.value }))}
                      required className={sosField + " appearance-none"}>
                      <option value="">Select</option>
                      {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Units *</label>
                    <input type="number" min="1" max="20" value={sosData.quantity}
                      onChange={(e) => setSosData((p) => ({ ...p, quantity: e.target.value }))}
                      placeholder="e.g. 2" required className={sosField} />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Hospital *</label>
                  <input type="text" value={sosData.hospital}
                    onChange={(e) => setSosData((p) => ({ ...p, hospital: e.target.value }))}
                    placeholder="Hospital name" required className={sosField} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Patient Name</label>
                    <input type="text" value={sosData.patientName}
                      onChange={(e) => setSosData((p) => ({ ...p, patientName: e.target.value }))}
                      placeholder="Name" className={sosField} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Age</label>
                    <input type="number" value={sosData.patientAge}
                      onChange={(e) => setSosData((p) => ({ ...p, patientAge: e.target.value }))}
                      placeholder="Age" className={sosField} />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Room No.</label>
                  <input type="text" value={sosData.roomNumber}
                    onChange={(e) => setSosData((p) => ({ ...p, roomNumber: e.target.value }))}
                    placeholder="Ward / Room" className={sosField} />
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Location *</label>
                  <div className="flex gap-2">
                    <input type="text" value={sosData.addressText}
                      onChange={(e) => setSosData((p) => ({ ...p, addressText: e.target.value }))}
                      placeholder="City or area" required className={sosField} />
                    <motion.button type="button" whileTap={{ scale: 0.88 }} onClick={handleGetLocation} disabled={isFetchingLoc}
                      className="shrink-0 h-[52px] w-[52px] flex items-center justify-center rounded-xl border border-white/10 bg-white/6 text-white/60 disabled:opacity-50">
                      {isFetchingLoc ? <FaSpinner className="animate-spin text-sm" /> : <FaLocationArrow className="text-sm" />}
                    </motion.button>
                  </div>
                  {suggestions.length > 0 && (
                    <div className="mt-1.5 rounded-xl border border-white/10 bg-[#1a1515] overflow-hidden">
                      {suggestions.map((s) => (
                        <button key={s.id} type="button"
                          onClick={() => { setSosData((p) => ({ ...p, addressText: s.place_name, lat: s.center[1], lng: s.center[0] })); setSuggestions([]); }}
                          className="w-full px-3.5 py-2.5 text-left text-xs text-white/70 hover:bg-white/6 border-b border-white/6 last:border-0">
                          {s.place_name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Description *</label>
                  <textarea rows={3} value={sosData.description}
                    onChange={(e) => setSosData((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the emergency…" required className={sosField + " resize-none"} />
                </div>

                <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-blazing-flame py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-blazing-flame/30 disabled:opacity-60">
                  {isSubmitting ? <FaSpinner className="animate-spin" /> : <><FaHeartbeat className="animate-pulse" /> Broadcast SOS</>}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ REQUESTS BOTTOM SHEET ══ */}
      <AnimatePresence>
        {requestsModal.isOpen && requestsModal.donation && (
          <motion.div className="fixed inset-0 z-[100] flex flex-col justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRequestsModal({ isOpen: false, donation: null })}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="relative z-10 bg-surface rounded-t-[28px] max-h-[70vh] overflow-hidden shadow-2xl">

              <div className="flex flex-col items-center pt-3 border-b border-pine-teal/8">
                <div className="h-1 w-10 rounded-full bg-pine-teal/20 mb-3" />
                <div className="w-full flex items-center justify-between px-5 pb-4">
                  <div>
                    <h3 className="text-base font-black text-pine-teal">Requests</h3>
                    <p className="text-[11px] text-dusty-lavender mt-0.5 line-clamp-1">{requestsModal.donation.title}</p>
                  </div>
                  <button onClick={() => setRequestsModal({ isOpen: false, donation: null })}
                    className="h-8 w-8 flex items-center justify-center rounded-full border border-pine-teal/12 bg-surface-2 text-dusty-lavender">
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto no-scrollbar p-4 pb-8 space-y-2.5">
                {requestsModal.donation.requestedBy.map((req) => (
                  <div key={req._id} className="flex items-center justify-between rounded-2xl border border-pine-teal/10 bg-surface-2 p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 shrink-0 rounded-xl bg-pine-teal/10 border border-pine-teal/15 flex items-center justify-center text-sm font-black text-pine-teal uppercase">
                        {req.name?.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-pine-teal truncate max-w-[140px]">{req.name}</span>
                    </div>
                    <motion.button whileTap={{ scale: 0.94 }}
                      onClick={() => handleApprove(requestsModal.donation._id, req._id)}
                      disabled={approvingId === req._id}
                      className="flex items-center gap-1.5 rounded-xl bg-pine-teal px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-sm disabled:opacity-50">
                      {approvingId === req._id
                        ? <FaSpinner className="animate-spin text-xs" />
                        : <><FaCheck className="text-[10px]" /> Approve</>}
                    </motion.button>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </Layout>
  );
};

export default Dashboard;
