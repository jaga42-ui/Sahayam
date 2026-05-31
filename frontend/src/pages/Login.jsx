import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import AuthContext from "../context/AuthContext";
import { FaSpinner, FaGoogle, FaArrowRight, FaHeartbeat } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../utils/api";
import logo from "../assets/logo.png";
import PolicyModal from "../components/PolicyModal";

const inputBase =
  "w-full rounded-xl border bg-white/8 px-4 py-3.5 text-sm font-medium text-white placeholder-white/30 outline-none transition-all";

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
        const id = toast.loading("Verifying with Google…");
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
    <main className="min-h-screen aurora-bg flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden selection:bg-white/20 selection:text-white">

      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-pine-teal/12 blur-[100px] float-slow" />
        <div className="absolute top-1/2 -right-24 h-72 w-72 rounded-full bg-blazing-flame/10 blur-[100px] float-delay" />
        <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-dark-raspberry/15 blur-[80px] float-gentle" />
        <div className="dark-dot-grid absolute inset-0 opacity-25" />
      </div>

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

        {/* Card */}
        <div className="glass-dark rounded-3xl p-6 border border-white/10">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-pine-teal/25 bg-pine-teal/10 px-3.5 py-1.5 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-pine-teal opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-pine-teal" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-white/70">Network Active</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Welcome back</h2>
            <p className="text-[11px] font-medium text-white/40 mt-0.5">Sign in to your community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-white/40">Email *</label>
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)} required
                placeholder="you@example.com"
                className={`${inputBase} border border-pine-teal/50 focus:border-pine-teal focus:ring-2 focus:ring-pine-teal/10`}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Password *</label>
                <Link to="/forgot-password" className="text-[11px] font-bold text-white/50 hover:text-white transition-colors">
                  Forgot?
                </Link>
              </div>
              <input
                type="password" value={password}
                onChange={(e) => setPassword(e.target.value)} required
                placeholder="••••••••"
                className={`${inputBase} border border-pine-teal/50 focus:border-pine-teal focus:ring-2 focus:ring-pine-teal/10`}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="submit"
              disabled={loading || !email || !password}
              className="ripple-btn w-full mt-2 flex items-center justify-center gap-2.5 rounded-2xl py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-pine-teal to-[#1a3630]"
            >
              {loading
                ? <FaSpinner className="animate-spin text-lg" />
                : <><FaHeartbeat /> Sign In <FaArrowRight className="text-xs" /></>
              }
            </motion.button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogle} type="button"
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/6 py-3.5 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <FaGoogle className="text-blazing-flame text-base" /> Continue with Google
          </motion.button>

          <p className="mt-5 text-center text-[11px] font-medium text-white/35">
            New to Sahayam?{" "}
            <Link to="/register" className="text-white/70 font-bold hover:text-white transition-colors">
              Create an account
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-[11px] font-medium text-white/25">
          By signing in you agree to our{" "}
          <button onClick={() => setPolicy(true)} className="underline hover:text-white/50 transition-colors text-white/35">
            Terms & Privacy
          </button>
        </p>
      </motion.div>

      <PolicyModal isOpen={showPolicy} onClose={() => setPolicy(false)} />
    </main>
  );
};

export default Login;
