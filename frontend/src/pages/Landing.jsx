import { useContext, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  FaArrowRight, FaTint, FaShieldAlt, FaLock, FaBolt, FaCheck,
  FaHeartbeat, FaMapMarkerAlt, FaComments,
} from "react-icons/fa";
import AuthContext from "../context/AuthContext";
import logo from "../assets/logo.png";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1], delay },
});

const Wordmark = ({ className = "" }) => (
  <span className={`font-display font-semibold italic tracking-tight ${className}`}>
    Saha<span className="text-dark-raspberry">yam</span>
  </span>
);

const FEATURES = [
  {
    icon: FaBolt,
    title: "Matched in seconds",
    desc: "Post one SOS and the nearest matching donors are alerted at once — no chasing numbers, no forwarding the same message ten times.",
  },
  {
    icon: FaShieldAlt,
    title: "Only the right donors",
    desc: "We reach only donors whose group is compatible and who are eligible to give today. No false hope, no wasted calls.",
  },
  {
    icon: FaTint,
    title: "We don't stop until you're covered",
    desc: "Hospital asking for 3 replacement donors? The search keeps widening, ring by ring, until enough people confirm.",
  },
  {
    icon: FaLock,
    title: "Private by default",
    desc: "Coordinate in a secure in-app chat. Your number stays yours — never dropped into a public group.",
  },
];

const STEPS = [
  { icon: FaMapMarkerAlt, n: "01", title: "Raise an SOS", desc: "Drop your location, blood group, hospital and how many donors you need." },
  { icon: FaHeartbeat, n: "02", title: "Donors are alerted", desc: "Compatible, eligible donors nearby get pinged the instant you post." },
  { icon: FaComments, n: "03", title: "Coordinate & donate", desc: "Confirm donors privately, meet at the hospital, and help in time." },
];

// Donor pins scattered around the radar (percent positions + animation delays).
const PINS = [
  { top: "20%", left: "30%", d: 0.2 },
  { top: "32%", left: "70%", d: 0.6 },
  { top: "64%", left: "24%", d: 1.0 },
  { top: "70%", left: "62%", d: 0.4 },
  { top: "50%", left: "82%", d: 0.8 },
];

// Rings carry the real escalation radii from the engine (5 / 15 / 50 km).
const RINGS = [
  { s: 0.84, label: "50 km", top: "8%" },
  { s: 0.56, label: "15 km", top: "22%" },
  { s: 0.3, label: "5 km", top: "35%" },
];

/* ── Live-radar hero visual: previews the actual product ── */
const RadarPreview = () => (
  <div className="relative mx-auto aspect-square w-full max-w-[400px]">
    {/* glow */}
    <div className="absolute inset-0 rounded-full bg-dark-raspberry/10 blur-3xl" />

    {/* radar dish */}
    <div className="absolute inset-3 rounded-full border border-pine-teal/12 bg-gradient-to-br from-surface to-pearl-beige shadow-[0_30px_80px_-20px_rgba(26,54,48,0.35)] overflow-hidden">
      {/* crosshair */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-pine-teal/8" />
      <div className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 bg-pine-teal/8" />

      {/* concentric rings + radius labels */}
      {RINGS.map((r) => (
        <div key={r.label}>
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-pine-teal/12"
            style={{ width: `${r.s * 100}%`, height: `${r.s * 100}%` }} />
          <span
            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-pearl-beige/80 px-1.5 text-[8px] font-bold uppercase tracking-wider text-pine-teal/45"
            style={{ top: r.top }}>
            {r.label}
          </span>
        </div>
      ))}

      {/* rotating radar sweep */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
        className="absolute inset-0 rounded-full opacity-25"
        style={{ background: "conic-gradient(from 0deg, var(--color-dark-raspberry) 0deg, transparent 80deg)" }} />

      {/* center — the requester */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-2xl bg-pine-teal text-white shadow-lg">
        <FaTint className="text-lg" />
      </div>

      {/* donor pins */}
      {PINS.map((p, i) => (
        <motion.div key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 + p.d, type: "spring", stiffness: 320, damping: 18 }}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ top: p.top, left: p.left }}>
          <span className="relative flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-dark-raspberry/50 animate-ping" style={{ animationDelay: `${p.d}s` }} />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-dark-raspberry border-2 border-surface" />
          </span>
        </motion.div>
      ))}
    </div>
  </div>
);

