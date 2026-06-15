import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { FaBolt, FaStopwatch, FaSatelliteDish, FaCheckDouble, FaSpinner } from "react-icons/fa";
import api from "../utils/api";

// Maps escalation level → the radius ring it pings at (mirrors escalationEngine.js).
const LEVEL_RADIUS = { 1: "5 km", 2: "15 km", 3: "50 km" };

const STATUS_STYLES = {
  broadcasting: "bg-pine-teal/10 text-pine-teal border-pine-teal/20",
  escalating: "bg-[#34655b]/10 text-[#34655b] border-[#34655b]/20",
  matched: "bg-dark-raspberry/10 text-dark-raspberry border-dark-raspberry/20",
  fulfilled: "bg-[#7a2c4f]/10 text-[#7a2c4f] border-[#7a2c4f]/20",
  expired: "bg-dusty-lavender/10 text-dusty-lavender border-dusty-lavender/20",
  cancelled: "bg-dusty-lavender/10 text-dusty-lavender border-dusty-lavender/20",
};

function formatDuration(sec) {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

const EngineMetrics = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/admin/engine-metrics");
      setMetrics(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000); // live-ish refresh
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <FaSpinner className="animate-spin text-4xl text-dark-raspberry" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-white/70 backdrop-blur-lg border border-white rounded-[2rem] p-10 text-center text-dusty-lavender font-bold uppercase tracking-widest text-xs">
        Engine telemetry unavailable.
      </div>
    );
  }

  const kpis = [
    {
      title: "Fill Rate",
      value: `${Math.round((metrics.fillRate || 0) * 100)}%`,
      icon: <FaBolt />,
      color: "text-pine-teal",
      hint: "SOS answered / total",
    },
    {
      title: "Median Response",
      value: formatDuration(metrics.medianTimeToFirstResponseSec),
      icon: <FaStopwatch />,
      color: "text-dark-raspberry",
      hint: "time to first responder",
    },
    {
      title: "Total SOS",
      value: metrics.totalBlasts ?? 0,
      icon: <FaSatelliteDish />,
      color: "text-[#1a3630]",
      hint: "all-time broadcasts",
    },
    {
      title: "Answered",
      value: metrics.answeredCount ?? 0,
      icon: <FaCheckDouble />,
      color: "text-[#7a2c4f]",
      hint: "matched or fulfilled",
    },
  ];

  const depthData = Object.entries(metrics.escalationDepth || {}).map(([level, count]) => ({
    label: `L${level} · ${LEVEL_RADIUS[level] || ""}`,
    count,
  }));
  const DEPTH_COLORS = ["#29524a", "#34655b", "#9f1164"];

  const statusEntries = Object.entries(metrics.byStatus || {});

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26, delay: i * 0.07 }}
            className="bg-surface rounded-3xl border border-pine-teal/8 p-5 md:p-7 shadow-sm flex flex-col justify-between"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className={kpi.color}>{kpi.icon}</span>
              <p className="text-dusty-lavender text-[8px] md:text-[10px] uppercase font-black tracking-widest">
                {kpi.title}
              </p>
            </div>
            <h3 className={`text-3xl md:text-5xl font-black ${kpi.color} drop-shadow-sm`}>
              {kpi.value}
            </h3>
            <p className="text-[9px] text-dusty-lavender/80 uppercase tracking-widest font-bold mt-2">
              {kpi.hint}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Escalation depth chart */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-lg border border-white rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(41,82,74,0.08)] h-[340px] flex flex-col">
          <h3 className="text-sm font-black uppercase tracking-widest text-pine-teal mb-1">
            Escalation Depth
          </h3>
          <p className="text-[10px] text-dusty-lavender uppercase tracking-widest font-bold mb-5">
            How far the radius had to widen
          </p>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={depthData} margin={{ top: 6, right: 10, left: -22, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  stroke="#846b8a"
                  tick={{ fontSize: 10, fill: "#846b8a", fontWeight: 700 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#846b8a"
                  tick={{ fontSize: 10, fill: "#846b8a" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(41,82,74,0.06)" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #846b8a",
                    borderRadius: "12px",
                    color: "#29524a",
                  }}
                  itemStyle={{ color: "#29524a", fontWeight: "bold" }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {depthData.map((entry, index) => (
                    <Cell key={entry.label} fill={DEPTH_COLORS[index % DEPTH_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status breakdown */}
        <div className="bg-white/70 backdrop-blur-lg border border-white rounded-[2rem] p-6 shadow-[0_10px_30px_rgba(41,82,74,0.08)] h-[340px] flex flex-col">
          <h3 className="text-sm font-black uppercase tracking-widest text-pine-teal mb-1">
            Lifecycle
          </h3>
          <p className="text-[10px] text-dusty-lavender uppercase tracking-widest font-bold mb-5">
            SOS by current state
          </p>
          <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
            {statusEntries.length === 0 ? (
              <p className="text-dusty-lavender text-xs font-bold uppercase tracking-widest text-center pt-10">
                No SOS data yet
              </p>
            ) : (
              statusEntries.map(([status, count]) => (
                <div
                  key={status}
                  className="flex items-center justify-between bg-white rounded-2xl border border-dusty-lavender/20 px-4 py-3 shadow-sm"
                >
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                      STATUS_STYLES[status] || "bg-dusty-lavender/10 text-dusty-lavender border-dusty-lavender/20"
                    }`}
                  >
                    {status}
                  </span>
                  <span className="text-pine-teal font-black text-lg">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EngineMetrics;
