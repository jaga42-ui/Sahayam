// Developed by guruprasad and team
import { useState, useEffect, useContext } from 'react';
import axios from 'axios'; 
import AuthContext from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaUser, FaEnvelope, FaMapMarkerAlt, FaTint, FaBoxOpen, 
  FaAward, FaHistory, FaEdit, FaSave, FaTimes, FaPhone, 
  FaLocationArrow, FaSpinner, FaStar, FaShieldAlt, FaSignOutAlt 
} from 'react-icons/fa';
import toast from 'react-hot-toast';

import api from '../utils/api';

const Profile = () => {
  const { user, login, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalDonations: 0, activeListings: 0, bloodDonations: 0 });
  const [loading, setLoading] = useState(true);
  const [generatedStory, setGeneratedStory] = useState("");
  
  const [isEditing, setIsEditing] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '', bloodGroup: user?.bloodGroup || '', phone: user?.phone || '', addressText: user?.addressText || ''
  });

  const isDonor = user?.activeRole === 'donor';
  const themeAccent = isDonor ? 'text-blazing-flame' : 'text-dark-raspberry';
  const themeBg = isDonor ? 'bg-blazing-flame hover:bg-[#e03a12]' : 'bg-dark-raspberry hover:bg-[#850e53]';
  const themeFocusBorder = isDonor ? 'focus:border-blazing-flame' : 'focus:border-dark-raspberry';
  const themeGradient = 'from-dark-raspberry to-blazing-flame';

  useEffect(() => {
    const fetchImpactStats = async () => {
      if (!user?.token) return;
      try {
        const { data } = await api.get('/donations/my-history');
        const active = data.filter(d => d.status === 'available' || d.status === 'pending').length;
        const blood = data.filter(d => d.category === 'blood').length;
        setStats({ totalDonations: data.length, activeListings: active, bloodDonations: blood });
        setLoading(false);
      } catch (error) { setLoading(false); }
    };

    setFormData({
      name: user?.name || '', bloodGroup: user?.bloodGroup || '', phone: user?.phone || '', addressText: user?.addressText || ''
    });

    fetchImpactStats();
  }, [user]);

  // 👉 MAPBOX REVERSE GEOCODING (GPS)
  const handleGetLocation = async () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported');
    setIsFetchingLocation(true);
    const toastId = toast.loading("Locking onto GPS via Mapbox...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const apiKey = import.meta.env.VITE_MAPBOX_TOKEN;
          if (!apiKey) throw new Error("Mapbox Token Missing");

          const { data } = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${apiKey}`);
          
          if (data && data.features && data.features.length > 0) {
            const cityString = data.features[0].place_name.split(",")[0];
            setFormData({ ...formData, addressText: cityString });
            toast.success(`Location locked: ${cityString}`, { id: toastId });
          } else { throw new Error("Location unresolvable"); }
        } catch (error) { toast.error("Could not resolve location via Mapbox", { id: toastId }); } 
        finally { setIsFetchingLocation(false); }
      },
      () => {
        setIsFetchingLocation(false);
        toast.error('Please allow location permissions', { id: toastId });
      }
    );
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/profile', formData);
      login(data); 
      setIsEditing(false);
      toast.success("Identity updated successfully.");
    } catch (error) { toast.error(error.response?.data?.message || "Failed to update profile"); }
  };

  const handleMobileLogout = () => {
    logout();
    navigate('/login');
    toast.success("Successfully logged out.");
  };

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 pb-32 md:pb-24 text-pine-teal min-h-screen"> 
        
        <header className="mb-8 md:mb-12 border-b border-dusty-lavender/30 pt-6 pb-6 md:pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-4xl md:text-6xl font-black text-pine-teal uppercase tracking-tight">
              OPERATIVE <span className={themeAccent}>DOSSIER.</span>
            </motion.h1>
            <p className="text-dusty-lavender font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[10px] mt-1 md:mt-2">Global Network Profile & Settings</p>
          </div>
          
          {!isEditing && (
            <button onClick={() => setIsEditing(true)} className="w-full md:w-auto px-6 py-4 md:py-3 rounded-2xl md:rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest bg-white border border-dusty-lavender/30 text-dusty-lavender hover:text-pine-teal hover:shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
              <FaEdit /> Update Dossier
            </button>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          <div className="lg:col-span-4 space-y-6 md:space-y-8">
            <div className="bg-white/70 backdrop-blur-lg border border-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 relative overflow-hidden transition-all duration-500 shadow-[0_20px_40px_rgba(41,82,74,0.08)] group hover:shadow-[0_24px_50px_rgba(41,82,74,0.12)]">
              <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/70 to-transparent dashboard-card-sheen pointer-events-none" />
              
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="relative mb-5 md:mb-6 group">
                  {user.profilePic ? (
                    <img src={user.profilePic} alt="Profile" referrerPolicy="no-referrer" className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover shadow-lg border-4 border-white relative z-10" />
                  ) : (
                    <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center text-white font-black text-5xl md:text-6xl shadow-lg border-4 border-white relative z-10 bg-gradient-to-tr ${themeGradient}`}>
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-blazing-flame text-white p-2 md:p-2.5 rounded-full shadow-lg border-4 border-white z-20" title={user.rank || 'Member'}>
                    <FaShieldAlt className="text-xs md:text-sm" />
                  </div>
                </div>
                
                {!isEditing && (
                  <>
                    <h2 className="text-2xl md:text-3xl font-black text-pine-teal tracking-tight leading-tight">{user.name}</h2>
                    <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest mt-1 md:mt-2 ${themeAccent}`}>
                      {user.rank || (user.isAdmin ? <span className="text-dark-raspberry">System Admin</span> : 'Verified Sahayam Member')}
                    </p>

                    <div className="mt-5 md:mt-6 flex items-center justify-center gap-4 bg-white px-5 py-3 rounded-xl md:rounded-2xl border border-dusty-lavender/20 w-full shadow-sm">
                      <div className="flex items-center gap-3">
                        <FaStar className="text-blazing-flame text-lg md:text-xl" />
                        {user.totalRatings > 0 ? (
                          <div className="flex flex-col items-start leading-none">
                            <span className="text-pine-teal font-black text-lg md:text-xl">{user.rating?.toFixed(1)}</span>
                            <span className="text-dusty-lavender text-[8px] md:text-[9px] uppercase font-bold tracking-widest mt-0.5">{user.totalRatings} Endorsements</span>
                          </div>
                        ) : (
                          <span className="text-dusty-lavender font-black text-[10px] md:text-xs tracking-widest uppercase ml-1">Unranked</span>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 md:mt-8 space-y-2 md:space-y-3 relative z-10">
                    <div className="flex items-center gap-4 text-pine-teal bg-white/50 border border-white p-3.5 md:p-4 rounded-xl md:rounded-2xl shadow-sm">
                      <FaEnvelope className={`${themeAccent} shrink-0`} /> <span className="text-xs md:text-sm font-bold truncate">{user.email}</span>
                    </div>
                    <div className="flex items-center gap-4 text-pine-teal bg-white/50 border border-white p-3.5 md:p-4 rounded-xl md:rounded-2xl shadow-sm">
                      <FaPhone className={`${themeAccent} shrink-0`} /> <span className="text-xs md:text-sm font-bold truncate">{user.phone || 'Phone Classified'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-pine-teal bg-white/50 border border-white p-3.5 md:p-4 rounded-xl md:rounded-2xl shadow-sm">
                      <FaTint className="text-blazing-flame shrink-0" /> <span className="text-xs md:text-sm font-bold truncate">Type: {user.bloodGroup || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-4 text-pine-teal bg-white/50 border border-white p-3.5 md:p-4 rounded-xl md:rounded-2xl shadow-sm">
                      <FaMapMarkerAlt className={`${themeAccent} shrink-0`} /> <span className="text-xs md:text-sm font-bold truncate">{user.addressText || 'Sector Unknown'}</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form key="edit" onSubmit={handleUpdateProfile} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 md:mt-6 space-y-4 relative z-10">
                    <div>
                      <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 block">Full Name</label>
                      <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-xl md:rounded-2xl px-4 py-3.5 text-pine-teal text-base md:text-sm outline-none transition-all shadow-inner bg-white focus:bg-white ${themeFocusBorder}`} required />
                    </div>

                    <div>
                      <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 block">Secure Phone</label>
                      <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+91 XXXXXXXXXX" className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-xl md:rounded-2xl px-4 py-3.5 text-pine-teal text-base md:text-sm outline-none transition-all shadow-inner placeholder-dusty-lavender/70 focus:bg-white ${themeFocusBorder}`} />
                    </div>

                    <div>
                      <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 block">Blood Type</label>
                      <select value={formData.bloodGroup} onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})} className={`w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-xl md:rounded-2xl px-4 py-3.5 text-pine-teal text-base md:text-sm outline-none appearance-none transition-all shadow-inner cursor-pointer focus:bg-white ${themeFocusBorder}`}>
                        <option value="" className="text-dusty-lavender">Select Blood Group</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-dusty-lavender ml-2 md:ml-4 mb-1.5 block">Sector / Base</label>
                      <div className="flex gap-2">
                        <input value={formData.addressText} onChange={(e) => setFormData({...formData, addressText: e.target.value})} placeholder="e.g. Bhubaneswar" className={`flex-1 w-full bg-pearl-beige/30 border border-dusty-lavender/40 rounded-xl md:rounded-2xl px-4 py-3.5 text-pine-teal text-base md:text-sm outline-none transition-all shadow-inner placeholder-dusty-lavender/70 focus:bg-white ${themeFocusBorder}`} />
                        <button 
                          type="button" onClick={handleGetLocation} disabled={isFetchingLocation}
                          className="px-4 bg-white text-blazing-flame border border-dusty-lavender/40 rounded-xl md:rounded-2xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center shrink-0 shadow-sm hover:shadow-md"
                        >
                          {isFetchingLocation ? <FaSpinner className="animate-spin text-lg" /> : <FaLocationArrow className="text-lg" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 md:gap-3 mt-6 md:mt-8 pt-4 border-t border-dusty-lavender/20">
                      <button type="button" onClick={() => setIsEditing(false)} className="w-12 md:w-14 shrink-0 py-4 rounded-xl md:rounded-2xl font-black text-xs uppercase bg-white hover:bg-pearl-beige text-dusty-lavender hover:text-dark-raspberry active:scale-95 transition-all flex items-center justify-center shadow-sm border border-dusty-lavender/30">
                        <FaTimes className="text-lg" />
                      </button>
                      <button type="submit" className={`flex-1 py-4 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all text-white shadow-md active:scale-95 border border-transparent ${themeBg}`}>
                        <FaSave className="text-lg" /> Commit Record
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-5 md:space-y-6">
            
            <div className="bg-white/70 backdrop-blur-lg border border-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 relative overflow-hidden group shadow-[0_20px_40px_rgba(41,82,74,0.08)]">
              <div className="absolute -right-8 -bottom-8 md:-right-10 md:-bottom-10 text-8xl md:text-9xl text-blazing-flame/10 pointer-events-none">
                <FaAward />
              </div>
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 md:gap-6">
                <div>
                  <p className="text-blazing-flame text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mb-1 md:mb-2 flex items-center gap-2">
                    <FaStar className="animate-pulse" /> Sahayam Standing
                  </p>
                  <h3 className="text-5xl sm:text-6xl md:text-8xl font-black text-pine-teal tracking-tighter">{user.points || 0}</h3>
                  <p className="text-dusty-lavender font-bold uppercase tracking-widest text-[9px] md:text-[10px] mt-1 md:mt-2">Total Experience Points (XP)</p>
                </div>
                <div className="w-full md:w-auto bg-white px-5 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl border border-dusty-lavender/30 text-center md:min-w-[140px] shadow-sm">
                  <p className="text-dusty-lavender text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1">Current Rank</p>
                  <p className="text-dark-raspberry font-bold text-sm md:text-base tracking-wider truncate">{user.rank || 'Initiate'}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="bg-white/70 backdrop-blur-lg border border-white rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 relative overflow-hidden group shadow-[0_10px_30px_rgba(41,82,74,0.05)] hover:scale-105 hover:shadow-[0_20px_40px_rgba(41,82,74,0.12)] transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-gradient-to-bl from-pearl-beige to-transparent rounded-bl-[80px] md:rounded-bl-[100px] pointer-events-none"></div>
                <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 group-hover:scale-150 transition-all duration-500 pointer-events-none">
                  <FaBoxOpen className="text-[120px]" />
                </div>
                <div className={`text-3xl md:text-4xl mb-4 md:mb-6 opacity-90 ${themeAccent}`}><FaBoxOpen /></div>
                {loading ? (
                  <div className="h-10 md:h-14 w-16 md:w-24 bg-dusty-lavender/20 animate-pulse rounded-lg md:rounded-xl relative z-10"></div>
                ) : (
                  <h3 className="text-4xl md:text-5xl font-black text-pine-teal relative z-10">{user.donationsCount || stats.totalDonations}</h3>
                )}
                <p className="text-dusty-lavender text-[9px] md:text-[10px] uppercase font-black tracking-widest mt-2 md:mt-3 leading-tight relative z-10">Missions Completed</p>
              </div>

              <div className="bg-white/70 backdrop-blur-lg border border-white rounded-2xl md:rounded-[2.5rem] p-5 md:p-8 relative overflow-hidden group shadow-[0_10px_30px_rgba(41,82,74,0.05)] hover:scale-105 hover:shadow-[0_20px_40px_rgba(41,82,74,0.12)] transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-gradient-to-bl from-pearl-beige to-transparent rounded-bl-[80px] md:rounded-bl-[100px] pointer-events-none"></div>
                <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 group-hover:scale-150 transition-all duration-500 pointer-events-none">
                  <FaHistory className="text-[120px]" />
                </div>
                <div className={`text-3xl md:text-4xl mb-4 md:mb-6 opacity-90 ${themeAccent}`}><FaHistory /></div>
                {loading ? (
                  <div className="h-10 md:h-14 w-16 md:w-24 bg-dusty-lavender/20 animate-pulse rounded-lg md:rounded-xl relative z-10"></div>
                ) : (
                  <h3 className="text-4xl md:text-5xl font-black text-pine-teal relative z-10">{stats.activeListings}</h3>
                )}
                <p className="text-dusty-lavender text-[9px] md:text-[10px] uppercase font-black tracking-widest mt-2 md:mt-3 leading-tight relative z-10">Active Field Ops</p>
              </div>
            </div>

            {/* 👉 NEW: Referral Gamification */}
            <div className="mt-6 bg-white/70 backdrop-blur-lg border border-pine-teal/20 rounded-[2rem] p-6 shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-pine-teal flex items-center gap-2 mb-1">
                    <FaAward className="text-pine-teal" /> Recruit & Rank Up
                  </h3>
                  <p className="text-[10px] text-dusty-lavender uppercase font-bold tracking-wider">Earn 50 XP for every hero you recruit!</p>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`https://hopelink-api.onrender.com/register?ref=${user.referralCode || ''}`);
                    toast.success("Recruitment Link Copied!");
                  }}
                  className="w-full md:w-auto py-3 px-6 bg-pine-teal hover:bg-[#1a3630] text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-md transition-all active:scale-95"
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div className="md:hidden mt-8 pt-6 border-t border-dusty-lavender/30">
              <button 
                onClick={handleMobileLogout} 
                className="w-full py-4 bg-white hover:bg-pearl-beige text-dark-raspberry border border-dark-raspberry/30 rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
              >
                <FaSignOutAlt className="text-lg" /> Secure Logout
              </button>
            </div>

            {/* 👉 NEW: AI Hero Story Engine */}
            <div className="mt-8 bg-white/70 backdrop-blur-lg border border-blazing-flame/20 rounded-[2rem] p-6 shadow-sm relative overflow-hidden group flex flex-col">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blazing-flame to-pine-teal" />
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
                <div className="text-center md:text-left">
                  <h3 className="text-sm font-black uppercase tracking-widest text-pine-teal flex items-center justify-center md:justify-start gap-2 mb-1">
                    <FaAward className="text-blazing-flame" /> Share Your Legacy
                  </h3>
                  <p className="text-[10px] text-dusty-lavender uppercase font-bold tracking-wider">Let AI craft your personalized impact story to inspire others.</p>
                </div>
                <button 
                  onClick={async () => {
                    const toastId = toast.loading("AI is crafting your story...");
                    try {
                      const { data } = await api.get('/donations/hero-story');
                      toast.dismiss(toastId);
                      setGeneratedStory(data.story);
                      toast.success("Story Generated!");
                    } catch (err) {
                      toast.error("Failed to generate story", { id: toastId });
                    }
                  }}
                  className="w-full md:w-auto py-3 px-6 bg-blazing-flame hover:bg-[#e03a12] text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <FaStar /> Generate AI Story
                </button>
              </div>

              {generatedStory && (
                <div className="mt-4 p-4 bg-white border border-dusty-lavender/30 rounded-xl relative">
                  <p className="text-pine-teal font-medium text-sm italic">"{generatedStory}"</p>
                  <div className="flex justify-end mt-3">
                    <button onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: 'My Sahayam Journey', text: generatedStory, url: 'https://hopelink-api.onrender.com' }).catch(console.error);
                        } else {
                          navigator.clipboard.writeText(generatedStory + " https://hopelink-api.onrender.com");
                          toast.success("Copied to clipboard!");
                        }
                    }} className="text-[10px] uppercase font-black tracking-widest text-blazing-flame hover:underline flex items-center gap-1">
                      <FaAward /> Share Now
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center pt-6 md:pt-8 px-4">
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] italic leading-relaxed text-dusty-lavender">
                "A community is only as strong as its willingness to protect one another."
              </p>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
};

export default Profile;