const Landing = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  const registerLink = refCode ? `/register?ref=${refCode}` : "/register";

  useEffect(() => {
    if (user?.token) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-pearl-beige text-pine-teal font-sans overflow-x-hidden antialiased">
      <Helmet>
        <title>Sahayam — find a blood donor, closer than you think</title>
        <meta name="description" content="A real-time network that connects blood emergencies with verified, compatible donors nearby. Raise an SOS and reach the right donors in seconds — not in frantic group chats." />
      </Helmet>

      {/* ── NAV ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-pearl-beige/80 backdrop-blur-md border-b border-pine-teal/8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <img src={logo} alt="Sahayam" className="h-7 w-auto shrink-0" />
            <Wordmark className="text-lg text-pine-teal" />
          </Link>
          <nav className="flex items-center gap-1.5">
            <Link to="/login" className="px-3 py-2 rounded-lg text-sm font-medium text-pine-teal/60 hover:text-pine-teal hover:bg-surface transition-colors">
              Sign in
            </Link>
            <Link to={registerLink} className="flex items-center gap-1.5 rounded-lg bg-pine-teal px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2f5a47]">
              Get started <FaArrowRight className="text-[11px]" />
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative px-5 pt-28 pb-16 sm:pt-32 lg:pt-36">
        {/* ambient gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-dark-raspberry/12 blur-3xl" />
          <div className="absolute top-40 -left-24 h-96 w-96 rounded-full bg-pine-teal/10 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          {/* copy */}
          <div className="text-center lg:text-left">
            <motion.div {...fadeUp(0)}
              className="inline-flex items-center gap-2 rounded-full border border-pine-teal/12 bg-surface px-3 py-1 text-[12px] font-medium text-pine-teal/65">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-dark-raspberry opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-dark-raspberry" />
              </span>
              When minutes decide everything
            </motion.div>

            <motion.h1 {...fadeUp(0.08)}
              className="mt-6 font-display text-[clamp(2.6rem,6.5vw,4.25rem)] font-semibold leading-[1.03] tracking-tight text-pine-teal">
              Blood, found in minutes.<br />
              <span className="bg-gradient-to-r from-dark-raspberry to-[#9a7bc8] bg-clip-text text-transparent">
                Not in frantic group chats.
              </span>
            </motion.h1>

            <motion.p {...fadeUp(0.16)}
              className="mx-auto lg:mx-0 mt-6 max-w-xl text-[17px] leading-relaxed text-pine-teal/60">
              When someone you love needs blood, every minute counts. Sahayam instantly alerts
              verified, compatible donors right around you — and keeps reaching farther until
              enough say yes. No forwards, no dead ends, no waiting.
            </motion.p>

            <motion.div {...fadeUp(0.24)} className="mt-9 flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-3">
              <Link to={registerLink}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-dark-raspberry px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-dark-raspberry/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-dark-raspberry/30">
                Become a donor <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-pine-teal/15 bg-surface px-7 py-3.5 text-sm font-semibold text-pine-teal/75 transition-colors hover:text-pine-teal">
                I have an account
              </Link>
            </motion.div>

            <motion.div {...fadeUp(0.3)} className="mt-8 flex flex-wrap items-center lg:justify-start justify-center gap-x-6 gap-y-2 text-[13px] text-pine-teal/50">
              {["Verified donors", "Compatible-only", "100% free"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <FaCheck className="text-[10px] text-dark-raspberry" /> {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* radar visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="order-first lg:order-last">
            <RadarPreview />
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="relative px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp()} className="mx-auto max-w-xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-dark-raspberry/80">Why Sahayam</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-pine-teal">
              The fastest way to reach the right donor.
            </h2>
          </motion.div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} {...fadeUp(i * 0.06)}
                  className="group rounded-3xl border border-pine-teal/10 bg-surface p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-pine-teal/5">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-dark-raspberry to-[#9a7bc8] text-white shadow-md shadow-dark-raspberry/20 transition-transform group-hover:scale-110">
                    <Icon className="text-lg" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-pine-teal">{f.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-pine-teal/55">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeUp()} className="mx-auto max-w-xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-dark-raspberry/80">How it works</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-pine-teal">
              Three steps, minutes apart.
            </h2>
          </motion.div>

          <div className="relative mt-14 grid gap-5 md:grid-cols-3">
            {/* connecting line */}
            <div className="pointer-events-none absolute left-0 right-0 top-7 hidden md:block">
              <div className="mx-auto h-px max-w-3xl bg-gradient-to-r from-transparent via-pine-teal/15 to-transparent" />
            </div>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div key={s.n} {...fadeUp(i * 0.1)} className="relative text-center">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-pine-teal/10 bg-surface text-dark-raspberry shadow-sm">
                    <Icon className="text-xl" />
                  </div>
                  <span className="font-display text-sm font-bold text-dark-raspberry/40">{s.n}</span>
                  <h3 className="mt-1 font-display text-lg font-semibold text-pine-teal">{s.title}</h3>
                  <p className="mx-auto mt-1.5 max-w-xs text-[14px] leading-relaxed text-pine-teal/55">{s.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-5 py-20">
        <motion.div {...fadeUp()}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-pine-teal to-[#13312a] px-8 py-16 sm:px-14 text-center shadow-2xl shadow-pine-teal/20">
          {/* decorative glow */}
          <div className="pointer-events-none absolute -top-20 -right-10 h-64 w-64 rounded-full bg-dark-raspberry/25 blur-3xl" />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-[2.75rem] font-semibold tracking-tight text-white leading-tight">
              Somewhere near you, a family is waiting.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-white/70">
              It takes a minute to register. The next time a matching request appears nearby,
              we'll let you know — and you could be the reason a family gets to breathe again.
            </p>
            <Link to={registerLink}
              className="mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-semibold text-pine-teal shadow-lg transition-transform hover:-translate-y-0.5">
              Become a donor <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-pine-teal/8 px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Sahayam" className="h-6 w-auto" />
            <Wordmark className="text-base text-pine-teal" />
          </div>
          <div className="flex flex-wrap gap-x-7 gap-y-2">
            <Link to="/terms" className="text-sm font-medium text-pine-teal/45 hover:text-pine-teal transition-colors">Terms</Link>
            <Link to="/privacy" className="text-sm font-medium text-pine-teal/45 hover:text-pine-teal transition-colors">Privacy</Link>
            <a href="mailto:support@sahayam.com" className="text-sm font-medium text-pine-teal/45 hover:text-pine-teal transition-colors">Contact</a>
          </div>
          <p className="text-xs font-medium text-pine-teal/35">© {new Date().getFullYear()} Sahayam</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
