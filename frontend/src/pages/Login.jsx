import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import AuthContext from '../context/AuthContext';
import { FaEnvelope, FaLock, FaSpinner, FaGoogle, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import api from '../utils/api';
import logo from '../assets/logo.png';
import PolicyModal from '../components/PolicyModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
      toast.success(`Authentication successful. Welcome back, ${data.name}.`, {
        style: { background: '#ffffff', color: '#29524a', border: '1px solid #846b8a' }
      });
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Access Denied. Invalid credentials.', {
        style: { background: '#ffffff', color: '#ff4a1c', border: '1px solid #ff4a1c' }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!window.google) {
      return toast.error("Secure gateway is still loading. Please wait a moment.");
    }

    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID, 
      scope: 'email profile',
      ux_mode: 'popup',
      callback: async (response) => {
        if (response.code) {
          const toastId = toast.loading("Verifying Identity...", {
            style: { background: '#ffffff', color: '#29524a' }
          });
          try {
            const { data } = await api.post('/auth/google', { code: response.code });
            login(data);
            toast.success(`Identity verified. Welcome, ${data.name}.`, { 
              id: toastId,
              style: { background: '#ffffff', color: '#29524a', border: '1px solid #846b8a' }
            });
            navigate('/dashboard');
          } catch (error) {
            toast.error(error.response?.data?.message || "Google Login Failed", { id: toastId });
          }
        }
      },
    });
    
    client.requestCode();
  };

  return (
    <main className="min-h-screen bg-pearl-beige flex flex-col lg:flex-row relative selection:bg-dark-raspberry selection:text-white overflow-hidden font-sans">
      
      {/* LEFT SIDE STORY/BRANDING (Hidden on mobile, visible on lg+) */}
      <div className="hidden lg:flex lg:w-1/2 bg-pine-teal relative items-center justify-center p-12 overflow-hidden border-r border-dusty-lavender/20 shadow-2xl z-20">
         <div className="absolute top-[20%] right-[-20%] w-[40vw] h-[40vw] bg-blazing-flame/20 blur-[120px] rounded-full pointer-events-none"></div>
         <div className="absolute bottom-[-10%] left-[-10%] w-[30vw] h-[30vw] bg-dark-raspberry/20 blur-[100px] rounded-full pointer-events-none"></div>
         
         <div className="relative z-10 max-w-xl text-pearl-beige">
             <Link to="/" className="flex items-center gap-3 mb-12 group inline-flex">
               <img src={logo} alt="Sahayam Logo" className="h-10 w-auto group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(255,74,28,0.4)]" />
               <span className="text-2xl font-black italic tracking-tighter text-white">SAHA<span className="text-blazing-flame">YAM.</span></span>
             </Link>
             
             <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
               <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-[1.1] tracking-tight">
                 Welcome back to <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-dark-raspberry to-pine-teal">Our Community.</span>
               </h1>
               <p className="text-lg lg:text-xl font-medium text-pearl-beige/80 mb-10 leading-relaxed border-l-4 border-dark-raspberry pl-6">
                 Log in to check on your neighborhood, offer support, or ask for help. We're so glad you're here.
               </p>
               
               <div className="bg-surface/5 backdrop-blur-xl border border-surface/10 p-6 rounded-[2rem] shadow-xl hover:bg-surface/10 transition-colors">
                  <p className="text-sm font-black uppercase tracking-widest text-white mb-3 flex items-center gap-3">
                    <FaShieldAlt className="text-dark-raspberry text-xl" /> Fast & Secure Access
                  </p>
                  <p className="text-sm text-pearl-beige/70 leading-relaxed font-medium">
                    Authenticate via your encrypted email or utilize Google SSO for instant access to the emergency dispatch dashboard.
                  </p>
               </div>
             </motion.div>
         </div>
      </div>

      {/* RIGHT SIDE FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10 overflow-y-auto min-h-screen">
        {/* VIBRANT BACKGROUND GLOWS */}
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] max-w-[600px] h-[50vh] bg-blazing-flame/10 blur-[100px] rounded-full pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md bg-surface/70 backdrop-blur-lg border border-surface rounded-[2.5rem] p-8 sm:p-10 shadow-[0_20px_40px_rgba(41,82,74,0.08)] relative z-10 my-8"
        >
          {/* Mobile Logo (Only visible on small screens) */}
          <div className="lg:hidden text-center mb-8">
             <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
               <img src={logo} alt="Sahayam Logo" className="h-8 w-auto group-hover:scale-110 transition-transform" />
               <span className="text-xl font-black italic tracking-tighter text-pine-teal">SAHA<span className="text-blazing-flame">YAM.</span></span>
             </Link>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-pine-teal tracking-tight">
              Sign In
            </h2>
            <p className="text-dusty-lavender text-sm font-bold tracking-widest mt-1">
              Connect with your community.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="emailInput" className="text-dusty-lavender text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2 ml-1">
                <FaEnvelope className="text-blazing-flame" /> Secured Email
              </label>
              <input 
                id="emailInput"
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required
                className="w-full bg-surface border border-dusty-lavender/40 rounded-2xl px-5 py-4 text-pine-teal text-base md:text-sm placeholder-dusty-lavender/70 focus:border-blazing-flame focus:ring-4 focus:ring-blazing-flame/10 outline-none transition-all shadow-inner"
                placeholder="operator@sahayam.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1 mr-1">
                <label htmlFor="passwordInput" className="text-dusty-lavender text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2">
                  <FaLock className="text-blazing-flame" /> Passcode
                </label>
                <Link to="/forgot-password" className="text-[10px] text-dark-raspberry hover:text-[#850e53] font-black uppercase tracking-widest transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <input 
                id="passwordInput"
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required
                className="w-full bg-surface border border-dusty-lavender/40 rounded-2xl px-5 py-4 text-pine-teal text-base md:text-sm placeholder-dusty-lavender/70 focus:border-blazing-flame focus:ring-4 focus:ring-blazing-flame/10 outline-none transition-all shadow-inner"
                placeholder="••••••••"
              />
            </div>

            <button 
              disabled={loading || !email || !password} 
              className="w-full mt-4 bg-dark-raspberry hover:bg-[#850e53] text-white font-black uppercase tracking-widest text-xs py-4 md:py-5 rounded-2xl transition-all shadow-[0_10px_25px_rgba(159,17,100,0.3)] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
            >
              {loading ? <FaSpinner className="animate-spin text-xl text-white" /> : 'Sign In'}
            </button>
          </form>

          <div className="relative mt-8 mb-6">
            <div className="flex items-center">
              <div className="flex-1 border-t border-dusty-lavender/30"></div>
              <span className="px-4 text-dusty-lavender text-[9px] font-black uppercase tracking-widest">Or Authenticate Via</span>
              <div className="flex-1 border-t border-dusty-lavender/30"></div>
            </div>
          </div>
          
          <button 
            onClick={handleGoogleLogin} 
            type="button" 
            className="w-full bg-surface hover:bg-pearl-beige/50 border border-dusty-lavender/40 text-pine-teal hover:text-dark-raspberry font-bold text-xs uppercase tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 shadow-sm"
          >
            <FaGoogle className="text-blazing-flame text-lg" /> Continue with Google
          </button>

          <div className="mt-8 text-center bg-surface/50 py-4 rounded-2xl border border-surface shadow-sm">
            <p className="text-dusty-lavender text-[10px] font-bold uppercase tracking-widest">
              New to Sahayam?
              <Link to="/register" className="block mt-2 text-pine-teal hover:text-dark-raspberry text-xs font-black transition-colors">
                Join our Community
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <button type="button" onClick={() => setShowPolicyModal(true)} className="text-[10px] text-dusty-lavender hover:text-pine-teal underline font-bold uppercase tracking-widest transition-colors">
              Terms & Privacy Policy
            </button>
          </div>
        </motion.div>
      </div>

      <PolicyModal isOpen={showPolicyModal} onClose={() => setShowPolicyModal(false)} />
    </main>
  );
};

export default Login;