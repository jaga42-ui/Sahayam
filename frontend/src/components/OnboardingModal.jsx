import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaHeartbeat, FaShieldAlt, FaStar, FaTimes } from "react-icons/fa";

const OnboardingModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem("sahayam_onboarded");
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("sahayam_onboarded", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-pine-teal/80 backdrop-blur-sm"
          onClick={handleClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-white border border-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6 border-b border-dusty-lavender/20 pb-4">
            <h3 className="text-2xl font-black text-pine-teal uppercase tracking-tight">Welcome to Sahayam</h3>
            <button
              onClick={handleClose}
              className="text-dusty-lavender hover:text-blazing-flame p-2 bg-white hover:bg-pearl-beige rounded-full transition-colors border border-dusty-lavender/20"
            >
              <FaTimes />
            </button>
          </div>

          <div className="overflow-y-auto pr-4 no-scrollbar space-y-6 text-sm text-pine-teal/80 leading-relaxed mb-6 flex-1">
            <p className="font-bold text-base text-pine-teal">
              Sahayam is a modern community coordination platform. Here is how you can help:
            </p>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 shrink-0 bg-blazing-flame/10 rounded-xl flex items-center justify-center text-blazing-flame text-xl">
                <FaHeartbeat />
              </div>
              <div>
                <h4 className="font-black text-pine-teal uppercase tracking-widest text-[10px] mb-1">Emergency SOS Routing</h4>
                <p>When someone triggers an SOS, Sahayam bypasses standard feeds and immediately blasts the closest top-rated donors via email and push notifications. If unanswered, the AI expands the radius up to 50km.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 shrink-0 bg-pine-teal/10 rounded-xl flex items-center justify-center text-pine-teal text-xl">
                <FaShieldAlt />
              </div>
              <div>
                <h4 className="font-black text-pine-teal uppercase tracking-widest text-[10px] mb-1">Verified Organizations</h4>
                <p>To prevent fraud, organizations can register as NGOs and undergo an admin verification process. Verified NGOs have special privileges on the platform.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 shrink-0 bg-[#eab308]/10 rounded-xl flex items-center justify-center text-[#eab308] text-xl">
                <FaStar />
              </div>
              <div>
                <h4 className="font-black text-pine-teal uppercase tracking-widest text-[10px] mb-1">Gamification & Ranks</h4>
                <p>Every heroic action earns you points. Gain points for responding to an SOS, completing successful donations, and submitting app feedback. Climb the ranks from Rookie to Apex Savior!</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-full py-4 bg-blazing-flame hover:bg-[#6e4fa0] text-white rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-colors shadow-[0_10px_25px_rgba(138,111,176,0.3)] active:scale-95"
          >
            I'm Ready to Save Lives
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OnboardingModal;
