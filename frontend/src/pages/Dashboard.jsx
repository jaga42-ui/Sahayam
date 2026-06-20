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
  FaHeart,
  FaTint,
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

const BLOOD_GROUPS = ["All", "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

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
  const { user, socket, enableNotifications, isDarkMode, toggleDarkMode, thankYouPrompt, setThankYouPrompt } = useContext(AuthContext);
  const navigate = useNavigate();

  const [localRole,      setLocalRole]      = useState(user?.activeRole || "donor");
  const [feed,           setFeed]           = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [responders,     setResponders]     = useState([]);
  const [filterCategory, setFilter]         = useState("All");
  const [bloodGroupFilter, setBloodGroupFilter] = useState(() => localStorage.getItem("sg_bgFilter") || "All");
  const [offlineQueue,   setOfflineQueue]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("sg_offlineQueue") || "[]"); } catch { return []; }
  });
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
  const [thankYouMsg,    setThankYouMsg]    = useState("");
  const [sendingThanks,  setSendingThanks]  = useState(false);
  const [donorRarity,    setDonorRarity]    = useState(null); // { count, bloodGroup }

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
        if (localStorage.getItem("__mockfeed") === "1") { setFeed(MOCK_FEED); setHasMore(false); setLoading(false); return; }
        const [feedRes, rarityRes] = await Promise.all([
          api.get("/donations/feed?page=1&limit=12"),
          api.get("/auth/donor-rarity").catch(() => null),
        ]);
        setFeed(feedRes.data.donations || (Array.isArray(feedRes.data) ? feedRes.data : []));
        setHasMore(feedRes.data.hasMore || false);
        setPage(1);
        if (rarityRes?.data) setDonorRarity(rarityRes.data);
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

  // Process offline request queue when connectivity is restored
  useEffect(() => {
    const processQueue = async () => {
      if (!navigator.onLine || offlineQueue.length === 0) return;
      const queue = [...offlineQueue];
      setOfflineQueue([]);
      localStorage.removeItem("sg_offlineQueue");
      for (const { id } of queue) {
        try {
          await api.post(`/donations/${id}/request`, {});
          toast.success("Queued request submitted!");
        } catch { /* already shown optimistically */ }
      }
    };
    window.addEventListener("online", processQueue);
    return () => window.removeEventListener("online", processQueue);
  }, [offlineQueue]);

  const processedFeed = useMemo(() => {
    let f = filterCategory === "Urgent" ? feed.filter((i) => i.isEmergency) : feed;
    if (bloodGroupFilter !== "All") f = f.filter((i) => i.bloodGroup === bloodGroupFilter);
    return f;
  }, [feed, filterCategory, bloodGroupFilter]);

  const activeCount = useMemo(() => feed.filter((i) => i.status !== "fulfilled").length, [feed]);
  const urgentCount = useMemo(() => feed.filter((i) => i.isEmergency && i.status !== "fulfilled").length, [feed]);

  const pendingDonations = useMemo(() =>
    feed.filter((i) => i.status === "pending" && (
      (i.donorId?._id || i.donorId) === user?._id ||
      (i.receiverId?._id || i.receiverId) === user?._id
    )), [feed, user?._id]);

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
    if (!navigator.onLine) {
      const newQueue = [...offlineQueue, { id }];
      setOfflineQueue(newQueue);
      localStorage.setItem("sg_offlineQueue", JSON.stringify(newQueue));
      setFeed((p) => p.map((i) => i._id === id ? { ...i, requestedBy: [...(i.requestedBy || []), { _id: user._id, name: user.name }] } : i));
      toast("Queued — will send when you reconnect", { icon: "📶" });
      return;
    }
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
          <header className="px-5 pt-6 pb-4">
            {/* Name row */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-pine-teal truncate leading-tight">
                  {user?.name?.split(" ")[0]}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {user?.bloodGroup && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-dark-raspberry/10 border border-dark-raspberry/20 px-2 py-0.5 text-[11px] font-bold text-dark-raspberry">
                      <FaTint className="text-[7px]" /> {user.bloodGroup}
                    </span>
                  )}
                  <span className={`text-[11px] font-semibold ${user?.isAvailable ? "text-pine-teal" : "text-dusty-lavender/55"}`}>
                    {user?.isAvailable ? "● On-duty" : "○ Snoozed"}
                  </span>
                </div>
              </div>
              <button onClick={enableNotifications} className={iconBtn} aria-label="Enable notifications">
                <FaBell className="text-sm" />
              </button>
            </div>

            {/* Live pulse strip */}
            <motion.div
              key={urgentCount}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className={`mt-3.5 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 ${
                urgentCount > 0
                  ? "bg-[#fef3f2] border border-[#d6453f]/20"
                  : "bg-pine-teal/5 border border-pine-teal/12"
              }`}>
              <span className="relative flex h-2 w-2 shrink-0">
                {urgentCount > 0 && <span className="absolute inline-flex h-full w-full rounded-full bg-[#d6453f] opacity-50 animate-ping" />}
                <span className={`relative inline-flex h-2 w-2 rounded-full ${urgentCount > 0 ? "bg-[#d6453f]" : "bg-pine-teal/50"}`} />
              </span>
              <p className="text-[13px] font-medium text-pine-teal/65 leading-none">
                {loading ? "Scanning nearby…" : activeCount === 0
                  ? "All quiet — you're on standby"
                  : urgentCount > 0
                    ? <><span className="font-bold text-[#c0392b]">{urgentCount} urgent</span>{activeCount > urgentCount ? ` · ${activeCount - urgentCount} more nearby` : " nearby"}</>
                    : <><span className="font-bold text-pine-teal">{activeCount}</span> {activeCount === 1 ? "request" : "requests"} nearby</>
                }
              </p>
            </motion.div>

            {/* Raise SOS — primary CTA */}
            <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} onClick={() => setShowSOS(true)}
              className="mt-3 w-full flex items-center justify-center gap-2.5 rounded-xl bg-dark-raspberry py-3.5 text-[13.5px] font-semibold text-white shadow-[0_4px_20px_-6px_rgba(107,50,140,0.5)] transition-shadow hover:shadow-[0_6px_28px_-6px_rgba(107,50,140,0.7)]">
              <FaPlus className="text-[11px]" /> Raise an SOS
            </motion.button>

            {/* Critical infrastructure strip */}
            {donorRarity?.bloodGroup && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-[#6b1a3a]/10 to-transparent border border-dark-raspberry/15 px-3.5 py-2.5">
                <div className="h-7 w-7 shrink-0 rounded-lg bg-dark-raspberry/15 flex items-center justify-center">
                  <FaHeartbeat className="text-[10px] text-dark-raspberry" />
                </div>
                <p className="text-[12px] font-medium text-pine-teal/70 leading-snug">
                  {donorRarity.count === 0
                    ? <><span className="font-bold text-dark-raspberry">You may be the only {donorRarity.bloodGroup} donor</span> currently active nearby</>
                    : <>You're <span className="font-bold text-dark-raspberry">1 of {donorRarity.count + 1} {donorRarity.bloodGroup} donors</span> within 5km</>
                  }
                </p>
              </motion.div>
            )}
          </header>

          {/* ── FILTER + COUNT ── */}
          <div className="sticky top-0 z-30 bg-pearl-beige/90 backdrop-blur-xl border-b border-pine-teal/8 px-5 pt-3 pb-2 space-y-2.5">
            <div className="flex items-center justify-between">
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
            {/* Blood group chips */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              {BLOOD_GROUPS.map((bg) => {
                const active = bloodGroupFilter === bg;
                return (
                  <button key={bg} onClick={() => {
                    setBloodGroupFilter(bg);
                    localStorage.setItem("sg_bgFilter", bg);
                  }}
                    className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold transition-all ${
                      active
                        ? "bg-dark-raspberry text-white shadow-sm"
                        : "bg-surface border border-pine-teal/10 text-pine-teal/55 hover:text-pine-teal hover:border-pine-teal/25"
                    }`}>
                    {bg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── PENDING DONATION BANNER ── */}
          <AnimatePresence>
            {pendingDonations.map((item) => {
              const isDonorSide = (item.donorId?._id || item.donorId) === user?._id;
              return (
                <motion.div key={item._id}
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="mx-5 mt-4 flex items-center gap-3 rounded-2xl border border-dark-raspberry/25 bg-dark-raspberry/8 px-4 py-3.5">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-dark-raspberry opacity-60 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-dark-raspberry" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-dark-raspberry">
                      {isDonorSide ? "Donation Matched" : "Donor Confirmed"}
                    </p>
                    <p className="text-[13px] font-medium text-pine-teal truncate">{item.title}</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(`/chat/${item._id}`)}
                    className="shrink-0 rounded-full bg-dark-raspberry px-3.5 py-1.5 text-[11px] font-bold text-white">
                    {isDonorSide ? "Enter PIN" : "Chat"}
                  </motion.button>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* ── FEED ── */}
          <div className="px-5 pt-4 pb-32 space-y-3">
            {loading ? (
              [...Array(3)].map((_, n) => <SkeletonCard key={n} />)
            ) : processedFeed.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center px-6">
                <div className="mb-5 h-16 w-16 flex items-center justify-center rounded-3xl border border-pine-teal/10 bg-surface shadow-sm">
                  <FaHeartbeat className="text-2xl text-pine-teal/30" />
                </div>
                <h3 className="font-display text-[17px] font-semibold text-pine-teal">You're on standby</h3>
                <p className="mt-2 max-w-[260px] text-[13.5px] text-pine-teal/45 leading-relaxed">
                  {user?.bloodGroup
                    ? `When someone nearby needs ${user.bloodGroup}, you'll be notified first.`
                    : "When someone nearby needs blood, their request appears here."}
                </p>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowSOS(true)}
                  className="mt-5 flex items-center gap-2 rounded-xl border border-dark-raspberry/25 bg-dark-raspberry/8 px-5 py-2.5 text-[13px] font-semibold text-dark-raspberry">
                  <FaPlus className="text-[10px]" /> Post a request
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
                    const ageHours       = Math.round((Date.now() - new Date(item.createdAt)) / 3600000);
                    const expiresInHours = 72 - ageHours;
                    const isExpiringSoon = !item.isEmergency && expiresInHours <= 12 && expiresInHours > 0;
                    const isDonorVerified = item.donorId?.kycStatus?.documentVerified || item.donorId?.isVerified;
                    const statItems = [];
                    if (item.patientDetails?.name) statItems.push({ label: "Patient", value: `${item.patientDetails.name}${item.patientDetails.age ? `, ${item.patientDetails.age}` : ""}` });
                    if (item.quantity) statItems.push({ label: "Needs", value: item.quantity });
                    if (hoursLeft !== null) statItems.push({ label: "Deadline", value: hoursLeft > 0 ? `${hoursLeft}h left` : "Overdue", danger: hoursLeft <= 0 });
                    if (isExpiringSoon) statItems.push({ label: "Expires", value: `${expiresInHours}h`, danger: true });

                    const avatarSrc = item.donorId?.profilePic ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(item.donorId?.name || "S")}&background=3b6b54&color=fff&bold=true&size=64`;

                    /* ── ACTION BUTTON (shared logic, different styles per card type) ── */
                    const actionBtn = item.status === "fulfilled" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-pine-teal/8 px-3 py-1.5 text-[11px] font-semibold text-pine-teal border border-pine-teal/15">
                        <FaCheckCircle className="text-[10px]" /> Done
                      </span>
                    ) : isMine && localRole === "donor" ? (
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={() => setRequestsModal({ isOpen: true, donation: item })}
                        disabled={!item.requestedBy?.length}
                        className="inline-flex items-center gap-1 rounded-full bg-pine-teal px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-40">
                        <FaUsers className="text-[10px]" />
                        {item.requestedBy?.length ? `${item.requestedBy.length}` : "0"}
                      </motion.button>
                    ) : isApproved ? (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate(`/chat/${item._id}`)}
                        className="inline-flex items-center gap-1 rounded-full bg-dark-raspberry px-3 py-1.5 text-[11px] font-semibold text-white">
                        <FaCommentDots className="text-[10px]" /> Chat
                      </motion.button>
                    ) : alreadyReq ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-pine-teal/20 bg-pine-teal/6 px-3 py-1.5 text-[11px] font-semibold text-pine-teal">
                        <FaCheck className="text-[10px]" /> Sent
                      </span>
                    ) : null;

                    if (item.isEmergency) {
                      /* ══════════════════════════════════════
                         EMERGENCY CARD — split layout
                      ══════════════════════════════════════ */
                      return (
                        <motion.article key={item._id} layout custom={idx}
                          variants={cardVariants} initial="hidden" animate="show" exit="exit"
                          className="overflow-hidden rounded-2xl border border-[#d6453f]/25 bg-[#fef6f5] shadow-[0_2px_8px_rgba(214,69,63,0.07),0_14px_36px_-14px_rgba(214,69,63,0.22)]">

                          <div className="flex">
                            {/* Left — blood group column */}
                            <div className="shrink-0 w-[68px] bg-gradient-to-b from-[#d6453f] to-[#b33329] flex flex-col items-center justify-center py-5 gap-1.5">
                              <span className="text-[22px] font-black text-white leading-none tracking-tight">{item.bloodGroup || "—"}</span>
                              <span className="text-[7px] font-black uppercase tracking-widest text-white/55">blood</span>
                              <span className="mt-1.5 relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-50 animate-ping" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                              </span>
                            </div>

                            {/* Right — content */}
                            <div className="flex-1 min-w-0 px-3.5 pt-3 pb-2.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#c0392b]">Urgent</span>
                                {(item.verifiedByInstitution || isDonorVerified) && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#2b7fff]">
                                    <FaShieldAlt className="text-[8px]" /> Verified
                                  </span>
                                )}
                                <span className="ml-auto text-[10px] text-[#d6453f]/40 shrink-0">{dateStr}</span>
                              </div>

                              <h3 className="mt-1 text-[15px] font-bold leading-snug text-[#7a1a16] line-clamp-2">{item.title}</h3>

                              {place && (
                                <p className="mt-1 flex items-center gap-1 text-[12px] font-medium text-[#c0392b]/55 min-w-0">
                                  <FaMapMarkerAlt className="text-[9px] shrink-0" />
                                  <span className="truncate">{place}</span>
                                </p>
                              )}

                              {statItems.length > 0 && (
                                <div className="mt-2 flex gap-3.5 flex-wrap">
                                  {statItems.map((s, si) => (
                                    <div key={si}>
                                      <p className="text-[9px] font-bold uppercase tracking-wide text-[#d6453f]/40">{s.label}</p>
                                      <p className={`text-[12px] font-bold leading-snug ${s.danger ? "text-[#c0392b]" : "text-[#7a1a16]"}`}>{s.value}</p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="mt-2 flex items-center gap-1.5">
                                <img src={avatarSrc} alt="" referrerPolicy="no-referrer" className="h-4 w-4 rounded-full object-cover shrink-0" />
                                <span className="text-[11px] text-[#c0392b]/45 truncate">
                                  {item.donorId?.name || "Anonymous"}
                                  {item.requestedBy?.length > 0 && <> · <span className="font-semibold text-[#c0392b]/60">{item.requestedBy.length} responding</span></>}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Bottom CTA */}
                          <div className="px-3 pb-3 pt-1 flex items-center gap-2">
                            {actionBtn ? (
                              <div className="flex-1">{actionBtn}</div>
                            ) : (
                              <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleRequest(item._id)}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#d6453f] py-3 text-[13px] font-bold text-white shadow-[0_4px_18px_-6px_rgba(214,69,63,0.55)] transition-shadow hover:shadow-[0_6px_24px_-6px_rgba(214,69,63,0.75)]">
                                <FaHeartbeat className="animate-pulse text-[11px]" /> Respond Now
                              </motion.button>
                            )}
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleShare(item)}
                              className="h-10 w-10 flex items-center justify-center rounded-xl border border-[#d6453f]/15 bg-[#fdf0ef] text-[#d6453f]/50 hover:text-[#d6453f] transition-colors shrink-0" aria-label="Share">
                              <FaShareAlt className="text-[11px]" />
                            </motion.button>
                            {isMine && (
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleDelete(item._id)}
                                className="h-10 w-10 flex items-center justify-center rounded-xl border border-[#d6453f]/15 bg-[#fdf0ef] text-[#d6453f]/40 hover:text-[#d6453f] transition-colors shrink-0" aria-label="Delete">
                                <FaTrash className="text-[10px]" />
                              </motion.button>
                            )}
                          </div>
                        </motion.article>
                      );
                    }

                    /* ══════════════════════════════════════
                       NON-EMERGENCY CARD — compact row
                    ══════════════════════════════════════ */
                    return (
                      <motion.article key={item._id} layout custom={idx}
                        variants={cardVariants} initial="hidden" animate="show" exit="exit"
                        className="overflow-hidden rounded-xl bg-surface border border-pine-teal/8 shadow-[0_1px_3px_rgba(59,107,84,0.05),0_6px_18px_-10px_rgba(59,107,84,0.12)]">

                        <div className="flex items-center gap-3 px-4 py-3.5">
                          {/* Blood group pill */}
                          <div className="shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-dark-raspberry to-[#523a7d] flex flex-col items-center justify-center shadow-sm">
                            <span className="text-[11px] font-black text-white leading-none">{item.bloodGroup || <CategoryIcon className="text-sm" />}</span>
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-semibold text-pine-teal line-clamp-1 leading-snug">{item.title}</p>
                            <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-pine-teal/40">
                              {place && <><FaMapMarkerAlt className="text-[9px] shrink-0 text-dark-raspberry/50" /><span className="truncate max-w-[120px]">{place}</span><span className="shrink-0 mx-1">·</span></>}
                              <span className="shrink-0">{dateStr}</span>
                              {(item.verifiedByInstitution || isDonorVerified) && <><span className="mx-1">·</span><span className="text-[#2b7fff] font-semibold flex items-center gap-0.5"><FaShieldAlt className="text-[8px]" />Verified</span></>}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="shrink-0 flex items-center gap-1.5">
                            {actionBtn || (
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleRequest(item._id)}
                                className="inline-flex items-center gap-1 rounded-full border border-dark-raspberry/25 bg-dark-raspberry/8 px-3 py-1.5 text-[11px] font-semibold text-dark-raspberry transition-colors hover:bg-dark-raspberry hover:text-white">
                                <FaHandsHelping className="text-[10px]" /> {isDonor ? "Help" : "Request"}
                              </motion.button>
                            )}
                            <motion.button whileTap={{ scale: 0.88 }} onClick={() => handleShare(item)}
                              className="h-8 w-8 flex items-center justify-center rounded-full text-dusty-lavender/50 hover:text-pine-teal hover:bg-pine-teal/6 transition-all" aria-label="Share">
                              <FaShareAlt className="text-[10px]" />
                            </motion.button>
                            {isMine && (
                              <motion.button whileTap={{ scale: 0.88 }} onClick={() => handleDelete(item._id)}
                                className="h-8 w-8 flex items-center justify-center rounded-full text-dusty-lavender/40 hover:text-[#d6453f] hover:bg-[#d6453f]/6 transition-all" aria-label="Delete">
                                <FaTrash className="text-[10px]" />
                              </motion.button>
                            )}
                          </div>
                        </div>

                        {/* Expiry warning strip */}
                        {isExpiringSoon && (
                          <div className="px-4 py-1.5 border-t border-pine-teal/6 bg-amber-50/60 flex items-center gap-1.5">
                            <FaClock className="text-[9px] text-amber-500/70 shrink-0" />
                            <span className="text-[10px] font-semibold text-amber-600/70">Expires in {expiresInHours}h</span>
                          </div>
                        )}
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

      {/* ══ THANK YOU MODAL ══ */}
      <AnimatePresence>
        {thankYouPrompt && (
          <motion.div className="fixed inset-0 z-[110] flex flex-col justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setThankYouPrompt(null); setThankYouMsg(""); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="relative z-10 mx-auto w-full max-w-2xl bg-surface rounded-t-[28px] overflow-hidden shadow-2xl">

              <div className="flex flex-col items-center pt-3 pb-0 border-b border-pine-teal/8">
                <div className="h-1 w-10 rounded-full bg-pine-teal/20 mb-3" />
                <div className="w-full px-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 shrink-0 rounded-2xl bg-dark-raspberry/10 flex items-center justify-center">
                      <FaHeart className="text-dark-raspberry" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-pine-teal">Mission Complete!</h2>
                      <p className="text-[12px] text-pine-teal/45 mt-0.5">
                        {thankYouPrompt.donorName} helped you. Send them a thank you?
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3">
                <textarea
                  rows={3}
                  placeholder={`Tell ${thankYouPrompt.donorName} what their help meant to you…`}
                  value={thankYouMsg}
                  onChange={(e) => setThankYouMsg(e.target.value)}
                  className="w-full rounded-xl border border-pine-teal/15 bg-surface-2 px-4 py-3.5 text-sm text-pine-teal placeholder-pine-teal/30 outline-none focus:border-dark-raspberry/40 resize-none transition-all"
                />
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => { setThankYouPrompt(null); setThankYouMsg(""); }}
                    className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl border border-pine-teal/12 bg-surface-2 text-pine-teal/40">
                    <FaTimes />
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} disabled={sendingThanks || !thankYouMsg.trim()}
                    onClick={async () => {
                      if (!thankYouMsg.trim()) return;
                      setSendingThanks(true);
                      try {
                        await api.post(`/donations/${thankYouPrompt.donationId}/thank`, { message: thankYouMsg });
                        toast.success("Thank you sent!");
                        setThankYouPrompt(null);
                        setThankYouMsg("");
                      } catch { toast.error("Could not send thank you."); }
                      finally { setSendingThanks(false); }
                    }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-dark-raspberry py-3.5 text-[12px] font-black uppercase tracking-widest text-white shadow-md disabled:opacity-50">
                    {sendingThanks ? <FaSpinner className="animate-spin" /> : <><FaHeart className="text-xs" /> Send Thanks</>}
                  </motion.button>
                </div>
                <button onClick={() => { setThankYouPrompt(null); setThankYouMsg(""); }}
                  className="w-full text-center text-[12px] text-pine-teal/35 hover:text-pine-teal/60 transition-colors py-1">
                  Skip
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </Layout>
  );
};

export default Dashboard;
