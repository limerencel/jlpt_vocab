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

  const byLevel = useMemo(() => rows.filter((r) => r.level !== "ALL"), [rows]);
  const overall = useMemo(() => rows.find((r) => r.level === "ALL"), [rows]);

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <section className="mx-auto max-w-4xl">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Progress Stats</h1>
            <p className="text-sm text-slate-600">Your learning status by JLPT level</p>
          </div>
          <Link 
            to="/study" 
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-50 transition-colors duration-200"
          >
            Back to Study
          </Link>
        </header>

        {loading ? <p className="mt-8 text-slate-600">Loading stats...</p> : null}
        {error ? <p className="mt-8 text-red-600">{error}</p> : null}

        {!loading && !error && overall ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-slate-900">Overall</h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Seen" value={overall.seen_words} />
              <Stat label="Known" value={overall.known_words} />
              <Stat label="Learning" value={overall.learning_words} />
              <Stat label="Known Rate" value={`${overall.known_rate}%`} />
            </div>
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="mt-6 grid gap-3">
            {byLevel.map((row) => (
              <div key={row.level} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">{row.level}</h3>
                  <span className="text-sm text-slate-500">Known rate {row.known_rate}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-brand-500"
                    style={{ width: `${Math.min(100, Number(row.known_rate))}%` }}
                  />
                </div>
                <div className="mt-3 flex gap-4 text-sm text-slate-700">
                  <span>Seen: {row.seen_words}</span>
                  <span>Known: {row.known_words}</span>
                  <span>Learning: {row.learning_words}</span>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
