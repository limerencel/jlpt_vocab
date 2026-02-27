import { createContext, useContext, useState, useMemo, useEffect } from "react";
import { supabase } from "../lib/supabase";

const StudyContext = createContext();

export function useStudy() {
  return useContext(StudyContext);
}

const LEVELS = ["N5", "N4", "N3", "N2", "N1"];

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function StudyProvider({ children }) {
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
      .select(`
        id, 
        word, 
        reading, 
        meaning, 
        level,
        word_enrichment (
          example_ja,
          example_en,
          pronunciation_url
        )
      `)
      .in("level", selectedLevels)
      .limit(300);

    setLoading(false);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    setWords(shuffle(data ?? []));
  }

  function toggleLevel(level) {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  }

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

  // Initial load if words is empty
  useEffect(() => {
    if (words.length === 0 && !loading) {
      loadDeck();
    }
  }, []);

  const value = {
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
  };

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>;
}
