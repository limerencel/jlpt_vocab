import { Link } from "react-router-dom";
import FlashCard from "../components/FlashCard";
import { useAuth } from "../contexts/AuthContext";
import { useStudy } from "../contexts/StudyContext";

export default function StudyPage() {
  const { signOut } = useAuth();
  const {
    selectedLevels,
    words,
    index,
    loading,
    error,
    correct,
    wrong,
    current,
    done,
    canLoad,
    loadDeck,
    toggleLevel,
    answer,
    LEVELS,
  } = useStudy();

  const isSessionStarted = words.length > 0;

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 lg:p-12">
      <section className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-brand-500 grid place-content-center text-white shadow-lg shadow-brand-500/20">
              <span className="text-xl font-black">文</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">JLPT Vocab</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Master Japanese</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              to="/stats" 
              className="group relative flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 bg-white rounded-xl border border-slate-200 shadow-sm transition-all hover:bg-slate-50 active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-brand-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V19.875c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
              Stats
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>

        <div className="mb-12 rounded-3xl border-2 border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Select Levels</h3>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((level) => {
                  const active = selectedLevels.includes(level);
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleLevel(level)}
                      className={`relative overflow-hidden rounded-xl px-5 py-2.5 text-xs font-black transition-all duration-300 border-2 ${
                        active
                          ? "bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20"
                          : "bg-white border-slate-100 text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      {level}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <button
              type="button"
              onClick={loadDeck}
              disabled={!canLoad || loading}
              className={`min-w-[180px] rounded-2xl px-6 py-4 text-sm font-black text-white transition-all duration-300 shadow-xl active:scale-95 disabled:opacity-50 disabled:scale-100 ${
                isSessionStarted 
                  ? "bg-slate-800 hover:bg-slate-900 shadow-slate-200" 
                  : "bg-brand-500 hover:bg-brand-600 shadow-brand-500/20"
              }`}
            >
              {loading ? "Preparing..." : isSessionStarted ? "Reload Session" : "Start Session"}
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
            {error}
          </div>
        ) : null}

        <section className="relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="h-12 w-12 rounded-full border-4 border-slate-200 border-t-brand-500 animate-spin"></div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Words</p>
            </div>
          ) : null}

          {!loading && isSessionStarted && words.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold uppercase tracking-widest">No words found for these levels.</p>
            </div>
          ) : null}

          {!loading && current ? (
            <div className="animate-in fade-in duration-1000">
              <div className="max-w-xl mx-auto mb-6 flex items-end justify-between px-2">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Progress</p>
                  <p className="text-sm font-black text-slate-900">
                    Card <span className="text-brand-500 text-lg">{index + 1}</span> / {words.length}
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Known</p>
                    <p className="text-lg font-black text-emerald-600 leading-none">{correct}</p>
                  </div>
                  <div className="text-right border-l border-slate-100 pl-4">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-1">Learning</p>
                    <p className="text-lg font-black text-red-500 leading-none">{wrong}</p>
                  </div>
                </div>
              </div>

              <FlashCard word={current} />

              <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-6">
                <button
                  type="button"
                  onClick={() => answer(false)}
                  className="w-full sm:w-48 group flex flex-col items-center gap-2 rounded-2xl bg-white border-2 border-slate-100 p-4 transition-all duration-300 hover:border-red-200 hover:bg-red-50/30 active:scale-95 shadow-sm hover:shadow-md"
                >
                  <span className="text-2xl font-black text-red-500 transition-transform group-hover:scale-110">✖</span>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-red-500">I don't know</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => answer(true)}
                  className="w-full sm:w-48 group flex flex-col items-center gap-2 rounded-2xl bg-white border-2 border-slate-100 p-4 transition-all duration-300 hover:border-emerald-200 hover:bg-emerald-50/30 active:scale-95 shadow-sm hover:shadow-md"
                >
                  <span className="text-2xl font-black text-emerald-500 transition-transform group-hover:scale-110">✔</span>
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-emerald-500">I know this</span>
                </button>
              </div>
            </div>
          ) : null}

          {!loading && done ? (
            <div className="mx-auto max-w-xl rounded-3xl border-2 border-slate-100 bg-white p-10 text-center shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="h-20 w-20 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-10 h-10">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Session Done!</h2>
              <p className="mt-2 text-slate-400 font-bold uppercase tracking-widest text-xs">You're making great progress</p>
              
              <div className="mt-10 grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-emerald-50 p-6 border border-emerald-100 transition-all hover:scale-105">
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Known</p>
                  <p className="text-4xl font-black text-emerald-600">{correct}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 transition-all hover:scale-105">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Learning</p>
                  <p className="text-4xl font-black text-slate-900">{wrong}</p>
                </div>
              </div>
              
              <button
                type="button"
                onClick={loadDeck}
                className="mt-10 w-full rounded-2xl bg-brand-500 px-8 py-5 text-sm font-black text-white shadow-xl shadow-brand-500/20 hover:bg-brand-600 transition-all active:scale-95"
              >
                Start New Session
              </button>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  );
}
