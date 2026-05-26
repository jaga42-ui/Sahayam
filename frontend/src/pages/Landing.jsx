import { useEffect, useContext, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, useInView } from "framer-motion";
import {
  FaHeartbeat, FaMapMarkerAlt, FaComments, FaBell,
  FaShieldAlt, FaArrowRight, FaUsers, FaTrophy,
  FaCheckCircle, FaBolt,
} from "react-icons/fa";
import AuthContext from "../context/AuthContext";
import logo from "../assets/logo.png";

/* ── Animation helpers ── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
});

const FEATURES = [
  {
    icon: FaHeartbeat,
    color: "text-blazing-flame",
    bg: "bg-blazing-flame/10",
    border: "border-blazing-flame/20",
    title: "Blood & SOS Matching",
    desc: "AI-powered cross-typing matches compatible donors within seconds. Radius auto-expands if no one responds.",
  },
  {
    icon: FaMapMarkerAlt,
    color: "text-pine-teal",
    bg: "bg-pine-teal/10",
    border: "border-pine-teal/20",
    title: "Real-Time Radar",
    desc: "Live map of nearby donors and active requests. Every pin is a verified community member ready to help.",
  },
  {
    icon: FaComments,
    color: "text-dark-raspberry",
    bg: "bg-dark-raspberry/10",
    border: "border-dark-raspberry/20",
    title: "Encrypted Secure Chat",
    desc: "End-to-end verified chat with PIN-based handoff verification. Your personal details stay private.",
  },
  {
    icon: FaTrophy,
    color: "text-dusty-lavender",
    bg: "bg-dusty-lavender/10",
    border: "border-dusty-lavender/20",
    title: "Community Rankings",
    desc: "Earn points for every act of help. Rise through the leaderboard. Certificates for milestone donors.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Post or Request",
    desc: "Share what you need — blood, food, clothes — or offer what you have. Location is auto-detected.",
    accent: "text-blazing-flame",
    border: "border-blazing-flame/30",
    bg: "bg-blazing-flame/8",
  },
  {
    n: "02",
    title: "Get Matched Instantly",
    desc: "Our algorithm finds the closest verified volunteers or compatible donors in your area within seconds.",
    accent: "text-pine-teal",
    border: "border-pine-teal/30",
    bg: "bg-pine-teal/8",
  },
  {
    n: "03",
    title: "Connect & Complete",
    desc: "Chat securely, coordinate the handoff, and confirm with a one-time PIN. Both sides earn community points.",
    accent: "text-dark-raspberry",
    border: "border-dark-raspberry/30",
    bg: "bg-dark-raspberry/8",
  },
];

const STATS = [
  { value: "2,400+", label: "Community Members", icon: FaUsers },
  { value: "< 3 min", label: "Avg. SOS Response", icon: FaBolt },
  { value: "95%", label: "Requests Fulfilled", icon: FaCheckCircle },
  { value: "50+", label: "Cities Active", icon: FaMapMarkerAlt },
];

const Landing = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  const registerLink = refCode ? `/register?ref=${refCode}` : "/register";

  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  useEffect(() => {
    if (user?.token) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-pearl-beige text-pine-teal font-sans overflow-x-hidden">
      <Helmet>
        <title>Sahayam — No one should face hardship alone.</title>
        <meta name="description" content="A trusted community network where people can ask for help, support others, and stay connected during difficult moments." />
      </Helmet>

      {/* ── NAV ── */}
      <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-pearl-beige/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img src={logo} alt="Sahayam" className="h-8 w-auto group-hover:scale-110 transition-transform duration-300" />
            <span className="text-xl font-black italic tracking-tighter text-pine-teal">
              SAHA<span className="text-blazing-flame">YAM.</span>
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-2">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-pine-teal/70 hover:text-pine-teal hover:bg-surface transition-all"
            >
              Sign In
            </Link>
            <Link
              to={registerLink}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-pine-teal text-white shadow-lg shadow-pine-teal/25 hover:bg-pine-teal/90 hover:shadow-pine-teal/35 hover:-translate-y-0.5 transition-all"
            >
              Get Started <FaArrowRight className="text-xs" />
            </Link>
          </nav>

          {/* Mobile CTA */}
          <Link
            to={registerLink}
            className="sm:hidden flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-pine-teal text-white"
          >
            Join <FaArrowRight />
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36">
        {/* Background dots */}
        <div className="landing-dot-grid absolute inset-0 opacity-70 pointer-events-none" />

        {/* Glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-radial from-blazing-flame/10 via-dark-raspberry/6 to-transparent blur-3xl" />
          <div className="absolute top-40 -right-20 w-80 h-80 rounded-full bg-pine-teal/8 blur-3xl" />
          <div className="absolute bottom-0 left-10 w-60 h-60 rounded-full bg-dark-raspberry/6 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-5 text-center">
          {/* Status pill */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-blazing-flame/25 bg-surface/80 backdrop-blur-md px-4 py-2 shadow-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blazing-flame opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blazing-flame" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-widest text-pine-teal">
              Community Network · Active
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(2.8rem,8vw,5.5rem)] font-black leading-[1.05] tracking-[-0.04em] text-pine-teal mb-6"
          >
            Help is closer
            <br />
            <span className="relative inline-block">
              than you think.
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 12" fill="none">
                <path d="M2 8 Q100 2 200 8 Q300 14 398 8" stroke="#ff4a1c" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
              </svg>
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.22 }}
            className="mx-auto max-w-2xl text-lg md:text-xl font-medium text-pine-teal/70 leading-relaxed mb-10"
          >
            Sahayam connects blood donors, community volunteers, and people in need — instantly and securely. Because every second counts when life demands help.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          >
            <Link
              to={registerLink}
              className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-pine-teal text-white text-sm font-black uppercase tracking-widest shadow-xl shadow-pine-teal/30 hover:shadow-pine-teal/45 hover:-translate-y-1 transition-all duration-300"
            >
              <FaHeartbeat className="text-blazing-flame" />
              Join Sahayam
              <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-pine-teal/20 bg-surface/70 backdrop-blur text-pine-teal text-sm font-bold hover:border-pine-teal/40 hover:bg-surface hover:-translate-y-0.5 transition-all shadow-sm"
            >
              Sign In
            </Link>
          </motion.div>

          {/* Trust pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={heroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {["Verified Members", "Real-Time SOS", "Free Forever", "NGO Supported"].map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-pine-teal/15 bg-surface/60 text-[11px] font-bold text-pine-teal/70 backdrop-blur"
              >
                <FaCheckCircle className="text-pine-teal text-[10px]" />
                {tag}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="border-y border-black/[0.06] bg-surface py-16">
        <div className="mx-auto max-w-5xl px-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} {...fadeUp(i * 0.08)} className="text-center">
                  <Icon className="mx-auto mb-3 text-2xl text-blazing-flame" />
                  <p className="text-3xl md:text-4xl font-black tracking-tight text-pine-teal">{stat.value}</p>
                  <p className="mt-1.5 text-xs font-bold uppercase tracking-widest text-dusty-lavender">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div {...fadeUp()} className="mb-16 text-center">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.3em] text-dusty-lavender">Why Sahayam</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-pine-teal leading-tight">
              Built for moments that<br className="hidden md:block" /> can't wait.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  {...fadeUp(i * 0.1)}
                  className={`group relative overflow-hidden rounded-3xl border ${feat.border} bg-surface p-8 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500`}
                >
                  {/* Corner accent */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle, currentColor, transparent)` }} />

                  <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border ${feat.border} ${feat.bg}`}>
                    <Icon className={`text-2xl ${feat.color}`} />
                  </div>
                  <h3 className="mb-3 text-xl font-black tracking-tight text-pine-teal">{feat.title}</h3>
                  <p className="text-sm font-medium leading-relaxed text-pine-teal/65">{feat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-t border-black/[0.06] bg-surface py-24 md:py-32">
        <div className="mx-auto max-w-5xl px-5">
          <motion.div {...fadeUp()} className="mb-16 text-center">
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.3em] text-dusty-lavender">How It Works</p>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-pine-teal">
              Three steps to support.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[calc(33%+1.5rem)] right-[calc(33%+1.5rem)] h-px bg-gradient-to-r from-blazing-flame/30 via-pine-teal/30 to-dark-raspberry/30" />

            {STEPS.map((step, i) => (
              <motion.div
                key={step.n}
                {...fadeUp(i * 0.12)}
                className={`relative rounded-3xl border ${step.border} ${step.bg} p-8 text-center hover:-translate-y-1.5 hover:shadow-lg transition-all duration-400`}
              >
                <div className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface font-black text-sm ${step.accent} shadow-sm border ${step.border}`}>
                  {step.n}
                </div>
                <h3 className={`mb-3 text-lg font-black tracking-tight text-pine-teal`}>{step.title}</h3>
                <p className="text-sm font-medium leading-relaxed text-pine-teal/60">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMERGENCY BANNER ── */}
      <section className="py-8 px-5">
        <div className="mx-auto max-w-5xl">
          <motion.div
            {...fadeUp()}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-pine-teal via-pine-teal to-[#142e28] p-10 md:p-14 shadow-2xl shadow-pine-teal/30 text-center"
          >
            {/* Bg glows */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blazing-flame/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-dark-raspberry/15 blur-3xl" />

            {/* SOS badge */}
            <div className="relative mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-blazing-flame/40 bg-blazing-flame/15 px-4 py-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blazing-flame opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-blazing-flame" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-widest text-white">Emergency System Active</span>
            </div>

            <h2 className="relative mb-4 text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Someone near you might<br className="hidden md:block" /> need blood right now.
            </h2>
            <p className="relative mx-auto mb-8 max-w-xl text-base font-medium leading-relaxed text-white/70">
              Join the Sahayam network to receive SOS alerts for your blood type. Your registration could save a life within minutes.
            </p>
            <Link
              to={registerLink}
              className="relative inline-flex items-center gap-2.5 rounded-2xl bg-blazing-flame px-8 py-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-blazing-flame/35 hover:bg-[#e03d10] hover:-translate-y-1 hover:shadow-blazing-flame/50 transition-all duration-300"
            >
              <FaHeartbeat className="animate-pulse" />
              Join the Network
              <FaArrowRight />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST ROW ── */}
      <section className="border-t border-black/[0.06] bg-surface py-20">
        <div className="mx-auto max-w-5xl px-5">
          <motion.div {...fadeUp()} className="mb-12 text-center">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-pine-teal">Why communities trust us</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: FaShieldAlt, title: "Verified & Safe", desc: "Every member is identity-verified. NGO accounts undergo manual review before activation." },
              { icon: FaBell, title: "Instant Alerts", desc: "Push notifications and email SOS blasts reach you the moment an emergency matches your profile." },
              { icon: FaUsers, title: "Community-First", desc: "No ads. No data selling. Sahayam is built for the community, by the community." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.title} {...fadeUp(i * 0.1)} className="flex flex-col items-center text-center p-8 rounded-3xl border border-pine-teal/10 bg-surface-2 hover:border-pine-teal/20 hover:-translate-y-1 transition-all">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-dark-raspberry/10 text-dark-raspberry border border-dark-raspberry/15">
                    <Icon className="text-xl" />
                  </div>
                  <h3 className="mb-2 text-base font-black text-pine-teal">{item.title}</h3>
                  <p className="text-sm font-medium leading-relaxed text-pine-teal/60">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-black/[0.06] py-12 bg-pearl-beige">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Sahayam" className="h-7 w-auto" />
              <span className="text-lg font-black italic tracking-tighter text-pine-teal">
                SAHA<span className="text-blazing-flame">YAM.</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <Link to="/terms" className="text-sm font-medium text-pine-teal/50 hover:text-pine-teal transition-colors">Terms</Link>
              <Link to="/privacy" className="text-sm font-medium text-pine-teal/50 hover:text-pine-teal transition-colors">Privacy</Link>
              <a href="mailto:support@sahayam.com" className="text-sm font-medium text-pine-teal/50 hover:text-pine-teal transition-colors">Contact</a>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-black/[0.05] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs font-medium text-pine-teal/40">
              Built with care for communities that care for each other.
            </p>
            <p className="text-xs font-medium text-pine-teal/30">© {new Date().getFullYear()} Sahayam</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
