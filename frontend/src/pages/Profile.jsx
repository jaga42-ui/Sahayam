import { useState, useEffect, useContext } from "react";
import axios from "axios";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser, FaEnvelope, FaMapMarkerAlt, FaTint, FaBoxOpen,
  FaHistory, FaEdit, FaSave, FaTimes, FaPhone,
  FaLocationArrow, FaSpinner, FaStar, FaShieldAlt, FaSignOutAlt,
  FaShareAlt, FaCheckCircle, FaBell, FaToggleOn, FaToggleOff,
  FaTrophy, FaHeart, FaUsers, FaPlus, FaTrash, FaPassport,
  FaHeartbeat, FaCertificate, FaCalendarAlt, FaUserShield,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../utils/api";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  ? import.meta.env.VITE_BACKEND_URL.replace("/api", "")
  : "https://hopelink-api.onrender.com";

const springIn = { type: "spring", stiffness: 300, damping: 26 };
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RELATIONS = ["Parent", "Spouse", "Child", "Sibling", "Friend", "Other"];

const StatChip = ({ icon: Icon, label, value, color, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...springIn, delay }}
    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 shrink-0"
  >
    <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-white/10">
      <Icon className={`text-sm ${color}`} />
    </div>
    <div>
      <p className={`text-xl font-black leading-none ${color}`}>{value}</p>
      <p className="text-[10px] font-bold text-white/40 mt-0.5 uppercase tracking-wider">{label}</p>
    </div>
  </motion.div>
);

const SectionHeader = ({ title }) => (
  <div className="px-5 py-4 border-b border-pine-teal/8">
    <h3 className="text-sm font-black text-pine-teal uppercase tracking-widest">{title}</h3>
  </div>
);

