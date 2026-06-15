import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaHeartbeat, FaShieldAlt, FaLock, FaTimes } from "react-icons/fa";

const STEPS = [
  {
    icon: FaHeartbeat,
    tint: "bg-dark-raspberry/10 text-dark-raspberry",
    title: "Raise an SOS",
    desc: "Need blood? Post the group, hospital and how many donors you need — nearby donors are alerted in seconds.",
  },
  {
    icon: FaShieldAlt,
    tint: "bg-pine-teal/10 text-pine-teal",
    title: "Only the right donors",
    desc: "We ping donors whose blood group is compatible and who are eligible to donate right now, and keep widening the search until enough confirm.",
  },
  {
    icon: FaLock,
    tint: "bg-[#d6453f]/10 text-[#c0392b]",
    title: "Private & safe",
    desc: "Coordinate in a secure chat. Your phone number stays private until you choose to share it.",
  },
];

const OnboardingModal = () => {
  const [isOpen, setIsOpen] = useState(() => !localStorage.getItem("sahayam_onboarded"));

  const handleClose = () => {
    localStorage.setItem("sahayam_onboarded", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="absolute inset-0 bg-pine-teal/70 backdrop-blur-sm"
          onClick={handleClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 16 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="relative w-full max-w-md bg-surface border border-pine-teal/10 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3 className="font-display text-2xl font-semibold tracking-tight text-pine-teal">Welcome to Sahayam</h3>
              <p className="mt-1 text-[14px] text-pine-teal/55">Find a blood donor when minutes matter.</p>
            </div>
            <button onClick={handleClose} aria-label="Close"
              className="shrink-0 h-9 w-9 flex items-center justify-center rounded-full border border-pine-teal/12 text-dusty-lavender hover:text-pine-teal transition-colors">
              <FaTimes className="text-sm" />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto no-scrollbar">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="flex gap-3.5">
                  <div className={`shrink-0 h-10 w-10 flex items-center justify-center rounded-xl ${s.tint}`}>
                    <Icon className="text-base" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-semibold text-pine-teal">{s.title}</h4>
                    <p className="mt-0.5 text-[13.5px] leading-relaxed text-pine-teal/55">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={handleClose}
            className="mt-6 w-full rounded-xl bg-dark-raspberry py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#5e4585]">
            Get started
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingModal;
