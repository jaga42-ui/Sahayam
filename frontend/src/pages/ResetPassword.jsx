import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FaKey, FaSpinner, FaShieldAlt, FaArrowRight } from "react-icons/fa";
import api from "../utils/api";
import logo from "../assets/logo.png";

const inputBase =
  "w-full rounded-xl border bg-white/8 px-4 py-3.5 text-sm font-medium text-white placeholder-white/30 outline-none transition-all";

const ResetPassword = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();

  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,         setLoading]         = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword)
      return toast.error("Security mismatch: Passwords do not align.");
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await api.post(`/auth/resetpassword/${id}/${token}`, { password });
      toast.success("Override successful. New credentials locked in.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired recovery link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen aurora-bg flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden selection:bg-white/20 selection:text-white font-sans">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-dark-raspberry/15 blur-[100px] float-slow" />
        <div className="absolute top-1/2 -left-24 h-72 w-72 rounded-full bg-blazing-flame/10 blur-[100px] float-delay" />
        <div className="absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-pine-teal/12 blur-[80px] float-gentle" />
        <div className="dark-dot-grid absolute inset-0 opacity-25" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.img
              whileHover={{ scale: 1.1, rotate: -5 }}
              src={logo} alt="Sahayam"
              className="h-9 w-auto drop-shadow-[0_0_14px_rgba(255,74,28,0.55)]"
            />
            <span className="text-2xl font-black italic tracking-tighter text-white">
              SAHA<span className="text-blazing-flame drop-shadow-[0_0_10px_rgba(255,74,28,0.8)]">YAM.</span>
            </span>
          </Link>
        </div>

        <div className="glass-dark rounded-3xl p-6 border border-white/10">
          <div className="flex flex-col items-center mb-6">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-14 h-14 rounded-2xl bg-pine-teal/20 border border-pine-teal/40 flex items-center justify-center mb-3"
            >
              <FaShieldAlt className="text-pine-teal text-xl drop-shadow-[0_0_8px_rgba(41,82,74,0.8)]" />
            </motion.div>
            <h2 className="text-xl font-black text-white tracking-tight">New Credentials</h2>
            <p className="text-[11px] font-medium text-white/40 mt-0.5">Establish a new encryption key.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">New Passcode *</label>
              <input
                type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required
                placeholder="••••••••"
                className={`${inputBase} border border-pine-teal/50 focus:border-pine-teal focus:ring-2 focus:ring-pine-teal/10`}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Verify Passcode *</label>
              <input
                type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} required
                placeholder="••••••••"
                className={`${inputBase} border border-pine-teal/50 focus:border-pine-teal focus:ring-2 focus:ring-pine-teal/10`}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="ripple-btn w-full mt-2 flex items-center justify-center gap-2.5 rounded-2xl py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-pine-teal to-[#1a3630]"
            >
              {loading
                ? <FaSpinner className="animate-spin text-lg" />
                : <>Confirm Override <FaArrowRight className="text-xs" /></>
              }
            </motion.button>

            <p className="text-center pt-2">
              <Link to="/login" className="text-[11px] font-bold text-white/35 hover:text-white/60 uppercase tracking-widest transition-colors">
                Abort & Return to Login
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </main>
  );
};

export default ResetPassword;
