import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import logo from "../assets/logo.png";

/*
  RouteTransition — a brief, elegant brand curtain that sweeps over the
  screen on every route change. Keeps navigation feeling intentional and
  calm without blocking for long (~620ms total).
*/
const RouteTransition = () => {
  const location = useLocation();
  const [active, setActive] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    // Don't curtain the very first paint (the startup splash handles that).
    if (first.current) {
      first.current = false;
      return;
    }
    setActive(true);
    const t = setTimeout(() => setActive(false), 560);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="route-curtain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-pearl-beige/85 backdrop-blur-md pointer-events-none"
        >
          <div className="absolute top-[-10%] left-[-8%] w-[40%] max-w-[480px] h-[40%] bg-pine-teal/10 blur-[110px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-8%] w-[40%] max-w-[480px] h-[40%] bg-blazing-flame/10 blur-[110px] rounded-full" />

          <div className="relative flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center w-16 h-16">
              <motion.span
                className="absolute inset-0 rounded-full border border-blazing-flame/30"
                animate={{ scale: [1, 1.7], opacity: [0.55, 0] }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeOut" }}
              />
              <motion.img
                src={logo}
                alt=""
                aria-hidden="true"
                className="h-9 w-auto relative z-10 drop-shadow-[0_4px_14px_rgba(110,79,160,0.25)]"
                initial={{ scale: 0.8, rotate: -6 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 18 }}
              />
            </div>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 56 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-px bg-gradient-to-r from-transparent via-dark-raspberry/60 to-transparent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RouteTransition;
