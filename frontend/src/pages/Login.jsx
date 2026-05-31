import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import AuthContext from "../context/AuthContext";
import { FaSpinner, FaGoogle, FaArrowRight, FaHeart } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../utils/api";
import logo from "../assets/logo.png";
import PolicyModal from "../components/PolicyModal";

const inputBase =
  "w-full rounded-xl border border-border bg-pearl-beige/60 px-4 py-3.5 text-sm font-medium text-pine-teal placeholder-pine-teal/35 outline-none transition-all focus:border-pine-teal focus:ring-2 focus:ring-pine-teal/10 focus:bg-surface";

const Login = () => {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPolicy, setPolicy] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data);
      toast.success(`Welcome back, ${data.name}.`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    if (!window.google) return toast.error("Google login is loading — try again in a moment.");
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: "email profile",
      ux_mode: "popup",
      callback: async (response) => {
        if (!response.code) return;
        const id = toast.loading("Signing you in with Google…");
        try {
          const { data } = await api.post("/auth/google", { code: response.code });
          login(data);
          toast.success(`Welcome, ${data.name}.`, { id });
          navigate("/dashboard");
        } catch (err) {
          toast.error(err.response?.data?.message || "Google login failed.", { id });
        }
      },
    });
    client.requestCode();
  };

  return (
    <main className="min-h-screen bg-pearl-beige flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Soft ambient wash */}
      <div className="landing-dot-grid absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-pine-teal/10 blur-[110px] float-slow" />
        <div className="absolute top-1/2 -right-24 h-72 w-72 rounded-full bg-blazing-flame/10 blur-[110px] float-delay" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-dark-raspberry/8 blur-[90px] float-gentle" />
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

        {/* Card */}
        <div className="rounded-3xl p-6 sm:p-7 border border-border bg-surface shadow-teal">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-pine-teal/20 bg-pine-teal/8 px-3.5 py-1.5 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-pine-teal opacity-60" />
                <span className="relative h-2 w-2 rounded-full bg-pine-teal" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-pine-teal/70">A community that shows up</span>
            </div>
            <h2 className="font-display text-2xl font-semibold text-pine-teal tracking-tight">Welcome back</h2>
            <p className="text-[12px] font-medium text-pine-teal/50 mt-0.5">Sign in to keep helping.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">Email</label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className={inputBase}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-dusty-lavender">Password</label>
                <Link to="/forgot-password" className="text-[11px] font-semibold text-pine-teal/55 hover:text-pine-teal transition-colors">
                  Forgot?
                </Link>
              </div>
              <input
                type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required
                placeholder="••••••••"
                className={inputBase}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading || !email || !password}
              className="ripple-btn w-full mt-2 flex items-center justify-center gap-2.5 rounded-2xl py-4 text-sm font-bold text-white shadow-teal transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-pine-teal hover:-translate-y-0.5"
            >
              {loading
                ? <FaSpinner className="animate-spin text-lg" />
                : <><FaHeart className="text-blazing-flame" /> Sign in <FaArrowRight className="text-xs" /></>
              }
            </motion.button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-dusty-lavender">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogle} type="button"
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-pearl-beige/50 py-3.5 text-sm font-semibold text-pine-teal/80 hover:bg-surface-2 hover:text-pine-teal transition-all"
          >
            <FaGoogle className="text-dark-raspberry text-base" /> Continue with Google
          </motion.button>

          <p className="mt-5 text-center text-[12px] font-medium text-pine-teal/45">
            New to Sahayam?{" "}
            <Link to="/register" className="text-pine-teal font-bold hover:underline underline-offset-2 transition-colors">
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-[11px] font-medium text-pine-teal/35">
          By signing in you agree to our{" "}
          <button onClick={() => setPolicy(true)} className="underline underline-offset-2 hover:text-pine-teal transition-colors">
            Terms &amp; Privacy
          </button>
        </p>
      </motion.div>

      <PolicyModal isOpen={showPolicy} onClose={() => setPolicy(false)} />
    </main>
  );
};

export default Login;