const Profile = () => {
  const { user, login, logout, toggleAvailability, enableNotifications } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats,              setStats]              = useState({ totalDonations: 0, activeListings: 0, bloodDonations: 0 });
  const [loading,            setLoading]            = useState(true);
  const [isEditing,          setIsEditing]          = useState(false);
  const [isFetchingLocation, setFetchingLocation]   = useState(false);
  const [formData,           setFormData]           = useState({
    name: user?.name || "", bloodGroup: user?.bloodGroup || "",
    phone: user?.phone || "", addressText: user?.addressText || "",
  });

  // New feature state
  const [rarity,           setRarity]           = useState(null);   // { count, bloodGroup }
  const [passport,         setPassport]         = useState(null);
  const [passportOpen,     setPassportOpen]     = useState(false);
  const [contacts,         setContacts]         = useState([]);
  const [safetyNet,        setSafetyNet]        = useState([]);
  const [contactsLoading,  setContactsLoading]  = useState(false);
  const [safetyNetLoading, setSafetyNetLoading] = useState(false);
  const [editingContacts,  setEditingContacts]  = useState(false);
  const [draftContacts,    setDraftContacts]    = useState([]);
  const [savingContacts,   setSavingContacts]   = useState(false);
  const [thanksReceived,   setThanksReceived]   = useState([]);

  useEffect(() => {
    setFormData({
      name: user?.name || "", bloodGroup: user?.bloodGroup || "",
      phone: user?.phone || "", addressText: user?.addressText || "",
    });

    const fetchAll = async () => {
      if (!user?.token) return;
      setLoading(true);
      try {
        const [histRes, rarityRes, passportRes, netRes] = await Promise.all([
          api.get("/donations/my-history"),
          api.get("/auth/donor-rarity").catch(() => null),
          api.get("/auth/donor-passport").catch(() => null),
          api.get("/auth/family-safety-net").catch(() => null),
        ]);

        const data = histRes.data;
        const active = data.filter((d) => d.status === "available" || d.status === "pending").length;
        const blood  = data.filter((d) => d.category === "blood").length;
        setStats({ totalDonations: data.length, activeListings: active, bloodDonations: blood });

        if (rarityRes?.data) setRarity(rarityRes.data);
        if (passportRes?.data) {
          setPassport(passportRes.data);
          setThanksReceived(passportRes.data.thanksReceived || []);
        }
        if (netRes?.data) {
          setSafetyNet(netRes.data);
          setContacts(netRes.data);
        }
      } catch { /* silently */ }
      finally { setLoading(false); }
    };
    fetchAll();
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

  const handleSaveContacts = async () => {
    setSavingContacts(true);
    try {
      await api.put("/auth/emergency-contacts", { contacts: draftContacts });
      setContacts(draftContacts);
      setEditingContacts(false);
      toast.success("Family safety net updated.");
      // Refresh safety net counts
      const { data } = await api.get("/auth/family-safety-net");
      setSafetyNet(data);
      setContacts(data);
    } catch { toast.error("Failed to save contacts."); }
    finally { setSavingContacts(false); }
  };

  const sharePassport = () => {
    const text = `I'm a verified ${user?.bloodGroup || ""} blood donor on Sahayam — ${passport?.donationsCount || 0} donations. Join me: ${window.location.origin}`;
    if (navigator.share) {
      navigator.share({ title: "My Donor Passport", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Passport copied!");
    }
  };

  if (!user) return null;

  const inputCls = "w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3.5 text-sm font-medium text-white placeholder-white/30 outline-none focus:border-blazing-flame/60 focus:ring-2 focus:ring-blazing-flame/10 transition-all";
  const livesHelped = Math.max(user.donationsCount || 0, stats.bloodDonations) * 3;

  const statData = [
    { icon: FaTint,    label: "Donated", value: loading ? "—" : (user.donationsCount || stats.bloodDonations), color: "text-dark-raspberry" },
    { icon: FaHeart,   label: "Lives",   value: loading ? "—" : livesHelped,                                   color: "text-blazing-flame" },
    { icon: FaTrophy,  label: "Points",  value: loading ? "—" : (user.points || 0),                           color: "text-pine-teal" },
    { icon: FaHistory, label: "Active",  value: loading ? "—" : stats.activeListings,                         color: "text-dusty-lavender" },
  ];

  const rarityText = rarity?.count !== undefined
    ? rarity.count === 0
      ? `You may be the only ${rarity.bloodGroup} donor nearby`
      : `You're 1 of ${rarity.count + 1} ${rarity.bloodGroup} donors within 5km`
    : null;

  return (
    <Layout>
      <div className="min-h-screen bg-pearl-beige font-sans pb-32 md:pb-16">

        {/* ── AURORA COVER HEADER ── */}
        <div className="aurora-header relative px-4 pt-8 pb-20">
          <div className="dark-dot-grid absolute inset-0 opacity-20" />

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
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{user.bloodGroup ? `${user.bloodGroup} · Donor` : "Donor"}</span>
              {user.rating > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-yellow-400/20 border border-yellow-400/30 px-2 py-0.5 text-[10px] font-black text-yellow-300">
                  <FaStar className="text-[8px]" /> {user.rating?.toFixed(1)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── STAT CHIPS ── */}
        <div className="-mt-10 px-4 mb-6">
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-0.5">
            {statData.map((s, i) => <StatChip key={s.label} {...s} delay={i * 0.06} />)}
          </div>
        </div>

        <div className="px-4 space-y-4">

          {/* ── CRITICAL INFRASTRUCTURE CARD ── */}
          {rarity?.bloodGroup && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#6b1a3a] to-[#3d0f22] border border-dark-raspberry/30 shadow-lg p-5 relative">
              <div className="absolute inset-0 opacity-10 dark-dot-grid" />
              <div className="relative z-10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Critical Infrastructure</p>
                    <p className="text-lg font-black text-white leading-snug">{rarityText}</p>
                  </div>
                  <div className="shrink-0 h-12 w-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                    <span className="text-lg font-black text-white">{rarity.bloodGroup}</span>
                  </div>
                </div>
                <p className="mt-2.5 text-[12px] text-white/55 leading-relaxed">
                  {rarity.count === 0
                    ? "Someone's life may depend on you being on the app."
                    : "Stay on-duty. Someone nearby may need you at any moment."}
                </p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-white opacity-50 animate-ping" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                  </span>
                  <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">
                    {user.isAvailable ? "Active on-duty" : "Currently snoozed"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── DONOR CARD ── */}
          <div className="aurora-header rounded-3xl p-5 relative overflow-hidden">
            <div className="dark-dot-grid absolute inset-0 opacity-15" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Your blood group</p>
                <p className="text-6xl font-black text-white tracking-tighter">{user.bloodGroup || "—"}</p>
                {user.rank && (
                  <span className="inline-flex items-center gap-1 mt-1.5 rounded-full bg-white/10 border border-white/15 px-2.5 py-1 text-[10px] font-black text-white/70 uppercase tracking-widest">
                    <FaTrophy className="text-[9px] text-yellow-400" /> {user.rank}
                  </span>
                )}
              </div>
              <div className="text-right space-y-2">
                <motion.button whileTap={{ scale: 0.9 }} onClick={toggleAvailability}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                    user.isAvailable
                      ? "border-pine-teal/40 bg-pine-teal/20 text-pine-teal"
                      : "border-white/15 bg-white/8 text-white/50"
                  }`}>
                  {user.isAvailable
                    ? <><FaToggleOn className="text-base text-pine-teal" /> On-duty</>
                    : <><FaToggleOff className="text-base" /> Snoozed</>}
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPassportOpen(true)}
                  className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white/70">
                  <FaPassport className="text-xs" /> Passport
                </motion.button>
              </div>
            </div>
            <div className="pointer-events-none absolute -bottom-8 -right-8 text-white/4">
              <FaTint className="text-[120px]" />
            </div>
          </div>

          {/* ── THANKS RECEIVED ── */}
          {thanksReceived.length > 0 && (
            <div className="rounded-3xl overflow-hidden bg-surface border border-pine-teal/8 shadow-sm">
              <SectionHeader title="People You Helped" />
              <div className="p-4 space-y-2.5">
                {thanksReceived.map((t, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="rounded-2xl border border-dark-raspberry/12 bg-dark-raspberry/5 px-4 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <div className="h-8 w-8 shrink-0 rounded-xl bg-dark-raspberry/15 flex items-center justify-center">
                        <FaHeart className="text-[11px] text-dark-raspberry" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black uppercase tracking-widest text-dark-raspberry/70">{t.from}</p>
                        <p className="text-[13px] font-medium text-pine-teal mt-0.5 leading-snug">"{t.message}"</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* ── FAMILY SAFETY NET ── */}
          <div className="rounded-3xl overflow-hidden bg-surface border border-pine-teal/8 shadow-sm">
            <div className="px-5 py-4 border-b border-pine-teal/8 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-pine-teal uppercase tracking-widest">Family Safety Net</h3>
                <p className="text-[11px] text-pine-teal/40 mt-0.5">Know how many donors are nearby for each family member</p>
              </div>
              {!editingContacts && (
                <motion.button whileTap={{ scale: 0.88 }}
                  onClick={() => { setDraftContacts(contacts.map(c => ({ ...c })).filter(c => c.name || c.phone)); setEditingContacts(true); }}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl border border-pine-teal/20 bg-pine-teal/8 px-3 py-2 text-[11px] font-black text-pine-teal uppercase tracking-wide">
                  <FaEdit className="text-[10px]" /> Edit
                </motion.button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {!editingContacts ? (
                <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-4 space-y-2">
                  {contacts.length === 0 ? (
                    <div className="py-8 flex flex-col items-center text-center">
                      <FaUsers className="text-2xl text-pine-teal/20 mb-3" />
                      <p className="text-[13px] font-semibold text-pine-teal/40">Add family members to see how many donors are nearby if they ever need blood</p>
                    </div>
                  ) : (
                    contacts.map((c, i) => (
                      <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-3 rounded-2xl border border-pine-teal/8 bg-surface-2 px-4 py-3.5">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-dark-raspberry/20 to-pine-teal/15 border border-pine-teal/10 flex flex-col items-center justify-center">
                          <span className="text-[11px] font-black text-pine-teal">{c.bloodGroup || "?"}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-pine-teal truncate">{c.name}</p>
                          <p className="text-[11px] text-pine-teal/40">{c.relation}</p>
                        </div>
                        {c.bloodGroup && (
                          <div className="text-right shrink-0">
                            <p className="text-lg font-black text-pine-teal leading-none">{c.donorCount ?? "—"}</p>
                            <p className="text-[9px] font-bold text-pine-teal/40 uppercase tracking-wide">donors nearby</p>
                          </div>
                        )}
                      </motion.div>
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-4 bg-[#0a1f1a] space-y-3">
                  {draftContacts.map((c, i) => (
                    <div key={i} className="rounded-2xl border border-white/10 bg-white/4 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Contact {i + 1}</span>
                        <button onClick={() => setDraftContacts((p) => p.filter((_, idx) => idx !== i))}
                          className="h-6 w-6 flex items-center justify-center rounded-full text-white/30 hover:text-blazing-flame transition-colors">
                          <FaTrash className="text-[9px]" />
                        </button>
                      </div>
                      <input type="text" placeholder="Name" value={c.name || ""} onChange={(e) => setDraftContacts((p) => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                        className="w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-blazing-flame/40" />
                      <div className="grid grid-cols-2 gap-2">
                        <select value={c.relation || ""} onChange={(e) => setDraftContacts((p) => p.map((x, idx) => idx === i ? { ...x, relation: e.target.value } : x))}
                          className="rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-white outline-none focus:border-blazing-flame/40 appearance-none cursor-pointer">
                          <option value="" className="bg-[#0a1f1a]">Relation</option>
                          {RELATIONS.map((r) => <option key={r} value={r} className="bg-[#0a1f1a]">{r}</option>)}
                        </select>
                        <select value={c.bloodGroup || ""} onChange={(e) => setDraftContacts((p) => p.map((x, idx) => idx === i ? { ...x, bloodGroup: e.target.value } : x))}
                          className="rounded-xl border border-white/10 bg-white/6 px-3 py-2.5 text-sm text-white outline-none focus:border-blazing-flame/40 appearance-none cursor-pointer">
                          <option value="" className="bg-[#0a1f1a]">Blood Group</option>
                          {BLOOD_GROUPS.map((g) => <option key={g} value={g} className="bg-[#0a1f1a]">{g}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                  {draftContacts.length < 5 && (
                    <button onClick={() => setDraftContacts((p) => [...p, { name: "", relation: "", bloodGroup: "", phone: "" }])}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 py-3 text-[12px] font-bold text-white/40 hover:text-white/60 hover:border-white/30 transition-colors">
                      <FaPlus className="text-[10px]" /> Add family member
                    </button>
                  )}
                  <div className="flex gap-2 pt-1">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditingContacts(false)}
                      className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl border border-white/10 bg-white/6 text-white/50">
                      <FaTimes />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveContacts} disabled={savingContacts}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-dark-raspberry py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-md disabled:opacity-60">
                      {savingContacts ? <FaSpinner className="animate-spin" /> : <><FaSave /> Save Safety Net</>}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

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
                    { key: "name",  label: "Full Name", type: "text", placeholder: "Your name" },
                    { key: "phone", label: "Phone",     type: "tel",  placeholder: "+91 9XXXXXXXX" },
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
                      {BLOOD_GROUPS.map((g) => <option key={g} value={g} className="bg-[#0a1f1a]">{g}</option>)}
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

          {/* ── NOTIFICATIONS ── */}
          <div className="rounded-3xl border border-pine-teal/10 bg-surface p-5 flex items-center justify-between gap-4 shadow-sm">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-0.5">Push Alerts</p>
              <p className="text-sm font-bold text-pine-teal">Get notified when blood is needed nearby</p>
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={enableNotifications}
              className="shrink-0 flex items-center gap-1.5 rounded-2xl bg-dark-raspberry px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-white shadow-sm">
              <FaBell className="text-xs" /> Enable
            </motion.button>
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

      {/* ══ DONOR PASSPORT SHEET ══ */}
      <AnimatePresence>
        {passportOpen && passport && (
          <motion.div className="fixed inset-0 z-[100] flex flex-col justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPassportOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="relative z-10 mx-auto w-full max-w-2xl bg-surface rounded-t-[28px] overflow-hidden shadow-2xl">

              <div className="flex flex-col items-center pt-3 pb-0 border-b border-pine-teal/8">
                <div className="h-1 w-10 rounded-full bg-pine-teal/20 mb-3" />
                <div className="w-full flex items-center justify-between px-5 pb-4">
                  <div>
                    <h2 className="text-base font-black text-pine-teal">Donor Passport</h2>
                    <p className="text-[12px] text-pine-teal/45 mt-0.5">Your verified blood donor identity</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPassportOpen(false)}
                    className="h-8 w-8 flex items-center justify-center rounded-full border border-pine-teal/12 bg-surface-2 text-dusty-lavender">
                    <FaTimes className="text-xs" />
                  </motion.button>
                </div>
              </div>

              {/* Passport card */}
              <div className="p-5">
                <div className="rounded-2xl bg-gradient-to-br from-[#0a1f1a] to-[#1a0f2e] border border-white/10 p-5 relative overflow-hidden">
                  <div className="dark-dot-grid absolute inset-0 opacity-20" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30 mb-1">Sahayam · Blood Donor</p>
                        <p className="text-xl font-black text-white">{passport.name}</p>
                      </div>
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-dark-raspberry to-[#6b1a3a] flex items-center justify-center border border-white/15">
                        <span className="text-xl font-black text-white">{passport.bloodGroup || "?"}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: "Donations", value: passport.donationsCount || 0 },
                        { label: "Points", value: passport.points || 0 },
                        { label: "Rank", value: passport.rank || "Novice" },
                      ].map(({ label, value }) => (
                        <div key={label} className="rounded-xl bg-white/6 border border-white/8 px-3 py-2.5 text-center">
                          <p className="text-lg font-black text-white leading-none">{value}</p>
                          <p className="text-[9px] font-bold text-white/35 uppercase tracking-wider mt-1">{label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {passport.isVerified ? (
                          <span className="flex items-center gap-1.5 rounded-full bg-pine-teal/20 border border-pine-teal/30 px-3 py-1.5 text-[10px] font-black text-pine-teal">
                            <FaCheckCircle className="text-[9px]" /> KYC Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 rounded-full bg-white/8 border border-white/10 px-3 py-1.5 text-[10px] font-bold text-white/40">
                            Unverified
                          </span>
                        )}
                        {passport.eligible ? (
                          <span className="rounded-full bg-pine-teal/20 border border-pine-teal/30 px-3 py-1.5 text-[10px] font-black text-pine-teal">Eligible</span>
                        ) : (
                          <span className="rounded-full bg-amber-400/15 border border-amber-400/25 px-3 py-1.5 text-[10px] font-black text-amber-400">
                            Eligible in {passport.daysUntilEligible}d
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent donations */}
                {passport.recentDonations?.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-pine-teal/40 mb-2">Recent Activity</p>
                    {passport.recentDonations.map((d, i) => (
                      <div key={d._id || i} className="flex items-center gap-3 rounded-xl border border-pine-teal/8 bg-surface-2 px-4 py-3">
                        <div className="h-8 w-8 shrink-0 rounded-xl bg-dark-raspberry/10 flex items-center justify-center">
                          <FaTint className="text-[10px] text-dark-raspberry" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-pine-teal truncate">{d.title}</p>
                          <p className="text-[11px] text-pine-teal/40">{new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                        </div>
                        {d.bloodGroup && (
                          <span className="shrink-0 text-[11px] font-black text-dark-raspberry">{d.bloodGroup}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <motion.button whileTap={{ scale: 0.97 }} onClick={sharePassport}
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-pine-teal py-3.5 text-[12px] font-black uppercase tracking-widest text-white shadow-md">
                  <FaShareAlt className="text-xs" /> Share My Passport
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Profile;
