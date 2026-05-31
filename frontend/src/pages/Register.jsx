import { useState, useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCheck, FaSpinner, FaArrowRight, FaHeart,
} from "react-icons/fa";
import toast from "react-hot-toast";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";
import logo from "../assets/logo.png";
import PolicyModal from "../components/PolicyModal";

const ROLES = [
  { id: "donor",    label: "Donor",       desc: "Give blood, food, or supplies",    gradient: "from-[#8a6fb0] to-[#6e4fa0]" },
  { id: "receiver", label: "Receiver",    desc: "Request help from your community", gradient: "from-[#6e4fa0] to-[#5e4585]" },
  { id: "ngo",      label: "Institution", desc: "Coordinate large-scale aid",       gradient: "from-[#3b6b54] to-[#2d5343]" },
];

const springIn = { type: "spring", stiffness: 300, damping: 26 };

const inputBase =
  "w-full rounded-xl border border-border bg-pearl-beige/60 px-4 py-3.5 text-sm font-medium text-pine-teal placeholder-pine-teal/35 outline-none transition-all focus:border-pine-teal focus:ring-2 focus:ring-pine-teal/10 focus:bg-surface";

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
    if (!agreedToPolicy) return toast.error("Please agree to the Terms & Privacy first.");
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
        <div className="mb-5 grid grid-cols-3 gap-2">
          {ROLES.map((r) => (
            <motion.button
              key={r.id}
              type="button"
              whileTap={{ scale: 0.93 }}
              onClick={() => setActiveRole(r.id)}
              className={`relative overflow-hidden rounded-2xl border px-3 py-3.5 text-center transition-all ${
                activeRole === r.id
                  ? `border-transparent bg-gradient-to-br ${r.gradient} text-white shadow-teal`
                  : "border-border bg-surface text-pine-teal/55 hover:bg-surface-2 hover:text-pine-teal"
              }`}
            >
              <p className="relative text-[11px] font-bold uppercase tracking-widest">{r.label}</p>
              <p className="relative text-[9px] font-medium mt-0.5 opacity-80 leading-tight">{r.desc}</p>
            </motion.button>
          ))}
        </div>

        {/* Form card */}
        <div className="rounded-3xl p-6 sm:p-7 border border-border bg-surface shadow-teal">
          <div className="mb-5">
            <h2 className="font-display text-2xl font-semibold text-pine-teal tracking-tight">Create your account</h2>
            <p className="text-[12px] font-medium text-pine-teal/50 mt-0.5">Join your neighbours in showing up for each other.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">
                {activeRole === "ngo" ? "Representative name" : "Full name"}
              </label>
              <input
                required type="text"
                placeholder={activeRole === "ngo" ? "Dr. Priya Sharma" : "Arjun Mehta"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputBase}
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
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">Organization / Hospital</label>
                  <input
                    required type="text" placeholder="Apollo Hospitals"
                    value={formData.organizationName}
                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                    className={inputBase}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">Email</label>
              <input
                required type="email" placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputBase}
              />
            </div>

            {/* Phone + Password row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">Phone</label>
                <input
                  required type="tel" placeholder="+91 9XXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputBase}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">Password</label>
                <input
                  required type="password" placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={inputBase}
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
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">Blood group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className={inputBase + " appearance-none cursor-pointer"}
                  >
                    <option value="">Select (optional)</option>
                    {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Policy checkbox */}
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-pearl-beige/50 p-3.5 mt-2">
              <motion.button
                type="button" whileTap={{ scale: 0.85 }}
                onClick={() => setAgreedToPolicy((v) => !v)}
                className={`mt-0.5 h-5 w-5 shrink-0 rounded-md border flex items-center justify-center transition-all ${
                  agreedToPolicy ? "bg-pine-teal border-pine-teal" : "border-pine-teal/30 bg-surface"
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
              <p className="text-[11px] text-pine-teal/55 leading-relaxed">
                I agree to the{" "}
                <button type="button" onClick={() => setShowPolicy(true)} className="text-pine-teal font-semibold underline underline-offset-2 hover:opacity-80">
                  Terms &amp; Privacy
                </button>
                . Sahayam is a community tool, not an emergency service.
              </p>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={isLoading || !agreedToPolicy}
              className={`ripple-btn w-full mt-1 flex items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-bold text-white shadow-teal transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r ${role.gradient} hover:-translate-y-0.5`}
            >
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
      </motion.div>

      <PolicyModal isOpen={showPolicy} onClose={() => setShowPolicy(false)} onAccept={() => { setAgreedToPolicy(true); setShowPolicy(false); }} />
    </main>
  );
};

export default Register;
