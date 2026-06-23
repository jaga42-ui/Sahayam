import { motion } from "framer-motion";

/**
 * Animated sliding switch — a track whose white knob springs left↔right via
 * framer-motion `layout`, with a smooth colour transition. Use anywhere a
 * boolean is toggled. `size`: "sm" (default) | "md".
 */
const Switch = ({ on, onClick, disabled = false, size = "sm", "aria-label": ariaLabel }) => {
  const dims =
    size === "md"
      ? { track: "h-6 w-11", knob: "h-5 w-5" }
      : { track: "h-[18px] w-8", knob: "h-3.5 w-3.5" };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      aria-label={ariaLabel}
      className={`flex ${dims.track} shrink-0 items-center rounded-full px-0.5 transition-colors duration-300 disabled:opacity-50 ${
        on ? "justify-end bg-pine-teal" : "justify-start bg-pine-teal/25"
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 600, damping: 34 }}
        className={`${dims.knob} rounded-full bg-white shadow-sm`}
      />
    </motion.button>
  );
};

export default Switch;
