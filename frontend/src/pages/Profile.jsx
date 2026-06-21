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
    className="flex items-center gap-3 rounded-2xl border border-pine-teal/10 bg-surface px-4 py-3 shrink-0 shadow-sm"
  >
    <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-pine-teal/8">
      <Icon className={`text-sm ${color}`} />
    </div>
    <div>
      <p className={`text-xl font-black leading-none ${color}`}>{value}</p>
      <p className="text-[10px] font-bold text-pine-teal/45 mt-0.5 uppercase tracking-wider">{label}</p>
    </div>
  </motion.div>
);

const SectionHeader = ({ title }) => (
  <div className="px-5 py-4 border-b border-pine-teal/8">
    <h3 className="font-display text-[15px] font-semibold text-pine-teal">{title}</h3>
  </div>
);

const Profile = () => {
  const { user, login, logout, toggleAvailability, enableNotifications } = useContext(AuthContext);
  const navigate = useNavigate();

  const [stats,              setStats]              = useState({ totalDonations: 0, activeListings: 0, bloodDonations: 0 });
  const [kycFile,            setKycFile]            = useState(null);
  const [kycType,            setKycType]            = useState("aadhaar");
  const [kycUploading,       setKycUploading]       = useState(false);
  const [loading,            setLoading]            = useState(true);
  const [isEditing,          setIsEditing]          = useState(false);
  const [isFetchingLocation, setFetchingLocation]   = useState(false);
  const formatPhoneDisplay = (stored) => {
    if (!stored || stored === "Not Provided") return stored || "";
    const digits = stored.replace(/\D/g, "");
    const ten = digits.length === 12 ? digits.slice(2) : digits;
    return ten.length === 10 ? `+91 ${ten.slice(0, 5)} ${ten.slice(5)}` : stored;
  };

  const [formData,           setFormData]           = useState({
    name: user?.name || "", bloodGroup: user?.bloodGroup || "",
    phone: (user?.phone || "").replace(/^\+91/, ""), addressText: user?.addressText || "",
  });

  // New feature state
  const [rarity,           setRarity]           = useState(null);   // { count, bloodGroup }
  const [passport,         setPassport]         = useState(null);
  const [passportOpen,     setPassportOpen]     = useState(false);
  const [offlineDonating,  setOfflineDonating]  = useState(false);
  const [offlineDate,      setOfflineDate]      = useState("");
  const [savingNotifPrefs, setSavingNotifPrefs] = useState(false);
  const [notifPrefs,       setNotifPrefs]       = useState({
    emergencyNearby: true, campReminders: true, weeklyDigest: true, requestApproved: true,
  });
  const [myHistory,        setMyHistory]        = useState([]);
  const [relistingId,      setRelistingId]      = useState(null);
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
      phone: (user?.phone || "").replace(/^\+91/, ""), addressText: user?.addressText || "",
    });
    if (user?.notificationPrefs) {
      setNotifPrefs((p) => ({ ...p, ...user.notificationPrefs }));
    }

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

        const data = Array.isArray(histRes?.data) ? histRes.data : [];
        const active = data.filter((d) => d.status === "available" || d.status === "pending").length;
        const blood  = data.filter((d) => d.category === "blood").length;
        setStats({ totalDonations: data.length, activeListings: active, bloodDonations: blood });
        setMyHistory(data.filter((d) => {
          const dId = d.donorId?._id || d.donorId;
          return String(dId) === String(user?._id);
        }).slice(0, 10));

        if (rarityRes?.data) setRarity(rarityRes.data);
        if (passportRes?.data) {
          const p = passportRes.data;
          if (!Array.isArray(p.recentDonations)) p.recentDonations = [];
          if (!Array.isArray(p.thanksReceived)) p.thanksReceived = [];
          setPassport(p);
          setThanksReceived(p.thanksReceived);
        }
        if (netRes?.data) {
          const net = Array.isArray(netRes.data) ? netRes.data : [];
          setSafetyNet(net);
          setContacts(net);
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

  const handleKYCSubmit = async () => {
    if (!kycFile) return toast.error("Select a document image first.");
    setKycUploading(true);
    try {
      const fd = new FormData();
      fd.append("document", kycFile);
      fd.append("documentType", kycType);
      await api.post("/auth/kyc", fd);
      toast.success("KYC submitted! We'll verify within 48 hours.");
      setKycFile(null);
      login({ ...user, kycStatus: { ...user.kycStatus, kycSubmittedAt: new Date().toISOString(), documentType: kycType } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed.");
    } finally {
      setKycUploading(false);
    }
  };

  const handleLogOfflineDonation = async () => {
    setOfflineDonating(true);
    try {
      const body = offlineDate ? { donationDate: offlineDate } : {};
      const { data } = await api.post("/auth/log-offline-donation", body);
      login(data);
      setOfflineDate("");
      toast.success("Offline donation logged! Cooldown started.");
      // Refresh passport
      const passRes = await api.get("/auth/donor-passport").catch(() => null);
      if (passRes?.data) setPassport(passRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to log donation.");
    } finally {
      setOfflineDonating(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Delete your account permanently?\n\nThis erases your profile, donations, SOS requests, chats and history. It cannot be undone.",
    );
    if (!confirmed) return;
    const tid = toast.loading("Deleting your account…");
    try {
      await api.delete("/auth/me");
      toast.success("Your account and data have been deleted.", { id: tid });
      logout();
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete account.", { id: tid });
    }
  };

  const handleTestPush = async () => {
    const tid = toast.loading("Sending a test notification…");
    try {
      const { data } = await api.post("/auth/test-push");
      toast.success(
        data.ok ? "Sent! Watch for the notification on this device." : "Sent.",
        { id: tid },
      );
    } catch (err) {
      const d = err.response?.data;
      toast.error(d?.error ? `FCM: ${d.error}` : (d?.message || "Test push failed."), { id: tid });
    }
  };

  const handleRelist = async (donationId) => {
    setRelistingId(donationId);
    try {
      await api.post(`/donations/${donationId}/relist`);
      toast.success("Re-listed! It's live again.");
      setMyHistory((p) => p.map((d) => d._id === donationId ? { ...d, _relisted: true } : d));
    } catch (err) {
      toast.error(err.response?.data?.message || "Re-list failed.");
    } finally {
      setRelistingId(null);
    }
  };

  const handleSaveNotifPrefs = async (updated) => {
    setSavingNotifPrefs(true);
    try {
      await api.put("/auth/notification-prefs", updated);
      toast.success("Preferences saved.");
    } catch {
      toast.error("Failed to save preferences.");
    } finally {
      setSavingNotifPrefs(false);
    }
  };

  const generateCertificate = () => {
    const count = passport?.donationsCount || user?.donationsCount || 0;
    const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Donation Certificate — Sahayam</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;600;800&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#f5f0eb;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:32px;font-family:'Inter',sans-serif}
  .cert{background:#fff;max-width:760px;width:100%;border:3px solid #3b6b54;border-radius:18px;padding:64px 72px;text-align:center;position:relative;box-shadow:0 32px 80px -16px rgba(59,107,84,0.25)}
  .cert::before{content:'';position:absolute;inset:12px;border:1px solid rgba(167,60,100,0.3);border-radius:10px;pointer-events:none}
  .brand{font-size:30px;font-weight:900;color:#3b6b54;letter-spacing:-1px}.brand span{color:#a73c64}
  .divider{margin:6px auto 28px;font-size:10px;letter-spacing:5px;text-transform:uppercase;color:#a73c64}
  .presented{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#999;margin-bottom:10px}
  .name{font-family:'Playfair Display',serif;font-size:44px;color:#1a3a2a;margin-bottom:24px}
  .body-text{font-size:15px;color:#666;line-height:1.8;max-width:500px;margin:0 auto 28px}
  .badge{display:inline-block;background:linear-gradient(135deg,#a73c64,#6b1a3a);color:#fff;padding:12px 28px;border-radius:10px;font-size:24px;font-weight:900;margin-bottom:28px}
  .count{font-size:56px;font-weight:900;color:#a73c64;line-height:1}.count-label{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#aaa;margin-bottom:40px}
  .footer{border-top:1px dashed #e0ddd8;padding-top:20px;font-size:11px;color:#bbb;line-height:1.7}
</style></head><body>
<div class="cert">
  <div class="brand">Saha<span>yam</span></div>
  <div class="divider">Certificate of Recognition</div>
  <div class="presented">This is presented to</div>
  <div class="name">${user?.name || ""}</div>
  <div class="body-text">In recognition of extraordinary compassion and voluntary commitment to saving human lives through blood donation.</div>
  <div class="badge">${user?.bloodGroup || "—"}</div><br>
  <div class="count">${count}</div>
  <div class="count-label">${count === 1 ? "Donation" : "Donations"} Completed</div>
  <div class="footer">Issued on ${date} · Sahayam Community Blood Network<br><em>"Every drop counts. Every donor matters."</em></div>
</div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    window.open(URL.createObjectURL(blob), "_blank");
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

  const inputCls = "w-full rounded-xl border border-pine-teal/12 bg-pearl-beige px-4 py-3.5 text-sm font-medium text-pine-teal placeholder-pine-teal/40 outline-none focus:border-blazing-flame/60 focus:ring-2 focus:ring-blazing-flame/10 transition-all";
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

        {/* ── COVER HEADER ── */}
        <div className="relative px-4 pt-8 pb-20 bg-surface border-b border-pine-teal/8">
          <div className="mesh-bg absolute inset-0 opacity-50" />

          <div className="relative z-10 flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-pine-teal/40">Your Profile</p>
              <h1 className="text-2xl font-black text-pine-teal tracking-tight mt-0.5">{user.name?.split(" ")[0]}</h1>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <motion.button whileTap={{ scale: 0.88 }} onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 rounded-2xl border border-pine-teal/15 bg-pine-teal/8 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-pine-teal">
                  <FaEdit className="text-xs" /> Edit
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.88 }} onClick={() => { logout(); navigate("/"); }}
                className="md:hidden h-10 w-10 flex items-center justify-center rounded-2xl border border-pine-teal/12 bg-pine-teal/6 text-pine-teal/60">
                <FaSignOutAlt className="text-sm" />
              </motion.button>
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="relative mb-3">
              {user.profilePic ? (
                <img src={user.profilePic} alt="Profile" referrerPolicy="no-referrer"
                  className="w-24 h-24 rounded-3xl object-cover border-4 border-pine-teal/10 shadow-xl" />
              ) : (
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center bg-gradient-to-br from-dark-raspberry to-pine-teal text-white font-black text-4xl border-4 border-surface shadow-xl">
                  {user.name?.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-1.5 -right-1.5 bg-blazing-flame text-white h-8 w-8 rounded-xl flex items-center justify-center shadow-lg border-2 border-surface">
                <FaShieldAlt className="text-xs" />
              </div>
            </div>
            <h2 className="text-xl font-black text-pine-teal">{user.name}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-pine-teal/50">{(passport?.bloodGroup || user.bloodGroup) ? `${passport?.bloodGroup || user.bloodGroup} · Donor` : "Donor"}</span>
              {user.rating > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-yellow-400/15 border border-yellow-500/30 px-2 py-0.5 text-[10px] font-black text-yellow-600">
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
          <div className="rounded-3xl p-5 relative overflow-hidden bg-surface border border-pine-teal/10 shadow-sm">
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-pine-teal/40 mb-1">Your blood group</p>
                <p className="text-6xl font-black text-dark-raspberry tracking-tighter">{passport?.bloodGroup || user.bloodGroup || "—"}</p>
                {user.rank && (
                  <span className="inline-flex items-center gap-1 mt-1.5 rounded-full bg-pine-teal/8 border border-pine-teal/15 px-2.5 py-1 text-[10px] font-black text-pine-teal/70 uppercase tracking-widest">
                    <FaTrophy className="text-[9px] text-yellow-500" /> {user.rank}
                  </span>
                )}
              </div>
              <div className="text-right space-y-2">
                <motion.button whileTap={{ scale: 0.9 }} onClick={toggleAvailability}
                  className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-[11px] font-black uppercase tracking-widest transition-all ${
                    user.isAvailable
                      ? "border-pine-teal/40 bg-pine-teal/15 text-pine-teal"
                      : "border-pine-teal/15 bg-pine-teal/5 text-pine-teal/50"
                  }`}>
                  {user.isAvailable
                    ? <><FaToggleOn className="text-base text-pine-teal" /> On-duty</>
                    : <><FaToggleOff className="text-base" /> Snoozed</>}
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPassportOpen(true)}
                  className="flex items-center gap-2 rounded-2xl border border-pine-teal/15 bg-pine-teal/5 px-4 py-2.5 text-[11px] font-black uppercase tracking-widest text-pine-teal/70">
                  <FaPassport className="text-xs" /> Passport
                </motion.button>
              </div>
            </div>
            <div className="pointer-events-none absolute -bottom-8 -right-8 text-dark-raspberry/5">
              <FaTint className="text-[120px]" />
            </div>
          </div>

          {/* ── LOG OFFLINE DONATION ── */}
          <div className="rounded-3xl overflow-hidden bg-surface border border-pine-teal/8 shadow-sm">
            <SectionHeader title="Log Offline Donation" />
            <div className="p-4 space-y-3">
              <p className="text-[12px] text-pine-teal/50 leading-relaxed">
                Donated blood outside the app? Log it here to update your 90-day cooldown.
              </p>
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-dusty-lavender">
                  Donation date (leave blank for today)
                </label>
                <input type="date" value={offlineDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setOfflineDate(e.target.value)}
                  className="w-full rounded-xl border border-pine-teal/15 bg-surface-2 px-4 py-3 text-sm text-pine-teal outline-none focus:border-pine-teal/40" />
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogOfflineDonation}
                disabled={offlineDonating}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-dark-raspberry py-3.5 text-[11px] font-black uppercase tracking-widest text-white shadow-sm disabled:opacity-50">
                {offlineDonating ? <FaSpinner className="animate-spin" /> : <><FaTint className="text-[10px]" /> I Donated Blood</>}
              </motion.button>
            </div>
          </div>

          {/* ── COOLDOWN COUNTDOWN + CERTIFICATE ── */}
          {passport && (
            <div className="rounded-3xl overflow-hidden bg-surface border border-pine-teal/8 shadow-sm">
              <SectionHeader title="Donor Status" />
              <div className="p-4 flex items-center gap-4">
                {/* Circular countdown arc */}
                <div className="shrink-0 relative">
                  {(() => {
                    const total = 90;
                    const remaining = passport.daysUntilEligible || 0;
                    const elapsed = total - remaining;
                    const pct = Math.min(elapsed / total, 1);
                    const r = 30;
                    const circ = 2 * Math.PI * r;
                    const dash = pct * circ;
                    return (
                      <svg width="76" height="76" viewBox="0 0 76 76">
                        <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(59,107,84,0.08)" strokeWidth="6" />
                        <circle cx="38" cy="38" r={r} fill="none"
                          stroke={passport.eligible ? "#3b6b54" : "#a73c64"}
                          strokeWidth="6"
                          strokeDasharray={`${dash} ${circ}`}
                          strokeLinecap="round"
                          transform="rotate(-90 38 38)"
                          style={{ transition: "stroke-dasharray 0.6s ease" }}
                        />
                        <text x="38" y="43" textAnchor="middle" fontSize="13" fontWeight="900"
                          fill={passport.eligible ? "#3b6b54" : "#a73c64"}>
                          {passport.eligible ? "OK" : `${remaining}d`}
                        </text>
                      </svg>
                    );
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  {passport.eligible ? (
                    <>
                      <p className="text-sm font-black text-pine-teal">Eligible to donate</p>
                      <p className="text-[12px] text-pine-teal/45 mt-0.5">Your 90-day cooldown has passed.</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-black text-dark-raspberry">Cooldown active</p>
                      <p className="text-[12px] text-pine-teal/45 mt-0.5">{passport.daysUntilEligible} days until next eligible donation</p>
                    </>
                  )}
                  <motion.button whileTap={{ scale: 0.95 }} onClick={generateCertificate}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl border border-pine-teal/20 bg-pine-teal/8 px-3.5 py-2 text-[11px] font-black uppercase tracking-widest text-pine-teal">
                    <FaCertificate className="text-[11px]" /> Download Certificate
                  </motion.button>
                </div>
              </div>
            </div>
          )}

          {/* ── POINTS REDEMPTION LADDER ── */}
          {(() => {
            const pts = user?.points || 0;
            const tiers = [
              { pts: 100,  label: "Bronze",   color: "from-amber-700 to-amber-500",   perk: "Community badge + profile verified" },
              { pts: 250,  label: "Silver",   color: "from-slate-500 to-slate-300",   perk: "Priority matching in SOS alerts" },
              { pts: 500,  label: "Gold",     color: "from-yellow-600 to-yellow-400", perk: "Gold donor badge + leaderboard" },
              { pts: 1000, label: "Platinum", color: "from-purple-700 to-purple-400", perk: "Exclusive discounts — coming soon" },
            ];
            const currentTier = [...tiers].reverse().find((t) => pts >= t.pts);
            return (
              <div className="rounded-3xl overflow-hidden bg-surface border border-pine-teal/8 shadow-sm">
                <div className="px-5 py-4 border-b border-pine-teal/8">
                  <h3 className="font-display text-[15px] font-semibold text-pine-teal">Points Ladder</h3>
                  <p className="text-[11px] text-pine-teal/40 mt-0.5">You have <span className="font-black text-pine-teal">{pts}</span> points</p>
                </div>
                <div className="p-4 space-y-2.5">
                  {tiers.map((t) => {
                    const unlocked = pts >= t.pts;
                    const isCurrent = currentTier?.label === t.label;
                    return (
                      <div key={t.label} className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all ${
                        isCurrent
                          ? "border-pine-teal/30 bg-pine-teal/8"
                          : unlocked
                          ? "border-pine-teal/12 bg-surface-2"
                          : "border-pine-teal/6 bg-surface-2 opacity-50"
                      }`}>
                        <div className={`shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center shadow-sm`}>
                          <FaTrophy className="text-white text-xs" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] font-black text-pine-teal">{t.label}</p>
                            {isCurrent && <span className="text-[9px] font-black uppercase tracking-widest text-pine-teal bg-pine-teal/15 rounded-full px-2 py-0.5">Current</span>}
                          </div>
                          <p className="text-[11px] text-pine-teal/45 mt-0.5">{t.perk}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[11px] font-black text-pine-teal/60">{t.pts} pts</p>
                          {unlocked
                            ? <FaCheckCircle className="text-pine-teal text-sm ml-auto mt-0.5" />
                            : <p className="text-[10px] text-pine-teal/30 font-semibold mt-0.5">+{t.pts - pts}</p>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

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
                <h3 className="font-display text-[15px] font-semibold text-pine-teal">Family Safety Net</h3>
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
                    <div key={i} className="rounded-2xl border border-pine-teal/10 bg-pearl-beige p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-pine-teal/45">Contact {i + 1}</span>
                        <button onClick={() => setDraftContacts((p) => p.filter((_, idx) => idx !== i))}
                          className="h-6 w-6 flex items-center justify-center rounded-full text-pine-teal/40 hover:text-blazing-flame transition-colors">
                          <FaTrash className="text-[9px]" />
                        </button>
                      </div>
                      <input type="text" placeholder="Name" value={c.name || ""} onChange={(e) => setDraftContacts((p) => p.map((x, idx) => idx === i ? { ...x, name: e.target.value } : x))}
                        className="w-full rounded-xl border border-pine-teal/12 bg-pearl-beige px-3 py-2.5 text-sm text-pine-teal placeholder-pine-teal/40 outline-none focus:border-blazing-flame/40" />
                      <div className="grid grid-cols-2 gap-2">
                        <select value={c.relation || ""} onChange={(e) => setDraftContacts((p) => p.map((x, idx) => idx === i ? { ...x, relation: e.target.value } : x))}
                          className="rounded-xl border border-pine-teal/12 bg-pearl-beige px-3 py-2.5 text-sm text-pine-teal outline-none focus:border-blazing-flame/40 appearance-none cursor-pointer">
                          <option value="" className="bg-[#0a1f1a]">Relation</option>
                          {RELATIONS.map((r) => <option key={r} value={r} className="bg-[#0a1f1a]">{r}</option>)}
                        </select>
                        <select value={c.bloodGroup || ""} onChange={(e) => setDraftContacts((p) => p.map((x, idx) => idx === i ? { ...x, bloodGroup: e.target.value } : x))}
                          className="rounded-xl border border-pine-teal/12 bg-pearl-beige px-3 py-2.5 text-sm text-pine-teal outline-none focus:border-blazing-flame/40 appearance-none cursor-pointer">
                          <option value="" className="bg-[#0a1f1a]">Blood Group</option>
                          {BLOOD_GROUPS.map((g) => <option key={g} value={g} className="bg-[#0a1f1a]">{g}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                  {draftContacts.length < 5 && (
                    <button onClick={() => setDraftContacts((p) => [...p, { name: "", relation: "", bloodGroup: "", phone: "" }])}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-dashed border-pine-teal/25 py-3 text-[12px] font-bold text-pine-teal/45 hover:text-pine-teal/70 hover:border-pine-teal/40 transition-colors">
                      <FaPlus className="text-[10px]" /> Add family member
                    </button>
                  )}
                  <div className="flex gap-2 pt-1">
                    <motion.button whileTap={{ scale: 0.95 }} onClick={() => setEditingContacts(false)}
                      className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl border border-pine-teal/12 bg-pearl-beige text-pine-teal/60">
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
              <h3 className="font-display text-[15px] font-semibold text-pine-teal">Details</h3>
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
                    { icon: FaPhone,       value: formatPhoneDisplay(user.phone) || "Not set", label: "Phone" },
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
                  {/* Name */}
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-pine-teal/45">Full Name</label>
                    <input type="text" value={formData.name} placeholder="Your name" required
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      className={inputCls} />
                  </div>
                  {/* Phone */}
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-pine-teal/45">Phone</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-pine-teal/40 select-none pointer-events-none">+91</span>
                      <input type="tel" inputMode="numeric" placeholder="9XXXXXXXXX" maxLength={10}
                        value={formData.phone}
                        onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                        className={`${inputCls} pl-10 pr-12 ${
                          formData.phone.length > 0
                            ? /^[6-9]\d{9}$/.test(formData.phone) ? "border-pine-teal/50" : "border-dark-raspberry/40"
                            : ""
                        }`} />
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tabular-nums ${
                        formData.phone.length === 10 ? "text-pine-teal/60" : "text-pine-teal/30"
                      }`}>{formData.phone.length}/10</span>
                    </div>
                    {formData.phone.length > 0 && !/^[6-9]\d{9}$/.test(formData.phone) && (
                      <p className="mt-1 text-[10px] text-dark-raspberry/70 font-medium">
                        {formData.phone.length < 10 ? `${10 - formData.phone.length} more digit${10 - formData.phone.length !== 1 ? "s" : ""} needed` : "Must start with 6, 7, 8, or 9"}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-pine-teal/45">Blood Group</label>
                    <select value={formData.bloodGroup}
                      onChange={(e) => setFormData((p) => ({ ...p, bloodGroup: e.target.value }))}
                      className={inputCls + " appearance-none cursor-pointer"}>
                      <option value="" className="bg-[#0a1f1a]">Select</option>
                      {BLOOD_GROUPS.map((g) => <option key={g} value={g} className="bg-[#0a1f1a]">{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-pine-teal/45">Location</label>
                    <div className="flex gap-2">
                      <input type="text" value={formData.addressText} placeholder="City / Area"
                        onChange={(e) => setFormData((p) => ({ ...p, addressText: e.target.value }))}
                        className={inputCls} />
                      <motion.button type="button" whileTap={{ scale: 0.85 }}
                        onClick={handleGetLocation} disabled={isFetchingLocation}
                        className="h-[52px] w-[52px] shrink-0 flex items-center justify-center rounded-xl border border-pine-teal/12 bg-pearl-beige text-pine-teal/60 disabled:opacity-50">
                        {isFetchingLocation ? <FaSpinner className="animate-spin" /> : <FaLocationArrow />}
                      </motion.button>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => setIsEditing(false)}
                      className="h-12 w-12 shrink-0 flex items-center justify-center rounded-xl border border-pine-teal/12 bg-pearl-beige text-pine-teal/60">
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

          {/* ── KYC VERIFICATION ── */}
          <div className="rounded-3xl overflow-hidden bg-surface border border-pine-teal/8 shadow-sm">
            <div className="px-5 py-4 border-b border-pine-teal/8 flex items-center justify-between">
              <div>
                <h3 className="font-display text-[15px] font-semibold text-pine-teal">Identity Verification</h3>
                <p className="text-[11px] text-pine-teal/40 mt-0.5">Verified donors get priority matching in SOS alerts</p>
              </div>
              {user.kycStatus?.documentVerified && (
                <span className="flex items-center gap-1.5 rounded-full bg-pine-teal/12 border border-pine-teal/25 px-3 py-1.5 text-[10px] font-black text-pine-teal">
                  <FaCheckCircle className="text-[9px]" /> Verified
                </span>
              )}
            </div>
            <div className="p-4">
              {user.kycStatus?.documentVerified ? (
                <div className="flex items-center gap-3 rounded-2xl border border-pine-teal/15 bg-pine-teal/5 px-4 py-3.5">
                  <FaUserShield className="text-pine-teal text-lg shrink-0" />
                  <div>
                    <p className="text-sm font-black text-pine-teal">KYC Verified</p>
                    <p className="text-[11px] text-pine-teal/45 mt-0.5">Your {user.kycStatus.documentType?.replace("_", " ")} has been verified</p>
                  </div>
                </div>
              ) : user.kycStatus?.kycSubmittedAt && !user.kycStatus?.documentVerified ? (
                <div className="flex items-center gap-3 rounded-2xl border border-amber-400/25 bg-amber-50/60 px-4 py-3.5">
                  <FaShieldAlt className="text-amber-500 text-lg shrink-0" />
                  <div>
                    <p className="text-sm font-black text-amber-700">Under review</p>
                    <p className="text-[11px] text-amber-600/70 mt-0.5">Submitted {new Date(user.kycStatus.kycSubmittedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short" })} · up to 48h</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-dusty-lavender">Document type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[["aadhaar","Aadhaar"],["passport","Passport"],["driving_license","Driving Lic."]].map(([val, lbl]) => (
                        <button key={val} type="button" onClick={() => setKycType(val)}
                          className={`rounded-xl border py-2.5 text-[11px] font-bold transition-all ${
                            kycType === val
                              ? "border-pine-teal bg-pine-teal/10 text-pine-teal"
                              : "border-border bg-surface-2 text-pine-teal/50"
                          }`}>
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-dusty-lavender">Upload document image</label>
                    <label className={`flex items-center gap-3 rounded-2xl border cursor-pointer px-4 py-3.5 transition-all ${
                      kycFile ? "border-pine-teal/30 bg-pine-teal/5" : "border-dashed border-pine-teal/20 bg-surface-2 hover:border-pine-teal/35"
                    }`}>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => setKycFile(e.target.files[0] || null)} />
                      <FaUserShield className="text-pine-teal/40 text-lg shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-pine-teal/70 truncate">
                          {kycFile ? kycFile.name : "Tap to select image"}
                        </p>
                        <p className="text-[10px] text-pine-teal/35">JPG, PNG · max 10MB</p>
                      </div>
                    </label>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleKYCSubmit}
                    disabled={kycUploading || !kycFile}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-pine-teal py-3.5 text-[11px] font-black uppercase tracking-widest text-white shadow-teal disabled:opacity-40">
                    {kycUploading ? <FaSpinner className="animate-spin" /> : <><FaShieldAlt /> Submit for Verification</>}
                  </motion.button>
                  <p className="text-[10px] text-pine-teal/30 text-center">Documents are encrypted and never shared with third parties</p>
                </div>
              )}
            </div>
          </div>

          {/* ── NOTIFICATION PREFERENCES ── */}
          <div className="rounded-3xl overflow-hidden bg-surface border border-pine-teal/8 shadow-sm">
            <div className="px-5 py-4 border-b border-pine-teal/8 flex items-center justify-between">
              <h3 className="font-display text-[15px] font-semibold text-pine-teal">Notification Preferences</h3>
              <div className="flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleTestPush}
                  className="shrink-0 rounded-xl border border-pine-teal/15 px-3 py-2 text-[11px] font-black text-pine-teal/70 uppercase tracking-wide hover:bg-pine-teal/5 transition-colors">
                  Send Test
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={enableNotifications}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl border border-pine-teal/20 bg-pine-teal/8 px-3 py-2 text-[11px] font-black text-pine-teal uppercase tracking-wide">
                  <FaBell className="text-[10px]" /> Enable Push
                </motion.button>
              </div>
            </div>
            <div className="p-4 space-y-2.5">
              {[
                { key: "emergencyNearby", label: "Emergency nearby",   desc: "Alerts when someone near you needs blood" },
                { key: "requestApproved", label: "Request approved",   desc: "When a donor matches your request" },
                { key: "campReminders",   label: "Camp reminders",      desc: "Upcoming blood camps in your area" },
                { key: "weeklyDigest",    label: "Weekly digest",       desc: "Community stats every Sunday" },
              ].map(({ key, label, desc }) => {
                const on = notifPrefs[key] ?? true;
                return (
                  <div key={key} className="flex items-center justify-between gap-3 rounded-2xl border border-pine-teal/8 bg-surface-2 px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-pine-teal">{label}</p>
                      <p className="text-[11px] text-pine-teal/40 mt-0.5">{desc}</p>
                    </div>
                    <motion.button whileTap={{ scale: 0.85 }} disabled={savingNotifPrefs}
                      onClick={() => {
                        const updated = { ...notifPrefs, [key]: !on };
                        setNotifPrefs(updated);
                        handleSaveNotifPrefs(updated);
                      }}
                      className={`shrink-0 transition-colors disabled:opacity-50 ${on ? "text-pine-teal" : "text-pine-teal/25"}`}>
                      {on ? <FaToggleOn className="text-2xl" /> : <FaToggleOff className="text-2xl" />}
                    </motion.button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── MY POSTS (with re-list) ── */}
          {myHistory.length > 0 && (
            <div className="rounded-3xl overflow-hidden bg-surface border border-pine-teal/8 shadow-sm">
              <SectionHeader title="My Posts" />
              <div className="p-4 space-y-2.5">
                {myHistory.map((d) => {
                  const canRelist = (d.status === "expired" || d.status === "fulfilled") && !d._relisted;
                  const statusColor = {
                    active: "text-pine-teal bg-pine-teal/10 border-pine-teal/20",
                    pending: "text-amber-600 bg-amber-50 border-amber-300/40",
                    fulfilled: "text-pine-teal/50 bg-pine-teal/5 border-pine-teal/10",
                    expired: "text-dusty-lavender bg-dusty-lavender/8 border-dusty-lavender/20",
                  }[d.status] || "text-pine-teal/50 bg-surface-2 border-pine-teal/10";
                  return (
                    <div key={d._id} className="flex items-center gap-3 rounded-2xl border border-pine-teal/8 bg-surface-2 px-4 py-3">
                      <div className="shrink-0 h-9 w-9 rounded-xl bg-dark-raspberry/10 border border-dark-raspberry/15 flex items-center justify-center">
                        <span className="text-[11px] font-black text-dark-raspberry">{d.bloodGroup || "—"}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold text-pine-teal truncate">{d.title}</p>
                        <span className={`inline-block mt-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border px-2 py-0.5 ${statusColor}`}>
                          {d.status}
                        </span>
                      </div>
                      {canRelist && (
                        <motion.button whileTap={{ scale: 0.9 }} disabled={relistingId === d._id}
                          onClick={() => handleRelist(d._id)}
                          className="shrink-0 flex items-center gap-1 rounded-xl border border-dark-raspberry/25 bg-dark-raspberry/8 px-3 py-2 text-[11px] font-black text-dark-raspberry disabled:opacity-50">
                          {relistingId === d._id ? <FaSpinner className="animate-spin text-[10px]" /> : <><FaPlus className="text-[9px]" /> Re-list</>}
                        </motion.button>
                      )}
                      {d._relisted && (
                        <span className="shrink-0 text-[10px] font-bold text-pine-teal flex items-center gap-1">
                          <FaCheckCircle className="text-[9px]" /> Live
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

          {/* ── DANGER ZONE: delete account (right to erasure) ── */}
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-blazing-flame/30 py-3.5 text-[11px] font-black uppercase tracking-widest text-blazing-flame/80 hover:bg-blazing-flame/8 transition-colors">
            <FaTrash className="text-xs" /> Delete My Account
          </button>

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
