import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FlashCard from "../components/FlashCard";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function StudyPage() {
  const { signOut } = useAuth();
  const [selectedLevels, setSelectedLevels] = useState(["N5"]);
  const [words, setWords] = useState([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);

  const current = words[index] ?? null;
  const done = words.length > 0 && index >= words.length;

  const canLoad = useMemo(() => selectedLevels.length > 0, [selectedLevels]);

  async function loadDeck() {
    if (!canLoad) return;
    setLoading(true);
    setError("");
    setCorrect(0);
    setWrong(0);
    setIndex(0);

    const { data, error: fetchError } = await supabase
      .from("words")
      .select("id, word, reading, meaning, level")
      .in("level", selectedLevels)
      .limit(300);

    setLoading(false);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setWords(shuffle(data ?? []));
  }

  useEffect(() => {
    loadDeck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function answer(isCorrect) {
    if (!current) return;

    const { error: rpcError } = await supabase.rpc("record_answer", {
      p_word_id: current.id,
      p_is_correct: isCorrect,
    });

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    if (isCorrect) setCorrect((v) => v + 1);
    else setWrong((v) => v + 1);

    setIndex((v) => v + 1);
  }

  function toggleLevel(level) {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <section className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Study</h1>
            <p className="text-sm text-slate-600">Flashcards with instant progress sync</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/stats" className="text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white">
              Stats
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white"
            >
              Sign out
            </button>
          </div>
        </header>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-slate-700">Levels</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LEVELS.map((level) => {
              const active = selectedLevels.includes(level);
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleLevel(level)}
                  className={`rounded-lg px-3 py-2 text-sm border ${
                    active
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-white border-slate-300 text-slate-700"
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={loadDeck}
            disabled={!canLoad || loading}
            className="mt-4 rounded-lg bg-brand-500 px-4 py-2 text-white disabled:opacity-60"
          >
            {loading ? "Loading..." : "Start / Reload Session"}
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <section className="mt-8">
          {loading ? <p className="text-slate-600">Loading words...</p> : null}

          {!loading && words.length === 0 ? (
            <p className="text-slate-600">No words found for selected levels.</p>
          ) : null}

          {!loading && current ? (
            <>
              <p className="mb-4 text-sm text-slate-600">
                Card {index + 1} / {words.length}
              </p>
              <FlashCard word={current} />
              <div className="mt-5 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => answer(false)}
                  className="rounded-lg bg-red-600 px-5 py-2 text-white"
                >
                  不正解
                </button>
                <button
                  type="button"
                  onClick={() => answer(true)}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-white"
                >
                  正解
                </button>
              </div>
            </>
          ) : null}

          {done ? (
            <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-center">
              <h2 className="text-xl font-semibold text-slate-900">Session Complete</h2>
              <p className="mt-3 text-slate-700">Correct: {correct}</p>
              <p className="text-slate-700">Wrong: {wrong}</p>
              <button
                type="button"
                onClick={loadDeck}
                className="mt-5 rounded-lg bg-brand-500 px-4 py-2 text-white"
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
