// Developed by guruprasad and team
import {
  FaPhoneAlt,
  FaCommentDots,
  FaDirections,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

const EmergencyMatchModal = ({ sosData, onClose }) => {
  const navigate = useNavigate();
  const controls = useAnimation();

  // Slide up on mount
  useEffect(() => {
    controls.start({ y: 0, transition: { type: "spring", damping: 25, stiffness: 200 } });
  }, [controls]);

  // 👉 NATIVE UPGRADE: The Swipe Physics Engine
  const handleDragEnd = (event, info) => {
    // If the user swipes down fast enough, or drags it more than 100px down
    if (info.offset.y > 100 || info.velocity.y > 500) {
      controls.start({ y: "100%", transition: { duration: 0.2 } }).then(onClose);
    } else {
      // Otherwise, snap it back into place
      controls.start({ y: 0, transition: { type: "spring", damping: 25, stiffness: 200 } });
    }
  };

  if (!sosData || !sosData.donorId) return null;

  const lng = sosData.location.coordinates[0];
  const lat = sosData.location.coordinates[1];
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return (
    <div className="fixed inset-0 z-[4000] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
      
      {/* Background Blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-pine-teal/60 backdrop-blur-sm"
        onClick={() => controls.start({ y: "100%", transition: { duration: 0.2 } }).then(onClose)}
      />

      <motion.div
        initial={{ y: "100%" }}
        animate={controls}
        exit={{ y: "100%" }}
        // 👉 NATIVE UPGRADE: Framer Motion Drag Directives
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }} // Resists pulling up, allows pulling down
        onDragEnd={handleDragEnd}
        className="relative w-full max-w-md bg-white border-t sm:border border-blazing-flame/30 rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-[0_20px_50px_rgba(138,111,176,0.15)] overflow-hidden cursor-grab active:cursor-grabbing touch-none"
      >
        {/* 👉 NATIVE UPGRADE: Distinct Pull Tab Indicator */}
        <div className="w-12 h-1.5 bg-dusty-lavender/30 rounded-full mx-auto mb-5 sm:hidden" />

        <button
          onClick={() => controls.start({ y: "100%", transition: { duration: 0.2 } }).then(onClose)}
          className="hidden sm:block absolute top-6 right-6 text-dusty-lavender hover:text-dark-raspberry bg-pearl-beige hover:bg-pearl-beige/80 p-2 rounded-full transition-colors z-20"
        >
          <FaTimes className="text-sm" />
        </button>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blazing-flame/10 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>

        <div className="relative z-10 text-center pointer-events-auto">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-blazing-flame/10 text-blazing-flame rounded-2xl sm:rounded-[2rem] mb-5 sm:mb-6 border border-blazing-flame/20 shadow-sm">
            <FaPhoneAlt className="text-2xl sm:text-3xl animate-bounce" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-pine-teal italic tracking-tighter mb-2 uppercase leading-tight">
            CRISIS <span className="text-blazing-flame">MATCHED.</span>
          </h2>

          <p className="text-dusty-lavender text-xs sm:text-sm font-medium mb-6 sm:mb-8 px-2">
            You are responding to{" "}
            <b className="text-pine-teal">{sosData.donorId.name}</b>. Every second
            counts. Establish contact immediately.
          </p>

          <div className="space-y-3 sm:space-y-4">
            <a
              href={`tel:${sosData.donorId.phone}`}
              className="w-full py-4 sm:py-5 bg-blazing-flame hover:bg-[#6e4fa0] active:bg-[#5e4585] text-white rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest transition-all shadow-[0_10px_25px_rgba(138,111,176,0.3)] active:scale-95 flex items-center justify-center gap-3"
            >
              <FaPhoneAlt className="text-lg" /> Call{" "}
              {sosData.donorId.name.split(" ")[0]} Now
            </a>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-4 sm:py-4 bg-white hover:bg-pearl-beige/50 active:bg-pearl-beige border border-dusty-lavender/40 text-pine-teal rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center justify-center gap-3"
            >
              <FaDirections className="text-lg text-pine-teal" /> GPS Routing
            </a>

            <button
              onClick={() => {
                controls.start({ y: "100%", transition: { duration: 0.2 } }).then(() => {
                  onClose();
                  navigate(`/chat/${sosData._id}_${sosData.donorId._id}`, {
                    state: {
                      otherUserId: sosData.donorId._id,
                      otherUserName: sosData.donorId.name,
                      itemTitle: "Emergency SOS",
                    },
                  });
                });
              }}
              className="w-full pt-4 pb-2 text-dusty-lavender hover:text-pine-teal rounded-2xl font-bold text-[10px] sm:text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <FaCommentDots className="text-sm" /> Open Secure Chat
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default EmergencyMatchModal;