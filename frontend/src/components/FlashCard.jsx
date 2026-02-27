import { useState } from "react";

export default function FlashCard({ word }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="w-full max-w-xl mx-auto">
      <button
        className="w-full h-64 [perspective:1000px]"
        type="button"
        onClick={() => setFlipped((v) => !v)}
      >
        <div
          className={`relative h-full w-full rounded-2xl border border-slate-200 bg-white shadow-md transition-transform duration-500 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          <div className="absolute inset-0 grid place-content-center p-6 [backface-visibility:hidden]">
            <p className="text-xs uppercase tracking-wide text-slate-500">Tap to reveal</p>
            <h2 className="mt-3 text-4xl font-bold text-slate-900">{word.word}</h2>
            <p className="mt-2 text-sm text-slate-500">{word.level}</p>
          </div>

          <div className="absolute inset-0 grid place-content-center p-6 [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <p className="text-xs uppercase tracking-wide text-slate-500">Reading</p>
            <p className="mt-2 text-2xl font-semibold text-slate-800">{word.reading || "-"}</p>
            <p className="mt-4 text-xs uppercase tracking-wide text-slate-500">Meaning</p>
            <p className="mt-2 text-lg text-slate-700 text-center">{word.meaning}</p>
          </div>
        </div>
      </button>
    </div>
  );
}
