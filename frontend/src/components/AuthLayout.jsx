import { motion } from 'framer-motion';
import { FaShieldAlt } from 'react-icons/fa';

const AuthLayout = ({ children, title, subtitle, icon: Icon = FaShieldAlt }) => {
  return (
    <div className="min-h-screen bg-pearl-beige flex items-center justify-center p-4 relative overflow-hidden selection:bg-dark-raspberry selection:text-white font-sans">
      
      {/* Animated Ambient Background Glows */}
      <motion.div 
        animate={{ x: [0, 30, 0], y: [0, -30, 0] }} 
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] sm:w-[50%] sm:h-[50%] bg-dark-raspberry/10 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none"
      />
      <motion.div 
        animate={{ x: [0, -30, 0], y: [0, 30, 0] }} 
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] sm:w-[50%] sm:h-[50%] bg-blazing-flame/10 blur-[100px] sm:blur-[120px] rounded-full pointer-events-none"
      />

      {/* Premium Frosted Glass Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white/70 backdrop-blur-lg border border-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_40px_rgba(59,107,84,0.08)] relative z-10 my-8"
      >
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white border border-dusty-lavender/30 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl text-blazing-flame mx-auto mb-4 sm:mb-6 shadow-sm">
            <Icon />
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-black text-pine-teal tracking-tight mb-2 uppercase leading-tight">
            {title.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="text-blazing-flame">{title.split(' ').slice(-1)}</span>
          </h1>
          
          {subtitle && (
            <p className="text-dusty-lavender font-bold text-[10px] sm:text-xs tracking-widest uppercase mt-2 sm:mt-3">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* The injected form goes here */}
        {children}
        
      </motion.div>
    </div>
  );
};

export default AuthLayout;