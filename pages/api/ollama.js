export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { snippet, source = "Unknown", url = null, extra = false } = req.body;

  if (!snippet || snippet.trim().length === 0) {
    return res.status(400).json({ error: "No snippet provided" });
  }

  let prompt = `You are a media bias and emotional manipulation analyst.
Source: ${source}
`;

  if (url) {
    prompt += `URL: ${url}
`;
  }

  prompt += `
Analyze the following article content:

"""${snippet}"""

1) Identify if the article has any political bias: "Left-leaning", "Right-leaning", or "Neutral".
2) Provide a detailed explanation of any bias, emotional manipulation, framing, or groupthink present.
3) Give a bias rating on a scale from 0 (completely neutral) to 10 (extremely biased), with a short justification.

Format your response like this:

Bias Type: <Left-leaning | Right-leaning | Neutral>
Bias Rating: <number from 0 to 10>
Explanation:
<your detailed analysis here>
`;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral", // replace with your actual model name
        prompt,
        stream: false,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${text}`);
    }

    const data = await response.json();

    if (!data.response) {
      throw new Error("No response from Ollama");
    }

    // Parse only the FIRST occurrence of Bias Type and Bias Rating
    const lines = data.response.split("\n").map((l) => l.trim());

    let biasType = null;
    let biasRating = null;

    for (const line of lines) {
      if (!biasType && line.toLowerCase().startsWith("bias type:")) {
        biasType = line.split(":")[1].trim();
      }
      if (!biasRating && line.toLowerCase().startsWith("bias rating:")) {
        biasRating = line.split(":")[1].trim();
      }
      if (biasType && biasRating) break;
    }
    if (!biasType) biasType = "Unknown";
    if (!biasRating) biasRating = "Unknown";

    res.status(200).json({
      analysis: data.response,
      biasType,
      biasRating,
    });
  } catch (error) {
    console.error("Error in /api/ollama:", error);
    res.status(500).json({ error: error.message || "Failed to analyze" });
  }
}
