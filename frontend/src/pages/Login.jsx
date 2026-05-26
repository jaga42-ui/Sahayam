import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import AuthContext from "../context/AuthContext";
import { FaEnvelope, FaLock, FaSpinner, FaGoogle, FaShieldAlt, FaArrowRight, FaHeartbeat } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../utils/api";
import logo from "../assets/logo.png";
import PolicyModal from "../components/PolicyModal";

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
    <main className="min-h-screen bg-pearl-beige flex flex-col lg:flex-row font-sans overflow-hidden selection:bg-dark-raspberry selection:text-white">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[42%] relative bg-pine-teal overflow-hidden items-center justify-center p-14">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-20 w-96 h-96 rounded-full bg-blazing-flame/20 blur-[100px]" />
          <div className="absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-dark-raspberry/25 blur-[80px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-white/[0.03] blur-3xl" />
        </div>

        {/* Dot grid overlay */}
        <div className="pointer-events-none absolute inset-0 landing-dot-grid opacity-20" />

        <div className="relative z-10 max-w-sm">
          <Link to="/" className="flex items-center gap-2.5 mb-12 group">
            <img src={logo} alt="Sahayam" className="h-9 w-auto group-hover:scale-110 transition-transform" />
            <span className="text-xl font-black italic tracking-tighter text-white">
              SAHA<span className="text-blazing-flame">YAM.</span>
            </span>
          </Link>

          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blazing-flame/35 bg-blazing-flame/15 px-3.5 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute h-full w-full rounded-full bg-blazing-flame opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-blazing-flame" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Network Active</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight mb-5">
              Welcome back<br />to your community.
            </h1>

            <p className="text-base font-medium text-white/65 leading-relaxed mb-8 border-l-2 border-blazing-flame/50 pl-4">
              Sign in to check on your neighbourhood, offer support, or respond to emergencies near you.
            </p>

            {/* Feature list */}
            <div className="space-y-3">
              {[
                { icon: FaShieldAlt, text: "End-to-end verified accounts" },
                { icon: FaHeartbeat, text: "Real-time SOS blood alerts" },
                { icon: FaEnvelope,  text: "Secure encrypted messaging" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/10">
                    <Icon className="text-sm text-white/70" />
                  </div>
                  <span className="text-sm font-medium text-white/60">{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 overflow-y-auto min-h-screen lg:min-h-0 relative">
        {/* Ambient */}
        <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full bg-blazing-flame/6 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[400px] my-8"
        >
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <img src={logo} alt="Sahayam" className="h-8 w-auto group-hover:scale-110 transition-transform" />
              <span className="text-xl font-black italic tracking-tighter text-pine-teal">
                SAHA<span className="text-blazing-flame">YAM.</span>
              </span>
            </Link>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-pine-teal/10 bg-surface shadow-xl shadow-pine-teal/6 p-8">
            <div className="mb-7">
              <h2 className="text-2xl font-black tracking-tight text-pine-teal">Sign in</h2>
              <p className="mt-1 text-sm font-medium text-dusty-lavender">Connect with your community.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-dusty-lavender">
                  <FaEnvelope className="text-blazing-flame text-[10px]" /> Email
                </label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-pine-teal/15 bg-surface-2 px-4 py-3.5 text-sm font-medium text-pine-teal placeholder-dusty-lavender/50 outline-none focus:border-blazing-flame focus:ring-2 focus:ring-blazing-flame/10 transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-dusty-lavender">
                    <FaLock className="text-blazing-flame text-[10px]" /> Password
                  </label>
                  <Link to="/forgot-password" className="text-[11px] font-bold text-dark-raspberry hover:text-dark-raspberry/70 transition-colors">
                    Forgot?
                  </Link>
                </div>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-pine-teal/15 bg-surface-2 px-4 py-3.5 text-sm font-medium text-pine-teal placeholder-dusty-lavender/50 outline-none focus:border-blazing-flame focus:ring-2 focus:ring-blazing-flame/10 transition-all"
                />
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={loading || !email || !password}
                className="mt-2 w-full flex items-center justify-center gap-2.5 rounded-xl bg-pine-teal py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-pine-teal/25 hover:shadow-pine-teal/35 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <FaSpinner className="animate-spin text-lg" /> : <>Sign In <FaArrowRight className="text-xs" /></>}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-pine-teal/10" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-dusty-lavender/70">or</span>
              <div className="flex-1 h-px bg-pine-teal/10" />
            </div>

            {/* Google */}
            <motion.button
              whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}
              onClick={handleGoogle} type="button"
              className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-pine-teal/15 bg-surface-2 py-3.5 text-sm font-bold text-pine-teal hover:border-pine-teal/30 hover:bg-surface transition-all"
            >
              <FaGoogle className="text-blazing-flame text-base" /> Continue with Google
            </motion.button>

            {/* Register link */}
            <div className="mt-6 text-center">
              <p className="text-sm font-medium text-dusty-lavender">
                New to Sahayam?{" "}
                <Link to="/register" className="font-black text-pine-teal hover:text-dark-raspberry transition-colors">
                  Create an account
                </Link>
              </p>
            </div>
          </div>

          {/* Policy */}
          <p className="mt-4 text-center text-[11px] font-medium text-dusty-lavender/60">
            By signing in you agree to our{" "}
            <button onClick={() => setPolicy(true)} className="underline hover:text-pine-teal transition-colors">
              Terms & Privacy
            </button>
          </p>
        </motion.div>
      </div>

      <PolicyModal isOpen={showPolicy} onClose={() => setPolicy(false)} />
    </main>
  );
};

export default Login;
