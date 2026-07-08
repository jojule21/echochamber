# echochamber — Media Bias Analyzer

A Next.js app that pulls the same day's top headlines from CNN and Fox News side by side, then runs any article snippet through an LLM-powered analysis that rates its bias and flags emotional-manipulation techniques.

The point: see how differently two outlets frame the same news, with an analyst that grades the framing instead of you having to guess.

## How it works

- `pages/index.js` — fetches top headlines from both outlets via [NewsAPI](https://newsapi.org) and renders them for comparison; caches analyses client-side so repeat lookups are free.
- `pages/api/` — serverless route that takes an article snippet + source, builds a media-bias-analyst prompt, and returns a structured analysis (bias type, bias rating, explanation).

## Setup

```bash
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_NEWS_API_KEY=your_newsapi_key
# plus the LLM API key used by pages/api/ (see that file)
```

```bash
npm run dev
# open http://localhost:3000
```

## Status

🚧 **Under active development** — currently integrating Google Gemini and Anthropic Claude as the analysis backends, so the same article can be graded by multiple models and the ratings compared.

## Notes

This is an experiment in media literacy, not a political statement — it analyzes framing and emotional language on both sides with the same rubric.
