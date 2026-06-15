import { useContext, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  FaArrowRight, FaTint, FaShieldAlt, FaLock, FaBolt, FaCheck,
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
    desc: "Raise one SOS and the nearest donors are alerted instantly — faster than any WhatsApp forward.",
  },
  {
    icon: FaShieldAlt,
    title: "Only the right donors",
    desc: "We ping donors whose blood group is compatible and who are actually eligible to donate right now.",
  },
  {
    icon: FaTint,
    title: "Widens until covered",
    desc: "Need several replacement donors? The search keeps expanding until enough people confirm.",
  },
  {
    icon: FaLock,
    title: "Private by default",
    desc: "Coordinate in a secure chat. Your phone number is never exposed in a public forward.",
  },
];

const STEPS = [
  { n: "01", title: "Raise an SOS", desc: "Enter the blood group, hospital and how many donors you need. We pin your location." },
  { n: "02", title: "Donors are alerted", desc: "Compatible, eligible donors near you get notified the moment you post." },
  { n: "03", title: "Coordinate & donate", desc: "Confirm donors in a private chat, meet at the hospital, and help in time." },
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

  return (
    <div className="min-h-screen bg-pearl-beige text-pine-teal font-sans overflow-x-hidden antialiased">
      <Helmet>
        <title>Sahayam — find a blood donor, closer than you think</title>
        <meta name="description" content="A real-time network that connects blood emergencies with verified, compatible donors nearby. Raise an SOS and reach the right donors in seconds." />
      </Helmet>

      {/* ── NAV ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-pearl-beige/80 backdrop-blur-md border-b border-pine-teal/8">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
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
      <section className="relative px-5 pt-32 pb-20 sm:pt-36 sm:pb-24">
        <div className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* copy */}
          <div>
            <motion.div {...fadeUp(0)}
              className="inline-flex items-center gap-2 rounded-full border border-pine-teal/12 bg-surface px-3 py-1 text-[12px] font-medium text-pine-teal/65">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-dark-raspberry opacity-60 animate-ping" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-dark-raspberry" />
              </span>
              Blood, when minutes matter
            </motion.div>

            <motion.h1 {...fadeUp(0.06)}
              className="mt-5 font-display text-[clamp(2.4rem,6vw,3.75rem)] font-semibold leading-[1.05] tracking-tight text-pine-teal">
              Find a blood donor,<br />
              <span className="text-dark-raspberry">closer than you think.</span>
            </motion.h1>

            <motion.p {...fadeUp(0.12)}
              className="mt-5 max-w-md text-[16px] leading-relaxed text-pine-teal/55">
              When a family needs blood, every minute counts. Sahayam alerts verified,
              compatible donors nearby in seconds — and keeps widening the search until
              enough confirm.
            </motion.p>

            <motion.div {...fadeUp(0.18)} className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3">
              <Link to={registerLink}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-dark-raspberry px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#5e4585]">
                Become a donor <FaArrowRight className="text-xs" />
              </Link>
              <Link to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-pine-teal/15 bg-surface px-6 py-3.5 text-sm font-semibold text-pine-teal/75 transition-colors hover:text-pine-teal">
                I have an account
              </Link>
            </motion.div>

            <motion.div {...fadeUp(0.24)} className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-pine-teal/50">
              {["Verified donors", "Compatible match", "Free forever"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                  <FaCheck className="text-[10px] text-dark-raspberry" /> {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* product visual: a live request card */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="relative mx-auto w-full max-w-sm">
            {/* soft glow */}
            <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-dark-raspberry/5 blur-2xl" />

            <div className="relative rounded-3xl border border-pine-teal/10 bg-surface p-5 shadow-[0_24px_60px_-20px_rgba(59,107,84,0.22)]">
              <div className="h-0.5 w-full rounded-full bg-[#d6453f] mb-4" />
              <div className="flex items-start gap-3.5">
                <div className="shrink-0 h-14 w-14 rounded-2xl border border-[#d6453f]/30 bg-[#d6453f]/[0.06] flex flex-col items-center justify-center text-[#c0392b]">
                  <span className="text-base font-bold leading-none">O−</span>
                  <span className="text-[8px] font-semibold uppercase tracking-[0.15em] mt-1 opacity-60">blood</span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#c0392b]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-[#d6453f] opacity-60 animate-ping" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#d6453f]" />
                    </span>
                    Urgent
                  </span>
                  <h3 className="mt-1 font-display text-[15px] font-semibold text-pine-teal leading-snug">
                    O− needed at Fortis Hospital
                  </h3>
                  <p className="mt-1 text-[13px] text-pine-teal/55">Whitefield · 2.1 km away</p>
                </div>
              </div>

              {/* coverage */}
              <div className="mt-4 rounded-2xl border border-pine-teal/8 bg-surface-2 p-3.5">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-pine-teal/50">Replacement donors</span>
                  <span className="font-semibold text-pine-teal">2 of 3 confirmed</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-pine-teal/10 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: "66%" }}
                    transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
                    className="h-full rounded-full bg-dark-raspberry" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {["#3b6b54", "#6e4fa0", "#d6453f"].map((c, i) => (
                    <div key={i} className="h-7 w-7 rounded-full border-2 border-surface" style={{ background: c }} />
                  ))}
                </div>
                <span className="text-[12px] text-pine-teal/55">+1 donor on the way</span>
                <span className="ml-auto rounded-lg bg-[#d6453f] px-3 py-1.5 text-[12px] font-semibold text-white">Respond</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="border-t border-pine-teal/8 px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp()} className="max-w-xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-dark-raspberry/80">Why Sahayam</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-pine-teal">
              Built for the moments that matter most.
            </h2>
          </motion.div>

          <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} {...fadeUp(i * 0.06)} className="flex gap-4">
                  <div className="shrink-0 h-11 w-11 flex items-center justify-center rounded-xl border border-pine-teal/12 bg-surface text-dark-raspberry">
                    <Icon className="text-base" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-pine-teal">{f.title}</h3>
                    <p className="mt-1.5 text-[14px] leading-relaxed text-pine-teal/55">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-t border-pine-teal/8 bg-surface/40 px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <motion.div {...fadeUp()} className="max-w-xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-dark-raspberry/80">How it works</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-pine-teal">
              Three steps, minutes apart.
            </h2>
          </motion.div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} {...fadeUp(i * 0.08)}
                className="rounded-2xl border border-pine-teal/10 bg-surface p-6">
                <span className="font-display text-2xl font-semibold text-dark-raspberry/30">{s.n}</span>
                <h3 className="mt-3 font-display text-lg font-semibold text-pine-teal">{s.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-pine-teal/55">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-5 py-20">
        <motion.div {...fadeUp()}
          className="mx-auto max-w-5xl rounded-[2rem] bg-pine-teal px-8 py-14 sm:px-14 text-center">
          <h2 className="font-display text-3xl sm:text-[2.75rem] font-semibold tracking-tight text-white leading-tight">
            Someone nearby needs blood today.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-white/65">
            Register as a donor in a minute. When a matching request comes up near you,
            we'll let you know — and you could save a life.
          </p>
          <Link to={registerLink}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-pine-teal transition-transform hover:-translate-y-0.5">
            Become a donor <FaArrowRight className="text-xs" />
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-pine-teal/8 px-5 py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
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
