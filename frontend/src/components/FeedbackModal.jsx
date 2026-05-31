import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaStar, FaPaperPlane, FaCommentAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../utils/api";

const FeedbackModal = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return toast.error("Please enter a message.");

    setIsSubmitting(true);
    try {
      // You can wire this to a simple backend endpoint later
      await api.post("/feedback", { rating, message });
      toast.success("Thank you! Your feedback helps us improve Sahayam.");
      setMessage("");
      setRating(5);
      onClose();
    } catch (error) {
      toast.error("Failed to send feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="absolute inset-0 bg-pine-teal/60 backdrop-blur-sm" 
            onClick={onClose} 
          />
          
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} 
            className="relative w-full max-w-md bg-pearl-beige border-t sm:border border-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl flex flex-col"
          >
            <div className="w-12 h-1.5 bg-dusty-lavender/20 rounded-full mx-auto mb-6 sm:hidden" />
            <button onClick={onClose} className="absolute top-5 right-5 text-dusty-lavender hover:text-pine-teal bg-white p-2 rounded-full shadow-sm active:scale-90 transition-all">
              <FaTimes className="text-sm" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-pine-teal/10 text-pine-teal rounded-full flex items-center justify-center text-lg">
                <FaCommentAlt />
              </div>
              <div>
                <h2 className="text-xl font-black text-pine-teal uppercase tracking-tight">App Feedback</h2>
                <p className="text-[10px] uppercase tracking-widest text-dusty-lavender font-bold">Help us build a better grid</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-2 block text-center">Rate your experience</label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button type="button" key={star} onClick={() => setRating(star)} className="text-2xl outline-none active:scale-90 transition-transform">
                      <FaStar className={star <= rating ? "text-[#f59e0b] drop-shadow-sm" : "text-dusty-lavender/30"} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea 
                value={message} onChange={(e) => setMessage(e.target.value)} 
                placeholder="What do you love? What's broken?" rows="4" 
                className="w-full bg-white border border-dusty-lavender/30 rounded-2xl p-4 text-pine-teal text-sm outline-none focus:border-pine-teal transition-all resize-none shadow-inner"
              />

              <button 
                type="submit" disabled={isSubmitting} 
                className="w-full py-4 bg-pine-teal hover:bg-[#1a3630] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-[0_10px_25px_rgba(59,107,84,0.3)] transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isSubmitting ? "Transmitting..." : <><FaPaperPlane /> Send to Developers</>}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;