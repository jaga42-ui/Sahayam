import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FaEnvelope, FaSpinner, FaLock, FaArrowRight } from "react-icons/fa";
import api from "../utils/api";
import logo from "../assets/logo.png";

const inputBase =
  "w-full rounded-xl border border-border bg-pearl-beige/60 px-4 py-3.5 text-sm font-medium text-pine-teal placeholder-pine-teal/35 outline-none transition-all focus:border-pine-teal focus:ring-2 focus:ring-pine-teal/10 focus:bg-surface";

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
      toast.success("Reset link sent — check your inbox.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-pearl-beige flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="landing-dot-grid absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-dark-raspberry/8 blur-[110px] float-slow" />
        <div className="absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-pine-teal/10 blur-[90px] float-gentle" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.img whileHover={{ scale: 1.1, rotate: -5 }} src={logo} alt="Sahayam" className="h-9 w-auto" />
            <span className="font-display text-2xl font-semibold italic tracking-tightest text-pine-teal">
              Saha<span className="text-dark-raspberry">yam</span>
            </span>
          </Link>
        </div>

        <div className="rounded-3xl p-6 sm:p-7 border border-border bg-surface shadow-teal">
          <div className="flex flex-col items-center mb-6">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
              className="w-14 h-14 rounded-2xl bg-dark-raspberry/10 border border-dark-raspberry/25 flex items-center justify-center mb-3"
            >
              <FaLock className="text-dark-raspberry text-xl" />
            </motion.div>
            <h2 className="font-display text-2xl font-semibold text-pine-teal tracking-tight text-center">Forgot your password?</h2>
            <p className="text-[12px] font-medium text-pine-teal/50 mt-0.5 text-center">
              {sent ? "Check your inbox for the reset link." : "We'll email you a secure link to reset it."}
            </p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-pine-teal/10 border border-pine-teal/25 flex items-center justify-center">
                <FaEnvelope className="text-pine-teal text-2xl" />
              </div>
              <p className="text-pine-teal/60 text-sm text-center font-medium leading-relaxed">
                We've sent a reset link to <span className="text-pine-teal font-bold">{email}</span>. Open it to set a new password.
              </p>
              <Link to="/login" className="text-[11px] font-semibold text-pine-teal/50 hover:text-pine-teal transition-colors mt-2">
                Back to sign in
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">
                  Account email
                </label>
                <input
                  type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  className={inputBase}
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading || !email}
                className="ripple-btn w-full mt-2 flex items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-bold text-white shadow-berry transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-dark-raspberry hover:-translate-y-0.5"
              >
                {loading
                  ? <FaSpinner className="animate-spin text-lg" />
                  : <>Send reset link <FaArrowRight className="text-xs" /></>
                }
              </motion.button>

              <p className="text-center pt-2">
                <Link to="/login" className="text-[11px] font-semibold text-pine-teal/45 hover:text-pine-teal transition-colors">
                  Back to sign in
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
