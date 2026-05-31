import { motion, AnimatePresence } from "framer-motion";
import { FaShieldAlt, FaTimes } from "react-icons/fa";

const PolicyModal = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-pine-teal/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white border border-white rounded-[2.5rem] p-6 sm:p-8 shadow-2xl flex flex-col max-h-[85vh]"
        >
          <div className="flex justify-between items-center mb-6 border-b border-dusty-lavender/20 pb-4">
            <div className="flex items-center gap-3 text-pine-teal">
              <div className="w-10 h-10 bg-pearl-beige/50 rounded-full flex items-center justify-center text-dark-raspberry border border-dusty-lavender/30">
                <FaShieldAlt className="text-lg" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Terms & Privacy</h3>
            </div>
            <button
              onClick={onClose}
              className="text-dusty-lavender hover:text-blazing-flame p-2 bg-white hover:bg-pearl-beige rounded-full transition-colors border border-dusty-lavender/20"
            >
              <FaTimes />
            </button>
          </div>

          <div className="overflow-y-auto pr-4 no-scrollbar space-y-5 text-sm text-pine-teal/80 leading-relaxed mb-6 flex-1">
            <p className="font-bold">
              Welcome to Sahayam. By joining our platform, you agree to the
              following terms designed to keep our community safe.
            </p>
            <div>
              <h4 className="font-black text-pine-teal uppercase tracking-widest text-[10px] mb-1">1. Not an Emergency Service</h4>
              <p>Sahayam is a peer-to-peer communication platform. It does not replace professional medical advice or official emergency services.</p>
            </div>
            <div>
              <h4 className="font-black text-pine-teal uppercase tracking-widest text-[10px] mb-1">2. No Verification of Goods</h4>
              <p>We do not and cannot medically test, screen, or verify the safety, quality, or legality of resources exchanged. You accept all associated risks.</p>
            </div>
            <div>
              <h4 className="font-bold text-pine-teal uppercase tracking-widest text-[10px] mb-1">3. Location Data & Privacy</h4>
              <p>When you post an SOS or a donation, we use your location to alert nearby users. Your exact pinpoint is generalized on the public feed to protect your privacy.</p>
            </div>
            <div>
              <h4 className="font-bold text-pine-teal uppercase tracking-widest text-[10px] mb-1">4. Data Sharing</h4>
              <p>We absolutely do not sell your data. Your profile details are only shared with other verified users when you actively interact with them.</p>
            </div>
            <div>
              <h4 className="font-bold text-pine-teal uppercase tracking-widest text-[10px] mb-1">5. Zero Liability</h4>
              <p>By using an account, you agree that the creators of Sahayam bear zero liability for any harm resulting from the use of this platform.</p>
            </div>
          </div>

          <button
            onClick={onAccept ? onAccept : onClose}
            className="w-full py-4 bg-pine-teal hover:bg-[#1a3630] text-white rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-colors shadow-[0_10px_25px_rgba(59,107,84,0.3)] active:scale-95"
          >
            I Accept & Agree
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PolicyModal;
