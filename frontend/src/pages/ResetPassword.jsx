import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { FaShieldAlt, FaSpinner, FaArrowRight } from "react-icons/fa";
import api from "../utils/api";
import logo from "../assets/logo.png";

const inputBase =
  "w-full rounded-xl border border-border bg-pearl-beige/60 px-4 py-3.5 text-sm font-medium text-pine-teal placeholder-pine-teal/35 outline-none transition-all focus:border-pine-teal focus:ring-2 focus:ring-pine-teal/10 focus:bg-surface";

const ResetPassword = () => {
  const { id, token } = useParams();
  const navigate = useNavigate();

  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,         setLoading]         = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword)
      return toast.error("Those passwords don't match.");
    if (password.length < 6)
      return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    try {
      await api.post(`/auth/resetpassword/${id}/${token}`, { password });
      toast.success("Your password has been updated.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "This reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-pearl-beige flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="landing-dot-grid absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-dark-raspberry/8 blur-[110px] float-slow" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-pine-teal/10 blur-[90px] float-gentle" />
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
              className="w-14 h-14 rounded-2xl bg-pine-teal/10 border border-pine-teal/25 flex items-center justify-center mb-3"
            >
              <FaShieldAlt className="text-pine-teal text-xl" />
            </motion.div>
            <h2 className="font-display text-2xl font-semibold text-pine-teal tracking-tight">Set a new password</h2>
            <p className="text-[12px] font-medium text-pine-teal/50 mt-0.5">Choose something secure you'll remember.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">New password</label>
              <input
                type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required
                placeholder="••••••••"
                className={inputBase}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">Confirm password</label>
              <input
                type="password" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)} required
                placeholder="••••••••"
                className={inputBase}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="ripple-btn w-full mt-2 flex items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-bold text-white shadow-teal transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-pine-teal hover:-translate-y-0.5"
            >
              {loading
                ? <FaSpinner className="animate-spin text-lg" />
                : <>Update password <FaArrowRight className="text-xs" /></>
              }
            </motion.button>

            <p className="text-center pt-2">
              <Link to="/login" className="text-[11px] font-semibold text-pine-teal/45 hover:text-pine-teal transition-colors">
                Back to sign in
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
    </main>
  );
};

export default ResetPassword;
