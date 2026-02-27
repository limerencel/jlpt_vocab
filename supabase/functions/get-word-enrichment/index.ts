import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EnrichmentPayload = {
  wordId: number;
  word: string;
  reading: string | null;
  pronunciationUrl: string;
  exampleJa: string | null;
  exampleEn: string | null;
  source: string;
  fromCache: boolean;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Missing Supabase env vars" }, 500);
    }
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { wordId } = await req.json();
    if (!wordId || Number.isNaN(Number(wordId))) {
      return json({ error: "wordId is required" }, 400);
    }

    const numericWordId = Number(wordId);

    const { data: wordRow, error: wordError } = await admin
      .from("words")
      .select("id, word, reading")
      .eq("id", numericWordId)
      .single();

    if (wordError || !wordRow) {
      return json({ error: "Word not found" }, 404);
    }

    const { data: cachedRow } = await admin
      .from("word_enrichment")
      .select("word_id, example_ja, example_en, pronunciation_url, source")
      .eq("word_id", numericWordId)
      .maybeSingle();

    if (cachedRow) {
      const payload: EnrichmentPayload = {
        wordId: numericWordId,
        word: wordRow.word,
        reading: wordRow.reading,
        pronunciationUrl: cachedRow.pronunciation_url,
        exampleJa: cachedRow.example_ja,
        exampleEn: cachedRow.example_en,
        source: cachedRow.source,
        fromCache: true,
      };
      return json(payload, 200);
    }

    const pronunciationUrl = buildPronunciationUrl(wordRow.word, wordRow.reading);

    const example = await fetchExampleSentence(wordRow.word);
    const source = example ? "tatoeba+languagepod101" : "languagepod101";

    const { error: upsertError } = await admin.from("word_enrichment").upsert(
      {
        word_id: numericWordId,
        example_ja: example?.ja ?? null,
        example_en: example?.en ?? null,
        pronunciation_url: pronunciationUrl,
        source,
        fetched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "word_id" },
    );

    if (upsertError) {
      return json({ error: upsertError.message }, 500);
    }

    const payload: EnrichmentPayload = {
      wordId: numericWordId,
      word: wordRow.word,
      reading: wordRow.reading,
      pronunciationUrl,
      exampleJa: example?.ja ?? null,
      exampleEn: example?.en ?? null,
      source,
      fromCache: false,
    };

    return json(payload, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return json({ error: message }, 500);
  }
});

function buildPronunciationUrl(word: string, reading: string | null) {
  const kanji = encodeURIComponent(word);
  const kana = encodeURIComponent(reading || word);
  return `https://assets.languagepod101.com/dictionary/japanese/audiomp3.php?kanji=${kanji}&kana=${kana}`;
}

async function fetchExampleSentence(word: string): Promise<{ ja: string; en: string | null } | null> {
  const endpoint = new URL("https://tatoeba.org/en/api_v0/search");
  endpoint.searchParams.set("from", "jpn");
  endpoint.searchParams.set("to", "eng");
  endpoint.searchParams.set("query", word);
  endpoint.searchParams.set("sort", "relevance");
  endpoint.searchParams.set("limit", "5");

  const res = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "User-Agent": "jlpt-vocab-app/1.0",
    },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const candidates = Array.isArray(data?.results) ? data.results : [];

  for (const item of candidates) {
    const ja = getText(item);
    if (!ja) continue;

    const translations = Array.isArray(item?.translations) ? item.translations : [];
    let en: string | null = null;

    for (const bucket of translations) {
      const list = Array.isArray(bucket) ? bucket : [bucket];
      const english = list.find((v: any) => (v?.lang || v?.language) === "eng") || list[0];
      const englishText = getText(english);
      if (englishText) {
        en = englishText;
        break;
      }
    }

    return { ja, en };
  }

  return null;
}

function getText(obj: any): string | null {
  const text = obj?.text || obj?.sentence || obj?.value || null;
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  return trimmed.length ? trimmed : null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
