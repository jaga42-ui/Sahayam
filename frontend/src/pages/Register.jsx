import { useState, useContext } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserPlus, FaEnvelope, FaLock, FaPhone, FaTint, FaShieldAlt, FaTimes, FaCheck, FaSpinner,
} from "react-icons/fa";
import toast from "react-hot-toast";
import AuthContext from "../context/AuthContext";
import api from "../utils/api";
import logo from "../assets/logo.png";
import PolicyModal from "../components/PolicyModal";

const Register = () => {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", phone: "", bloodGroup: "", organizationName: "",
  });
  const [activeRole, setActiveRole] = useState("donor");
  const [isLoading, setIsLoading] = useState(false);

  // Privacy Policy States
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // 👉 DYNAMIC THEME HANDLERS BASED ON ROLE
  const getThemeAccent = () => {
    if (activeRole === "donor") return "text-blazing-flame";
    if (activeRole === "ngo") return "text-pine-teal";
    return "text-dark-raspberry";
  };
  const getThemeBg = () => {
    if (activeRole === "donor") return "bg-blazing-flame hover:bg-[#e03a12]";
    if (activeRole === "ngo") return "bg-pine-teal hover:bg-[#1a3630]";
    return "bg-dark-raspberry hover:bg-[#850e53]";
  };
  const getThemeFocusBorder = () => {
    if (activeRole === "donor") return "focus:border-blazing-flame focus:ring-blazing-flame/10";
    if (activeRole === "ngo") return "focus:border-pine-teal focus:ring-pine-teal/10";
    return "focus:border-dark-raspberry focus:ring-dark-raspberry/10";
  };
  const getThemeShadow = () => {
    if (activeRole === "donor") return "shadow-[0_10px_25px_rgba(255,74,28,0.3)]";
    if (activeRole === "ngo") return "shadow-[0_10px_25px_rgba(41,82,74,0.3)]";
    return "shadow-[0_10px_25px_rgba(159,17,100,0.3)]";
  };

  const themeAccent = getThemeAccent();
  const themeBg = getThemeBg();
  const themeFocusBorder = getThemeFocusBorder();
  const themeShadow = getThemeShadow();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToPolicy) {
      return toast.error("You must agree to the Terms & Privacy Policy to join Sahayam.", {
        style: { background: '#ffffff', color: '#ff4a1c', border: '1px solid #ff4a1c' }
      });
    }

    setIsLoading(true);
    try {
      const payload = { ...formData, activeRole, refCode };
      if (!payload.bloodGroup) delete payload.bloodGroup;

      const { data } = await api.post("/auth/register", payload);
      login(data);
      toast.success("Welcome to the Sahayam Community!", {
        style: { background: '#ffffff', color: '#29524a', border: '1px solid #846b8a' }
      });
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed. Please check your inputs.", {
        style: { background: '#ffffff', color: '#ff4a1c', border: '1px solid #ff4a1c' }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptPolicy = () => {
    setAgreedToPolicy(true);
    setShowPolicyModal(false);
  };

  return (
    <main className="min-h-screen bg-pearl-beige flex flex-col lg:flex-row relative selection:bg-dark-raspberry selection:text-white overflow-hidden font-sans">
      
      {/* LEFT SIDE STORY/BRANDING (Hidden on mobile, visible on lg+) */}
      <div className="hidden lg:flex lg:w-1/2 bg-pine-teal relative items-center justify-center p-12 overflow-hidden border-r border-dusty-lavender/20 shadow-2xl z-20">
         <div className="absolute top-[-20%] left-[-20%] w-[40vw] h-[40vw] bg-blazing-flame/20 blur-[120px] rounded-full pointer-events-none"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[30vw] h-[30vw] bg-dark-raspberry/20 blur-[100px] rounded-full pointer-events-none"></div>
         
         <div className="relative z-10 max-w-xl text-pearl-beige">
             <Link to="/" className="flex items-center gap-3 mb-12 group inline-flex">
               <img src={logo} alt="Sahayam Logo" className="h-10 w-auto group-hover:scale-110 transition-transform drop-shadow-[0_0_15px_rgba(255,74,28,0.4)]" />
               <span className="text-2xl font-black italic tracking-tighter text-white">SAHA<span className="text-blazing-flame">YAM.</span></span>
             </Link>
             
             <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
               <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-[1.1] tracking-tight">
                 Become a Node in the <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blazing-flame to-[#ff7e5f]">Lifesaver Grid.</span>
               </h1>
               <p className="text-lg lg:text-xl font-medium text-pearl-beige/80 mb-10 leading-relaxed border-l-4 border-blazing-flame pl-6">
                 Every 2 seconds, someone needs blood or emergency assistance. By creating an account, you aren't just signing up for an app—you are stepping up as a critical lifeline for your neighborhood.
               </p>
               
               <div className="bg-surface/5 backdrop-blur-xl border border-surface/10 p-6 rounded-[2rem] shadow-xl hover:bg-surface/10 transition-colors">
                  <p className="text-sm font-black uppercase tracking-widest text-white mb-3 flex items-center gap-3">
                    <FaShieldAlt className="text-blazing-flame text-xl" /> Secure & Private
                  </p>
                  <p className="text-sm text-pearl-beige/70 leading-relaxed font-medium">
                    Your data is strictly encrypted. We only use your location to match you with verified, hyper-local emergencies. No spam. No compromises. Just life-saving connections.
                  </p>
               </div>
             </motion.div>
         </div>
      </div>

      {/* RIGHT SIDE FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 relative z-10 overflow-y-auto min-h-screen">
        {/* VIBRANT BACKGROUND GLOWS */}
        <div className="absolute top-[10%] right-[-10%] w-[50vw] max-w-[600px] h-[50vh] bg-dark-raspberry/10 blur-[100px] rounded-full pointer-events-none"></div>

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
            <h2 className="text-3xl font-black text-pine-teal tracking-tight mb-1 uppercase">
              Join <span className={themeAccent}>Sahayam.</span>
            </h2>
            <p className="text-dusty-lavender text-xs font-bold uppercase tracking-widest mt-1">
              Create your secure account.
            </p>
          </div>

          {/* Role Selector */}
          <div className="flex bg-surface/50 backdrop-blur-md p-1.5 rounded-2xl mb-6 border border-dusty-lavender/30 shadow-sm flex-wrap sm:flex-nowrap gap-1 sm:gap-0">
            <button
              type="button"
              onClick={() => setActiveRole("donor")}
              className={`flex-1 py-3 px-1 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${activeRole === "donor" ? "bg-blazing-flame text-white shadow-md" : "text-dusty-lavender hover:text-pine-teal hover:bg-surface"}`}
            >
              Donor
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("receiver")}
              className={`flex-1 py-3 px-1 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${activeRole === "receiver" ? "bg-dark-raspberry text-white shadow-md" : "text-dusty-lavender hover:text-pine-teal hover:bg-surface"}`}
            >
              Receiver
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("ngo")}
              className={`flex-1 py-3 px-1 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${activeRole === "ngo" ? "bg-pine-teal text-white shadow-md" : "text-dusty-lavender hover:text-pine-teal hover:bg-surface"}`}
            >
              Institution
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FaUserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-dusty-lavender/80" />
              <input
                required
                aria-label={activeRole === "ngo" ? "Representative Name" : "Full Name"}
                type="text"
                placeholder={activeRole === "ngo" ? "Representative Name" : "Full Name"}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full bg-surface border border-dusty-lavender/40 rounded-xl pl-11 pr-4 py-3.5 text-pine-teal text-base md:text-sm outline-none focus:ring-4 transition-all shadow-inner placeholder-dusty-lavender/70 ${themeFocusBorder}`}
              />
            </div>

            {activeRole === "ngo" && (
              <div className="relative">
                <FaShieldAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-dusty-lavender/80" />
                <input
                  required
                  aria-label="Organization/Hospital Name"
                  type="text"
                  placeholder="Organization/Hospital Name"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  className={`w-full bg-surface border border-dusty-lavender/40 rounded-xl pl-11 pr-4 py-3.5 text-pine-teal text-base md:text-sm outline-none focus:ring-4 transition-all shadow-inner placeholder-dusty-lavender/70 ${themeFocusBorder}`}
                />
              </div>
            )}

            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-dusty-lavender/80" />
              <input
                required
                aria-label="Email Address"
                type="email"
                placeholder="operator@sahayam.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full bg-surface border border-dusty-lavender/40 rounded-xl pl-11 pr-4 py-3.5 text-pine-teal text-base md:text-sm outline-none focus:ring-4 transition-all shadow-inner placeholder-dusty-lavender/70 ${themeFocusBorder}`}
              />
            </div>

            <div className="relative">
              <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-dusty-lavender/80" />
              <input
                required
                aria-label="Phone Number"
                type="tel"
                placeholder="+91 XXXXXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full bg-surface border border-dusty-lavender/40 rounded-xl pl-11 pr-4 py-3.5 text-pine-teal text-base md:text-sm outline-none focus:ring-4 transition-all shadow-inner placeholder-dusty-lavender/70 ${themeFocusBorder}`}
              />
            </div>

            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-dusty-lavender/80" />
              <input
                required
                aria-label="Secure Password"
                type="password"
                placeholder="Secure Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full bg-surface border border-dusty-lavender/40 rounded-xl pl-11 pr-4 py-3.5 text-pine-teal text-base md:text-sm outline-none focus:ring-4 transition-all shadow-inner placeholder-dusty-lavender/70 ${themeFocusBorder}`}
              />
            </div>

            {activeRole === "donor" && (
              <div className="relative">
                <FaTint className="absolute left-4 top-1/2 -translate-y-1/2 text-blazing-flame" />
                <select
                  aria-label="Blood Group"
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className={`w-full bg-surface border border-dusty-lavender/40 rounded-xl pl-11 pr-4 py-3.5 text-pine-teal text-base md:text-sm outline-none focus:ring-4 transition-all appearance-none shadow-inner cursor-pointer ${themeFocusBorder}`}
                >
                  <option value="" disabled className="text-dusty-lavender">Blood Group (Optional)</option>
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 👉 THE LEGAL SHIELD: A11y Compliant Checkbox */}
            <div className="flex items-start gap-3 mt-6 mb-2 bg-surface/50 p-4 rounded-xl border border-surface shadow-sm">
              <button
                type="button"
                role="checkbox"
                aria-checked={agreedToPolicy}
                onClick={() => setAgreedToPolicy(!agreedToPolicy)}
                className={`w-5 h-5 mt-0.5 rounded border flex items-center justify-center shrink-0 transition-all ${agreedToPolicy ? (activeRole === "donor" ? "bg-blazing-flame border-blazing-flame" : "bg-dark-raspberry border-dark-raspberry") : "bg-surface border-dusty-lavender/50 shadow-inner"}`}
              >
                {agreedToPolicy && <FaCheck className="text-white text-[10px]" />}
              </button>
              <p className="text-[10px] sm:text-xs text-pine-teal leading-relaxed font-medium">
                I agree to the{" "}
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(true)}
                  className={`font-bold underline decoration-dusty-lavender underline-offset-4 transition-all ${themeAccent}`}
                >
                  Terms & Privacy Policy
                </button>
                .
                <br /><br />
                <span className="text-dusty-lavender block leading-tight">
                  <strong className="text-pine-teal">Disclaimer:</strong> Sahayam
                  is a community coordination tool, not an official emergency
                  service. I take full legal responsibility for any
                  exchanges made through this platform.
                </span>
              </p>
            </div>

            {/* The Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !agreedToPolicy}
              className={`w-full py-4 mt-4 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs text-white transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${themeBg} ${themeShadow}`}
            >
              {isLoading ? <FaSpinner className="animate-spin text-xl" /> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-dusty-lavender text-[10px] uppercase font-bold tracking-widest mt-8">
            Already a hero?{" "}
            <Link to="/login" className="text-pine-teal font-black hover:text-blazing-flame transition-colors">
              Sign In
            </Link>
          </p>
        </motion.div>
      </div>

      <PolicyModal 
        isOpen={showPolicyModal} 
        onClose={() => setShowPolicyModal(false)} 
        onAccept={handleAcceptPolicy} 
      />
    </main>
  );
};

export default Register;