import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaHome } from "react-icons/fa";

const NotFound = () => {
  return (
    <main className="min-h-screen aurora-bg flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-white/20 selection:text-white font-sans">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 h-80 w-80 rounded-full bg-dark-raspberry/15 blur-[100px] float-gentle" />
        <div className="absolute bottom-1/4 -right-20 h-72 w-72 rounded-full bg-pine-teal/12 blur-[100px] float-delay" />
        <div className="dark-dot-grid absolute inset-0 opacity-20" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.h1
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 18 }}
          className="text-[140px] md:text-[200px] font-black leading-none gradient-text-aurora"
        >
          404
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, type: "spring", stiffness: 300, damping: 26 }}
          className="glass-dark rounded-3xl border border-white/10 px-8 py-7 max-w-sm -mt-6 shadow-[0_20px_60px_rgba(8,20,16,0.5)]"
        >
          <h2 className="text-xl font-black text-white tracking-tight mb-2">Off the Grid</h2>
          <p className="text-white/40 text-sm font-medium leading-relaxed mb-6">
            The coordinates you entered do not match any known sector in the Sahayam network.
          </p>
          <motion.div whileTap={{ scale: 0.96 }}>
            <Link
              to="/dashboard"
              className="ripple-btn flex items-center justify-center gap-2.5 rounded-2xl py-4 text-[11px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-pine-teal to-[#1a3630] shadow-lg shadow-pine-teal/30"
            >
              <FaHome /> Return to Base
            </Link>
          </motion.div>
          <Link
            to="/"
            className="mt-3 block text-center text-[10px] font-bold text-white/30 uppercase tracking-widest hover:text-white/60 transition-colors"
          >
            Go to Landing
          </Link>
        </motion.div>
      </div>
    </main>
  );
};

export default NotFound;
