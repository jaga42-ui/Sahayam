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
  FaTrash,
  FaLocationArrow,
  FaCheckCircle,
  FaCheck,
  FaUsers,
  FaRunning,
  FaHandsHelping,
  FaShareAlt,
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
  { label: "All" },
  { label: "Urgent" },
];

const CATEGORY_META = {
  blood:   { label: "Blood",   icon: FaHeartbeat,   soft: "bg-dark-raspberry/8 text-dark-raspberry border-dark-raspberry/20" },
  food:    { label: "Food",    icon: FaUtensils,    soft: "bg-pine-teal/8 text-pine-teal border-pine-teal/20" },
  clothes: { label: "Clothes", icon: FaTshirt,      soft: "bg-dark-raspberry/8 text-dark-raspberry border-dark-raspberry/20" },
  book:    { label: "Book",    icon: FaBook,        soft: "bg-dusty-lavender/10 text-dusty-lavender border-dusty-lavender/25" },
  general: { label: "General", icon: FaHandsHelping, soft: "bg-pine-teal/8 text-pine-teal border-pine-teal/20" },
};

const getCategoryMeta = (c) => CATEGORY_META[c?.toLowerCase()] || CATEGORY_META.general;

// TEMP-PREVIEW
const MOCK_FEED = [
  { _id:"m1", category:"blood", isEmergency:true, severityLevel:"Code Red", bloodGroup:"O-", title:"O- needed urgently for surgery", quantity:"3 Units", addressText:"Fortis Hospital, Whitefield", patientDetails:{name:"Ravi Kumar", age:42}, criticalDeadline:new Date(Date.now()+4*3600000).toISOString(), requestedBy:[{_id:"a",name:"Asha"},{_id:"b",name:"Vikram"}], donorId:{_id:"d1", name:"Priya Nair"}, status:"active", createdAt:new Date().toISOString() },
  { _id:"m2", category:"blood", isEmergency:false, bloodGroup:"B+", title:"B+ donors needed this week", quantity:"2 Units", addressText:"Manipal Hospital, HAL", donorId:{_id:"d2", name:"Karthik Reddy"}, requestedBy:[], status:"active", createdAt:new Date(Date.now()-3600000).toISOString() },
  { _id:"m4", category:"blood", isEmergency:false, bloodGroup:"AB+", title:"AB+ requirement at city hospital", quantity:"2 Units", addressText:"Narayana Health City", donorId:{_id:"x", name:"You"}, requestedBy:[{_id:"r1",name:"Deepa"}], status:"active", createdAt:new Date(Date.now()-86400000).toISOString() },
];

