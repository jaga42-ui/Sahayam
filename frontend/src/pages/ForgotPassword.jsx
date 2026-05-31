import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FaEnvelope, FaSpinner, FaLock, FaArrowRight } from "react-icons/fa";
import api from "../utils/api";
import logo from "../assets/logo.png";

const inputBase =
  "w-full rounded-xl border bg-white/8 px-4 py-3.5 text-sm font-medium text-white placeholder-white/30 outline-none transition-all";

const ForgotPassword = () => {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgotpassword", { email });
      setSent(true);
      toast.success("Override link sent. Check your inbox.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Transmission failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen aurora-bg flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden selection:bg-white/20 selection:text-white font-sans">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-blazing-flame/10 blur-[100px] float-slow" />
        <div className="absolute top-1/2 -right-24 h-72 w-72 rounded-full bg-dark-raspberry/12 blur-[100px] float-delay" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-pine-teal/12 blur-[80px] float-gentle" />
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
              className="h-9 w-auto drop-shadow-[0_0_14px_rgba(138,111,176,0.45)]"
            />
            <span className="font-display text-2xl font-semibold italic tracking-tightest text-white">
              Saha<span className="text-blazing-flame">yam</span>
            </span>
          </Link>
        </div>

        <div className="glass-dark rounded-3xl p-6 border border-white/10">
          <div className="flex flex-col items-center mb-6">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-14 h-14 rounded-2xl bg-dark-raspberry/20 border border-dark-raspberry/40 flex items-center justify-center mb-3"
            >
              <FaLock className="text-dark-raspberry text-xl drop-shadow-[0_0_8px_rgba(110,79,160,0.8)]" />
            </motion.div>
            <h2 className="text-xl font-black text-white tracking-tight text-center">System Override</h2>
            <p className="text-[11px] font-medium text-white/40 mt-0.5 text-center">
              {sent ? "Check your inbox for the recovery link." : "Request a secure link to regain access."}
            </p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-pine-teal/20 border border-pine-teal/40 flex items-center justify-center">
                <FaEnvelope className="text-pine-teal text-2xl drop-shadow-[0_0_8px_rgba(59,107,84,0.8)]" />
              </div>
              <p className="text-white/60 text-sm text-center font-medium leading-relaxed">
                We've sent a recovery link to <span className="text-white font-bold">{email}</span>. Follow it to reset your password.
              </p>
              <Link to="/login" className="text-[10px] font-bold text-white/40 uppercase tracking-widest hover:text-white/70 transition-colors mt-2">
                Back to Login
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">
                  Account Email *
                </label>
                <input
                  type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required
                  placeholder="operator@sahayam.com"
                  className={`${inputBase} border border-dark-raspberry/50 focus:border-dark-raspberry focus:ring-2 focus:ring-dark-raspberry/10`}
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading || !email}
                className="ripple-btn w-full mt-2 flex items-center justify-center gap-2.5 rounded-2xl py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-dark-raspberry to-[#5e4585]"
              >
                {loading
                  ? <FaSpinner className="animate-spin text-lg" />
                  : <>Send Override Link <FaArrowRight className="text-xs" /></>
                }
              </motion.button>

              <p className="text-center pt-2">
                <Link to="/login" className="text-[11px] font-bold text-white/35 hover:text-white/60 uppercase tracking-widest transition-colors">
                  Abort & Return to Login
                </Link>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </main>
  );
};

export default ForgotPassword;
