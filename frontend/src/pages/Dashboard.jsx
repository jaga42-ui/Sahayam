// Developed by guruprasad and team
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
  FaLock,
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
  blood: {
    label: "Blood",
    icon: FaHeartbeat,
    panel:
      "bg-blazing-flame/10 text-blazing-flame border-blazing-flame/20",
  },
  food: {
    label: "Food",
    icon: FaUtensils,
    panel: "bg-pine-teal/10 text-pine-teal border-pine-teal/20",
  },
  clothes: {
    label: "Clothes",
    icon: FaTshirt,
    panel:
      "bg-dark-raspberry/10 text-dark-raspberry border-dark-raspberry/20",
  },
  book: {
    label: "Book",
    icon: FaBook,
    panel:
      "bg-dusty-lavender/10 text-dusty-lavender border-dusty-lavender/20",
  },
  general: {
    label: "General",
    icon: FaHandsHelping,
    panel: "bg-pearl-beige/60 text-pine-teal border-dusty-lavender/20",
  },
};

const MotionDiv = motion.div;
const MotionSection = motion.section;
const MotionArticle = motion.article;
const MotionButton = motion.button;
const MotionH1 = motion.h1;
const MotionP = motion.p;

const cardVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.98 },
  show: (index) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 24,
      delay: Math.min(index * 0.035, 0.22),
    },
  }),
  exit: { opacity: 0, y: -16, scale: 0.97, transition: { duration: 0.18 } },
};

const optimizeImageUrl = (url) => {
  if (!url) return "";
  if (!url.includes("cloudinary.com")) {
    return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  }
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_800/");
};

const getCategoryMeta = (category) =>
  CATEGORY_META[category?.toLowerCase()] || CATEGORY_META.general;

const SkeletonCard = () => (
  <div className="relative h-[430px] overflow-hidden rounded-[2rem] border border-dusty-lavender/20 bg-surface/40 p-5 shadow-[0_18px_50px_rgba(41,82,74,0.08)] backdrop-blur-2xl">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" />
    <div className="flex flex-col gap-4 opacity-70">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-dusty-lavender/30" />
        <div className="flex-1">
          <div className="mb-2 h-3 w-1/2 rounded-full bg-dusty-lavender/30" />
          <div className="h-2 w-1/3 rounded-full bg-dusty-lavender/20" />
        </div>
      </div>
      <div className="h-44 w-full rounded-[1.5rem] bg-dusty-lavender/20" />
      <div className="space-y-3 mt-2">
        <div className="h-4 w-4/5 rounded-full bg-dusty-lavender/30" />
        <div className="h-3 w-full rounded-full bg-dusty-lavender/20" />
        <div className="h-3 w-2/3 rounded-full bg-dusty-lavender/20" />
      </div>
      <div className="mt-auto h-12 w-full rounded-2xl bg-dusty-lavender/20" />
    </div>
  </div>
);

