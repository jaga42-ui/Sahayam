import { useContext, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  FaTint, FaMapMarkerAlt, FaComments, FaHeart,
  FaArrowRight, FaShieldAlt, FaBell, FaUsers,
} from "react-icons/fa";
import AuthContext from "../context/AuthContext";
import logo from "../assets/logo.png";

const sp = { type: "spring", stiffness: 280, damping: 22 };

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay },
});

const FEATURES = [
  {
    icon: FaTint, accent: "text-dark-raspberry", soft: "bg-dark-raspberry/10",
    title: "Find blood, fast",
    desc: "Send one alert and nearby matching donors hear you within seconds.",
  },
  {
    icon: FaMapMarkerAlt, accent: "text-pine-teal", soft: "bg-pine-teal/10",
    title: "Help that's nearby",
    desc: "A gentle live map of people offering and asking for help around you.",
  },
  {
    icon: FaComments, accent: "text-blazing-flame", soft: "bg-blazing-flame/10",
    title: "Talk in private",
    desc: "A calm, secure chat. Your details stay yours until you choose to share.",
  },
  {
    icon: FaHeart, accent: "text-dark-raspberry", soft: "bg-dark-raspberry/10",
    title: "Kindness, counted",
    desc: "Every act of help is remembered, celebrated, and gently rewarded.",
  },
];

const STEPS = [
  { n: "01", title: "Ask or offer", desc: "Tell us what you need, or what you can give. We find your spot on the map." },
  { n: "02", title: "Get matched", desc: "The closest, kindest neighbours are notified right away." },
  { n: "03", title: "Meet & help", desc: "Coordinate safely, confirm, and complete the moment of help." },
];

const TRUST = [
  { icon: FaShieldAlt, title: "Safe by design", desc: "Members are verified, and partner organisations are reviewed by hand." },
  { icon: FaBell, title: "You'll know in time", desc: "Quiet, timely alerts reach you the moment something matches you." },
  { icon: FaUsers, title: "For the community", desc: "No ads. No selling your data. Built for people, by people." },
];

