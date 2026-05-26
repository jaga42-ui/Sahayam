import { useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useInView } from "framer-motion";
import {
  FaHeartbeat, FaMapMarkerAlt, FaComments, FaTrophy,
  FaShieldAlt, FaArrowRight, FaUsers, FaBell,
  FaCheckCircle,
} from "react-icons/fa";
import { useEffect, useRef } from "react";
import AuthContext from "../context/AuthContext";
import logo from "../assets/logo.png";

/* ── Spring preset ── */
const sp = { type: "spring", stiffness: 280, damping: 22 };

/* ── Hero opening stagger ── */
const heroWrap = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
};
const heroEl = {
  hidden: { opacity: 0, y: 48, filter: "blur(12px)" },
  show: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
};

/* ── Viewport fade-up ── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 36 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay },
});

const FEATURES = [
  {
    icon: FaHeartbeat, color: "text-blazing-flame",
    bg: "bg-blazing-flame/10", border: "border-blazing-flame/20",
    title: "Blood & SOS Matching",
    desc: "Broadcast an emergency to compatible donors near you. Radius auto-expands until someone responds.",
  },
  {
    icon: FaMapMarkerAlt, color: "text-pine-teal",
    bg: "bg-pine-teal/10", border: "border-pine-teal/20",
    title: "Real-Time Radar",
    desc: "Live map of nearby donors and active requests — every pin is a verified community member ready to help.",
  },
  {
    icon: FaComments, color: "text-dark-raspberry",
    bg: "bg-dark-raspberry/10", border: "border-dark-raspberry/20",
    title: "Encrypted Secure Chat",
    desc: "End-to-end verified chat with PIN-based handoff. Your contact details stay private until you choose to share.",
  },
  {
    icon: FaTrophy, color: "text-yellow-400",
    bg: "bg-yellow-400/10", border: "border-yellow-400/20",
    title: "Community Rankings",
    desc: "Earn points for every act of support. Rise through the leaderboard and unlock certificates for milestone donors.",
  },
];

const STEPS = [
  {
    n: "01", title: "Post or Request",
    desc: "Share what you need — blood, food, clothes — or offer what you have. Location is auto-detected.",
    accent: "text-blazing-flame", border: "border-blazing-flame/25", glow: "shadow-[0_0_30px_rgba(255,74,28,0.2)]",
  },
  {
    n: "02", title: "Get Matched Instantly",
    desc: "The closest verified volunteers or compatible donors in your area are notified within seconds.",
    accent: "text-pine-teal", border: "border-pine-teal/25", glow: "shadow-[0_0_30px_rgba(41,82,74,0.2)]",
  },
  {
    n: "03", title: "Connect & Complete",
    desc: "Chat securely, coordinate handoff, confirm with a QR scan. Both sides earn community points.",
    accent: "text-dark-raspberry", border: "border-dark-raspberry/25", glow: "shadow-[0_0_30px_rgba(160,17,106,0.2)]",
  },
];

const Landing = () => {
  const { user }  = useContext(AuthContext);
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode   = searchParams.get("ref");
  const registerLink = refCode ? `/register?ref=${refCode}` : "/register";

  useEffect(() => {
    if (user?.token) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const featRef = useRef(null);
  const featInView = useInView(featRef, { once: true, margin: "-80px" });

  return (
    <div className="min-h-screen bg-[#05110d] text-white font-sans overflow-x-hidden">
      <Helmet>
        <title>Sahayam — No one should face hardship alone.</title>
        <meta name="description" content="A trusted community network where people can ask for help, support others, and stay connected during difficult moments." />
      </Helmet>

      {/* ── FIXED DARK NAV ── */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.img
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={sp}
              src={logo} alt="Sahayam"
              className="h-8 w-auto drop-shadow-[0_0_12px_rgba(255,74,28,0.6)]"
            />
            <span className="text-xl font-black italic tracking-tighter text-white">
              SAHA<span className="text-blazing-flame drop-shadow-[0_0_10px_rgba(255,74,28,0.8)]">YAM.</span>
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-2">
            <Link to="/login" className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/50 hover:text-white hover:bg-white/8 transition-all">
              Sign In
            </Link>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Link to={registerLink} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black bg-blazing-flame text-white shadow-lg shadow-blazing-flame/30 hover:shadow-blazing-flame/50 hover:-translate-y-0.5 transition-all uppercase tracking-widest">
                Get Started <FaArrowRight className="text-xs" />
              </Link>
            </motion.div>
          </nav>

          <Link to={registerLink} className="sm:hidden flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-blazing-flame text-white shadow-md shadow-blazing-flame/30">
            Join <FaArrowRight />
          </Link>
        </div>
      </header>

      {/* ══════════════════════════════════════════
          HERO — FULL SCREEN AURORA + CRAZY REVEAL
      ══════════════════════════════════════════ */}
      <section className="relative min-h-screen aurora-bg flex flex-col items-center justify-center px-5 pt-20 pb-16 overflow-hidden">
        <div className="dark-dot-grid absolute inset-0 opacity-20 pointer-events-none" />

        {/* Floating blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[15%] -left-40 h-[28rem] w-[28rem] rounded-full bg-blazing-flame/12 blur-[130px] float-gentle" />
          <div className="absolute bottom-[15%] -right-40 h-96 w-96 rounded-full bg-pine-teal/15 blur-[110px] float-delay" />
          <div className="absolute top-[60%] left-[30%] h-72 w-72 rounded-full bg-dark-raspberry/12 blur-[90px] float-slow" />
        </div>

        {/* ── Opening reveal sequence ── */}
        <motion.div
          variants={heroWrap}
          initial="hidden"
          animate="show"
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          {/* Animated logo with pulse rings */}
          <motion.div variants={heroEl} className="mb-8 flex justify-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {/* Expanding rings */}
              {[0, 0.5, 1].map((delay) => (
                <motion.span
                  key={delay}
                  className="absolute inset-0 rounded-full border border-blazing-flame/40"
                  animate={{ scale: [1, 2.4], opacity: [0.7, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay, ease: "easeOut" }}
                />
              ))}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-dashed border-white/10"
              />
              <Link to="/">
                <motion.img
                  whileHover={{ scale: 1.15, rotate: -8 }}
                  transition={sp}
                  src={logo} alt="Sahayam"
                  className="h-14 w-auto relative z-10 drop-shadow-[0_0_28px_rgba(255,74,28,0.9)]"
                />
              </Link>
            </div>
          </motion.div>

          {/* Status badge */}
          <motion.div variants={heroEl} className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-blazing-flame/30 bg-blazing-flame/10 backdrop-blur-md px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blazing-flame opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blazing-flame" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-white/80">Community Network · Active</span>
          </motion.div>

          {/* Headline line 1 */}
          <motion.h1
            variants={heroEl}
            className="text-[clamp(2.8rem,9vw,5.8rem)] font-black leading-[1.02] tracking-[-0.04em] text-white"
          >
            Help is closer
          </motion.h1>

          {/* Headline line 2 — gradient aurora text */}
          <motion.div
            variants={heroEl}
            className="text-[clamp(2.8rem,9vw,5.8rem)] font-black leading-[1.02] tracking-[-0.04em] mb-7"
          >
            <span className="gradient-text-aurora">than you think.</span>
          </motion.div>

          {/* Sub */}
          <motion.p
            variants={heroEl}
            className="mx-auto max-w-xl text-lg font-medium text-white/45 leading-relaxed mb-10"
          >
            Sahayam connects blood donors, community volunteers, and people in need —
            instantly, securely, and for free. Because every second counts.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={heroEl} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <motion.div whileTap={{ scale: 0.96 }}>
              <Link
                to={registerLink}
                className="ripple-btn group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-blazing-flame text-white text-sm font-black uppercase tracking-widest shadow-2xl shadow-blazing-flame/40 hover:shadow-blazing-flame/60 hover:-translate-y-1.5 transition-all duration-300"
              >
                <FaHeartbeat className="animate-pulse" />
                Join Sahayam
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/15 bg-white/6 text-white text-sm font-bold hover:bg-white/12 hover:-translate-y-0.5 transition-all"
            >
              Sign In
            </Link>
          </motion.div>

          {/* Trust pills */}
          <motion.div variants={heroEl} className="flex flex-wrap items-center justify-center gap-2.5">
            {["Verified Members", "Real-Time SOS", "Free Forever", "NGO Supported"].map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-white/12 bg-white/6 text-[11px] font-bold text-white/45 backdrop-blur"
              >
                <FaCheckCircle className="text-pine-teal text-[9px]" />
                {tag}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll breath indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <motion.div
            animate={{ y: [0, 10, 0], opacity: [0.6, 0.2, 0.6] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent"
          />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/25 mt-1">Scroll</span>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES — dark glass cards
      ══════════════════════════════════════════ */}
      <section ref={featRef} className="py-24 md:py-32 bg-[#05110d]">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div {...fadeUp()} className="mb-16 text-center">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.3em] text-white/30">Why Sahayam</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Built for moments that<br className="hidden md:block" />
              <span className="gradient-text-aurora"> can't wait.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 40, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, y: 0, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.09 }}
                  className={`group relative overflow-hidden glass-dark rounded-3xl border ${feat.border} p-7 hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-500`}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "radial-gradient(circle at 70% 30%, rgba(255,74,28,0.04) 0%, transparent 70%)" }}
                  />
                  <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border ${feat.border} ${feat.bg}`}>
                    <Icon className={`text-2xl ${feat.color}`} />
                  </div>
                  <h3 className="mb-3 text-xl font-black tracking-tight text-white">{feat.title}</h3>
                  <p className="text-sm font-medium leading-relaxed text-white/45">{feat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS — aurora tinted
      ══════════════════════════════════════════ */}
      <section className="py-24 md:py-32 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #05110d 0%, #081410 50%, #05110d 100%)" }}>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full bg-pine-teal/8 blur-[120px]" />
          <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-dark-raspberry/8 blur-[120px]" />
        </div>

        <div className="mx-auto max-w-5xl px-5 relative z-10">
          <motion.div {...fadeUp()} className="mb-16 text-center">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.3em] text-white/30">How It Works</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              Three steps to <span className="gradient-text-aurora">support.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            <div className="hidden md:block absolute top-14 left-[calc(33%+1.5rem)] right-[calc(33%+1.5rem)] h-px bg-gradient-to-r from-blazing-flame/30 via-pine-teal/30 to-dark-raspberry/30" />

            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                {...fadeUp(i * 0.12)}
                className={`relative glass-dark rounded-3xl border ${step.border} ${step.glow} p-8 text-center hover:-translate-y-2 hover:shadow-2xl transition-all duration-500`}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={sp}
                  className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border ${step.border} bg-white/5 font-black text-sm ${step.accent}`}
                >
                  {step.n}
                </motion.div>
                <h3 className="mb-3 text-lg font-black tracking-tight text-white">{step.title}</h3>
                <p className="text-sm font-medium leading-relaxed text-white/40">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          EMERGENCY CTA
      ══════════════════════════════════════════ */}
      <section className="py-8 px-5 bg-[#05110d]">
        <div className="mx-auto max-w-5xl">
          <motion.div
            {...fadeUp()}
            className="relative overflow-hidden rounded-3xl aurora-header p-10 md:p-16 text-center"
          >
            <div className="dark-dot-grid absolute inset-0 opacity-15" />
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blazing-flame/20 blur-3xl float-gentle" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-dark-raspberry/20 blur-3xl float-delay" />

            <div className="relative z-10">
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-blazing-flame/40 bg-blazing-flame/15 px-4 py-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blazing-flame opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-blazing-flame" />
                </span>
                <span className="text-[11px] font-black uppercase tracking-widest text-white">Emergency System Active</span>
              </div>

              <h2 className="mb-4 text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Someone near you might<br className="hidden md:block" /> need blood right now.
              </h2>
              <p className="mx-auto mb-8 max-w-xl text-base font-medium leading-relaxed text-white/55">
                Join the Sahayam network to receive SOS alerts for your blood type. Your registration could save a life within minutes.
              </p>
              <motion.div whileTap={{ scale: 0.96 }}>
                <Link
                  to={registerLink}
                  className="ripple-btn inline-flex items-center gap-2.5 rounded-2xl bg-blazing-flame px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-blazing-flame/40 hover:bg-[#e03d10] hover:-translate-y-1 hover:shadow-blazing-flame/60 transition-all duration-300"
                >
                  <FaHeartbeat className="animate-pulse" />
                  Join the Network
                  <FaArrowRight />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TRUST
      ══════════════════════════════════════════ */}
      <section className="py-24 bg-[#05110d]">
        <div className="mx-auto max-w-5xl px-5">
          <motion.div {...fadeUp()} className="mb-14 text-center">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Why communities <span className="gradient-text-aurora">trust us</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: FaShieldAlt, title: "Verified & Safe", desc: "Every member is identity-verified. NGO accounts undergo manual review before activation." },
              { icon: FaBell, title: "Instant Alerts", desc: "Push notifications and email SOS blasts reach you the moment an emergency matches your profile." },
              { icon: FaUsers, title: "Community-First", desc: "No ads. No data selling. Sahayam is built for the community, by the community." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  {...fadeUp(i * 0.1)}
                  className="group flex flex-col items-center text-center p-8 glass-dark rounded-3xl border border-white/8 hover:border-white/16 hover:-translate-y-1.5 transition-all duration-400"
                >
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: -8 }}
                    transition={sp}
                    className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-dark-raspberry/15 text-dark-raspberry border border-dark-raspberry/25"
                  >
                    <Icon className="text-xl" />
                  </motion.div>
                  <h3 className="mb-2 text-base font-black text-white">{item.title}</h3>
                  <p className="text-sm font-medium leading-relaxed text-white/40">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/6 py-12 bg-[#03090a]">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Sahayam" className="h-7 w-auto drop-shadow-[0_0_8px_rgba(255,74,28,0.4)]" />
              <span className="text-lg font-black italic tracking-tighter text-white/80">
                SAHA<span className="text-blazing-flame">YAM.</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <Link to="/terms"   className="text-sm font-medium text-white/30 hover:text-white/60 transition-colors">Terms</Link>
              <Link to="/privacy" className="text-sm font-medium text-white/30 hover:text-white/60 transition-colors">Privacy</Link>
              <a href="mailto:support@sahayam.com" className="text-sm font-medium text-white/30 hover:text-white/60 transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-white/6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs font-medium text-white/20">Built with care for communities that care for each other.</p>
            <p className="text-xs font-medium text-white/15">© {new Date().getFullYear()} Sahayam</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
