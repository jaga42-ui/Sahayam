import { useState, useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCheck, FaSpinner, FaArrowRight, FaHeart, FaEye, FaEyeSlash, FaTint,
} from "react-icons/fa";
import toast from "react-hot-toast";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";
import logo from "../assets/logo.png";
import PolicyModal from "../components/PolicyModal";

const ROLES = [
  { id: "donor",    label: "Donor",       desc: "I want to donate blood",           gradient: "from-[#a73c64] to-[#6b1a3a]" },
  { id: "receiver", label: "Recipient",   desc: "I need to find a donor",           gradient: "from-[#3b6b54] to-[#2d5343]" },
  { id: "ngo",      label: "Institution", desc: "Hospital / NGO / Blood bank",      gradient: "from-[#5e4585] to-[#3d2b5e]" },
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const inputBase =
  "w-full rounded-xl border border-border bg-pearl-beige/60 px-4 py-3.5 text-sm font-medium text-pine-teal placeholder-pine-teal/35 outline-none transition-all focus:border-pine-teal focus:ring-2 focus:ring-pine-teal/10 focus:bg-surface";

const getPasswordStrength = (p) => {
  if (!p) return null;
  if (p.length < 6) return { label: "Too short", color: "bg-red-400", w: "w-1/4" };
  if (p.length < 8) return { label: "Weak", color: "bg-orange-400", w: "w-2/4" };
  if (/[A-Z]/.test(p) && /[0-9]/.test(p)) return { label: "Strong", color: "bg-pine-teal", w: "w-full" };
  return { label: "Fair", color: "bg-yellow-400", w: "w-3/4" };
};

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
  const [showPass,       setShowPass]       = useState(false);

  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();

  const role = ROLES.find((r) => r.id === activeRole);
  const strength = getPasswordStrength(formData.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToPolicy) return toast.error("Please agree to the Terms & Privacy first.");
    if (activeRole === "donor" && !formData.bloodGroup) return toast.error("Blood group is required for donors.");
    setIsLoading(true);
    try {
      const payload = { ...formData, activeRole, refCode };
      if (!payload.bloodGroup) delete payload.bloodGroup;
      await api.post("/auth/register", payload);
      toast.success("Account created! Check your email for a 6-digit code.");
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-pearl-beige flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="landing-dot-grid absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-blazing-flame/8 blur-[110px] float-slow" />
        <div className="absolute top-1/2 -right-24 h-72 w-72 rounded-full bg-dark-raspberry/8 blur-[110px] float-delay" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-pine-teal/10 blur-[90px] float-gentle" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.img whileHover={{ scale: 1.1, rotate: -5 }} src={logo} alt="Sahayam" className="h-9 w-auto" />
            <span className="font-display text-2xl font-semibold italic tracking-tightest text-pine-teal">
              Saha<span className="text-dark-raspberry">yam</span>
            </span>
          </Link>
        </div>

        {/* Role selector */}
        <div className="mb-4 grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <motion.button key={r.id} type="button" whileTap={{ scale: 0.93 }}
              onClick={() => setActiveRole(r.id)}
              className={`relative overflow-hidden rounded-2xl border px-3 py-3.5 text-center transition-all ${
                activeRole === r.id
                  ? `border-transparent bg-gradient-to-br ${r.gradient} text-white shadow-md`
                  : "border-border bg-surface text-pine-teal/55 hover:bg-surface-2 hover:text-pine-teal"
              }`}>
              <p className="relative text-[11px] font-bold uppercase tracking-widest leading-tight">{r.label}</p>
              <p className="relative text-[9px] font-medium mt-1 opacity-75 leading-tight">{r.desc}</p>
            </motion.button>
          ))}
        </div>

        {/* Form card */}
        <div className="rounded-3xl p-6 sm:p-7 border border-border bg-surface shadow-teal">
          <div className="mb-5">
            <h2 className="font-display text-2xl font-semibold text-pine-teal tracking-tight">Create your account</h2>
            <p className="text-[12px] font-medium text-pine-teal/50 mt-0.5">
              {activeRole === "donor"
                ? "Join thousands of verified blood donors saving lives nearby."
                : activeRole === "receiver"
                ? "Find verified donors near you in minutes, not hours."
                : "Register your institution to coordinate large-scale blood drives."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">
                {activeRole === "ngo" ? "Representative name" : "Full name"}
              </label>
              <input required type="text"
                placeholder={activeRole === "ngo" ? "Dr. Priya Sharma" : "Arjun Mehta"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputBase} />
            </div>

            {/* Org name — NGO only */}
            <AnimatePresence>
              {activeRole === "ngo" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">Organization / Hospital</label>
                  <input required type="text" placeholder="Apollo Hospitals, Chennai"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    className={inputBase} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">Email</label>
              <input required type="email" placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputBase} />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">Phone number</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-pine-teal/40 select-none pointer-events-none">+91</span>
                <input required type="tel" placeholder="98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputBase + " pl-12"} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">Password</label>
              <div className="relative">
                <input required type={showPass ? "text" : "password"} placeholder="Min. 8 characters"
                  value={formData.password} minLength={8}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={inputBase + " pr-11"} />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pine-teal/35 hover:text-pine-teal transition-colors">
                  {showPass ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                </button>
              </div>
              {/* Strength bar */}
              {strength && (
                <div className="mt-1.5 space-y-1">
                  <div className="h-1 w-full rounded-full bg-pine-teal/8 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: strength.w }}
                      transition={{ duration: 0.3 }}
                      className={`h-full rounded-full ${strength.color}`} />
                  </div>
                  <p className={`text-[10px] font-bold ${strength.color.replace("bg-", "text-")}`}>{strength.label}</p>
                </div>
              )}
            </div>

            {/* Blood group — visual grid, donor only */}
            <AnimatePresence>
              {activeRole === "donor" && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">
                    Your blood group <span className="text-dark-raspberry ml-1">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {BLOOD_GROUPS.map((g) => {
                      const active = formData.bloodGroup === g;
                      return (
                        <motion.button key={g} type="button" whileTap={{ scale: 0.88 }}
                          onClick={() => setFormData({ ...formData, bloodGroup: g })}
                          className={`relative rounded-2xl border py-3 text-center font-black text-[13px] transition-all ${
                            active
                              ? "border-transparent bg-gradient-to-br from-dark-raspberry to-[#6b1a3a] text-white shadow-md"
                              : "border-border bg-pearl-beige/60 text-pine-teal/60 hover:border-dark-raspberry/30 hover:text-dark-raspberry"
                          }`}>
                          {active && (
                            <div className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-pine-teal border-2 border-surface flex items-center justify-center">
                              <FaCheck className="text-[6px] text-white" />
                            </div>
                          )}
                          <FaTint className={`text-[9px] mx-auto mb-0.5 ${active ? "text-white/60" : "text-dark-raspberry/30"}`} />
                          {g}
                        </motion.button>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[10px] text-pine-teal/35 font-medium">
                    Don't know your blood group? You can update this later.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Policy checkbox */}
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-pearl-beige/50 p-3.5">
              <motion.button type="button" whileTap={{ scale: 0.85 }}
                onClick={() => setAgreedToPolicy((v) => !v)}
                className={`mt-0.5 h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-all ${
                  agreedToPolicy ? "bg-pine-teal border-pine-teal" : "border-pine-teal/30 bg-surface"
                }`}>
                <AnimatePresence>
                  {agreedToPolicy && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500 }}>
                      <FaCheck className="text-white text-[9px]" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
              <p className="text-[11px] text-pine-teal/55 leading-relaxed">
                I have read and agree to the{" "}
                <button type="button" onClick={() => setShowPolicy(true)}
                  className="text-pine-teal font-semibold underline underline-offset-2 hover:opacity-80">
                  Terms of Service &amp; Privacy Policy
                </button>
                . I understand Sahayam is a community tool, not an emergency service. Call 112 for life-threatening emergencies.
              </p>
            </div>

            {/* Submit */}
            <motion.button type="submit" whileTap={{ scale: 0.97 }}
              disabled={isLoading || !agreedToPolicy}
              className={`ripple-btn w-full mt-1 flex items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-bold text-white shadow-teal transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r ${role.gradient} hover:-translate-y-0.5`}>
              {isLoading
                ? <FaSpinner className="animate-spin text-lg" />
                : <><FaHeart /> Join Sahayam <FaArrowRight className="text-xs" /></>
              }
            </motion.button>
          </form>

          <p className="mt-5 text-center text-[12px] font-medium text-pine-teal/45">
            Already a member?{" "}
            <Link to="/login" className="text-pine-teal font-bold hover:underline underline-offset-2 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-3 text-center text-[10px] text-pine-teal/30 font-medium px-4">
          Blood group data is sensitive personal data protected under India's DPDP Act, 2023. We never sell it.
        </p>
      </motion.div>

      <PolicyModal isOpen={showPolicy} onClose={() => setShowPolicy(false)}
        onAccept={() => { setAgreedToPolicy(true); setShowPolicy(false); }} />
    </main>
  );
};

export default Register;
