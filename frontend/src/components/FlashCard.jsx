import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function FlashCard({ word }) {
  const [flipped, setFlipped] = useState(false);
  const [enrichment, setEnrichment] = useState(null);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);
  
  // Initial enrichment from pre-fetched database data (snake_case)
  useEffect(() => {
    const initialEnrichment = Array.isArray(word.word_enrichment) 
      ? word.word_enrichment[0] 
      : word.word_enrichment;
    
    if (initialEnrichment) {
      setEnrichment(initialEnrichment);
    } else {
      setEnrichment(null);
    }
    setFlipped(false);
  }, [word.id, word.word_enrichment]);

  // Fetch enrichment when flipped if not already present
  useEffect(() => {
    if (flipped && !enrichment && !loading) {
      fetchEnrichment();
    }
  }, [flipped, enrichment, word.id]);

  async function fetchEnrichment() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-word-enrichment-v2', {
        body: { wordId: word.id }
      });

      if (error) throw error;
      if (data) {
        // Edge function returns camelCase, but DB uses snake_case. 
        // We set it as is and handle both in the render.
        setEnrichment(data);
      }
    } catch (err) {
      console.error("Error fetching enrichment:", err);
    } finally {
      setLoading(false);
    }
  }

  // Handle both snake_case (DB) and camelCase (API)
  const exJa = enrichment?.example_ja || enrichment?.exampleJa;
  const exEn = enrichment?.example_en || enrichment?.exampleEn;
  const audioUrl = enrichment?.pronunciation_url || enrichment?.pronunciationUrl;
  
  const hasExample = !!(exJa || exEn);
  const hasAudio = !!audioUrl;

  const playAudio = (e) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error("Audio playback failed:", err));
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto perspective-1000 group">
      {hasAudio && (
        <audio ref={audioRef} src={audioUrl} preload="auto" />
      )}
      
      <div
        className={`relative w-full min-h-[22rem] cursor-pointer transition-all duration-700 preserve-3d shadow-2xl rounded-3xl ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
        onClick={() => setFlipped((v) => !v)}
      >
        {/* Front Side */}
        <div className="absolute inset-0 h-full w-full rounded-3xl border-2 border-slate-100 bg-white backface-hidden flex flex-col items-center justify-center p-10 transition-all duration-300 group-hover:border-brand-500/30">
          <div className="absolute top-8 left-8">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest shadow-sm">
              {word.level}
            </span>
          </div>
          
          <div className="text-center animate-float">
            <h2 className="text-7xl font-bold text-slate-900 tracking-tighter sm:text-8xl">
              {word.word}
            </h2>
            <div className="mt-8 flex flex-col items-center gap-2">
              <span className="h-1.5 w-12 bg-brand-500 rounded-full opacity-20"></span>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">
                Click to reveal
              </p>
            </div>
          </div>
        </div>

        {/* Back Side */}
        <div 
          className="absolute inset-0 h-full w-full rounded-3xl border-2 border-brand-500/20 bg-white backface-hidden flex flex-col p-8 transition-all duration-300 [transform:rotateY(180deg)] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
            <div className="flex-1">
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-2">Reading</p>
              <div className="flex items-baseline gap-3">
                <h3 className="text-4xl font-bold text-brand-600 tracking-tight">
                  {word.reading || word.word}
                </h3>
              </div>
            </div>
            
            {hasAudio && (
              <button
                type="button"
                onClick={playAudio}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 hover:bg-brand-500 hover:text-white transition-all duration-300 shadow-sm active:scale-90"
                aria-label="Play pronunciation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                  <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                </svg>
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-grow space-y-8">
            <section>
              <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-3">Meaning</p>
              <p className="text-2xl text-slate-800 font-medium leading-tight">
                {word.meaning}
              </p>
            </section>

            {loading && (
              <div className="flex items-center gap-3 py-4 text-slate-400">
                <div className="h-4 w-4 border-2 border-slate-200 border-t-brand-500 rounded-full animate-spin"></div>
                <span className="text-xs font-bold uppercase tracking-widest">Enriching word...</span>
              </div>
            )}

            {!loading && hasExample && (
              <section className="animate-in fade-in slide-in-from-bottom-2 duration-700">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-3">Example Context</p>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <p className="text-xl text-slate-900 mb-3 font-japanese leading-relaxed">
                    {exJa}
                  </p>
                  <p className="text-sm text-slate-500 italic leading-snug">
                    {exEn}
                  </p>
                </div>
              </section>
            )}
            
            {!loading && !hasExample && flipped && (
              <section className="opacity-30">
                <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400 mb-2">Example Context</p>
                <p className="text-xs italic text-slate-400">No examples found for this word.</p>
              </section>
            )}
          </div>
          
          <div className="mt-8 pt-4 flex justify-center">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              Tap to hide
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
