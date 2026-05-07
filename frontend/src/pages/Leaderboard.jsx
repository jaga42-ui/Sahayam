import { useState, useEffect, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import Layout from '../components/Layout';
import { FaSpinner, FaCrown, FaStar } from 'react-icons/fa';

import api from '../utils/api';

const Leaderboard = () => {
  const { user } = useContext(AuthContext);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 👉 PREMIUM LIGHT THEME VARIABLES
  const isDonor = user?.activeRole === 'donor';
  const themeAccent = isDonor ? 'text-blazing-flame' : 'text-dark-raspberry';
  const themeBg = isDonor ? 'bg-blazing-flame' : 'bg-dark-raspberry';
  
  // Highlight the current user's card
  const meCardTheme = isDonor 
    ? 'bg-surface border-blazing-flame/40 shadow-[0_10px_30px_rgba(255,74,28,0.15)] ring-2 ring-blazing-flame/20' 
    : 'bg-surface border-dark-raspberry/40 shadow-[0_10px_30px_rgba(159,17,100,0.15)] ring-2 ring-dark-raspberry/20';

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const userRes = await api.get('/donations/leaderboard');
        setLeaders(userRes.data);
        setLoading(false);
      } catch (error) { 
        setLoading(false); 
      }
    };
    
    fetchLeaders();
  }, [user]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 pb-32 md:pb-24 min-h-screen text-pine-teal">
        
        <header className="text-center pt-6 mb-10 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-pine-teal uppercase tracking-tight mb-2 md:mb-4">
            COMMUNITY <span className={themeAccent}>LEADERS.</span>
          </h1>
          <p className="text-dusty-lavender uppercase font-black tracking-widest text-[10px] md:text-xs">Top Sahayam contributors making an impact</p>
        </header>


        {loading ? (
          <div className="flex justify-center py-20"><FaSpinner className={`animate-spin text-4xl ${themeAccent}`} /></div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {leaders.map((leader, index) => {
              const isTop3 = index < 3;
              const isMe = leader._id === user._id;

              return (
                <div 
                  key={leader._id} 
                  className={`relative flex items-center justify-between p-4 md:p-6 rounded-2xl md:rounded-[2rem] border transition-all ${
                    isMe 
                      ? meCardTheme 
                      : isTop3 
                        ? 'bg-surface/90 backdrop-blur-md border-surface shadow-[0_20px_40px_rgba(41,82,74,0.08)]' 
                        : 'bg-surface/50 backdrop-blur-sm border-dusty-lavender/20 shadow-sm'
                  } ${isTop3 ? 'md:scale-105 z-10' : 'scale-100'}`}
                >
                  
                  <div className="flex items-center gap-3 md:gap-6 overflow-hidden">
                    <div className="text-xl md:text-2xl font-black italic text-dusty-lavender w-6 md:w-8 text-center shrink-0">
                      {index === 0 ? <FaCrown className="text-blazing-flame mx-auto drop-shadow-md" /> : index + 1}
                    </div>
                    
                    <div className="relative shrink-0">
                      {leader.profilePic ? (
                        <img src={leader.profilePic} alt={leader.name} className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl object-cover border-2 ${isTop3 ? 'border-surface shadow-md' : 'border-dusty-lavender/20'}`} referrerPolicy="no-referrer" />
                      ) : (
                        <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-pearl-beige/50 border ${isTop3 ? 'border-surface shadow-md' : 'border-dusty-lavender/30'} flex items-center justify-center font-black text-pine-teal text-xl md:text-2xl uppercase`}>
                          {leader.name.charAt(0)}
                        </div>
                      )}
                      {index === 0 && <div className="absolute -top-2 -right-2 bg-blazing-flame text-white p-1 md:p-1.5 rounded-full text-[10px] md:text-xs shadow-lg shadow-blazing-flame/30"><FaStar /></div>}
                    </div>

                    <div className="min-w-0 pr-2">
                      <h3 className="text-base md:text-xl font-black text-pine-teal flex items-center gap-2 truncate">
                        <span className="truncate">{leader.name}</span>
                        {isMe && <span className={`text-[9px] md:text-[10px] ${themeBg} text-white px-2 py-0.5 rounded-md uppercase tracking-widest shrink-0 shadow-sm`}>You</span>}
                      </h3>
                      <p className={`${themeAccent} text-[9px] md:text-[10px] font-bold uppercase tracking-widest truncate mt-0.5`}>{leader.rank || 'Member'}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xl md:text-3xl font-black text-pine-teal">{leader.points}</p>
                    <p className="text-[8px] md:text-[10px] text-dusty-lavender font-black uppercase tracking-widest">XP</p>
                  </div>
                </div>
              );
            })}
            
            {leaders.length === 0 && (
              <div className="text-center py-10 bg-surface/50 backdrop-blur-md border border-dusty-lavender/30 rounded-3xl text-dusty-lavender font-bold uppercase tracking-widest text-xs md:text-sm">
                No leaders yet. Be the first to make a Sahayam impact!
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Leaderboard;