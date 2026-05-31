import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaHeart, FaTimes, FaShareSquare } from "react-icons/fa";
import logo from "../assets/logo.png";

const DISMISS_KEY = "sahayam_install_dismissed";

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;

/*
  InstallPrompt — a gentle, dismissible "Add to home screen" nudge.
  • Android / desktop Chrome: uses the native beforeinstallprompt event.
  • iOS Safari: shows a short how-to (no native prompt available).
  • Hidden if already installed or recently dismissed.
  Fully responsive: full-width bar on phones, compact card on desktop.
*/
const InstallPrompt = () => {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS never fires the event — offer a manual hint after a short delay.
    let iosTimer;
    if (isIOS()) {
      iosTimer = setTimeout(() => { setIosHint(true); setShow(true); }, 2500);
    }

    const onInstalled = () => { setShow(false); localStorage.setItem(DISMISS_KEY, "1"); };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setShow(false);
    setDeferred(null);
    localStorage.setItem(DISMISS_KEY, "1");
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="fixed z-[9990] left-1/2 -translate-x-1/2 bottom-20 md:bottom-6 md:left-auto md:right-6 md:translate-x-0
                     w-[calc(100%-1.5rem)] max-w-sm"
        >
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-teal p-4 flex items-center gap-3.5">
            <div className="dark-dot-grid absolute inset-0 opacity-40 pointer-events-none" />

            <div className="relative shrink-0 h-12 w-12 rounded-2xl bg-pearl-beige flex items-center justify-center">
              <img src={logo} alt="" aria-hidden="true" className="h-7 w-auto" />
            </div>

            <div className="relative min-w-0 flex-1">
              <p className="font-display text-base font-semibold text-pine-teal leading-tight">
                Keep Sahayam close
              </p>
              {iosHint ? (
                <p className="text-[12px] font-medium text-pine-teal/55 leading-snug mt-0.5 flex items-center gap-1 flex-wrap">
                  Tap <FaShareSquare className="inline text-dark-raspberry text-[11px]" /> Share, then
                  <span className="font-semibold text-pine-teal">Add to Home Screen</span>
                </p>
              ) : (
                <p className="text-[12px] font-medium text-pine-teal/55 leading-snug mt-0.5">
                  Add the app for one-tap help and instant alerts.
                </p>
              )}
            </div>

            <div className="relative flex items-center gap-1.5 shrink-0">
              {!iosHint && (
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={install}
                  className="flex items-center gap-1.5 rounded-xl bg-pine-teal px-3.5 py-2.5 text-[12px] font-bold text-white whitespace-nowrap"
                >
                  <FaHeart className="text-blazing-flame text-[11px]" /> Install
                </motion.button>
              )}
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="h-8 w-8 flex items-center justify-center rounded-lg text-dusty-lavender hover:text-pine-teal hover:bg-surface-2 transition-colors"
              >
                <FaTimes className="text-sm" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InstallPrompt;
