import { useState, useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserPlus, FaEnvelope, FaLock, FaPhone, FaTint,
  FaShieldAlt, FaCheck, FaSpinner, FaArrowRight, FaHeartbeat,
} from "react-icons/fa";
import toast from "react-hot-toast";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";
import logo from "../assets/logo.png";
import PolicyModal from "../components/PolicyModal";

const ROLES = [
  { id: "donor",    label: "Donor",       desc: "Give blood, food, or supplies",    color: "blazing-flame",  gradient: "from-[#8a6fb0] to-[#6e4fa0]" },
  { id: "receiver", label: "Receiver",    desc: "Request help from your community", color: "dark-raspberry", gradient: "from-[#6e4fa0] to-[#5e4585]" },
  { id: "ngo",      label: "Institution", desc: "Coordinate large-scale aid",       color: "pine-teal",      gradient: "from-[#3b6b54] to-[#2d5343]" },
];

const springIn = { type: "spring", stiffness: 300, damping: 26 };

const inputBase =
  "w-full rounded-xl border bg-white/8 px-4 py-3.5 text-sm font-medium text-white placeholder-white/30 outline-none transition-all";

const Register = () => {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || "";

  const [formData, setFormData] = useState({
    name: "", email: "", password: "", phone: "", bloodGroup: "", organizationName: "",
  });
  const [activeRole,     setActiveRole]     = useState("donor");
  const [isLoading,      setIsLoading]      = useState(false);
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [showPolicy,     setShowPolicy]     = useState(false);

  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();

  const role = ROLES.find((r) => r.id === activeRole);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToPolicy) return toast.error("Please agree to Terms & Privacy Policy first.");
    setIsLoading(true);
    try {
      const payload = { ...formData, activeRole, refCode };
      if (!payload.bloodGroup) delete payload.bloodGroup;
      const { data } = await api.post("/auth/register", payload);
      login(data);
      toast.success("Welcome to Sahayam!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const borderColor =
    activeRole === "donor"    ? "border-blazing-flame/50  focus:border-blazing-flame  focus:ring-blazing-flame/10" :
    activeRole === "receiver" ? "border-dark-raspberry/50 focus:border-dark-raspberry focus:ring-dark-raspberry/10" :
                                "border-pine-teal/50      focus:border-pine-teal      focus:ring-pine-teal/10";

  const accentGlow =
    activeRole === "donor"    ? "shadow-[0_0_28px_rgba(138,111,176,0.35)]" :
    activeRole === "receiver" ? "shadow-[0_0_28px_rgba(110,79,160,0.35)]" :
                                "shadow-[0_0_28px_rgba(59,107,84,0.45)]";

  return (
    <main className="min-h-screen aurora-bg flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden selection:bg-white/20 selection:text-white">

      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-blazing-flame/10 blur-[100px] float-slow" />
        <div className="absolute top-1/2 -right-24 h-72 w-72 rounded-full bg-dark-raspberry/12 blur-[100px] float-delay" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-pine-teal/15 blur-[80px] float-gentle" />
        <div className="dark-dot-grid absolute inset-0 opacity-25" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.img
              whileHover={{ scale: 1.1, rotate: -5 }}
              src={logo} alt="Sahayam"
              className="h-9 w-auto drop-shadow-[0_0_14px_rgba(138,111,176,0.45)]"
            />
            <span className="font-display text-2xl font-semibold italic tracking-tightest text-white">
              Saha<span className="text-blazing-flame">yam</span>
            </span>
          </Link>
        </div>

        {/* Role selector */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <motion.button
              key={r.id}
              type="button"
              whileTap={{ scale: 0.93 }}
              onClick={() => setActiveRole(r.id)}
              className={`relative overflow-hidden rounded-2xl border px-3 py-3.5 text-center transition-all ${
                activeRole === r.id
                  ? `border-white/20 bg-gradient-to-br ${r.gradient} text-white ${accentGlow}`
                  : "border-white/10 bg-white/5 text-white/50 hover:bg-white/8 hover:text-white/80"
              }`}
            >
              {activeRole === r.id && (
                <motion.div
                  layoutId="roleHighlight"
                  className="absolute inset-0 bg-white/10 rounded-2xl"
                  transition={springIn}
                />
              )}
              <p className="relative text-[11px] font-black uppercase tracking-widest">{r.label}</p>
              <p className="relative text-[9px] font-medium mt-0.5 opacity-75 leading-tight">{r.desc}</p>
            </motion.button>
          ))}
        </div>

        {/* Form card */}
        <div className="glass-dark rounded-3xl p-6 border border-white/10">
          <div className="mb-5">
            <h2 className="text-xl font-black text-white tracking-tight">Create your account</h2>
            <p className="text-[11px] font-medium text-white/40 mt-0.5">Join thousands making a difference</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">
                {activeRole === "ngo" ? "Representative Name" : "Full Name"} *
              </label>
              <input
                required type="text"
                placeholder={activeRole === "ngo" ? "Dr. Priya Sharma" : "Arjun Mehta"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`${inputBase} border ${borderColor} focus:ring-2`}
              />
            </div>

            {/* Org name (NGO only) */}
            <AnimatePresence>
              {activeRole === "ngo" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Organization / Hospital *</label>
                  <input
                    required type="text" placeholder="Apollo Hospitals"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    className={`${inputBase} border ${borderColor} focus:ring-2`}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Email *</label>
              <input
                required type="email" placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`${inputBase} border ${borderColor} focus:ring-2`}
              />
            </div>

            {/* Phone + Password row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Phone *</label>
                <input
                  required type="tel" placeholder="+91 9XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`${inputBase} border ${borderColor} focus:ring-2`}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Password *</label>
                <input
                  required type="password" placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={`${inputBase} border ${borderColor} focus:ring-2`}
                />
              </div>
            </div>

            {/* Blood group (donor only) */}
            <AnimatePresence>
              {activeRole === "donor" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className={`${inputBase} border ${borderColor} focus:ring-2 appearance-none cursor-pointer`}
                  >
                    <option value="" className="bg-[#100d0d]">Select (optional)</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((g) => (
                      <option key={g} value={g} className="bg-[#100d0d]">{g}</option>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Policy checkbox */}
            <div className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/4 p-3.5 mt-2">
              <motion.button
                type="button" whileTap={{ scale: 0.85 }}
                onClick={() => setAgreedToPolicy((v) => !v)}
                className={`mt-0.5 h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-all ${
                  agreedToPolicy ? "bg-blazing-flame border-blazing-flame" : "border-white/25 bg-white/5"
                }`}
              >
                <AnimatePresence>
                  {agreedToPolicy && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 500 }}>
                      <FaCheck className="text-white text-[9px]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
              <p className="text-[11px] text-white/50 leading-relaxed">
                I agree to the{" "}
                <button type="button" onClick={() => setShowPolicy(true)} className="text-white/80 underline underline-offset-2 hover:text-white">
                  Terms & Privacy Policy
                </button>
                . Sahayam is a community tool, not an emergency service.
              </p>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={isLoading || !agreedToPolicy}
              className={`ripple-btn w-full mt-1 flex items-center justify-center gap-2.5 rounded-2xl py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r ${role.gradient}`}
            >
              {isLoading
                ? <FaSpinner className="animate-spin text-lg" />
                : <><FaHeartbeat /> Join Sahayam <FaArrowRight className="text-xs" /></>
              }
            </motion.button>
          </form>

          <p className="mt-5 text-center text-[11px] font-medium text-white/35">
            Already a member?{" "}
            <Link to="/login" className="text-white/70 font-bold hover:text-white transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>

      <PolicyModal isOpen={showPolicy} onClose={() => setShowPolicy(false)} onAccept={() => { setAgreedToPolicy(true); setShowPolicy(false); }} />
    </main>
  );
};

export default Register;
