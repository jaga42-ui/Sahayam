import { useState, useContext } from 'react'; // 👉 Imported useState
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaBoxOpen, FaUser, FaSignOutAlt, FaTrophy, FaMapMarkerAlt, FaShieldAlt, FaExchangeAlt, FaEnvelope, FaCommentAlt } from 'react-icons/fa'; // 👉 Imported FaCommentAlt
import AuthContext from '../context/AuthContext';
import toast from 'react-hot-toast';

import logo from '../assets/logo.png'; 
import FeedbackModal from './FeedbackModal'; // 👉 Imported the Modal

const Sidebar = () => {
  const { user, logout, switchRole, toggleAvailability } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  // 👉 THE FIX: Added Feedback State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('System override successful. Session terminated.', {
      style: { background: '#ffffff', color: '#29524a', border: '1px solid #846b8a' }
    });
    navigate('/login');
  };

  const isDonor = user?.activeRole === 'donor';
  const themeAccent = isDonor ? 'text-blazing-flame' : 'text-dark-raspberry';
  const themeBg = isDonor ? 'bg-blazing-flame shadow-blazing-flame/30' : 'bg-dark-raspberry shadow-dark-raspberry/30';

  const getLinkClasses = (path, isRadar = false) => {
    const isActive = location.pathname === path;
    if (isRadar) {
      return `flex items-center space-x-3 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold ${
        isActive 
          ? "bg-blazing-flame text-white shadow-lg shadow-blazing-flame/30" 
          : "bg-transparent text-blazing-flame/70 hover:bg-surface hover:text-blazing-flame"
      }`;
    }
    return `flex items-center space-x-3 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold ${
      isActive 
        ? `${themeBg} text-white shadow-lg scale-[1.02]` 
        : "text-dusty-lavender hover:bg-surface hover:text-pine-teal"
    }`;
  };

  return (
    <div className="h-screen w-72 bg-surface/70 backdrop-blur-xl border-r border-surface text-pine-teal flex flex-col fixed left-0 top-0 z-50 overflow-hidden font-sans shadow-[0_20px_40px_rgba(41,82,74,0.08)]">
      
      {/* SIDEBAR HEADER */}
      <div className="p-8 pb-6">
        <Link to="/dashboard" className="flex items-center gap-3 group mb-8">
          <img src={logo} alt="Sahayam" className="h-10 w-auto group-hover:rotate-12 transition-transform drop-shadow-sm" />
          <span className="text-2xl font-black italic tracking-tighter uppercase text-pine-teal">
            SAHA<span className={themeAccent}>YAM.</span>
          </span>
        </Link>

        {user && !user.isAdmin && (
          <div className="space-y-3">
            <button 
              onClick={switchRole}
              className="w-full flex items-center justify-between bg-pearl-beige/30 border border-dusty-lavender/30 p-1.5 rounded-2xl hover:bg-surface transition-all shadow-inner"
            >
              <span className={`text-[9px] font-black uppercase tracking-widest flex-1 text-center ${isDonor ? 'text-blazing-flame' : 'text-dusty-lavender'}`}>Donor</span>
              <div className="w-10 h-5 bg-surface rounded-full relative border border-dusty-lavender/40 shadow-sm">
                <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform duration-300 ${isDonor ? 'bg-blazing-flame' : 'bg-dark-raspberry translate-x-5'}`} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest flex-1 text-center ${!isDonor ? 'text-dark-raspberry' : 'text-dusty-lavender'}`}>Receiver</span>
            </button>
            <button 
              onClick={toggleAvailability}
              className="w-full flex items-center justify-between bg-pearl-beige/30 border border-dusty-lavender/30 p-1.5 rounded-2xl hover:bg-surface transition-all shadow-inner"
            >
              <span className={`text-[9px] font-black uppercase tracking-widest flex-1 text-center ${!user?.isAvailable ? 'text-pine-teal' : 'text-dusty-lavender'}`}>Snooze</span>
              <div className="w-10 h-5 bg-surface rounded-full relative border border-dusty-lavender/40 shadow-sm">
                <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform duration-300 ${!user?.isAvailable ? 'bg-dusty-lavender' : 'bg-pine-teal translate-x-5'}`} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-widest flex-1 text-center ${user?.isAvailable ? 'text-blazing-flame' : 'text-dusty-lavender'}`}>On-Duty</span>
            </button>
          </div>
        )}
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
        {user?.isAdmin && (
          <Link to="/admin" className="flex items-center space-x-3 px-5 py-3.5 rounded-2xl font-bold bg-dark-raspberry/10 text-dark-raspberry border border-dark-raspberry/20 hover:bg-dark-raspberry hover:text-white transition-all mb-6">
            <FaShieldAlt /> <span>Admin Console</span>
          </Link>
        )}

        <Link to="/dashboard" className={getLinkClasses('/dashboard')}>
          <FaHome className="text-lg" /> <span>Feed</span>
        </Link>
        
        <Link to="/radar" className={getLinkClasses('/radar', true)}>
          <FaMapMarkerAlt className={`text-lg ${location.pathname === '/radar' ? '' : 'animate-pulse'}`} /> 
          <span>Crisis Radar</span>
        </Link>

        <Link to="/donations" className={getLinkClasses('/donations')}>
          <FaBoxOpen className="text-lg" /> <span>{isDonor ? 'Post Item' : 'Request Item'}</span>
        </Link>

        <Link to="/chat/inbox" className={getLinkClasses('/chat/inbox')}>
          <FaEnvelope className="text-lg" /> <span>Secure Inbox</span>
        </Link>
        
        <Link to="/leaderboard" className={getLinkClasses('/leaderboard')}>
          <FaTrophy className="text-lg" /> <span>Leaderboard</span>
        </Link>

        <Link to="/profile" className={getLinkClasses('/profile')}>
          <FaUser className="text-lg" /> <span>Profile</span>
        </Link>
      </nav>

      {/* USER PROFILE & LOGOUT SECTION */}
      <div className="p-4 mt-auto">
        <div className="bg-surface border border-dusty-lavender/30 rounded-3xl p-4 mb-4 shadow-sm">
          <div className="flex items-center gap-3">
            {user?.profilePic ? (
              <img src={user.profilePic} className="w-10 h-10 rounded-xl object-cover border border-dusty-lavender/30" referrerPolicy="no-referrer" />
            ) : (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg uppercase shadow-sm ${isDonor ? "bg-blazing-flame/10 text-blazing-flame border-blazing-flame/20" : "bg-dark-raspberry/10 text-dark-raspberry border-dark-raspberry/20"}`}>
                {user?.name?.charAt(0)}
              </div>
            )}
            <div className="overflow-hidden">
              <p className="text-sm font-black text-pine-teal truncate uppercase tracking-tighter">{user?.name}</p>
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${themeAccent}`}>
                LVL {Math.floor((user?.points || 0) / 100)} {user?.rank || 'Operator'}
              </p>
            </div>
          </div>
        </div>

        {/* 👉 THE FIX: Added Feedback Button */}
        <button 
          onClick={() => setIsFeedbackOpen(true)} 
          className="group flex items-center gap-3 w-full px-5 py-4 text-dusty-lavender hover:text-pine-teal transition-all rounded-2xl hover:bg-surface font-black uppercase tracking-widest text-[10px] mb-2"
        >
          <FaCommentAlt className="text-lg group-hover:-translate-y-1 transition-transform" /> 
          <span>Send Feedback</span>
        </button>

        <button 
          onClick={handleLogout} 
          className="group flex items-center gap-3 w-full px-5 py-4 text-dusty-lavender hover:text-dark-raspberry transition-all rounded-2xl hover:bg-surface font-black uppercase tracking-widest text-[10px]"
        >
          <FaSignOutAlt className="text-lg group-hover:rotate-12 transition-transform" /> 
          <span>End Session</span>
        </button>
      </div>

      {/* 👉 THE FIX: Added Feedback Modal Component */}
      <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
    </div>
  );
};

export default Sidebar;