const Dashboard = () => {
  const { user, switchRole, socket, enableNotifications, isDarkMode, toggleDarkMode } =
    useContext(AuthContext);
  const navigate = useNavigate();

  const [localRole, setLocalRole] = useState(user?.activeRole || "donor");
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [responders, setResponders] = useState([]);
  const [filterCategory, setFilterCategory] = useState("All");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [showSOS, setShowSOS] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvingId, setApprovingId] = useState(null);

  const isDonor = localRole === "donor";


  const [sosData, setSosData] = useState({
    bloodGroup: "",
    quantity: "",
    hospital: "",
    roomNumber: "",
    patientName: "",
    patientAge: "",
    addressText: "",
    description: "",
    lat: null,
    lng: null,
  });

  const [isListening, setIsListening] = useState(false);

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice SOS is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      toast.loading("Listening... Speak your emergency clearly.", { id: "voiceSOS" });
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      toast.success("Voice processed! Review auto-filled data.", { id: "voiceSOS" });
      
      let newSosData = { ...sosData, description: transcript };
      const lowerText = transcript.toLowerCase();
      
      const bloodTypes = ["a+", "a-", "b+", "b-", "ab+", "ab-", "o+", "o-"];
      for (const bg of bloodTypes) {
        if (lowerText.includes(bg) || lowerText.includes(bg.replace("+", " positive").replace("-", " negative"))) {
          newSosData.bloodGroup = bg.toUpperCase();
          break;
        }
      }
      
      const unitMatch = lowerText.match(/(\d+)\s*units?/);
      if (unitMatch) newSosData.quantity = unitMatch[1];

      setSosData(newSosData);
    };

    recognition.onerror = (event) => {
      toast.error(`Voice recognition failed: ${event.error}`, { id: "voiceSOS" });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const [requestsModal, setRequestsModal] = useState({
    isOpen: false,
    donation: null,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  useEffect(() => {
    if (user?.activeRole) setLocalRole(user.activeRole);
  }, [user?.activeRole]);

  useEffect(() => {
    if (!user?.token) return;

    const fetchDashboardData = async () => {
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

    fetchDashboardData();
  }, [user]);

  useEffect(() => {
    if (!user || !socket) return;

    const handleDonorComing = (data) => {
      setResponders((prev) => [...prev, data]);
      toast.success(`${data.donorName} is en route to help!`);
      setTimeout(
        () =>
          setResponders((prev) =>
            prev.filter((responder) => responder.blastId !== data.blastId),
          ),
        10000,
      );
    };

    const handleNewListing = (newDonation) =>
      setFeed((prev) => [newDonation, ...prev]);
    const handleListingUpdated = (updatedItem) =>
      setFeed((prev) =>
        prev.map((item) => (item._id === updatedItem._id ? updatedItem : item)),
      );
    const handleListingDeleted = (deletedId) =>
      setFeed((prev) => prev.filter((item) => item._id !== deletedId));

    socket.on("donor_coming", handleDonorComing);
    socket.on("new_listing", handleNewListing);
    socket.on("listing_updated", handleListingUpdated);
    socket.on("listing_deleted", handleListingDeleted);

    return () => {
      socket.off("donor_coming", handleDonorComing);
      socket.off("new_listing", handleNewListing);
      socket.off("listing_updated", handleListingUpdated);
      socket.off("listing_deleted", handleListingDeleted);
    };
  }, [user, socket]);

  useEffect(() => {
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [typingTimeout]);

  const processedFeed = useMemo(
    () =>
      feed.filter(
        (item) =>
          filterCategory === "All" ||
          item.category?.toLowerCase() === filterCategory.toLowerCase(),
      ),
    [feed, filterCategory],
  );

  const dashboardStats = useMemo(() => {
    const emergencyCount = feed.filter((item) => item.isEmergency).length;
    const responderCount = feed.reduce(
      (total, item) => total + (item.requestedBy?.length || 0),
      0,
    );
    const fulfilledCount = feed.filter(
      (item) => item.status === "fulfilled",
    ).length;

    return [
      {
        label: filterCategory === "All" ? "Active Signals" : "Showing",
        value: processedFeed.length,
        icon: FaBoxOpen,
        tone: "text-pine-teal",
        bg: "bg-pine-teal/10",
        border: "border-pine-teal/15",
      },
      {
        label: "SOS Alerts",
        value: emergencyCount,
        icon: FaExclamationTriangle,
        tone: "text-blazing-flame",
        bg: "bg-blazing-flame/10",
        border: "border-blazing-flame/20",
      },
      {
        label: "Responders",
        value: responderCount,
        icon: FaUsers,
        tone: "text-dark-raspberry",
        bg: "bg-dark-raspberry/10",
        border: "border-dark-raspberry/20",
      },
      {
        label: "Completed",
        value: fulfilledCount,
        icon: FaCheckCircle,
        tone: "text-dusty-lavender",
        bg: "bg-dusty-lavender/10",
        border: "border-dusty-lavender/20",
      },
    ];
  }, [feed, filterCategory, processedFeed.length]);

  const loadMoreListings = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const { data } = await api.get(
        `/donations/feed?page=${nextPage}&limit=12`,
      );
      setFeed((prev) => [...prev, ...(data.donations || [])]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch {
      toast.error("Failed to fetch more listings.");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      return toast.error("Geolocation is not supported.");
    }

    setIsFetchingLocation(true);
    const toastId = toast.loading("Locating...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
          if (!apiKey) throw new Error("Mapbox Token Missing");

          const { data } = await axios.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${apiKey}`,
          );

          if (data?.features?.length > 0) {
            const cityFeature = data.features.find(f => f.id.startsWith("place.") || f.id.startsWith("locality.") || f.id.startsWith("neighborhood."));
            const cityString = cityFeature ? cityFeature.text : data.features[0].text;
            setSosData((prev) => ({
              ...prev,
              addressText: cityString,
              lat: latitude,
              lng: longitude,
            }));
            setSuggestions([]);
            toast.success(`Location set: ${cityString}`, { id: toastId });
          }
        } catch {
          toast.error("Could not resolve address.", { id: toastId });
        } finally {
          setIsFetchingLocation(false);
        }
      },
      () => {
        setIsFetchingLocation(false);
        toast.error("Failed to acquire location.", { id: toastId });
      },
      { enableHighAccuracy: true },
    );
  };

  const handleLocationType = (e) => {
    const val = e.target.value;
    setSosData((prev) => ({ ...prev, addressText: val, lat: null, lng: null }));

    if (typingTimeout) clearTimeout(typingTimeout);

    if (val.length > 2) {
      const timeoutId = setTimeout(async () => {
        try {
          const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
          if (!apiKey) return;

          const { data } = await axios.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${apiKey}&autocomplete=true&limit=5&country=in`,
          );

          if (data?.features) {
            setSuggestions(
              data.features.map((feature) => ({
                display_name: feature.place_name,
                lat: feature.center[1],
                lon: feature.center[0],
              })),
            );
          }
        } catch {
          console.error("Autocomplete failed");
        }
      }, 600);

      setTypingTimeout(timeoutId);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (suggestion) => {
    const locationLabel =
      suggestion.display_name?.split(",").slice(0, 2).join(",") ||
      suggestion.display_name;

    setSosData((prev) => ({
      ...prev,
      addressText: locationLabel,
      lat: suggestion.lat,
      lng: suggestion.lon,
    }));
    setSuggestions([]);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  };

  const handleSOSSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const toastId = toast.loading("Analyzing emergency request...");
      
      // Simulate AI Triage Delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const textAnalysis = (sosData.description + " " + sosData.title).toLowerCase();
      let severityLevel = "Code Yellow";
      if (textAnalysis.includes("critical") || textAnalysis.includes("urgent") || textAnalysis.includes("accident") || textAnalysis.includes("dying") || textAnalysis.includes("icu")) {
        severityLevel = "Code Red";
      }

      toast.success(`Analysis complete. Classified as ${severityLevel}. Sending...`, { id: toastId });

      const formData = new FormData();
      formData.append("listingType", "request");
      formData.append("category", "blood");
      formData.append("isEmergency", "true");
      formData.append("severityLevel", severityLevel);
      formData.append("bloodGroup", sosData.bloodGroup);
      formData.append("quantity", `${sosData.quantity} Units`);
      formData.append("title", `URGENT: ${sosData.bloodGroup} Needed!`);
      formData.append("description", sosData.description);
      formData.append(
        "addressText",
        `${sosData.hospital}, ${sosData.addressText}`,
      );
      if (sosData.roomNumber) formData.append("hospitalRoomNumber", sosData.roomNumber);
      
      const patientDetails = {
        name: sosData.patientName,
        age: sosData.patientAge ? parseInt(sosData.patientAge) : undefined,
      };
      formData.append("patientDetails", JSON.stringify(patientDetails));

      // Calculate a 4-hour critical deadline for Code Red, 12-hour for Code Yellow
      const deadlineHours = severityLevel === "Code Red" ? 4 : 12;
      const criticalDeadline = new Date(Date.now() + deadlineHours * 60 * 60 * 1000).toISOString();
      formData.append("criticalDeadline", criticalDeadline);

      if (sosData.lat) formData.append("lat", sosData.lat);
      if (sosData.lng) formData.append("lng", sosData.lng);

      const { data } = await api.post("/donations", formData);
      setFeed((prev) => [data, ...prev]);
      setShowSOS(false);
      setSosData({
        bloodGroup: "",
        quantity: "",
        hospital: "",
        roomNumber: "",
        patientName: "",
        patientAge: "",
        addressText: "",
        description: "",
        lat: null,
        lng: null,
      });
      toast.success("Emergency request sent!");
    } catch {
      toast.error("Failed to broadcast SOS");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm("Delete this post?")) return;

    try {
      await api.delete(`/donations/${id}`);
      setFeed((prev) => prev.filter((item) => item._id !== id));
      toast.success("Deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const handleRequestItem = async (donationId) => {
    try {
      await api.post(`/donations/${donationId}/request`, {});
      setFeed((prev) =>
        prev.map((item) =>
          item._id === donationId
            ? {
                ...item,
                requestedBy: [
                  ...(item.requestedBy || []),
                  { _id: user._id, name: user.name },
                ],
              }
            : item,
        ),
      );
      toast.success("Response sent!");
    } catch {
      toast.error("Failed to send request.");
    }
  };

  const handleApproveRequest = async (donationId, receiverId) => {
    setApprovingId(receiverId);

    try {
      await api.patch(`/donations/${donationId}/approve`, { receiverId });
      setRequestsModal({ isOpen: false, donation: null });
      setFeed((prev) =>
        prev.map((item) =>
          item._id === donationId
            ? { ...item, status: "pending", receiverId }
            : item,
        ),
      );
      toast.success("Approved!");
    } catch {
      toast.error("Approval failed");
    } finally {
      setApprovingId(null);
    }
  };

  const handleShare = async (item) => {
    const shareText = item.isEmergency
      ? `URGENT: ${item.bloodGroup} blood needed at ${item.addressText?.split(",")[0] || "nearby"}. Can you help?`
      : `Sahayam: ${item.title} available near ${item.addressText?.split(",")[0] || "you"}.`;
    const shareData = {
      title: item.title,
      text: shareText,
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        console.log("Share cancelled");
      }
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(`${shareData.text} -> ${shareData.url}`)}`,
      );
    }
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="dashboard-shell relative min-h-screen overflow-hidden bg-pearl-beige font-sans text-pine-teal">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="dashboard-grid absolute inset-0 opacity-30 md:opacity-60" />
          <div className="dashboard-sheen absolute -top-24 left-[-25%] hidden h-80 w-[150%] opacity-60 md:block" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-32 md:pb-24">
          <div className="pointer-events-none fixed left-1/2 top-20 z-[100] flex -translate-x-1/2 flex-col gap-2">
            <AnimatePresence>
              {responders.map((res, index) => (
                <MotionDiv
                  key={`${res.blastId}-${index}`}
                  initial={{ y: -20, opacity: 0, scale: 0.96 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.96 }}
                  className="pointer-events-auto flex items-center gap-3 rounded-full border border-blazing-flame/30 bg-surface/90 px-5 py-3 text-pine-teal shadow-2xl backdrop-blur-xl"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blazing-flame/10">
                    <FaRunning className="text-blazing-flame" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">
                    {res.donorName} is coming!
                  </span>
                </MotionDiv>
              ))}
            </AnimatePresence>
          </div>

          <header className="border-b border-dusty-lavender/30 pb-4 pt-5 md:pb-7 md:pt-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <MotionDiv
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-3 hidden items-center gap-2 rounded-full border border-pine-teal/15 bg-surface/60 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-pine-teal shadow-sm backdrop-blur-xl sm:inline-flex"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blazing-flame opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blazing-flame"></span>
                  </span>
                  Sahayam Community : Active
                </MotionDiv>
                <MotionH1
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 }}
                  className="text-3xl font-black leading-tight tracking-tight text-pine-teal sm:text-5xl md:text-6xl"
                >
                  <span className="block text-dusty-lavender text-[10px] sm:text-xs uppercase tracking-[0.3em] mb-1">
                    Dashboard
                  </span>
                  {user?.name?.split(" ")[0] || "User"}
                </MotionH1>
                <MotionP
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-3 hidden max-w-2xl text-sm font-bold leading-relaxed text-pine-teal/70 sm:block md:text-base border-l-2 border-blazing-flame/50 pl-3"
                >
                  {isDonor
                    ? "Welcome to Sahayam. Monitor requests below or offer help to your local community."
                    : "Welcome to Sahayam. Create a request below to get help from your local community."}
                </MotionP>
              </div>

              <MotionDiv
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.12, type: "spring", stiffness: 220 }}
                className="grid w-full grid-cols-2 gap-2 rounded-2xl border border-dusty-lavender/30 bg-surface/50 p-1.5 shadow-sm backdrop-blur-xl sm:flex sm:w-auto sm:rounded-[1.5rem] sm:border-surface/70 sm:bg-surface/65 sm:p-2 sm:shadow-[0_18px_45px_rgba(41,82,74,0.1)]"
              >
                <MotionButton
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate("/donations")}
                  className={`flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-md transition-all sm:min-h-12 sm:rounded-2xl sm:py-3 sm:shadow-lg md:px-5 ${
                    isDonor
                      ? "bg-pine-teal shadow-pine-teal/25"
                      : "bg-dark-raspberry shadow-dark-raspberry/25"
                  }`}
                >
                  <FaBoxOpen className="text-sm" />
                  {isDonor ? "Post" : "Request"}
                </MotionButton>

                {!user?.isAdmin && (
                  <MotionButton
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={switchRole}
                    className="hidden min-h-12 items-center justify-center gap-2 rounded-2xl border border-dusty-lavender/20 bg-surface px-4 py-3 text-[10px] font-black uppercase tracking-widest text-pine-teal shadow-sm transition-all hover:border-pine-teal/30 sm:flex md:px-5"
                  >
                    <FaUsers className="text-sm text-dark-raspberry" />
                    {isDonor ? "Receiver" : "Donor"}
                  </MotionButton>
                )}

                <MotionButton
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={enableNotifications}
                  className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-dusty-lavender/20 bg-surface px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-pine-teal shadow-sm transition-all hover:border-blazing-flame/30 sm:min-h-12 sm:rounded-2xl sm:py-3 sm:flex md:px-5"
                >
                  <FaBell className="text-sm text-blazing-flame" />
                  Alerts
                </MotionButton>

                <MotionButton
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={toggleDarkMode}
                  className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-dusty-lavender/20 bg-surface px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-pine-teal shadow-sm transition-all hover:border-dusty-lavender/40 sm:min-h-12 sm:rounded-2xl sm:py-3 sm:flex md:px-5"
                >
                  {isDarkMode ? <FaSun className="text-sm text-[#ffd700]" /> : <FaMoon className="text-sm text-dusty-lavender" />}
                  {isDarkMode ? 'Light' : 'Dark'}
                </MotionButton>

                <MotionButton
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowSOS(true)}
                  className="flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blazing-flame px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white shadow-md shadow-blazing-flame/20 transition-all sm:min-h-12 sm:rounded-2xl sm:py-3 sm:shadow-lg sm:shadow-blazing-flame/25 md:px-5"
                >
                  <FaHeartbeat className="text-sm animate-pulse" />
                  SOS
                </MotionButton>
              </MotionDiv>
            </div>
          </header>

          <MotionSection
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.06 } },
            }}
            className="hidden grid-cols-2 gap-3 py-6 sm:grid lg:grid-cols-4"
          >
            {dashboardStats.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <MotionDiv
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: { opacity: 1, y: 0 },
                  }}
                  className={`group relative overflow-hidden rounded-[1.5rem] border ${stat.border} bg-surface/65 p-4 shadow-[0_14px_35px_rgba(41,82,74,0.07)] backdrop-blur-xl hover:scale-105 hover:shadow-[0_20px_40px_rgba(41,82,74,0.12)] transition-all duration-300 cursor-default`}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-80" />
                  <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 group-hover:scale-150 transition-all duration-500">
                    <StatIcon className="text-[100px]" />
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-dusty-lavender">
                        {stat.label}
                      </p>
                      <p className="mt-2 truncate text-2xl font-black tracking-tight text-pine-teal">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${stat.border} ${stat.bg}`}
                    >
                      <StatIcon className={`text-lg ${stat.tone}`} />
                    </div>
                  </div>
                </MotionDiv>
              );
            })}
          </MotionSection>

          <MotionDiv 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-pine-teal to-[#1a3630] border border-pine-teal/40 p-6 md:p-8 shadow-[0_20px_50px_rgba(41,82,74,0.3)] group cursor-pointer"
            onClick={() => {
              const url = `https://wa.me/?text=I%20just%20joined%20Sahayam%2C%20a%20community%20support%20network.%20Join%20me%20here%3A%20https%3A%2F%2Fsahayam.vercel.app%2F%3Fref%3D${user?._id}`;
              window.open(url, '_blank');
            }}
          >
            {/* Background Glows */}
            <div className="absolute top-[-50%] right-[-10%] w-[80%] h-[200%] bg-dark-raspberry/10 blur-[80px] rounded-full group-hover:bg-dark-raspberry/20 transition-all duration-700 pointer-events-none" />
            <div className="absolute bottom-[-50%] left-[-10%] w-[50%] h-[200%] bg-pearl-beige/10 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-black text-pearl-beige tracking-tight leading-tight mb-2">
                  Grow our community.
                </h3>
                <p className="text-dusty-lavender text-xs md:text-sm font-bold tracking-wider max-w-lg mx-auto md:mx-0">
                  Sahayam is built by people who care. Invite your neighbors and friends to join our support network.
                </p>
              </div>
              
              <div className="shrink-0 w-full md:w-auto flex flex-col gap-3">
                <button className="w-full md:w-auto bg-dark-raspberry text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-[0_15px_30px_rgba(159,17,100,0.3)] hover:bg-[#850e53] hover:scale-105 transition-all flex items-center justify-center gap-3">
                  <FaShareAlt className="text-lg" /> Share Invite
                </button>
              </div>
            </div>
          </MotionDiv>

          <div className="sticky top-0 z-30 -mx-4 mb-5 border-y border-dusty-lavender/30 bg-pearl-beige/95 px-4 py-2.5 backdrop-blur-xl sm:mb-6 md:static md:mx-0 md:rounded-[1.5rem] md:border md:bg-surface/50">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {FILTER_OPTIONS.map((option) => {
                const FilterIcon = option.icon;
                const isActive = filterCategory === option.label;

                return (
                  <MotionButton
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    key={option.label}
                    onClick={() => setFilterCategory(option.label)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-[9px] font-black uppercase tracking-widest transition-all sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-2.5 sm:text-[10px] ${
                      isActive
                        ? "border-pine-teal bg-pine-teal text-white shadow-lg shadow-pine-teal/20"
                        : "border-dusty-lavender/20 bg-surface/50 text-dusty-lavender shadow-sm hover:border-pine-teal/20 hover:text-pine-teal sm:border-surface/70 sm:bg-surface/65"
                    }`}
                  >
                    <FilterIcon className="text-xs sm:text-sm" />
                    {option.label}
                  </MotionButton>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((number) => (
                <SkeletonCard key={number} />
              ))}
            </div>
          ) : processedFeed.length === 0 ? (
            <MotionDiv
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] border border-dashed border-pine-teal/20 bg-surface/55 px-6 py-20 text-center shadow-[0_18px_45px_rgba(41,82,74,0.08)] backdrop-blur-xl"
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl border border-pine-teal/10 bg-pine-teal/10 text-pine-teal">
                <FaBoxOpen className="text-3xl" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-widest text-pine-teal">
                No active signals
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-relaxed text-pine-teal/60">
                Try another category or create a fresh community listing.
              </p>
              <button
                onClick={() => navigate("/donations")}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-pine-teal px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-pine-teal/25 transition-all active:scale-95"
              >
                <FaBoxOpen />
                New Listing
              </button>
            </MotionDiv>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {processedFeed.map((item, index) => {
                  const donorId = item.donorId?._id || item.donorId;
                  const receiverId = item.receiverId?._id || item.receiverId;
                  const isMine = donorId === user._id;
                  const alreadyReq = item.requestedBy?.some(
                    (requester) => (requester._id || requester) === user._id,
                  );
                  const isApprovedReceiver =
                    item.status === "pending" && receiverId === user._id;
                  const meta = getCategoryMeta(item.category);
                  const CategoryIcon = meta.icon;
                  const avatarName = encodeURIComponent(
                    item.donorId?.name || "Sahayam User",
                  );
                  const createdAt = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString()
                    : "Recently";

                  return (
                    <MotionArticle
                      layout
                      custom={index}
                      variants={cardVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      whileHover={{ y: -6 }}
                      key={item._id}
                      className={`group relative flex min-h-[430px] flex-col overflow-hidden rounded-[2rem] border bg-surface/70 p-4 shadow-[0_18px_45px_rgba(41,82,74,0.08)] backdrop-blur-2xl transition-shadow duration-300 hover:shadow-[0_24px_60px_rgba(41,82,74,0.16)] ${
                        item.isEmergency
                          ? "border-blazing-flame/40"
                          : "border-surface/70"
                      }`}
                    >
                      <div className="dashboard-card-sheen absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                      <div
                        className={`absolute inset-x-0 top-0 h-1 ${
                          item.isEmergency
                            ? "bg-blazing-flame"
                            : "bg-gradient-to-r from-pine-teal via-dusty-lavender to-dark-raspberry"
                        }`}
                      />

                      <div className="relative z-10 mb-4 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={
                              item.donorId?.profilePic ||
                              `https://ui-avatars.com/api/?name=${avatarName}&background=e8dab2&color=29524a`
                            }
                            alt="User"
                            className="h-11 w-11 shrink-0 rounded-2xl border border-surface/70 object-cover shadow-sm"
                          />
                          <div className="min-w-0">
                            <p className="flex items-center gap-1 truncate text-sm font-black tracking-tight text-pine-teal">
                              <span className="truncate">
                                {item.donorId?.name || "Community Member"}
                              </span>
                              {item.donorId?.points >= 50 && (
                                <FaMedal className="shrink-0 text-blazing-flame" />
                              )}
                            </p>
                            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-dusty-lavender">
                              {createdAt}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {item.verifiedByInstitution && (
                            <span className="flex shrink-0 items-center gap-1 rounded-xl bg-[#2b7fff] px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#2b7fff]/25" title="Verified by Institutional Node">
                              <FaShieldAlt /> Verified
                            </span>
                          )}
                          {item.isEmergency ? (
                            <span className="flex shrink-0 items-center gap-1 rounded-xl bg-blazing-flame px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-lg shadow-blazing-flame/25">
                              <FaExclamationTriangle />
                              SOS
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-xl border border-surface/70 bg-surface/80 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-pine-teal shadow-sm">
                              {meta.label}
                            </span>
                          )}
                        </div>
                      </div>

                      {item.image ? (
                        <div className="relative z-10 h-44 w-full shrink-0 overflow-hidden rounded-[1.5rem] bg-pearl-beige shadow-inner">
                          <img
                            src={optimizeImageUrl(item.image)}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            alt={item.title || "Donation item"}
                          />
                          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-pine-teal/30 to-transparent" />
                        </div>
                      ) : item.category?.toLowerCase() === "blood" ? (
                        <div
                          className={`relative z-10 flex h-44 w-full shrink-0 flex-col items-center justify-center overflow-hidden rounded-[1.5rem] text-white shadow-inner ${
                            item.isEmergency
                              ? "bg-gradient-to-br from-blazing-flame to-[#e03a12]"
                              : "bg-gradient-to-br from-dark-raspberry to-[#850e53]"
                          }`}
                        >
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16),transparent_45%,rgba(0,0,0,0.12))]" />
                          <FaHeartbeat className="relative mb-2 text-4xl drop-shadow-md" />
                          <span className="relative text-4xl font-black drop-shadow-md">
                            {item.bloodGroup || "Blood"}
                          </span>
                        </div>
                      ) : (
                        <div
                          className={`relative z-10 flex h-44 w-full shrink-0 flex-col items-center justify-center rounded-[1.5rem] border ${meta.panel} shadow-inner`}
                        >
                          <CategoryIcon className="mb-3 text-4xl" />
                          <span className="text-xs font-black uppercase tracking-[0.2em]">
                            {meta.label}
                          </span>
                        </div>
                      )}

                      <div className="relative z-10 mt-4 flex flex-1 flex-col">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          {item.quantity && (
                            <span className="rounded-lg border border-pine-teal/10 bg-pine-teal/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-pine-teal">
                              {item.quantity}
                            </span>
                          )}
                          <span className="rounded-lg border border-dusty-lavender/15 bg-surface/65 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-dusty-lavender">
                            {item.status || "active"}
                          </span>
                        </div>

                        <h3 className="mb-2 line-clamp-2 text-lg font-black leading-snug tracking-tight text-pine-teal group-hover:text-blazing-flame transition-colors duration-300">
                          {item.title}
                        </h3>

                        {item.patientDetails && item.patientDetails.name && (
                          <div className="mb-3 bg-gradient-to-r from-blazing-flame/10 to-transparent border-l-2 border-blazing-flame pl-3 py-2">
                             <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blazing-flame mb-0.5">Patient Details</p>
                             <p className="text-sm font-black text-pine-teal">{item.patientDetails.name} <span className="text-pine-teal/60 font-bold ml-1">({item.patientDetails.age} Yrs)</span></p>
                             {item.hospitalRoomNumber && <p className="text-[10px] font-bold text-pine-teal mt-1">Ward: <span className="font-black text-dark-raspberry">{item.hospitalRoomNumber}</span></p>}
                          </div>
                        )}

                        <p className="mb-4 line-clamp-2 flex-1 text-sm font-medium leading-relaxed text-pine-teal/70">
                          {item.description}
                        </p>
                        
                        <div className="mt-auto flex flex-wrap items-center gap-2">
                          {item.criticalDeadline && (
                            <div className="w-full flex items-center gap-2 rounded-xl border border-blazing-flame/30 bg-blazing-flame/5 p-2.5 text-[10px] font-black uppercase tracking-widest text-blazing-flame shadow-sm mb-1">
                              <FaClock className="text-sm shrink-0 animate-pulse" />
                              <span className="truncate">Deadline: {new Date(item.criticalDeadline).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                          )}
                          {item.severityLevel && item.severityLevel !== "Unverified" && (
                            <div className={`rounded-xl border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest shadow-sm ${
                              item.severityLevel === "Code Red" ? "border-blazing-flame/40 bg-blazing-flame/10 text-blazing-flame" :
                              "border-[#ffd700]/40 bg-[#ffd700]/10 text-[#cca000]"
                            }`}>
                              {item.severityLevel}
                            </div>
                          )}
                          <div className="flex flex-1 items-center gap-2 rounded-xl border border-dark-raspberry/10 bg-dark-raspberry/5 p-3 text-[10px] font-black uppercase tracking-widest text-dark-raspberry">
                            <FaMapMarkerAlt className="shrink-0 text-sm" />
                            <span className="truncate">
                              {item.addressText || item.location?.addressText || "Location pending"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 mt-4 flex gap-3 border-t border-dusty-lavender/10 pt-4">
                        {isMine ? (
                          item.status === "fulfilled" ? (
                            <button
                              disabled
                              className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-surface/70 bg-surface/60 py-3.5 text-[10px] font-black uppercase tracking-widest text-dusty-lavender shadow-sm"
                            >
                              <FaCheckCircle />
                              Completed
                            </button>
                          ) : (
                            <>
                              <MotionButton
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() =>
                                  setRequestsModal({
                                    isOpen: true,
                                    donation: item,
                                  })
                                }
                                disabled={!item.requestedBy?.length}
                                className={`flex flex-[2] items-center justify-center gap-2 rounded-2xl border py-3.5 text-[10px] font-black uppercase tracking-widest shadow-sm transition-all ${
                                  item.requestedBy?.length > 0
                                    ? "border-pine-teal/20 bg-surface text-pine-teal hover:border-pine-teal/40"
                                    : "cursor-not-allowed border-surface/60 bg-surface/50 text-dusty-lavender"
                                }`}
                              >
                                <FaUsers />
                                Requests ({item.requestedBy?.length || 0})
                              </MotionButton>
                              <MotionButton
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.94 }}
                                onClick={() => handleDeletePost(item._id)}
                                aria-label="Delete post"
                                className="flex w-12 items-center justify-center rounded-2xl border border-surface/70 bg-surface text-blazing-flame shadow-sm transition-all hover:border-blazing-flame/40"
                              >
                                <FaTrash className="text-sm" />
                              </MotionButton>
                            </>
                          )
                        ) : item.status === "fulfilled" ? (
                          <button
                            disabled
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-surface/70 bg-surface/60 py-3.5 text-[10px] font-black uppercase tracking-widest text-dusty-lavender shadow-sm"
                          >
                            <FaLock />
                            Closed
                          </button>
                        ) : isApprovedReceiver ? (
                          <MotionButton
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() =>
                              navigate(`/chat/${item._id}_${user._id}`)
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-dark-raspberry to-[#850e53] py-3.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-dark-raspberry/25"
                          >
                            <FaCommentDots className="text-sm" />
                            Connect
                          </MotionButton>
                        ) : alreadyReq ? (
                          <button
                            disabled
                            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-pine-teal/20 bg-surface py-3.5 text-[10px] font-black uppercase tracking-widest text-pine-teal shadow-sm"
                          >
                            <FaCheck />
                            Sent
                          </button>
                        ) : (
                          <>
                            <MotionButton
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.96 }}
                              onClick={() => handleRequestItem(item._id)}
                              className={`flex flex-[2] items-center justify-center gap-2 rounded-2xl py-3.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${
                                item.isEmergency
                                  ? "bg-gradient-to-r from-blazing-flame to-[#e03a12] shadow-blazing-flame/25"
                                  : "bg-gradient-to-r from-pine-teal to-[#1a3630] shadow-pine-teal/25"
                              }`}
                            >
                              <FaHandsHelping className="text-sm" />
                              {item.isEmergency ? "Respond" : "Claim"}
                            </MotionButton>
                            <MotionButton
                              whileHover={{ y: -2 }}
                              whileTap={{ scale: 0.94 }}
                              onClick={() => handleShare(item)}
                              aria-label="Share post"
                              className="flex w-12 items-center justify-center rounded-2xl border border-surface/70 bg-surface text-pine-teal shadow-sm transition-all hover:border-pine-teal/40"
                            >
                              <FaShareAlt className="text-sm" />
                            </MotionButton>
                          </>
                        )}
                      </div>
                    </MotionArticle>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {hasMore && (
            <div className="mt-12 flex justify-center">
              <MotionButton
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={loadMoreListings}
                disabled={loadingMore}
                className="flex items-center gap-3 rounded-full border border-surface/70 bg-surface/80 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-pine-teal shadow-xl backdrop-blur-xl disabled:opacity-60"
              >
                {loadingMore ? (
                  <FaSpinner className="animate-spin text-lg" />
                ) : (
                  <>
                    <FaBoxOpen />
                    Load More
                  </>
                )}
              </MotionButton>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showSOS && (
            <div className="fixed inset-0 z-[3000] flex items-end justify-center p-4 sm:items-center">
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-md"
                onClick={() => setShowSOS(false)}
              />
              <MotionDiv
                initial={{ y: "100%", opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: "100%", opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-md rounded-[2rem] border border-blazing-flame/50 bg-gradient-to-br from-[#1c0808] to-[#0a0000] p-6 shadow-[0_0_80px_rgba(255,74,28,0.3)] backdrop-blur-2xl sm:p-8 overflow-hidden"
              >
                {/* Emergency Radar Animation Background */}
                <div className="absolute inset-0 z-0 flex items-center justify-center opacity-20 pointer-events-none">
                  <div className="w-[400px] h-[400px] rounded-full border border-blazing-flame/20 animate-ping" style={{ animationDuration: '3s' }} />
                  <div className="absolute w-[200px] h-[200px] rounded-full border border-blazing-flame/30 animate-ping" style={{ animationDuration: '2s' }} />
                </div>

                <div className="relative z-10 mb-7 flex items-center justify-between">
                  <div className="flex items-center gap-4 text-blazing-flame">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blazing-flame bg-blazing-flame/20 shadow-[0_0_15px_rgba(255,74,28,0.5)]">
                      <FaExclamationTriangle className="text-2xl animate-pulse text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-white">
                        Emergency Request
                      </h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-dark-raspberry">
                        Ask for urgent help
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSOS(false)}
                    className="rounded-full bg-surface/10 p-3 text-white/50 shadow-inner transition-all hover:bg-blazing-flame hover:text-white"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="mb-6">
                  <button
                    type="button"
                    onClick={startVoiceRecognition}
                    className={`w-full flex items-center justify-center gap-3 rounded-2xl border py-4 text-xs font-black uppercase tracking-widest text-white shadow-[0_10px_30px_rgba(255,74,28,0.2)] transition-all ${isListening ? "bg-blazing-flame border-blazing-flame animate-pulse shadow-[0_0_40px_rgba(255,74,28,0.6)]" : "bg-surface/10 border-blazing-flame/50 hover:bg-blazing-flame/20"}`}
                  >
                    <FaMicrophone className={isListening ? "text-lg animate-bounce" : "text-lg"} />
                    {isListening ? "Listening... Speak naturally" : "Voice Request"}
                  </button>
                </div>

                <form onSubmit={handleSOSSubmit} className="relative z-10 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      required
                      value={sosData.bloodGroup}
                      onChange={(e) =>
                        setSosData({ ...sosData, bloodGroup: e.target.value })
                      }
                      className="flex-1 rounded-2xl border border-surface/10 bg-surface/5 px-4 py-4 text-xs font-black uppercase tracking-widest text-white shadow-inner outline-none focus:border-blazing-flame focus:bg-blazing-flame/10 transition-all cursor-pointer appearance-none"
                    >
                      <option value="" disabled className="text-black">
                        Blood Type
                      </option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                        (bg) => (
                          <option key={bg} value={bg} className="text-black">
                            {bg}
                          </option>
                        ),
                      )}
                    </select>
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="Units"
                      value={sosData.quantity}
                      onChange={(e) =>
                        setSosData({ ...sosData, quantity: e.target.value })
                      }
                      className="w-24 rounded-2xl border border-surface/10 bg-surface/5 px-4 py-4 text-center text-xs font-black uppercase tracking-widest text-white shadow-inner outline-none focus:border-blazing-flame focus:bg-blazing-flame/10 transition-all placeholder-white/30"
                    />
                  </div>
                  <input
                    required
                    placeholder="Hospital / Facility Name"
                    value={sosData.hospital}
                    onChange={(e) =>
                      setSosData({ ...sosData, hospital: e.target.value })
                    }
                    className="w-full rounded-2xl border border-surface/10 bg-surface/5 px-5 py-4 text-sm font-bold text-white shadow-inner outline-none focus:border-blazing-flame focus:bg-blazing-flame/10 transition-all placeholder-white/30"
                  />

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      required
                      placeholder="Patient Name"
                      value={sosData.patientName}
                      onChange={(e) =>
                        setSosData({ ...sosData, patientName: e.target.value })
                      }
                      className="flex-[2] rounded-2xl border border-surface/10 bg-surface/5 px-5 py-4 text-sm font-bold text-white shadow-inner outline-none focus:border-blazing-flame focus:bg-blazing-flame/10 transition-all placeholder-white/30"
                    />
                    <input
                      type="number"
                      placeholder="Age"
                      value={sosData.patientAge}
                      onChange={(e) =>
                        setSosData({ ...sosData, patientAge: e.target.value })
                      }
                      className="flex-1 rounded-2xl border border-surface/10 bg-surface/5 px-4 py-4 text-center text-sm font-bold text-white shadow-inner outline-none focus:border-blazing-flame focus:bg-blazing-flame/10 transition-all placeholder-white/30"
                    />
                  </div>

                  <input
                    placeholder="Ward / ICU / Room No. (Optional)"
                    value={sosData.roomNumber}
                    onChange={(e) =>
                      setSosData({ ...sosData, roomNumber: e.target.value })
                    }
                    className="w-full rounded-2xl border border-surface/10 bg-surface/5 px-5 py-4 text-sm font-bold text-white shadow-inner outline-none focus:border-blazing-flame focus:bg-blazing-flame/10 transition-all placeholder-white/30"
                  />

                  <div className="relative">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        required
                        readOnly
                        placeholder="Use GPS for accurate location"
                        value={sosData.addressText}
                        className="min-w-0 flex-1 rounded-2xl border border-surface/10 bg-surface/5 px-5 py-4 text-sm font-bold text-white shadow-inner outline-none transition-all placeholder-white/30 cursor-not-allowed opacity-80"
                      />
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isFetchingLocation}
                        className="flex w-full sm:w-14 py-4 sm:py-0 shrink-0 items-center justify-center rounded-2xl border border-surface/20 bg-surface/10 text-white shadow-md transition-all hover:bg-blazing-flame hover:border-blazing-flame disabled:opacity-60"
                      >
                        {isFetchingLocation ? (
                          <FaSpinner className="animate-spin text-lg" />
                        ) : (
                          <FaLocationArrow className="text-lg" />
                        )}
                      </button>
                    </div>
                    {/* Suggestions dropdown removed as manual typing is disabled */}
                  </div>

                  <textarea
                    required
                    rows="2"
                    placeholder="Critical patient details..."
                    value={sosData.description}
                    onChange={(e) =>
                      setSosData({ ...sosData, description: e.target.value })
                    }
                    className="w-full resize-none rounded-2xl border border-surface/10 bg-surface/5 px-5 py-4 text-sm font-bold text-white shadow-inner outline-none focus:border-blazing-flame focus:bg-blazing-flame/10 transition-all placeholder-white/30"
                  />

                  <MotionButton
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blazing-flame to-[#e03a12] py-5 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-[0_12px_35px_rgba(255,74,28,0.35)] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <FaSpinner className="animate-spin text-lg" />
                    ) : (
                      <>
                        <FaHeartbeat />
                        Send Request
                      </>
                    )}
                  </MotionButton>
                </form>
              </MotionDiv>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {requestsModal.isOpen && requestsModal.donation && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-pine-teal/60 backdrop-blur-md"
                onClick={() =>
                  setRequestsModal({ isOpen: false, donation: null })
                }
              />
              <MotionDiv
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-md rounded-[2rem] border border-surface bg-surface/90 p-6 shadow-2xl backdrop-blur-2xl sm:p-8"
              >
                <div className="mb-5 flex items-center justify-between border-b border-dusty-lavender/20 pb-5">
                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-pine-teal">
                      Active Requests
                    </h2>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-dusty-lavender">
                      Select a responder
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setRequestsModal({ isOpen: false, donation: null })
                    }
                    className="rounded-full bg-pearl-beige p-3 text-dusty-lavender shadow-inner transition-colors hover:text-pine-teal"
                  >
                    <FaTimes />
                  </button>
                </div>
                <div className="max-h-[50vh] space-y-3 overflow-y-auto pb-2 no-scrollbar">
                  {requestsModal.donation.requestedBy.map((requester) => (
                    <div
                      key={requester._id}
                      className="flex items-center justify-between rounded-2xl border border-dusty-lavender/20 bg-surface p-4 shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-pine-teal/20 bg-pine-teal/10 text-sm font-black uppercase text-pine-teal shadow-sm">
                          {requester.name?.charAt(0)}
                        </div>
                        <span className="truncate text-sm font-bold leading-none text-pine-teal">
                          {requester.name}
                        </span>
                      </div>
                      <MotionButton
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() =>
                          handleApproveRequest(
                            requestsModal.donation._id,
                            requester._id,
                          )
                        }
                        disabled={approvingId === requester._id}
                        className="flex items-center justify-center gap-2 rounded-xl bg-pine-teal px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-md disabled:opacity-60"
                      >
                        {approvingId === requester._id ? (
                          <FaSpinner className="animate-spin text-sm" />
                        ) : (
                          <>
                            <FaCheck />
                            Approve
                          </>
                        )}
                      </MotionButton>
                    </div>
                  ))}
                </div>
              </MotionDiv>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
};

export default Dashboard;
