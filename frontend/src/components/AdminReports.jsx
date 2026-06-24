import { useState, useEffect } from "react";
import { FaFlag, FaSpinner, FaCheckCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import api from "../utils/api";

const REASON_LABEL = { harassment: "Harassment", spam: "Spam", scam: "Scam", fake: "Fake", other: "Other" };
const STATUS_STYLE = {
  open: "bg-blazing-flame/10 text-blazing-flame border-blazing-flame/25",
  reviewed: "bg-amber-50 text-amber-600 border-amber-300/40",
  actioned: "bg-pine-teal/10 text-pine-teal border-pine-teal/25",
};

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    api.get("/admin/reports")
      .then(({ data }) => active && setReports(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const setStatus = async (id, status) => {
    setBusyId(id);
    try {
      const { data } = await api.patch(`/admin/reports/${id}`, { status });
      setReports((p) => p.map((r) => (r._id === id ? { ...r, status: data.status } : r)));
      toast.success(`Marked ${status}.`);
    } catch {
      toast.error("Couldn't update the report.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <FaSpinner className="animate-spin text-3xl text-dark-raspberry" />
      </div>
    );
  }

  const openCount = reports.filter((r) => r.status === "open").length;

  return (
    <div className="bg-white/70 backdrop-blur-lg border border-white rounded-[2rem] p-6 md:p-8 shadow-[0_20px_40px_rgba(41,82,74,0.08)] min-h-[60vh]">
      <div className="flex items-center justify-between mb-8 border-b border-dusty-lavender/30 pb-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-blazing-flame flex items-center gap-2">
          <FaFlag /> User Reports
        </h2>
        <span className="bg-blazing-flame/10 text-blazing-flame px-3 py-1 rounded-lg text-xs font-bold border border-blazing-flame/20">
          {openCount} open
        </span>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-dusty-lavender opacity-80">
          <FaCheckCircle className="text-5xl mb-3 text-pine-teal" />
          <p className="font-bold tracking-widest uppercase text-xs">No reports — the community is healthy.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r._id} className="bg-white border border-dusty-lavender/30 p-5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 justify-between shadow-sm">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-dark-raspberry/10 text-dark-raspberry border border-dark-raspberry/20">
                    {REASON_LABEL[r.reason] || r.reason}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${STATUS_STYLE[r.status] || ""}`}>
                    {r.status}
                  </span>
                  <span className="text-[10px] text-dusty-lavender">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-pine-teal">
                  <span className="font-bold">{r.reportedUser?.name || "Unknown user"}</span>
                  <span className="text-dusty-lavender"> reported by </span>
                  <span className="font-semibold">{r.reporter?.name || "Unknown"}</span>
                </p>
                <p className="text-[12px] text-dusty-lavender mt-0.5">
                  {r.reportedUser?.email}
                  {r.reportedUser?.noShowCount ? ` · ${r.reportedUser.noShowCount} no-shows` : ""}
                </p>
                {r.note && <p className="text-[13px] text-pine-teal/70 mt-2 italic">"{r.note}"</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  disabled={busyId === r._id || r.status === "reviewed"}
                  onClick={() => setStatus(r._id, "reviewed")}
                  className="px-4 py-2.5 rounded-xl border border-dusty-lavender/40 text-pine-teal text-[10px] font-black uppercase tracking-wider hover:bg-pearl-beige transition-colors disabled:opacity-40"
                >
                  Reviewed
                </button>
                <button
                  disabled={busyId === r._id}
                  onClick={() => setStatus(r._id, "actioned")}
                  className="px-4 py-2.5 rounded-xl bg-pine-teal text-white text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors hover:bg-[#2f5a47] disabled:opacity-50"
                >
                  Actioned
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReports;
