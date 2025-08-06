import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [articles, setArticles] = useState([]);

  const [userInputText, setUserInputText] = useState("");
  const [userInputUrl, setUserInputUrl] = useState("");

  const [selectedSnippet, setSelectedSnippet] = useState("");
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedUrl, setSelectedUrl] = useState("");

  const [analysis, setAnalysis] = useState("");
  const [biasType, setBiasType] = useState("");
  const [biasRating, setBiasRating] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const cache = useRef(new Map());

  useEffect(() => {
    fetch(
      `https://newsapi.org/v2/top-headlines?sources=cnn,fox-news&apiKey=${process.env.NEXT_PUBLIC_NEWS_API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => setArticles(data.articles || []))
      .catch(() => setError("Failed to load articles"));
  }, []);

  async function analyzeContent({ snippet, url, source }) {
    setLoading(true);
    setError("");
    setAnalysis("");
    setBiasType("");
    setBiasRating("");

    const cacheKey = `${source}:${snippet}`;

    if (cache.current.has(cacheKey)) {
      const cached = cache.current.get(cacheKey);
      setAnalysis(cached.analysis);
      setBiasType(cached.biasType);
      setBiasRating(cached.biasRating);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/ollama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snippet: snippet || "[No text provided]",
          url: url || null,
          source: source || "Unknown",
          extra: true,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`API error: ${res.status} - ${text}`);
      }

      const data = await res.json();

      setAnalysis(data.analysis);
      setBiasType(data.biasType || "Unknown");
      setBiasRating(data.biasRating || "Unknown");

      cache.current.set(cacheKey, {
        analysis: data.analysis,
        biasType: data.biasType,
        biasRating: data.biasRating,
      });
    } catch (err) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleUserInputAnalyze() {
    if (!userInputText.trim() && !userInputUrl.trim()) {
      setError("Please enter article text, URL, or both.");
      return;
    }

    analyzeContent({
      snippet: userInputText.trim(),
      url: userInputUrl.trim(),
      source: userInputUrl.trim() ? "User URL + Text" : "User Text Only",
    });
  }

  function handleNewsArticleAnalyze() {
    if (!selectedSnippet) return;

    analyzeContent({
      snippet: selectedSnippet,
      url: selectedUrl,
      source: selectedSource,
    });
  }

  return (
    <main
      style={{
        maxWidth: 800,
        margin: "auto",
        padding: 20,
        fontFamily: "Arial, sans-serif",
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: 30 }}>EchoChamber Breaker</h1>

      {/* User Input Section */}
      <section style={{ marginBottom: 40 }}>
        <h2>Paste Your Own Article & Link for Analysis</h2>

        <input
          type="url"
          placeholder="Paste original article URL (optional)"
          value={userInputUrl}
          onChange={(e) => setUserInputUrl(e.target.value)}
          style={{
            width: "100%",
            fontSize: 16,
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
            marginBottom: 12,
            boxSizing: "border-box",
          }}
          disabled={loading}
        />

        <textarea
          placeholder="Paste any article text here (optional)..."
          rows={8}
          value={userInputText}
          onChange={(e) => setUserInputText(e.target.value)}
          style={{
            width: "100%",
            fontSize: 16,
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
            boxSizing: "border-box",
            resize: "vertical",
          }}
          disabled={loading}
        />

        <button
          onClick={handleUserInputAnalyze}
          disabled={loading}
          style={{
            marginTop: 12,
            padding: "10px 20px",
            fontSize: 16,
            borderRadius: 6,
            backgroundColor: "#0070f3",
            color: "#fff",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Analyzing..." : "Analyze Bias"}
        </button>
      </section>

      <hr style={{ margin: "40px 0" }} />

      {/* News Articles Section */}
      <section>
        <p>Select a CNN or Fox News article to scan for bias:</p>

        <ul style={{ listStyle: "none", padding: 0, marginBottom: 20 }}>
          {articles.map(({ title, description, content, source, url }, i) => {
            if (!title?.trim()) return null;

            const fullText = content?.trim() || description?.trim() || title.trim();
            const label = `[${source?.name || "News"}] ${title}`;

            return (
              <li key={i} style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                <button
                  onClick={() => {
                    setSelectedSnippet(`${title}. ${fullText}`);
                    setSelectedSource(source?.name || "");
                    setSelectedUrl(url || "");
                    setAnalysis("");
                    setBiasType("");
                    setBiasRating("");
                    setError("");
                  }}
                  disabled={loading}
                  style={{
                    flexGrow: 1,
                    background: "#eee",
                    color: "#000",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  {label}
                </button>

                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: "#333",
                    color: "#fff",
                    padding: "8px 12px",
                    borderRadius: 6,
                    textDecoration: "none",
                    fontSize: "0.9rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  🔗 View
                </a>
              </li>
            );
          })}
        </ul>

        {selectedSnippet && (
          <>
            <h2>Selected Snippet</h2>
            <p
              style={{
                whiteSpace: "pre-wrap",
                background: "#eee",
                padding: 10,
                borderRadius: 6,
                minHeight: 80,
              }}
            >
              {selectedSnippet}
            </p>
            <button
              onClick={handleNewsArticleAnalyze}
              disabled={loading}
              style={{
                marginTop: 10,
                padding: "10px 20px",
                fontSize: 16,
                borderRadius: 6,
                backgroundColor: "#0070f3",
                color: "#fff",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Analyzing..." : "Analyze Bias"}
            </button>
          </>
        )}
      </section>

      {/* Unified Analysis Box */}
      {(analysis || error) && (
        <section
          style={{
            marginTop: 40,
            background: "#111",
            color: "#0f0", // full green text for readability
            padding: 20,
            borderRadius: 10,
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            minHeight: 120,
          }}
        >
          {error ? (
            <p style={{ color: "red" }}>⚠️ {error}</p>
          ) : (
            <>
              <h3>Ollama Analysis</h3>
              <p>{analysis}</p>
              <h4 style={{ marginTop: 20 }}>Bias Type: {biasType}</h4>
              <h4>Bias Rating (0-10): {biasRating}</h4>
            </>
          )}
        </section>
      )}
    </main>
  );
}
