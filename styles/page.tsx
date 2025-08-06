// app/page.tsx
"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedSnippet, setSelectedSnippet] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`https://newsapi.org/v2/top-headlines?sources=cnn,fox-news&apiKey=${process.env.NEXT_PUBLIC_NEWS_API_KEY}`)
      .then((res) => res.json())
      .then((data) => setArticles(data.articles || []));
  }, []);

  async function handleAnalyze() {
    if (!selectedSnippet) return;
    setLoading(true);
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snippet: selectedSnippet }),
    });
    const data = await res.json();
    setAnalysis(data.analysis || data.error);
    setLoading(false);
  }

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>🧠 EchoChamber Breaker</h1>
      <p>Select a CNN or Fox News article to scan for bias:</p>

      <ul>
        {articles.map((a, i) => (
          <li key={i} style={{ marginBottom: 10 }}>
            <button
              onClick={() => setSelectedSnippet(a.title + ". " + a.description)}
              style={{ background: "#eee", padding: "8px 12px", borderRadius: 6 }}
            >
              {a.title}
            </button>
          </li>
        ))}
      </ul>

      {selectedSnippet && (
        <>
          <h2>📝 Selected Snippet</h2>
          <p>{selectedSnippet}</p>
          <button onClick={handleAnalyze} disabled={loading} style={{ marginTop: 10 }}>
            {loading ? "Analyzing..." : "Analyze Bias"}
          </button>
        </>
      )}

      {analysis && (
        <>
          <h2>📊 GPT-4 Analysis</h2>
          <pre style={{ background: "#111", color: "#0f0", padding: 20, borderRadius: 10 }}>{analysis}</pre>
        </>
      )}
    </main>
  );
}
