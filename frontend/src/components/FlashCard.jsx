import { useEffect, useMemo, useRef, useState } from "react";

export default function FlashCard({
  word,
  enrichment,
  enrichmentLoading,
  enrichmentError,
  onFlipOpen,
}) {
  const [flipped, setFlipped] = useState(false);
  const [audioError, setAudioError] = useState("");
  const audioRef = useRef(null);

  useEffect(() => {
    setFlipped(false);
    setAudioError("");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, [word?.id]);

  useEffect(() => {
    if (flipped) {
      onFlipOpen?.();
    }
  }, [flipped, onFlipOpen]);

  const exampleJa = useMemo(() => enrichment?.exampleJa ?? null, [enrichment]);
  const exampleEn = useMemo(() => enrichment?.exampleEn ?? null, [enrichment]);

  async function playPronunciation() {
    setAudioError("");
    const url = enrichment?.pronunciationUrl;

    if (url) {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        await audio.play();
        return;
      } catch (_err) {
        setAudioError("Audio API playback failed. Using browser speech.");
      }
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word.reading || word.word);
      utterance.lang = "ja-JP";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      return;
    }

    setAudioError("No pronunciation playback available on this browser.");
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className="w-full h-[28rem] [perspective:1000px] cursor-pointer"
        role="button"
        tabIndex={0}
        onClick={() => setFlipped((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setFlipped((v) => !v);
          }
        }}
      >
        <div
          className={`relative h-full w-full rounded-2xl border border-slate-200 bg-white shadow-md transition-transform duration-500 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          <div className="absolute inset-0 grid place-content-center p-8 [backface-visibility:hidden]">
            <p className="text-xs uppercase tracking-wide text-slate-500">Tap to reveal</p>
            <h2 className="mt-4 text-5xl font-bold text-slate-900">{word.word}</h2>
            <p className="mt-3 text-base text-slate-600">{word.level}</p>
          </div>

          <div className="absolute inset-0 p-6 [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-y-auto">
            <p className="text-xs uppercase tracking-wide text-slate-500">Reading</p>
            <p className="mt-2 text-2xl font-semibold text-slate-800">{word.reading || "-"}</p>

            <p className="mt-5 text-xs uppercase tracking-wide text-slate-500">Meaning</p>
            <p className="mt-2 text-lg text-slate-700">{word.meaning}</p>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  playPronunciation();
                }}
                className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Play Pronunciation
              </button>
              {enrichment?.fromCache ? (
                <span className="text-xs rounded bg-emerald-50 px-2 py-1 text-emerald-700">Cached</span>
              ) : null}
            </div>

            {audioError ? <p className="mt-2 text-xs text-amber-700">{audioError}</p> : null}

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left">
              <p className="text-xs uppercase tracking-wide text-slate-500">Example sentence</p>

              {enrichmentLoading ? (
                <p className="mt-2 text-sm text-slate-600">Loading example...</p>
              ) : null}

              {enrichmentError ? (
                <p className="mt-2 text-sm text-red-600">{enrichmentError}</p>
              ) : null}

              {!enrichmentLoading && !enrichmentError ? (
                <>
                  <p className="mt-2 text-base text-slate-900">{exampleJa || "No example available."}</p>
                  {exampleEn ? <p className="mt-2 text-sm text-slate-600">{exampleEn}</p> : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
