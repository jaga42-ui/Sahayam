import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaEnvelope, FaSpinner, FaCheckCircle, FaArrowRight } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../utils/api";
import logo from "../assets/logo.png";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) return toast.error("Enter all 6 digits.");
    setLoading(true);
    try {
      await api.post("/auth/verify-email", { email, token: code });
      setVerified(true);
      setTimeout(() => navigate("/login"), 2200);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid code. Try again.");
      setOtp(["", "", "", "", "", ""]);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await api.post("/auth/resend-verification", { email });
      toast.success("New code sent to your email.");
      setCooldown(60);
    } catch {
      toast.error("Could not resend. Try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="min-h-screen bg-pearl-beige flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="landing-dot-grid absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-pine-teal/10 blur-[110px] float-slow" />
        <div className="absolute top-1/2 -right-24 h-72 w-72 rounded-full bg-dark-raspberry/8 blur-[110px] float-delay" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <Link to="/" className="flex items-center gap-2.5">
            <motion.img whileHover={{ scale: 1.1, rotate: -5 }} src={logo} alt="Sahayam" className="h-9 w-auto" />
            <span className="font-display text-2xl font-semibold italic tracking-tightest text-pine-teal">
              Saha<span className="text-dark-raspberry">yam</span>
            </span>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {verified ? (
            <motion.div key="success"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl p-8 border border-pine-teal/15 bg-surface shadow-teal text-center">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                className="mx-auto mb-4 h-16 w-16 rounded-3xl bg-pine-teal/10 flex items-center justify-center">
                <FaCheckCircle className="text-3xl text-pine-teal" />
              </motion.div>
              <h2 className="font-display text-xl font-semibold text-pine-teal">Email verified!</h2>
              <p className="text-[13px] text-pine-teal/50 mt-1.5">Taking you to sign in…</p>
            </motion.div>
          ) : (
            <motion.div key="form"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="rounded-3xl p-6 sm:p-7 border border-border bg-surface shadow-teal">

              <div className="flex items-center gap-3 mb-5">
                <div className="h-11 w-11 shrink-0 rounded-2xl bg-pine-teal/10 flex items-center justify-center">
                  <FaEnvelope className="text-pine-teal" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-pine-teal tracking-tight">Check your email</h2>
                  <p className="text-[12px] text-pine-teal/45 mt-0.5">
                    We sent a 6-digit code to <span className="font-semibold text-pine-teal/70">{email || "your email"}</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* OTP boxes */}
                <div className="flex gap-2.5 justify-center mb-5" onPaste={handlePaste}>
                  {otp.map((digit, i) => (
                    <motion.input
                      key={i}
                      ref={(el) => (inputs.current[i] = el)}
                      type="text" inputMode="numeric" maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      whileFocus={{ scale: 1.08 }}
                      className={`w-12 h-14 rounded-2xl border text-center text-xl font-black outline-none transition-all ${
                        digit
                          ? "border-pine-teal bg-pine-teal/8 text-pine-teal"
                          : "border-border bg-pearl-beige/60 text-pine-teal"
                      } focus:border-pine-teal focus:ring-2 focus:ring-pine-teal/10`}
                    />
                  ))}
                </div>

                <motion.button type="submit" whileTap={{ scale: 0.97 }}
                  disabled={loading || otp.join("").length < 6}
                  className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-pine-teal py-4 text-sm font-bold text-white shadow-teal transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5">
                  {loading
                    ? <FaSpinner className="animate-spin text-lg" />
                    : <><FaCheckCircle /> Verify Email <FaArrowRight className="text-xs" /></>
                  }
                </motion.button>
              </form>

              <div className="mt-4 text-center">
                <p className="text-[12px] text-pine-teal/40 mb-1.5">Didn't get it? Check your spam folder or</p>
                <button onClick={handleResend} disabled={resending || cooldown > 0}
                  className="text-[12px] font-bold text-pine-teal underline underline-offset-2 hover:opacity-70 disabled:opacity-40 transition-opacity">
                  {resending ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>

              <p className="mt-4 text-center text-[12px] text-pine-teal/35">
                Wrong email?{" "}
                <Link to="/register" className="font-bold text-pine-teal hover:underline underline-offset-2">
                  Go back
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
};

export default VerifyEmail;
