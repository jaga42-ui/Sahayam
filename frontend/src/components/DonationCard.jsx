import { motion } from 'framer-motion';
import { FaMapMarkerAlt, FaUser, FaClock, FaTint, FaUtensils, FaTshirt, FaBook, FaBoxOpen } from 'react-icons/fa';

const DonationCard = ({ d, onClaim, currentUser }) => {
  const getIconConfig = (type) => {
    switch(type?.toLowerCase()) {
      case 'blood': return { icon: <FaTint />, color: 'text-blazing-flame', border: 'border-blazing-flame/30', bg: 'bg-blazing-flame/10' };
      case 'food': return { icon: <FaUtensils />, color: 'text-dark-raspberry', border: 'border-dark-raspberry/30', bg: 'bg-dark-raspberry/10' };
      case 'clothes': return { icon: <FaTshirt />, color: 'text-dusty-lavender', border: 'border-dusty-lavender/40', bg: 'bg-dusty-lavender/20' };
      case 'books': 
      case 'book': return { icon: <FaBook />, color: 'text-pine-teal', border: 'border-pine-teal/30', bg: 'bg-pine-teal/10' };
      default: return { icon: <FaBoxOpen />, color: 'text-dark-raspberry', border: 'border-dark-raspberry/30', bg: 'bg-dark-raspberry/10' };
    }
  };

  const config = getIconConfig(d.type || d.category);
  
  // 👉 THE FIX: Unrestricted humanitarian routing. Claimable by anyone except the poster.
  const isClaimable = currentUser?._id !== (d.donor?._id || d.donorId);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className={`bg-white/70 backdrop-blur-lg border border-white rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-[0_20px_40px_rgba(59,107,84,0.08)] transition-all group flex flex-col`}
    >
      <div className={`h-40 md:h-48 relative overflow-hidden bg-white border-b ${config.border} shrink-0`}>
        {d.photo || d.image ? (
          <img 
            src={d.photo || d.image} 
            alt={d.title || d.description} 
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700" 
          />
        ) : (
          <div className={`absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-700 ${config.bg}`}>
            <div className={`text-7xl md:text-8xl opacity-80 ${config.color}`}>
              {config.icon}
            </div>
          </div>
        )}
        
        <div className="absolute top-3 right-3 md:top-4 md:right-4 bg-white/90 backdrop-blur-md px-3 py-1 md:py-1.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase text-pine-teal tracking-widest border border-dusty-lavender/30 shadow-md">
          {d.type || d.category}
        </div>
      </div>

      <div className="p-5 md:p-6 flex flex-col flex-1">
        <h3 className="text-lg md:text-xl font-black text-pine-teal mb-3 leading-tight line-clamp-2">
          {d.title || d.description}
        </h3>
        
        <div className="space-y-2 mb-5 md:mb-6 flex-1">
          <p className="text-pine-teal/80 text-xs md:text-sm flex items-center gap-2 font-bold truncate">
            <FaUser className={config.color} /> 
            <span className="truncate">{d.donor?.name || 'Sahayam Member'}</span>
          </p>
          <p className="text-pine-teal/80 text-xs md:text-sm flex items-center gap-2 font-bold truncate">
            <FaMapMarkerAlt className={config.color} /> 
            <span className="truncate">{d.location?.formattedAddress || d.addressText || 'Location Unknown'}</span>
          </p>
          <p className="text-pine-teal/80 text-xs md:text-sm flex items-center gap-2 font-bold">
            <FaClock className={config.color} /> 
            {new Date(d.createdAt).toLocaleDateString()}
          </p>
        </div>

        <div className="mt-auto pt-4 border-t border-dusty-lavender/20">
          {isClaimable ? (
            <button 
              onClick={() => onClaim(d._id)}
              className="w-full bg-pine-teal hover:bg-[#1a3630] text-white font-black uppercase tracking-widest text-[10px] md:text-xs py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all shadow-[0_10px_25px_rgba(59,107,84,0.3)] active:scale-95"
            >
              Claim Directive
            </button>
          ) : (
            <div className="w-full bg-pearl-beige/50 text-dusty-lavender text-center py-3.5 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest border border-dusty-lavender/30 shadow-inner">
              Your Active Listing
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DonationCard;