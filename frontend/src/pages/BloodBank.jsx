import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { FaTint, FaExclamationTriangle, FaMapMarkerAlt, FaPhoneAlt, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../utils/api";

const springIn = { type: "spring", stiffness: 300, damping: 26 };

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: springIn },
};

const BloodBank = () => {
  const { user } = useContext(AuthContext);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [activeTab,     setActiveTab]     = useState("All");
  const [loading,       setLoading]       = useState(true);
  const [locating,      setLocating]      = useState(false);

  const bloodGroups = ["All", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

  const fetchBloodRequests = async (lat = null, lng = null) => {
    try {
      setLoading(true);
      let url = "/donations/blood-donors";
      if (lat && lng) url += `?lat=${lat}&lng=${lng}`;
      const { data } = await api.get(url);
      setBloodRequests(data);
    } catch {
      toast.error("Failed to load the blood bank feed");
    } finally {
      setLoading(false);
      setLocating(false);
    }
  };

  useEffect(() => {
    if (user) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchBloodRequests(pos.coords.latitude, pos.coords.longitude),
        () => fetchBloodRequests(),
      );
    }
  }, [user]);

  const handleFindNearMe = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchBloodRequests(pos.coords.latitude, pos.coords.longitude);
        toast.success("Feed updated with nearest requests!");
      },
      () => { setLocating(false); toast.error("Location access denied."); },
    );
  };

  const handleRespond = async (id) => {
    if (window.confirm("Commit to this blood request? Your contact info will be shared.")) {
      try {
        await api.put(`/donations/${id}`, { status: "accepted" });
        toast.success("Thank you! Please check your Dashboard for contact details.");
        setBloodRequests(bloodRequests.filter((d) => d._id !== id));
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to respond to request");
      }
    }
  };

  const filtered = bloodRequests.filter((d) => activeTab === "All" ? true : d.bloodGroup === activeTab);

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
            className="relative z-10 text-center"
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className="mb-3"
            >
              <FaTint className="text-blazing-flame text-4xl mx-auto drop-shadow-[0_0_20px_rgba(138,111,176,0.8)]" />
            </motion.div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
              Sahayam<br />
              <span className="gradient-text-aurora">Blood.</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mt-2">Emergency Transfusion Network</p>
          </motion.div>

          {/* Filter chips */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ...springIn }}
            className="relative z-10 mt-5 overflow-x-auto no-scrollbar"
          >
            <div className="flex gap-2 min-w-max px-1 pb-1">
              {bloodGroups.map((tab) => (
                <motion.button
                  key={tab}
                  whileTap={{ scale: 0.88 }}
                  transition={springIn}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-4 py-2 rounded-xl font-black text-xs tracking-widest uppercase transition-all ${
                    activeTab === tab
                      ? "bg-blazing-flame text-white shadow-[0_0_20px_rgba(138,111,176,0.5)]"
                      : "bg-white/10 text-white/60 border border-white/15 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="bloodGroupBg"
                      className="absolute inset-0 rounded-xl bg-blazing-flame"
                      transition={springIn}
                    />
                  )}
                  <span className="relative z-10">{tab}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── CONTENT ── */}
        <div className="-mt-10 px-4">
          {/* Near me button */}
          <div className="flex justify-end mb-4">
            <motion.button
              whileTap={{ scale: 0.93 }}
              transition={springIn}
              onClick={handleFindNearMe}
              disabled={locating}
              className="flex items-center gap-2 bg-surface border border-pine-teal/15 text-pine-teal px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-surface-2 transition disabled:opacity-50"
            >
              {locating ? <FaSpinner className="animate-spin" /> : <><FaMapMarkerAlt /> Near Me</>}
            </motion.button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <FaSpinner className="animate-spin text-3xl text-blazing-flame" />
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <FaTint className="text-4xl text-dusty-lavender/30 mb-4" />
              <p className="text-lg font-black text-pine-teal">No matching requests</p>
              <p className="text-sm text-dusty-lavender/60 mt-2">Try a different blood group filter.</p>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants} initial="hidden" animate="show"
              className="space-y-3"
            >
              <AnimatePresence>
                {filtered.map((d) => (
                  <motion.div
                    key={d._id}
                    variants={cardVariants}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-surface rounded-3xl border p-5 relative overflow-hidden shadow-sm ${
                      d.isEmergency
                        ? "border-blazing-flame/30 shadow-[0_0_20px_rgba(138,111,176,0.12)]"
                        : "border-pine-teal/8"
                    }`}
                  >
                    {d.isEmergency && (
                      <div className="absolute top-0 right-0 px-4 py-1.5 bg-blazing-flame text-white font-black text-[9px] uppercase tracking-widest rounded-bl-2xl flex items-center gap-1.5">
                        <FaExclamationTriangle className="animate-pulse" /> Urgent
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-4">
                      <motion.div
                        initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={springIn}
                        className="w-16 h-16 rounded-2xl bg-blazing-flame/10 border border-blazing-flame/25 flex items-center justify-center text-blazing-flame font-black text-2xl shadow-inner shrink-0"
                      >
                        {d.bloodGroup}
                      </motion.div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-dusty-lavender mb-0.5">Required</p>
                        <h3 className="text-pine-teal font-black text-xl leading-tight">{d.quantity}</h3>
                      </div>
                    </div>

                    <p className="text-pine-teal/70 font-medium text-sm mb-4 line-clamp-2 leading-relaxed">
                      {d.description}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-dusty-lavender text-xs">
                        <FaMapMarkerAlt className="mt-0.5 shrink-0 text-dark-raspberry" />
                        <span className="text-pine-teal font-bold leading-snug">
                          {d.location?.formattedAddress || "Location hidden until accepted"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-dusty-lavender text-xs">
                        <FaPhoneAlt className="shrink-0 text-dark-raspberry" />
                        <span className="text-pine-teal font-bold">{d.donor?.name || "Unknown Requestor"}</span>
                      </div>
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      transition={springIn}
                      onClick={() => handleRespond(d._id)}
                      className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all uppercase tracking-widest text-white ${
                        d.isEmergency
                          ? "bg-blazing-flame shadow-[0_8px_20px_rgba(138,111,176,0.35)]"
                          : "bg-pine-teal shadow-[0_8px_20px_rgba(59,107,84,0.25)]"
                      }`}
                    >
                      <FaTint /> Respond Now
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BloodBank;
