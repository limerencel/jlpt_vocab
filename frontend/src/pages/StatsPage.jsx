import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function StatsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      setLoading(true);
      const { data, error: rpcError } = await supabase.rpc("get_progress_stats");
      if (!mounted) return;
      setLoading(false);
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      setRows(data ?? []);
    }

    loadStats();
    return () => {
      mounted = false;
    };
  }, []);

  const byLevel = useMemo(() => rows.filter((r) => r.level !== "ALL").sort((a, b) => b.level.localeCompare(a.level)), [rows]);
  const overall = useMemo(() => rows.find((r) => r.level === "ALL"), [rows]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 lg:p-12">
      <section className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-brand-500 grid place-content-center text-white shadow-lg shadow-brand-500/20">
              <span className="text-xl font-black">計</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Statistics</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Track your progress</p>
            </div>
          </div>
          <Link 
            to="/study" 
            className="group relative flex items-center gap-2 px-5 py-2.5 text-sm font-black text-white bg-slate-900 rounded-xl shadow-xl shadow-slate-200 transition-all hover:bg-slate-800 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Study
          </Link>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-brand-500 animate-spin"></div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Calculating Stats</p>
          </div>
        ) : null}

        {error ? (
          <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            {error}
          </div>
        ) : null}

        {!loading && !error && overall ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              <StatCard label="Words Seen" value={overall.seen_words} color="blue" />
              <StatCard label="Mastered" value={overall.known_words} color="emerald" />
              <StatCard label="Learning" value={overall.learning_words} color="brand" />
              <StatCard label="Mastery Rate" value={`${overall.known_rate}%`} color="orange" />
            </div>

            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 px-2">Breakdown by Level</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {byLevel.map((row) => (
                <LevelCard key={row.level} row={row} />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function StatCard({ label, value, color }) {
  const colors = {
    blue: "bg-blue-500 shadow-blue-500/20",
    emerald: "bg-emerald-500 shadow-emerald-500/20",
    brand: "bg-brand-500 shadow-brand-500/20",
    orange: "bg-orange-500 shadow-orange-500/20",
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm transition-all hover:shadow-md">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
        <div className={`h-2 w-2 rounded-full ${colors[color] || colors.brand} animate-pulse`}></div>
      </div>
    </div>
  );
}

function LevelCard({ row }) {
  const rate = Number(row.known_rate);
  
  return (
    <div className="group bg-white rounded-3xl border-2 border-slate-100 p-6 shadow-sm transition-all hover:border-brand-500/20 hover:shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 text-white grid place-content-center text-xs font-black">
            {row.level}
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 leading-none">{row.level} Proficiency</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">JLPT Level</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-brand-600 tracking-tight">{rate}%</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mastered</p>
        </div>
      </div>

      <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
        <div 
          className="absolute top-0 left-0 h-full bg-brand-500 transition-all duration-1000 ease-out rounded-full shadow-lg shadow-brand-500/20"
          style={{ width: `${Math.min(100, rate)}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100/50">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Seen</p>
          <p className="text-sm font-black text-slate-900">{row.seen_words}</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-emerald-50 border border-emerald-100/50">
          <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Known</p>
          <p className="text-sm font-black text-emerald-700">{row.known_words}</p>
        </div>
        <div className="text-center p-2 rounded-xl bg-orange-50 border border-orange-100/50">
          <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">Learning</p>
          <p className="text-sm font-black text-orange-700">{row.learning_words}</p>
        </div>
      </div>
    </div>
  );
}
