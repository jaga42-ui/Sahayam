import { motion } from "framer-motion";
import logo from "../assets/logo.png";

/*
  Loader — calm, elegant brand loader.
  • fullScreen : startup + route-transition screen (beige canvas, breathing logo)
  • inline     : small in-card spinner
*/
const Loader = ({ fullScreen = false, text = "One moment" }) => {
  const mark = (
    <div className="relative flex items-center justify-center w-24 h-24">
      {/* Soft orbiting rings (sage → plum) */}
      <motion.span
        className="absolute inset-0 rounded-full border border-pine-teal/30"
        animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.span
        className="absolute inset-0 rounded-full border border-blazing-flame/30"
        animate={{ scale: [1, 1.55], opacity: [0.5, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
      />
      {/* Slow dashed orbit */}
      <motion.span
        className="absolute inset-1 rounded-full border border-dashed border-dusty-lavender/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
      />
      {/* Breathing logo */}
      <motion.img
        src={logo}
        alt="Sahayam"
        className="h-12 w-auto relative z-10 drop-shadow-[0_6px_18px_rgba(110,79,160,0.25)]"
        animate={{ scale: [1, 1.06, 1], rotate: [0, 2, 0, -2, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );

  const content = (
    <div className="flex flex-col items-center justify-center gap-7 font-sans">
      {fullScreen && (
        <motion.div
          initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="font-display text-3xl font-semibold italic tracking-tightest text-pine-teal"
        >
          Saha<span className="text-dark-raspberry">yam</span>
        </motion.div>
      )}

      {mark}

      <motion.div
        animate={{ opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="flex flex-col items-center gap-3"
      >
        <p className="text-dusty-lavender font-semibold tracking-[0.35em] text-[10px] uppercase">
          {text}
        </p>
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-blazing-flame/60 to-transparent rounded-full" />
      </motion.div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-pearl-beige z-[9999] flex items-center justify-center overflow-hidden">
        {/* Soft ambient wash */}
        <div className="absolute top-[-12%] left-[-10%] w-[46%] max-w-[560px] h-[46%] bg-pine-teal/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-12%] right-[-10%] w-[46%] max-w-[560px] h-[46%] bg-blazing-flame/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative z-10">{content}</div>
      </div>
    );
  }

  return <div className="py-12 flex justify-center w-full">{content}</div>;
};

export default Loader;
