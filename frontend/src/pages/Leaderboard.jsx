import { useState, useEffect, useContext } from "react";
import AuthContext from "../context/AuthContext";
import Layout from "../components/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { FaSpinner, FaCrown, FaStar, FaMedal, FaFire } from "react-icons/fa";
import api from "../utils/api";

const springIn = { type: "spring", stiffness: 300, damping: 26 };

const RANK_COLORS = [
  { text: "text-yellow-400",  bg: "bg-yellow-400/15",  border: "border-yellow-400/30", glow: "shadow-[0_0_24px_rgba(250,204,21,0.35)]", crown: "text-yellow-400" },
  { text: "text-slate-300",   bg: "bg-slate-300/12",   border: "border-slate-300/25",  glow: "shadow-[0_0_18px_rgba(203,213,225,0.25)]", crown: "text-slate-300" },
  { text: "text-orange-400",  bg: "bg-orange-400/12",  border: "border-orange-400/25", glow: "shadow-[0_0_18px_rgba(251,146,60,0.25)]",  crown: "text-orange-400" },
];

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  show:   { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 26 } },
};

const Leaderboard = () => {
  const { user }   = useContext(AuthContext);
  const [leaders,  setLeaders]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get("/donations/leaderboard")
      .then(({ data }) => setLeaders(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const top3   = leaders.slice(0, 3);
  const rest   = leaders.slice(3);
  const myRank = leaders.findIndex((l) => l._id === user?._id);

  return (
    <Layout>
      <div className="min-h-screen bg-pearl-beige font-sans pb-32 md:pb-16">

        {/* ── AURORA HEADER ── */}
        <div className="aurora-header relative px-4 pt-8 pb-16 text-center overflow-hidden">
          <div className="dark-dot-grid absolute inset-0 opacity-20" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/25 bg-yellow-400/10 px-3.5 py-1.5 mb-4">
              <FaFire className="text-yellow-400 text-xs animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-yellow-300">Community Highlights</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
              Those who<br />
              <span className="gradient-text-aurora">show up.</span>
            </h1>
            {myRank >= 0 && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                className="mt-3 text-[11px] font-bold text-white/40 uppercase tracking-widest"
              >
                You are ranked <span className="text-white/80">#{myRank + 1}</span> · keep going
              </motion.p>
            )}
          </motion.div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <FaSpinner className="animate-spin text-3xl text-dark-raspberry" />
          </div>
        ) : (
          <>
            {/* ── TOP 3 PODIUM ── */}
            {top3.length > 0 && (
              <div className="-mt-10 px-4 mb-6">
                <div className="flex items-end justify-center gap-3">
                  {/* Reorder: 2nd, 1st, 3rd */}
                  {[top3[1], top3[0], top3[2]].map((leader, podiumIdx) => {
                    if (!leader) return <div key={podiumIdx} className="flex-1" />;
                    const realIdx   = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2;
                    const rc        = RANK_COLORS[realIdx];
                    const isFirst   = realIdx === 0;
                    const isMe      = leader._id === user?._id;
                    const heights   = ["h-28", "h-36", "h-24"]; // 2nd, 1st, 3rd

                    return (
                      <motion.div
                        key={leader._id}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ ...springIn, delay: podiumIdx * 0.1 }}
                        className="flex-1 flex flex-col items-center"
                      >
                        {/* Crown for #1 */}
                        {isFirst && (
                          <motion.div
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ ...springIn, delay: 0.4 }}
                            className="mb-1"
                          >
                            <FaCrown className="text-yellow-400 text-2xl drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] float-gentle" />
                          </motion.div>
                        )}

                        {/* Avatar */}
                        <div className={`relative mb-2 ${isFirst ? "scale-110" : ""}`}>
                          {leader.profilePic ? (
                            <img src={leader.profilePic} alt={leader.name} referrerPolicy="no-referrer"
                              className={`w-14 h-14 rounded-2xl object-cover border-2 ${rc.border} ${rc.glow}`} />
                          ) : (
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white border-2 ${rc.bg} ${rc.border} ${rc.glow}`}>
                              {leader.name?.charAt(0)}
                            </div>
                          )}
                          {isMe && (
                            <span className="absolute -top-1 -right-1 rounded-md bg-dark-raspberry px-1 py-0.5 text-[8px] font-black text-white uppercase">You</span>
                          )}
                        </div>

                        <p className="text-[11px] font-black text-pine-teal text-center truncate w-full px-1 mb-1">
                          {leader.name?.split(" ")[0]}
                        </p>

                        {/* Podium block */}
                        <div className={`w-full ${heights[podiumIdx]} rounded-t-2xl flex flex-col items-center justify-start pt-3 ${rc.bg} border-t-2 ${rc.border}`}>
                          <p className={`text-xl font-black ${rc.text}`}>#{realIdx + 1}</p>
                          <p className={`text-[10px] font-black ${rc.text} opacity-80`}>{leader.points}pts</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── REST OF THE LIST ── */}
            {rest.length > 0 && (
              <div className="px-4 space-y-2.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-dusty-lavender mb-3 px-1">Rankings</p>
                <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-2">
                  {rest.map((leader, idx) => {
                    const rank = idx + 4;
                    const isMe = leader._id === user?._id;

                    return (
                      <motion.div
                        key={leader._id}
                        variants={rowVariants}
                        className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
                          isMe
                            ? "border-dark-raspberry/35 bg-dark-raspberry/8 shadow-[0_0_20px_rgba(160,17,106,0.15)]"
                            : "border-pine-teal/8 bg-surface shadow-sm"
                        }`}
                      >
                        {/* Rank number */}
                        <div className={`w-8 text-center text-base font-black shrink-0 ${
                          isMe ? "text-dark-raspberry" : "text-dusty-lavender"
                        }`}>
                          {rank}
                        </div>

                        {/* Avatar */}
                        {leader.profilePic ? (
                          <img src={leader.profilePic} alt={leader.name} referrerPolicy="no-referrer"
                            className={`w-10 h-10 rounded-xl object-cover border shrink-0 ${isMe ? "border-dark-raspberry/30" : "border-pine-teal/10"}`} />
                        ) : (
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shrink-0 ${
                            isMe ? "bg-dark-raspberry/15 text-dark-raspberry border border-dark-raspberry/25" : "bg-surface-2 text-pine-teal border border-pine-teal/10"
                          }`}>
                            {leader.name?.charAt(0)}
                          </div>
                        )}

                        {/* Name + rank */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-sm font-bold truncate ${isMe ? "text-dark-raspberry" : "text-pine-teal"}`}>
                              {leader.name}
                            </span>
                            {isMe && <span className="shrink-0 text-[8px] font-black uppercase tracking-widest bg-dark-raspberry text-white px-1.5 py-0.5 rounded-md">You</span>}
                          </div>
                          <p className="text-[10px] font-bold text-dusty-lavender uppercase tracking-wider">{leader.rank || "Member"}</p>
                        </div>

                        {/* Points */}
                        <div className="text-right shrink-0">
                          <p className={`text-lg font-black ${isMe ? "text-dark-raspberry" : "text-pine-teal"}`}>{leader.points}</p>
                          <p className="text-[9px] text-dusty-lavender uppercase tracking-widest font-bold">pts</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            )}

            {leaders.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center px-4">
                <FaMedal className="text-4xl text-dusty-lavender/40 mb-4" />
                <h3 className="text-lg font-black text-pine-teal">No rankings yet</h3>
                <p className="text-sm text-dusty-lavender/60 mt-2">Be the first to make an impact.</p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Leaderboard;
