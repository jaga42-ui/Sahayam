import { useNavigate } from "react-router-dom";
import { FaHandHoldingHeart, FaBullhorn } from "react-icons/fa";

const CallToAction = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-4xl mx-auto my-8 relative rounded-[2rem] overflow-hidden shadow-[0_20px_40px_rgba(138,111,176,0.15)] font-sans">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blazing-flame to-[#5e4585] z-0" />
      
      {/* Abstract Shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 z-0" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 z-0" />

      <div className="relative z-10 px-6 py-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full mb-4 border border-white/30">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">The Grid is Live</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-3 leading-tight">
            Your Community <br className="hidden md:block" /> Needs You.
          </h2>
          <p className="text-white/80 text-sm md:text-base font-medium max-w-md">
            Whether it's surplus food, old books, or an urgent medical SOS, you have the power to make an immediate impact within a 15km radius.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <button 
            onClick={() => navigate("/create-donation")}
            className="bg-white text-pine-teal hover:bg-pearl-beige px-6 py-4 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <FaHandHoldingHeart className="text-sm text-blazing-flame" /> Share Resources
          </button>
          <button 
            onClick={() => navigate("/radar")}
            className="bg-black/20 hover:bg-black/30 backdrop-blur-sm text-white border border-white/30 px-6 py-4 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <FaBullhorn className="text-sm" /> View Radar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;