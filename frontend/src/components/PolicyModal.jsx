import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaShieldAlt, FaTimes, FaLock, FaCheck } from "react-icons/fa";
import { Link } from "react-router-dom";

const TABS = ["Terms", "Privacy"];

const TermsContent = () => (
  <div className="space-y-4 text-[13px] text-pine-teal/75 leading-relaxed">
    <p className="font-semibold text-pine-teal">
      Sahayam is a peer-to-peer blood donor coordination tool — not a medical service, blood bank, or emergency service.
    </p>

    {[
      {
        title: "You must be 18+ to donate blood",
        body: "Per NBTC guidelines. Younger users may only use the platform to request help.",
      },
      {
        title: "No commercial exchange",
        body: "Offering or accepting payment for blood is strictly prohibited under the Drugs & Cosmetics Act (India) and is grounds for immediate ban.",
      },
      {
        title: "SOS alerts are for genuine emergencies only",
        body: "Misuse of the broadcast system — including false emergencies — may be reported to authorities.",
      },
      {
        title: "Blood must be processed at a licensed facility",
        body: "Sahayam connects donors with recipients. All blood must be screened by a licensed blood bank before transfusion. We are not responsible for outcomes.",
      },
      {
        title: "Your blood group is sensitive personal data",
        body: "It is used only for donor matching and is never sold to third parties. You can delete your account and this data at any time.",
      },
      {
        title: "Zero commercial use of your data",
        body: "No ad tracking, no behavioural profiling, no third-party data brokers — ever.",
      },
    ].map(({ title, body }) => (
      <div key={title} className="flex items-start gap-2.5">
        <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-pine-teal/10 flex items-center justify-center">
          <FaCheck className="text-[8px] text-pine-teal" />
        </div>
        <div>
          <p className="font-semibold text-pine-teal text-[12px]">{title}</p>
          <p className="mt-0.5 text-pine-teal/60">{body}</p>
        </div>
      </div>
    ))}

    <p className="text-[11px] text-pine-teal/40 border-t border-pine-teal/8 pt-3">
      Full terms at{" "}
      <Link to="/terms" className="text-pine-teal underline underline-offset-2 font-semibold">sahayam.in/terms</Link>
      {" · "} Governing law: India · Jurisdiction: Chennai, TN
    </p>
  </div>
);

const PrivacyContent = () => (
  <div className="space-y-4 text-[13px] text-pine-teal/75 leading-relaxed">
    <p className="font-semibold text-pine-teal">
      We collect the minimum data needed to run the platform. Here's exactly what we do with it.
    </p>

    {[
      {
        title: "What we collect",
        body: "Name, email, phone, blood group, approximate location. That's it. No social media scraping, no behavioural tracking.",
      },
      {
        title: "Blood group is sensitive data",
        body: "Treated under India's IT (SPDI) Rules and DPDP Act 2023. Used only for donor matching. Never shared with advertisers.",
      },
      {
        title: "Location is never exact to other users",
        body: "GPS coordinates stay on our servers. Other users only see an approximate area (e.g., 'Koramangala, Bangalore').",
      },
      {
        title: "No cookies, no tracking scripts",
        body: "No Google Analytics, no Meta Pixel. We use only essential localStorage for session and preference storage.",
      },
      {
        title: "Your rights under DPDP Act 2023",
        body: "Access, correct, or delete your data at any time. Email privacy@sahayam.in. Grievances resolved within 15 days.",
      },
      {
        title: "Data breach notification",
        body: "If your data is ever compromised, we will notify you within 72 hours as required by law.",
      },
    ].map(({ title, body }) => (
      <div key={title} className="flex items-start gap-2.5">
        <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-dark-raspberry/10 flex items-center justify-center">
          <FaLock className="text-[8px] text-dark-raspberry" />
        </div>
        <div>
          <p className="font-semibold text-pine-teal text-[12px]">{title}</p>
          <p className="mt-0.5 text-pine-teal/60">{body}</p>
        </div>
      </div>
    ))}

    <p className="text-[11px] text-pine-teal/40 border-t border-pine-teal/8 pt-3">
      Full policy at{" "}
      <Link to="/privacy" className="text-pine-teal underline underline-offset-2 font-semibold">sahayam.in/privacy</Link>
      {" · "} Compliant with IT Act 2000 & DPDP Act 2023
    </p>
  </div>
);

const PolicyModal = ({ isOpen, onClose, onAccept }) => {
  const [tab, setTab] = useState(0);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", damping: 30, stiffness: 280 }}
          className="relative w-full sm:max-w-lg bg-surface border border-pine-teal/10 sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[88vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-pine-teal/8 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-pine-teal/8 flex items-center justify-center">
                <FaShieldAlt className="text-sm text-pine-teal" />
              </div>
              <div>
                <h3 className="text-[15px] font-black text-pine-teal">Before you join</h3>
                <p className="text-[10px] font-medium text-pine-teal/40 mt-0.5">Sahayam · June 2026</p>
              </div>
            </div>
            <button onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-full border border-pine-teal/12 bg-pearl-beige/80 text-dusty-lavender hover:text-blazing-flame transition-colors">
              <FaTimes className="text-xs" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex px-5 pt-3 pb-0 gap-1 shrink-0">
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)}
                className={`relative px-4 py-2 rounded-lg text-[12px] font-bold uppercase tracking-widest transition-colors ${
                  tab === i ? "text-pine-teal" : "text-pine-teal/35 hover:text-pine-teal/60"
                }`}>
                {tab === i && (
                  <motion.span layoutId="policyTab"
                    className="absolute inset-0 rounded-lg bg-pine-teal/8"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <span className="relative z-10">{t}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="overflow-y-auto px-5 py-4 flex-1 no-scrollbar">
            <AnimatePresence mode="wait">
              <motion.div key={tab}
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}>
                {tab === 0 ? <TermsContent /> : <PrivacyContent />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CTA */}
          <div className="px-5 pb-5 pt-3 border-t border-pine-teal/8 shrink-0 space-y-2">
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={onAccept ? onAccept : onClose}
              className="w-full py-3.5 bg-pine-teal text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-[0_4px_16px_-4px_rgba(59,107,84,0.5)] hover:shadow-[0_6px_24px_-4px_rgba(59,107,84,0.7)] transition-shadow active:scale-95">
              I Understand & Agree
            </motion.button>
            <p className="text-center text-[10px] text-pine-teal/30 font-medium">
              You can withdraw consent by deleting your account at any time.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PolicyModal;
