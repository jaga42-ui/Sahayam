import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaTimes, FaSpinner, FaMagic } from 'react-icons/fa';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AITriageModal = ({ isOpen, onClose, onTriageComplete }) => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTriage = async () => {
    if (!text.trim()) return toast.error("Please describe the emergency.");
    setLoading(true);
    try {
      const { data } = await api.post('/donations/triage', { text });
      toast.success("Emergency context extracted successfully!");
      if (onTriageComplete) onTriageComplete(data);
      setText('');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "AI parsing failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-pine-teal/80 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white/20">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl sm:text-2xl font-black text-pine-teal uppercase tracking-tight flex items-center gap-3">
              <div className="w-10 h-10 bg-blazing-flame/10 rounded-xl flex items-center justify-center text-blazing-flame text-xl">
                <FaRobot />
              </div>
              Smart Assistant
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-pearl-beige rounded-full text-dusty-lavender transition-colors"><FaTimes /></button>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-dusty-lavender mb-4 uppercase tracking-widest leading-relaxed">
            Describe the emergency naturally. Our Smart Assistant will find the blood group, location, and urgency automatically.
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. My dad was just in a massive car accident near Apollo Hospital, we desperately need O- blood right now!"
            className="w-full h-32 sm:h-40 bg-pearl-beige/30 border border-dusty-lavender/30 rounded-2xl p-4 text-pine-teal mb-6 resize-none outline-none focus:border-blazing-flame focus:bg-white transition-all shadow-inner text-sm"
          />
          <button onClick={handleTriage} disabled={loading} className="w-full py-4 bg-gradient-to-r from-blazing-flame to-[#e03a12] text-white font-black uppercase tracking-widest text-[10px] sm:text-xs rounded-xl flex justify-center items-center gap-2 shadow-[0_10px_25px_rgba(255,74,28,0.3)] transition-all active:scale-95 disabled:opacity-50">
            {loading ? <FaSpinner className="animate-spin text-lg" /> : <><FaMagic className="text-sm" /> Process Request</>}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default AITriageModal;