const Landing = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  const registerLink = refCode ? `/register?ref=${refCode}` : "/register";

  useEffect(() => {
    if (user?.token) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const Wordmark = ({ className = "" }) => (
    <span className={`font-display font-semibold italic tracking-tightest ${className}`}>
      Saha<span className="text-dark-raspberry">yam</span>
    </span>
  );

  return (
    <div className="min-h-screen bg-pearl-beige text-pine-teal font-sans overflow-x-hidden">
      <Helmet>
        <title>Sahayam — help, closer than you think</title>
        <meta name="description" content="A calm, community-first network for asking for help and showing up for each other." />
      </Helmet>

      {/* ── NAV ── */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 gap-2">
          <Link to="/" className="flex items-center gap-2 group min-w-0">
            <motion.img whileHover={{ scale: 1.08, rotate: -4 }} transition={sp}
              src={logo} alt="Sahayam" className="h-7 sm:h-8 w-auto shrink-0" />
            <Wordmark className="text-lg sm:text-xl text-pine-teal" />
          </Link>

          <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link to="/login" className="px-3 sm:px-4 py-2.5 rounded-xl text-sm font-semibold text-pine-teal/60 hover:text-pine-teal hover:bg-surface transition-all whitespace-nowrap">
              Sign in
            </Link>
            <motion.div whileTap={{ scale: 0.96 }}>
              <Link to={registerLink} className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold bg-pine-teal text-white shadow-teal hover:-translate-y-0.5 transition-all whitespace-nowrap">
                <span className="sm:hidden">Join</span>
                <span className="hidden sm:inline">Get started</span>
                <FaArrowRight className="text-xs" />
              </Link>
            </motion.div>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-24 pb-16 overflow-hidden">
        <div className="landing-dot-grid absolute inset-0 opacity-60 pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-[12%] -left-32 h-96 w-96 rounded-full bg-pine-teal/10 blur-[120px] float-gentle" />
          <div className="absolute bottom-[12%] -right-32 h-96 w-96 rounded-full bg-blazing-flame/10 blur-[120px] float-delay" />
          <div className="absolute top-[55%] left-[28%] h-72 w-72 rounded-full bg-dark-raspberry/8 blur-[100px] float-slow" />
        </div>

        <motion.div
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }}
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          {/* Animated logo */}
          <motion.div variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: sp } }} className="mb-9 flex justify-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {[0, 0.6, 1.2].map((d) => (
                <motion.span key={d} className="absolute inset-0 rounded-full border border-pine-teal/25"
                  animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, delay: d, ease: "easeOut" }} />
              ))}
              <motion.img src={logo} alt="Sahayam"
                animate={{ scale: [1, 1.05, 1], rotate: [0, 2, 0, -2, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="h-14 w-auto relative z-10 drop-shadow-[0_8px_22px_rgba(110,79,160,0.25)]" />
            </div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
            className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-border bg-surface px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pine-teal opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-pine-teal" />
            </span>
            <span className="text-[11px] font-semibold tracking-wide text-pine-teal/70">A community that shows up</span>
          </motion.div>

          <motion.h1 variants={{ hidden: { opacity: 0, y: 24, filter: "blur(8px)" }, show: { opacity: 1, y: 0, filter: "blur(0px)", transition: sp } }}
            className="font-display text-[clamp(2.6rem,8vw,5rem)] font-semibold leading-[1.05] tracking-tightest text-pine-teal">
            Help, closer<br />
            than <span className="italic gradient-text">you think.</span>
          </motion.h1>

          <motion.p variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
            className="mx-auto mt-7 max-w-lg text-lg font-medium text-pine-teal/55 leading-relaxed">
            Sahayam quietly connects neighbours who need help with the people nearby
            ready to give it. Simple, safe, and always free.
          </motion.p>

          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <motion.div whileTap={{ scale: 0.96 }}>
              <Link to={registerLink}
                className="ripple-btn group inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-pine-teal text-white text-sm font-bold shadow-teal hover:-translate-y-1 transition-all duration-300">
                <FaHeart className="text-blazing-flame" />
                Join Sahayam
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <Link to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-border bg-surface text-pine-teal text-sm font-semibold hover:-translate-y-0.5 transition-all">
              I already have an account
            </Link>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }}
            className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
            {["Verified members", "Real-time alerts", "Free forever", "NGO friendly"].map((tag) => (
              <span key={tag} className="px-3.5 py-1.5 rounded-full border border-border bg-surface/70 text-[11px] font-semibold text-pine-teal/55">
                {tag}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 md:py-28">
        <div className="mx-auto max-w-6xl px-5">
          <motion.div {...fadeUp()} className="mb-14 text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-dusty-lavender">Why Sahayam</p>
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tightest text-pine-teal leading-tight">
              Built for the moments<br className="hidden md:block" /> that <span className="italic gradient-text">matter most.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} {...fadeUp(i * 0.08)}
                  className="group rounded-3xl border border-border bg-surface p-7 hover:-translate-y-1 hover:shadow-teal transition-all duration-400">
                  <div className={`mb-5 inline-flex h-13 w-13 items-center justify-center rounded-2xl ${f.soft}`} style={{ height: "3.25rem", width: "3.25rem" }}>
                    <Icon className={`text-xl ${f.accent}`} />
                  </div>
                  <h3 className="mb-2 font-display text-xl font-semibold text-pine-teal">{f.title}</h3>
                  <p className="text-sm font-medium leading-relaxed text-pine-teal/55">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 md:py-28 bg-surface-2/60">
        <div className="mx-auto max-w-5xl px-5">
          <motion.div {...fadeUp()} className="mb-14 text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.25em] text-dusty-lavender">How it works</p>
            <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tightest text-pine-teal">
              Three gentle <span className="italic gradient-text">steps.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} {...fadeUp(i * 0.1)}
                className="rounded-3xl border border-border bg-surface p-8 text-center hover:-translate-y-1.5 transition-all duration-400">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-pine-teal/10 font-display text-lg font-semibold text-pine-teal">
                  {s.n}
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-pine-teal">{s.title}</h3>
                <p className="text-sm font-medium leading-relaxed text-pine-teal/55">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="py-10 px-5">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp()} className="relative overflow-hidden rounded-[2rem] aurora-header p-10 md:p-16 text-center">
            <div className="dark-dot-grid absolute inset-0 opacity-20" />
            <div className="relative z-10">
              <h2 className="font-display text-3xl md:text-5xl font-semibold tracking-tightest text-white leading-tight">
                Someone nearby may need<br className="hidden md:block" /> you today.
              </h2>
              <p className="mx-auto mt-5 mb-8 max-w-xl text-base font-medium leading-relaxed text-white/70">
                Join Sahayam and be the help that arrives in time. It takes a minute, and it's free.
              </p>
              <motion.div whileTap={{ scale: 0.96 }}>
                <Link to={registerLink}
                  className="ripple-btn inline-flex items-center gap-2.5 rounded-2xl bg-white px-8 py-4 text-sm font-bold text-pine-teal shadow-xl hover:-translate-y-1 transition-all duration-300">
                  <FaHeart className="text-dark-raspberry" />
                  Become a helper
                  <FaArrowRight />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── TRUST ── */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-5">
          <motion.div {...fadeUp()} className="mb-12 text-center">
            <h2 className="font-display text-2xl md:text-4xl font-semibold tracking-tightest text-pine-teal">
              Made to be <span className="italic gradient-text">trusted.</span>
            </h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TRUST.map((t, i) => {
              const Icon = t.icon;
              return (
                <motion.div key={t.title} {...fadeUp(i * 0.1)}
                  className="flex flex-col items-center text-center p-8 rounded-3xl border border-border bg-surface hover:-translate-y-1 transition-all duration-400">
                  <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl bg-dark-raspberry/10 text-dark-raspberry" style={{ height: "3.25rem", width: "3.25rem" }}>
                    <Icon className="text-xl" />
                  </div>
                  <h3 className="mb-2 font-display text-base font-semibold text-pine-teal">{t.title}</h3>
                  <p className="text-sm font-medium leading-relaxed text-pine-teal/55">{t.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-border py-12">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="Sahayam" className="h-7 w-auto" />
              <Wordmark className="text-lg text-pine-teal" />
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <Link to="/terms" className="text-sm font-medium text-pine-teal/45 hover:text-pine-teal transition-colors">Terms</Link>
              <Link to="/privacy" className="text-sm font-medium text-pine-teal/45 hover:text-pine-teal transition-colors">Privacy</Link>
              <a href="mailto:support@sahayam.com" className="text-sm font-medium text-pine-teal/45 hover:text-pine-teal transition-colors">Contact</a>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <p className="text-xs font-medium text-pine-teal/40">Built with care, for communities that care for each other.</p>
            <p className="text-xs font-medium text-pine-teal/30">© {new Date().getFullYear()} Sahayam</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
