import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

const StudyContext = createContext();
const LEVELS = ["N5", "N4", "N3", "N2", "N1"];
const SESSION_SIZE = 20;

export function useStudy() {
  return useContext(StudyContext);
}

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function normalizeLevels(levels) {
  const list = Array.isArray(levels) ? levels : [];
  const normalized = list.filter((level) => LEVELS.includes(level));
  return normalized.length ? normalized : ["N5"];
}

async function fetchWordsByIds(ids) {
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from("words")
    .select("id, word, reading, meaning, level")
    .in("id", ids);

  if (error) throw error;

  const map = new Map((data ?? []).map((row) => [row.id, row]));
  return ids.map((id) => map.get(id)).filter(Boolean);
}

export function StudyProvider({ children }) {
  const { user } = useAuth();
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

  async function persistUserSession(nextState) {
    if (!user) return;

    const payload = {
      user_id: user.id,
      selected_levels: normalizeLevels(nextState.selectedLevels),
      queue_word_ids: nextState.wordIds,
      current_index: nextState.index,
      correct: nextState.correct,
      wrong: nextState.wrong,
      updated_at: new Date().toISOString(),
    };

    const { error: saveError } = await supabase.from("user_study_session").upsert(payload, {
      onConflict: "user_id",
    });

    if (saveError) {
      // Non-blocking: user can still study even if session snapshot write fails.
      // eslint-disable-next-line no-console
      console.error("Failed to save study session", saveError);
    }
  }

  async function loadDeck() {
    if (!canLoad) return;

    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("words")
      .select("id, word, reading, meaning, level")
      .in("level", selectedLevels)
      .limit(SESSION_SIZE);

    setLoading(false);

    if (fetchError) {
      setError(fetchError.message);
      return;
    }

    const nextWords = shuffle(data ?? []);
    setWords(nextWords);
    setIndex(0);
    setCorrect(0);
    setWrong(0);

    await persistUserSession({
      selectedLevels,
      wordIds: nextWords.map((row) => row.id),
      index: 0,
      correct: 0,
      wrong: 0,
    });
  }

  function toggleLevel(level) {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  }

  async function answer(isCorrect) {
    if (!current) return;

    if (user) {
      const { error: rpcError } = await supabase.rpc("record_answer", {
        p_word_id: current.id,
        p_is_correct: isCorrect,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }
    }

    const nextCorrect = isCorrect ? correct + 1 : correct;
    const nextWrong = isCorrect ? wrong : wrong + 1;
    const nextIndex = index + 1;

    setCorrect(nextCorrect);
    setWrong(nextWrong);
    setIndex(nextIndex);

    await persistUserSession({
      selectedLevels,
      wordIds: words.map((row) => row.id),
      index: nextIndex,
      correct: nextCorrect,
      wrong: nextWrong,
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrapStudyState() {
      if (!user) {
        if (!words.length && !loading) {
          await loadDeck();
        }
        return;
      }

      setLoading(true);
      setError("");

      const { data: sessionRow, error: sessionError } = await supabase
        .from("user_study_session")
        .select("selected_levels, queue_word_ids, current_index, correct, wrong")
        .eq("user_id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (sessionError) {
        setLoading(false);
        setError(sessionError.message);
        return;
      }

      const savedWordIds = Array.isArray(sessionRow?.queue_word_ids) ? sessionRow.queue_word_ids : [];
      const savedLevels = normalizeLevels(sessionRow?.selected_levels);

      if (savedWordIds.length) {
        try {
          const savedWords = await fetchWordsByIds(savedWordIds);
          if (cancelled) return;

          if (savedWords.length) {
            setSelectedLevels(savedLevels);
            setWords(savedWords);
            setIndex(Math.min(Number(sessionRow?.current_index ?? 0), savedWords.length));
            setCorrect(Math.max(0, Number(sessionRow?.correct ?? 0)));
            setWrong(Math.max(0, Number(sessionRow?.wrong ?? 0)));
            setLoading(false);
            return;
          }
        } catch (restoreError) {
          if (!cancelled) {
            setError(restoreError instanceof Error ? restoreError.message : "Failed to restore session");
          }
        }
      }

      setSelectedLevels(savedLevels);
      setLoading(false);

      const { data: freshData, error: freshError } = await supabase
        .from("words")
        .select("id, word, reading, meaning, level")
        .in("level", savedLevels)
        .limit(SESSION_SIZE);

      if (cancelled) return;

      if (freshError) {
        setError(freshError.message);
        return;
      }

      const nextWords = shuffle(freshData ?? []);
      setWords(nextWords);
      setIndex(0);
      setCorrect(0);
      setWrong(0);

      await persistUserSession({
        selectedLevels: savedLevels,
        wordIds: nextWords.map((row) => row.id),
        index: 0,
        correct: 0,
        wrong: 0,
      });
    }

    bootstrapStudyState();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
