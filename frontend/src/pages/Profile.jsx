import { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser, FaEnvelope, FaMapMarkerAlt, FaTint, FaBoxOpen,
  FaAward, FaHistory, FaEdit, FaSave, FaTimes, FaPhone,
  FaLocationArrow, FaSpinner, FaStar, FaShieldAlt, FaSignOutAlt,
  FaShareAlt, FaCheckCircle,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../utils/api";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace("/api", "")
  : "https://hopelink-api.onrender.com";

const springIn = { type: "spring", stiffness: 300, damping: 26 };

const StatChip = ({ icon: Icon, label, value, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...springIn, delay }}
    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 shrink-0"
  >
    <div className={`h-9 w-9 flex items-center justify-center rounded-xl bg-white/10`}>
      <Icon className={`text-sm ${color}`} />
    </div>
    <div>
      <p className={`text-xl font-black leading-none ${color}`}>{value}</p>
      <p className="text-[10px] font-bold text-white/40 mt-0.5 uppercase tracking-wider">{label}</p>
    </div>
  </motion.div>
);

const Profile = () => {
  const { user, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats,             setStats]             = useState({ totalDonations: 0, activeListings: 0, bloodDonations: 0 });
  const [loading,           setLoading]           = useState(true);
  const [generatedStory,    setGeneratedStory]    = useState("");
  const [isEditing,         setIsEditing]         = useState(false);
  const [isFetchingLocation, setFetchingLocation] = useState(false);
  const [formData,          setFormData]          = useState({
    name: user?.name || "", bloodGroup: user?.bloodGroup || "",
    phone: user?.phone || "", addressText: user?.addressText || "",
  });

  useEffect(() => {
    setFormData({
      name: user?.name || "", bloodGroup: user?.bloodGroup || "",
      phone: user?.phone || "", addressText: user?.addressText || "",
    });
    const fetchStats = async () => {
      if (!user?.token) return;
      try {
        const { data } = await api.get("/donations/my-history");
        const active = data.filter((d) => d.status === "available" || d.status === "pending").length;
        const blood  = data.filter((d) => d.category === "blood").length;
        setStats({ totalDonations: data.length, activeListings: active, bloodDonations: blood });
      } catch { /* silently */ }
      finally { setLoading(false); }
    };
    fetchStats();
  }, [user]);

  const handleGetLocation = async () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    setFetchingLocation(true);
    const tid = toast.loading("Locking GPS…");
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
          if (!apiKey) throw new Error("Mapbox Token Missing");
          const { data } = await axios.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${apiKey}`,
          );
          if (data?.features?.length) {
            const city = data.features[0].place_name.split(",")[0];
            setFormData((p) => ({ ...p, addressText: city }));
            toast.success(`Location: ${city}`, { id: tid });
          }
        } catch { toast.error("Could not resolve location", { id: tid }); }
        finally { setFetchingLocation(false); }
      },
      () => { setFetchingLocation(false); toast.error("Location denied", { id: tid }); },
    );
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put("/auth/profile", formData);
      login(data);
      setIsEditing(false);
      toast.success("Profile updated.");
    } catch (err) { toast.error(err.response?.data?.message || "Update failed"); }
  };

  if (!user) return null;

  const inputCls = "w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3.5 text-sm font-medium text-white placeholder-white/30 outline-none focus:border-blazing-flame/60 focus:ring-2 focus:ring-blazing-flame/10 transition-all";

  const statData = [
    { icon: FaBoxOpen,     label: "Posts",   value: loading ? "—" : (user.donationsCount || stats.totalDonations), color: "text-blazing-flame" },
    { icon: FaHistory,     label: "Active",  value: loading ? "—" : stats.activeListings,                          color: "text-pine-teal" },
    { icon: FaTint,        label: "Blood",   value: loading ? "—" : stats.bloodDonations,                          color: "text-dark-raspberry" },
    { icon: FaStar,        label: "Points",  value: user.points || 0,                                              color: "text-yellow-400" },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-pearl-beige font-sans pb-32 md:pb-16">

        {/* ── AURORA COVER HEADER ── */}
        <div className="aurora-header relative px-4 pt-8 pb-20">
          <div className="dark-dot-grid absolute inset-0 opacity-20" />

          {/* Top row */}
          <div className="relative z-10 flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">Your Profile</p>
              <h1 className="text-2xl font-black text-white tracking-tight mt-0.5">{user.name?.split(" ")[0]}</h1>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white">
                  <FaEdit className="text-xs" /> Edit
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => { logout(); navigate("/"); }}
                className="md:hidden h-10 w-10 flex items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-white/50">
                <FaSignOutAlt className="text-sm" />
              </motion.button>
            </div>
          </div>

          {/* Avatar */}
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative mb-3">
              {user.profilePic ? (
                <img src={user.profilePic} alt="Profile" referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-white/20 shadow-2xl" />
              ) : (
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center bg-gradient-to-br from-dark-raspberry to-pine-teal text-white font-black text-4xl border-4 border-white/20 shadow-2xl">
                  {user.name?.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-1.5 -right-1.5 bg-blazing-flame text-white h-8 w-8 rounded-xl flex items-center justify-center shadow-lg border-2 border-white/30">
                <FaShieldAlt className="text-xs" />
              </div>
            </div>

            <h2 className="text-xl font-black text-white">{user.name}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{user.rank || "Community Member"}</span>
              {user.rating > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-yellow-400/20 border border-yellow-400/30 px-2 py-0.5 text-[10px] font-black text-yellow-300">
                  <FaStar className="text-[8px]" /> {user.rating?.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── STAT CHIPS (overlapping header) ── */}
        <div className="-mt-10 px-4 mb-6">
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-0.5">
            {statData.map((s, i) => <StatChip key={s.label} {...s} delay={i * 0.06} />)}
          </div>
        </div>

        <div className="px-4 space-y-4">

          {/* ── INFO / EDIT CARD ── */}
          <div className="rounded-3xl overflow-hidden bg-surface border border-pine-teal/8 shadow-sm">
            <div className="px-5 py-4 border-b border-pine-teal/8 flex items-center justify-between">
              <h3 className="text-sm font-black text-pine-teal uppercase tracking-widest">Details</h3>
              {isEditing && (
                <button onClick={() => setIsEditing(false)} className="text-dusty-lavender hover:text-blazing-flame transition-colors">
                  <FaTimes className="text-sm" />
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!isEditing ? (
                <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-4 space-y-2">
                  {[
                    { icon: FaEnvelope,    value: user.email,                   label: "Email" },
                    { icon: FaPhone,       value: user.phone || "Not set",       label: "Phone" },
                    { icon: FaTint,        value: user.bloodGroup || "Unknown",  label: "Blood" },
                    { icon: FaMapMarkerAlt,value: user.addressText || "Not set", label: "Area" },
                  ].map(({ icon: Icon, value, label }) => (
                    <div key={label} className="flex items-center gap-3 rounded-2xl border border-pine-teal/8 bg-surface-2 px-4 py-3.5">
                      <Icon className="text-sm text-dark-raspberry shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-widest text-dusty-lavender">{label}</p>
                        <p className="text-sm font-bold text-pine-teal truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <motion.form key="edit" onSubmit={handleUpdateProfile}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-4 space-y-3 bg-[#0a1f1a]">

                  {[
                    { key: "name",        label: "Full Name",   type: "text",     placeholder: "Your name" },
                    { key: "phone",       label: "Phone",       type: "tel",      placeholder: "+91 9XXXXXXXX" },
                  ].map(({ key, label, type, placeholder }) => (
                    <div key={key}>
                      <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">{label}</label>
                      <input type={type} value={formData[key]} placeholder={placeholder} required={key === "name"}
                        onChange={(e) => setFormData((p) => ({ ...p, [key]: e.target.value }))}
                        className={inputCls} />
                    </div>
                  ))}

                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Blood Group</label>
                    <select value={formData.bloodGroup}
                      onChange={(e) => setFormData((p) => ({ ...p, bloodGroup: e.target.value }))}
                      className={inputCls + " appearance-none cursor-pointer"}>
                      <option value="" className="bg-[#0a1f1a]">Select</option>
                      {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((g) => (
                        <option key={g} value={g} className="bg-[#0a1f1a]">{g}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Location</label>
                    <div className="flex gap-2">
                      <input type="text" value={formData.addressText} placeholder="City / Area"
                        onChange={(e) => setFormData((p) => ({ ...p, addressText: e.target.value }))}
                        className={inputCls} />
                      <motion.button type="button" whileTap={{ scale: 0.85 }}
                        onClick={handleGetLocation} disabled={isFetchingLocation}
                        className="h-[52px] w-[52px] shrink-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/6 text-white/60 disabled:opacity-50">
                        {isFetchingLocation ? <FaSpinner className="animate-spin" /> : <FaLocationArrow />}
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => setIsEditing(false)}
                      className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/6 text-white/50">
                      <FaTimes />
                    </motion.button>
                    <motion.button type="submit" whileTap={{ scale: 0.97 }}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-dark-raspberry py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-md">
                      <FaSave /> Save Changes
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* ── POINTS CARD ── */}
          <div className="aurora-header rounded-3xl p-5 relative overflow-hidden">
            <div className="dark-dot-grid absolute inset-0 opacity-15" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Community Standing</p>
                <p className="text-6xl font-black text-white tracking-tighter">{user.points || 0}</p>
                <p className="text-[10px] font-bold text-white/40 mt-1 uppercase tracking-widest">Total Points</p>
              </div>
              <div className="text-right">
                <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Rank</p>
                  <p className="text-sm font-black text-dark-raspberry">{user.rank || "Initiate"}</p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -bottom-8 -right-8 text-white/4">
              <FaAward className="text-[120px]" />
            </div>
          </div>

          {/* ── REFERRAL ── */}
          <div className="rounded-3xl border border-pine-teal/10 bg-surface p-5 flex items-center justify-between gap-4 shadow-sm">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-0.5">Referral</p>
              <p className="text-sm font-bold text-pine-teal">Invite friends, grow the community</p>
            </div>
            <motion.button whileTap={{ scale: 0.9 }}
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/?ref=${user?.referralCode || ""}`);
                toast.success("Link copied!");
              }}
              className="shrink-0 flex items-center gap-1.5 rounded-2xl bg-pine-teal px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-sm">
              <FaShareAlt className="text-xs" /> Copy
            </motion.button>
          </div>

          {/* ── AI STORY ── */}
          <div className="rounded-3xl border border-dark-raspberry/20 bg-surface p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-dark-raspberry via-pine-teal to-blazing-flame" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-0.5">AI Feature</p>
                <p className="text-sm font-bold text-pine-teal">Share your impact story</p>
              </div>
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={async () => {
                  const tid = toast.loading("Crafting your story…");
                  try {
                    const { data } = await api.get("/donations/hero-story");
                    toast.dismiss(tid);
                    setGeneratedStory(data.story);
                    toast.success("Story generated!");
                  } catch { toast.error("Failed", { id: tid }); }
                }}
                className="shrink-0 flex items-center gap-1.5 rounded-2xl bg-dark-raspberry px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-sm">
                <FaStar className="text-xs" /> Generate
              </motion.button>
            </div>

            <AnimatePresence>
              {generatedStory && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mt-4 rounded-2xl border border-pine-teal/10 bg-surface-2 p-4">
                  <p className="text-sm text-pine-teal italic leading-relaxed">"{generatedStory}"</p>
                  <motion.button whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: "My Community Impact", text: generatedStory, url: window.location.origin }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(generatedStory + " " + window.location.origin);
                        toast.success("Copied!");
                      }
                    }}
                    className="mt-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-dark-raspberry">
                    <FaShareAlt /> Share Now
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── LOGOUT (mobile) ── */}
          <motion.button whileTap={{ scale: 0.97 }}
            onClick={() => { logout(); navigate("/"); }}
            className="md:hidden w-full flex items-center justify-center gap-2 rounded-2xl border border-blazing-flame/25 bg-blazing-flame/8 py-4 text-sm font-black uppercase tracking-widest text-blazing-flame">
            <FaSignOutAlt /> Log Out
          </motion.button>

          <p className="text-center text-[10px] italic font-medium text-dusty-lavender/50 pb-4">
            "A community is only as strong as its willingness to protect one another."
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