const optimizeImageUrl = (url) => {
  if (!url) return "";
  if (!url.includes("cloudinary.com"))
    return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_600/");
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 5)  return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show:   (i) => ({ opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: Math.min(i * 0.035, 0.18) } }),
  exit:   { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

const SkeletonCard = () => (
  <div className="relative overflow-hidden rounded-2xl border border-pine-teal/8 bg-surface p-4">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent z-10" />
    <div className="flex items-start gap-3">
      <div className="h-14 w-14 shrink-0 rounded-2xl bg-pearl-beige/70" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="h-2.5 w-1/3 rounded-full bg-pearl-beige/60" />
        <div className="h-3.5 w-4/5 rounded-full bg-pearl-beige/70" />
        <div className="h-2.5 w-2/3 rounded-full bg-pearl-beige/50" />
      </div>
    </div>
    <div className="h-10 w-full rounded-xl bg-pearl-beige/50 mt-4" />
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
        if (localStorage.getItem("__mockfeed") === "1") { setFeed(MOCK_FEED); setHasMore(false); setLoading(false); return; } // TEMP-PREVIEW
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
    () => (filterCategory === "Urgent" ? feed.filter((i) => i.isEmergency) : feed),
    [feed, filterCategory],
  );

  const activeCount = useMemo(() => feed.filter((i) => i.status !== "fulfilled").length, [feed]);
  const urgentCount = useMemo(() => feed.filter((i) => i.isEmergency && i.status !== "fulfilled").length, [feed]);

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
  const iconBtn = "h-9 w-9 flex items-center justify-center rounded-full text-dusty-lavender transition-all hover:text-pine-teal hover:bg-pine-teal/8 hover:scale-110 active:scale-95";

  return (
    <Layout>
      <div className="min-h-screen bg-pearl-beige font-sans text-pine-teal">

        {/* Donor-coming toasts */}
        <div className="pointer-events-none fixed top-16 inset-x-0 z-[200] flex flex-col items-center gap-2 px-4">
          <AnimatePresence>
            {responders.map((r, i) => (
              <motion.div key={`${r.blastId}-${i}`}
                initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0, y: -16 }}
                className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-dark-raspberry/20 bg-surface/96 px-4 py-2.5 shadow-lg backdrop-blur-xl">
                <FaRunning className="text-xs text-dark-raspberry shrink-0" />
                <span className="text-xs font-semibold text-pine-teal">{r.donorName} is on their way</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mx-auto w-full max-w-2xl">

          {/* ── HEADER ── */}
          <header className="px-5 pt-8 pb-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-pine-teal/45">{getGreeting()},</p>
                <h1 className="font-display text-[2rem] font-semibold tracking-tight text-pine-teal leading-tight truncate">
                  {user?.name?.split(" ")[0]}
                </h1>
              </div>
              <div className="flex items-center gap-0.5 shrink-0 -mr-1.5">
                <button onClick={enableNotifications} className={iconBtn} aria-label="Notifications">
                  <FaBell className="text-sm" />
                </button>
                <button onClick={toggleDarkMode} className={iconBtn} aria-label="Toggle theme">
                  {isDarkMode ? <FaSun className="text-sm text-amber-500" /> : <FaMoon className="text-sm" />}
                </button>
              </div>
            </div>

            <p className="mt-1 text-[15px] text-pine-teal/55">
              {activeCount === 0
                ? "No active requests nearby right now."
                : <>
                    <span className="font-semibold text-pine-teal">{activeCount}</span> active request{activeCount !== 1 ? "s" : ""} nearby
                    {urgentCount > 0 && <> · <span className="font-semibold text-[#c0392b]">{urgentCount} urgent</span></>}
                  </>}
            </p>

            <div className="mt-5 flex gap-2.5">
              <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02, y: -1 }} onClick={() => setShowSOS(true)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-dark-raspberry py-3.5 text-sm font-semibold text-white shadow-[0_4px_18px_-6px_rgba(107,50,140,0.55)] transition-shadow hover:shadow-[0_6px_28px_-6px_rgba(107,50,140,0.75)]">
                <FaPlus className="text-xs" /> Raise an SOS
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02, y: -1 }}
                onClick={() => {
                  const link = encodeURIComponent(`${window.location.origin}/?ref=${user?.referralCode}`);
                  window.open(`https://wa.me/?text=I%20just%20joined%20Sahayam.%20Come%20join%20me%3A%20${link}`, "_blank");
                }}
                className="flex items-center justify-center gap-2 rounded-xl border border-pine-teal/20 bg-surface px-4 py-3.5 text-sm font-medium text-pine-teal/70 shadow-sm transition-all hover:border-pine-teal/40 hover:text-pine-teal hover:shadow-[0_4px_16px_-6px_rgba(59,107,84,0.3)]">
                <FaShareAlt className="text-xs" /> Invite
              </motion.button>
            </div>
          </header>

          {/* ── FILTER + COUNT ── */}
          <div className="sticky top-0 z-30 bg-pearl-beige/90 backdrop-blur-xl border-b border-pine-teal/8 px-5 py-3 flex items-center justify-between">
            <div className="inline-flex rounded-lg border border-pine-teal/10 bg-surface p-0.5">
              {FILTER_OPTIONS.map(({ label }) => {
                const active = filterCategory === label;
                return (
                  <button key={label} onClick={() => setFilter(label)}
                    className={`relative rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors ${
                      active ? "text-white" : "text-pine-teal/50 hover:text-pine-teal"
                    }`}>
                    {active && (
                      <motion.span layoutId="feedFilter"
                        className="absolute inset-0 rounded-md bg-pine-teal"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                    )}
                    <span className="relative z-10">{label}</span>
                  </button>
                );
              })}
            </div>
            <span className="text-xs font-medium text-pine-teal/40">
              {processedFeed.length} shown
            </span>
          </div>

          {/* ── FEED ── */}
          <div className="px-5 pt-4 pb-32 space-y-3">
            {loading ? (
              [...Array(3)].map((_, n) => <SkeletonCard key={n} />)
            ) : processedFeed.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-4 h-14 w-14 flex items-center justify-center rounded-2xl border border-pine-teal/12 bg-surface">
                  <FaHeartbeat className="text-xl text-dark-raspberry/70" />
                </div>
                <h3 className="font-display text-lg font-semibold text-pine-teal">All quiet nearby</h3>
                <p className="mt-1.5 max-w-xs text-sm text-pine-teal/45 leading-relaxed">
                  When someone nearby needs blood, it appears here. You can raise an SOS anytime.
                </p>
                <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.03, y: -1 }} onClick={() => setShowSOS(true)}
                  className="mt-6 flex items-center gap-2 rounded-xl bg-dark-raspberry px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_18px_-6px_rgba(107,50,140,0.5)] transition-shadow hover:shadow-[0_6px_24px_-6px_rgba(107,50,140,0.7)]">
                  <FaPlus className="text-xs" /> Raise an SOS
                </motion.button>
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
                    const isBlood    = item.category?.toLowerCase() === "blood";
                    const place      = item.addressText || item.location?.addressText;
                    const dateStr    = item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "Recently";
                    const hoursLeft  = item.criticalDeadline
                      ? Math.round((new Date(item.criticalDeadline) - Date.now()) / 3600000)
                      : null;
                    const statItems = [];
                    if (item.patientDetails?.name) statItems.push({ label: "Patient", value: `${item.patientDetails.name}${item.patientDetails.age ? `, ${item.patientDetails.age}` : ""}` });
                    if (item.quantity) statItems.push({ label: "Needs", value: item.quantity });
                    if (hoursLeft !== null) statItems.push({ label: "Deadline", value: hoursLeft > 0 ? `${hoursLeft}h left` : "Overdue", danger: hoursLeft <= 0 });

                    return (
                      <motion.article key={item._id} layout custom={idx}
                        variants={cardVariants} initial="hidden" animate="show" exit="exit"
                        className="group relative overflow-hidden rounded-2xl bg-surface border border-pine-teal/10 shadow-[0_1px_2px_rgba(59,107,84,0.04),0_10px_24px_-14px_rgba(59,107,84,0.18)] hover:-translate-y-0.5 hover:shadow-[0_2px_6px_rgba(59,107,84,0.06),0_18px_40px_-16px_rgba(59,107,84,0.26)] transition-all duration-300">

                        {/* urgency accent stripe */}
                        {item.isEmergency && <span className="absolute left-0 top-0 h-full w-1 bg-[#d6453f]" />}

                        {item.image && (
                          <div className="relative h-40 w-full overflow-hidden border-b border-pine-teal/8">
                            <img src={optimizeImageUrl(item.image)} alt={item.title}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                          </div>
                        )}

                        <div className="p-4 pl-[18px]">
                          <div className="flex items-start gap-3.5">
                            {/* blood-group chip / category icon — solid */}
                            {isBlood ? (
                              <div className={`shrink-0 h-[58px] w-[58px] rounded-2xl flex flex-col items-center justify-center text-white shadow-sm ${
                                item.isEmergency ? "bg-[#d6453f]" : "bg-gradient-to-br from-dark-raspberry to-[#523a7d]"
                              }`}>
                                <span className="text-lg font-bold leading-none">{item.bloodGroup || "—"}</span>
                                <span className="text-[8px] font-bold uppercase tracking-[0.12em] mt-1 text-white/75">blood</span>
                              </div>
                            ) : (
                              <div className={`shrink-0 h-[58px] w-[58px] rounded-2xl border flex items-center justify-center ${meta.soft}`}>
                                <CategoryIcon className="text-xl" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                {item.isEmergency ? (
                                  <span className="inline-flex items-center gap-1.5 rounded-md bg-[#d6453f]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#c0392b]">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span className="absolute inline-flex h-full w-full rounded-full bg-[#d6453f] opacity-60 animate-ping" />
                                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#d6453f]" />
                                    </span>
                                    Urgent
                                  </span>
                                ) : (
                                  <span className="rounded-md bg-pine-teal/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pine-teal/65">{meta.label}</span>
                                )}
                                {item.verifiedByInstitution && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2b7fff]">
                                    <FaShieldAlt className="text-[9px]" /> Verified
                                  </span>
                                )}
                                <span className="ml-auto text-[11px] font-medium text-pine-teal/40 shrink-0">{dateStr}</span>
                              </div>

                              <h3 className="mt-1.5 text-[15.5px] font-bold leading-snug text-pine-teal line-clamp-2">
                                {item.title}
                              </h3>

                              {place && (
                                <p className="mt-1 flex items-center gap-1.5 text-[13px] font-medium text-pine-teal/60 min-w-0">
                                  <FaMapMarkerAlt className="text-[10px] text-dark-raspberry shrink-0" />
                                  <span className="truncate">{place}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* structured stat strip */}
                          {statItems.length > 0 && (
                            <div className="mt-3.5 flex overflow-hidden rounded-xl border border-pine-teal/10 bg-pearl-beige/50 divide-x divide-pine-teal/10">
                              {statItems.map((s, si) => (
                                <div key={si} className="min-w-0 flex-1 px-3 py-2">
                                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-pine-teal/40">{s.label}</p>
                                  <p className={`mt-0.5 truncate text-[12.5px] font-semibold ${s.danger ? "text-[#c0392b]" : "text-pine-teal"}`}>{s.value}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* responders */}
                          {item.isEmergency && item.status !== "fulfilled" && (
                            <p className="mt-3 flex items-center gap-1.5 text-[12px] font-medium text-pine-teal/55">
                              <FaUsers className="text-[10px] text-pine-teal/40" />
                              {item.requestedBy?.length
                                ? <><span className="font-bold text-pine-teal">{item.requestedBy.length}</span> {item.requestedBy.length > 1 ? "donors" : "donor"} responding</>
                                : "No one has responded yet"}
                            </p>
                          )}

                          {/* footer: poster + actions */}
                          <div className="mt-3.5 pt-3.5 border-t border-pine-teal/8 flex items-center gap-2.5">
                            <img
                              src={item.donorId?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.donorId?.name || "S")}&background=3b6b54&color=fff&bold=true&size=64`}
                              alt="" referrerPolicy="no-referrer"
                              className="h-6 w-6 shrink-0 rounded-full object-cover" />
                            <span className="text-[12px] font-medium text-pine-teal/55 truncate min-w-0">{item.donorId?.name || "Anonymous"}</span>

                            <div className="ml-auto flex items-center gap-2 shrink-0">
                                              {item.status === "fulfilled" ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-pine-teal/8 px-3.5 py-2 text-[12px] font-semibold text-pine-teal border border-pine-teal/15">
                                  <FaCheckCircle className="text-xs" /> Fulfilled
                                </span>
                              ) : isMine && localRole === "donor" ? (
                                <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.04, y: -1 }}
                                  onClick={() => setRequestsModal({ isOpen: true, donation: item })}
                                  disabled={!item.requestedBy?.length}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-pine-teal px-3.5 py-2 text-[12px] font-semibold text-white shadow-[0_2px_12px_-4px_rgba(59,107,84,0.55)] transition-shadow hover:shadow-[0_4px_18px_-4px_rgba(59,107,84,0.7)] disabled:opacity-40 disabled:shadow-none">
                                  <FaUsers className="text-[11px]" />
                                  {item.requestedBy?.length ? `${item.requestedBy.length} request${item.requestedBy.length > 1 ? "s" : ""}` : "No requests"}
                                </motion.button>
                              ) : isApproved ? (
                                <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.04, y: -1 }} onClick={() => navigate(`/chat/${item._id}`)}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-dark-raspberry px-3.5 py-2 text-[12px] font-semibold text-white shadow-[0_2px_12px_-4px_rgba(107,50,140,0.5)] transition-shadow hover:shadow-[0_4px_18px_-4px_rgba(107,50,140,0.7)]">
                                  <FaCommentDots className="text-[11px]" /> Chat
                                </motion.button>
                              ) : alreadyReq ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-pine-teal/20 bg-pine-teal/6 px-3.5 py-2 text-[12px] font-semibold text-pine-teal">
                                  <FaCheck className="text-[11px]" /> Requested
                                </span>
                              ) : item.isEmergency ? (
                                <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05, y: -1 }} onClick={() => handleRequest(item._id)}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-[#d6453f] px-3.5 py-2 text-[12px] font-semibold text-white shadow-[0_2px_14px_-4px_rgba(214,69,63,0.6)] transition-shadow hover:shadow-[0_4px_22px_-4px_rgba(214,69,63,0.8)]">
                                  <FaHeartbeat className="text-[11px] animate-pulse" /> Respond
                                </motion.button>
                              ) : (
                                <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.04, y: -1 }} onClick={() => handleRequest(item._id)}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-dark-raspberry px-3.5 py-2 text-[12px] font-semibold text-white shadow-[0_2px_12px_-4px_rgba(107,50,140,0.45)] transition-shadow hover:shadow-[0_4px_18px_-4px_rgba(107,50,140,0.65)]">
                                  <FaHandsHelping className="text-[11px]" /> {isDonor ? "I can help" : "Request"}
                                </motion.button>
                              )}

                              <motion.button whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.08 }} onClick={() => handleShare(item)}
                                className="h-9 w-9 flex items-center justify-center rounded-full border border-pine-teal/12 bg-surface text-dusty-lavender transition-all hover:border-pine-teal/30 hover:bg-pine-teal/6 hover:text-pine-teal hover:shadow-sm" aria-label="Share">
                                <FaShareAlt className="text-[11px]" />
                              </motion.button>

                              {isMine && (
                                <motion.button whileTap={{ scale: 0.92 }} whileHover={{ scale: 1.08 }} onClick={() => handleDelete(item._id)}
                                  className="h-9 w-9 flex items-center justify-center rounded-full border border-pine-teal/12 bg-surface text-dusty-lavender transition-all hover:border-[#d6453f]/30 hover:bg-[#d6453f]/6 hover:text-[#d6453f] hover:shadow-sm" aria-label="Delete">
                                  <FaTrash className="text-[11px]" />
                                </motion.button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>

                {hasMore && (
                  <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01, y: -1 }} onClick={loadMore} disabled={loadingMore}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-pine-teal/15 bg-surface py-3.5 text-sm font-medium text-pine-teal/70 shadow-sm transition-all hover:border-pine-teal/35 hover:text-pine-teal hover:shadow-[0_4px_16px_-6px_rgba(59,107,84,0.25)] disabled:opacity-60">
                    {loadingMore ? <FaSpinner className="animate-spin" /> : <>Load more <FaArrowRight className="text-xs" /></>}
                  </motion.button>
                )}
              </>
            )}
          </div>
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
              className="relative z-10 mx-auto w-full max-w-2xl bg-[#100d0d] rounded-t-[28px] max-h-[92vh] overflow-y-auto no-scrollbar shadow-2xl">

              <div className="sticky top-0 z-20 bg-[#100d0d] flex flex-col items-center pt-3 pb-3 border-b border-white/8">
                <div className="h-1 w-10 rounded-full bg-white/20 mb-3" />
                <div className="w-full flex items-center justify-between px-5">
                  <div>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FaHeartbeat className="text-[#ff6b5e] animate-pulse" /> SOS Blood Alert
                    </h2>
                    <p className="text-[11px] text-white/40 mt-0.5">Broadcast to nearby donors instantly</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.1 }} onClick={() => setShowSOS(false)}
                    className="h-9 w-9 flex items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/60 transition-all hover:border-white/25 hover:bg-white/12 hover:text-white">
                    <FaTimes className="text-sm" />
                  </motion.button>
                </div>
              </div>

              <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-[#d6453f]/20 blur-3xl" />

              <form onSubmit={handleSOSSubmit} className="relative px-5 pt-4 pb-10 space-y-3.5">
                <motion.button type="button" whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} onClick={startVoiceRecognition}
                  className={`w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 text-sm font-semibold transition-all ${
                    isListening
                      ? "bg-blazing-flame/20 border border-blazing-flame text-blazing-flame shadow-[0_0_20px_-4px_rgba(255,107,55,0.4)]"
                      : "border border-white/12 bg-white/6 text-white/70 hover:border-white/25 hover:bg-white/10 hover:text-white"
                  }`}>
                  <FaMicrophone className={isListening ? "animate-pulse" : ""} />
                  {isListening ? "Listening…" : "Speak your emergency"}
                </motion.button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-[11px] font-medium text-white/30">or type</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-white/45">Blood group *</label>
                    <select value={sosData.bloodGroup}
                      onChange={(e) => setSosData((p) => ({ ...p, bloodGroup: e.target.value }))}
                      required className={sosField + " appearance-none"}>
                      <option value="">Select</option>
                      {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((g) => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-white/45">Units *</label>
                    <input type="number" min="1" max="20" value={sosData.quantity}
                      onChange={(e) => setSosData((p) => ({ ...p, quantity: e.target.value }))}
                      placeholder="e.g. 2" required className={sosField} />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-white/45">Hospital *</label>
                  <input type="text" value={sosData.hospital}
                    onChange={(e) => setSosData((p) => ({ ...p, hospital: e.target.value }))}
                    placeholder="Hospital name" required className={sosField} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-white/45">Patient name</label>
                    <input type="text" value={sosData.patientName}
                      onChange={(e) => setSosData((p) => ({ ...p, patientName: e.target.value }))}
                      placeholder="Name" className={sosField} />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium text-white/45">Age</label>
                    <input type="number" value={sosData.patientAge}
                      onChange={(e) => setSosData((p) => ({ ...p, patientAge: e.target.value }))}
                      placeholder="Age" className={sosField} />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-white/45">Room no.</label>
                  <input type="text" value={sosData.roomNumber}
                    onChange={(e) => setSosData((p) => ({ ...p, roomNumber: e.target.value }))}
                    placeholder="Ward / Room" className={sosField} />
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-white/45">Location *</label>
                  <div className="flex gap-2">
                    <input type="text" value={sosData.addressText}
                      onChange={(e) => setSosData((p) => ({ ...p, addressText: e.target.value }))}
                      placeholder="City or area" required className={sosField} />
                    <motion.button type="button" whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.08 }} onClick={handleGetLocation} disabled={isFetchingLoc}
                      className="shrink-0 h-[52px] w-[52px] flex items-center justify-center rounded-xl border border-white/10 bg-white/6 text-white/60 transition-all hover:border-white/25 hover:bg-white/12 hover:text-white disabled:opacity-50">
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
                  <label className="mb-1.5 block text-[11px] font-medium text-white/45">Description *</label>
                  <textarea rows={3} value={sosData.description}
                    onChange={(e) => setSosData((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Describe the emergency…" required className={sosField + " resize-none"} />
                </div>

                <motion.button type="submit" whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02, y: -1 }} disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#d6453f] py-4 text-sm font-semibold text-white shadow-[0_4px_24px_-6px_rgba(214,69,63,0.65)] transition-shadow hover:shadow-[0_8px_32px_-6px_rgba(214,69,63,0.85)] disabled:opacity-60 disabled:shadow-none">
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
              className="relative z-10 mx-auto w-full max-w-2xl bg-surface rounded-t-[28px] max-h-[70vh] overflow-hidden shadow-2xl">

              <div className="flex flex-col items-center pt-3 border-b border-pine-teal/8">
                <div className="h-1 w-10 rounded-full bg-pine-teal/20 mb-3" />
                <div className="w-full flex items-center justify-between px-5 pb-4">
                  <div>
                    <h3 className="text-base font-semibold text-pine-teal">Requests</h3>
                    <p className="text-[12px] text-pine-teal/50 mt-0.5 line-clamp-1">{requestsModal.donation.title}</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.1 }} onClick={() => setRequestsModal({ isOpen: false, donation: null })}
                    className="h-8 w-8 flex items-center justify-center rounded-full border border-pine-teal/12 bg-surface-2 text-dusty-lavender transition-all hover:border-pine-teal/30 hover:bg-pine-teal/8 hover:text-pine-teal">
                    <FaTimes className="text-xs" />
                  </motion.button>
                </div>
              </div>

              <div className="overflow-y-auto no-scrollbar p-4 pb-8 space-y-2.5">
                {requestsModal.donation.requestedBy.map((req) => (
                  <div key={req._id} className="flex items-center justify-between rounded-2xl border border-pine-teal/10 bg-surface-2 p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 shrink-0 rounded-full bg-pine-teal/10 border border-pine-teal/15 flex items-center justify-center text-sm font-bold text-pine-teal uppercase">
                        {req.name?.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-pine-teal truncate max-w-[140px]">{req.name}</span>
                    </div>
                    <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05, y: -1 }}
                      onClick={() => handleApprove(requestsModal.donation._id, req._id)}
                      disabled={approvingId === req._id}
                      className="flex items-center gap-1.5 rounded-full bg-pine-teal px-4 py-2.5 text-[12px] font-semibold text-white shadow-[0_2px_10px_-4px_rgba(59,107,84,0.5)] transition-shadow hover:shadow-[0_4px_16px_-4px_rgba(59,107,84,0.7)] disabled:opacity-50 disabled:shadow-none">
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
