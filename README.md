# Origin Trace

Origin Trace takes a claim, such as a forwarded message, and builds a case file: who reported it first, who repeated it, what officials and fact checkers say, and how much checkable evidence exists. Search data from SerpApi is the core of every result.

Built for the SerpApi India Hackathon 2026 with React, Node, and TypeScript.

## Run it

Requires Node 18.18 or newer.

```
npm i
npm start
```

Open http://localhost:5173.

Without an API key the app runs in demo mode with three bundled sample cases that use fictional outlets. To trace real claims:

1. Create a free account at https://serpapi.com (250 searches per month).
2. Copy `.env.example` to `.env`.
3. Set `SERPAPI_API_KEY` in `.env` and restart `npm start`.

## Features

- Four parallel SerpApi searches per trace, with live progress streamed to the page
- Origin candidate: the earliest dated news or web result that closely matches the claim
- Fact checker detection, including known checking organisations and fact check query results
- Official source detection for government, institutional, and intergovernmental domains
- Stance labels for each source (backs, disputes, neutral) from transparent keyword rules
- Verification coverage score from 0 to 100 with a factor by factor breakdown
- Finding label: disputed, supported, unclear, or unverified
- Timeline view with colouring by source type or by stance, and source type filters
- Spread charts: sources per day and cumulative sources
- Network view: ring layout showing how many repetitions each source is from the origin
- Sources explorer with search, type filters, stance filter, and sorting
- Related questions and related searches from Google, with one click retracing
- Region (India, United States, United Kingdom, Australia) and language (English, Hindi)
- Trace history saved in the browser, with reopen and clear
- Copy a short chat reply, copy or download a Markdown report, download JSON
- Light and dark themes, keyboard operable charts, reduced motion support

## How SerpApi is used

| Search | Engine | Purpose |
| --- | --- | --- |
| News | `google_news` | Who reported the claim and when. Nested story clusters are flattened. |
| Web | `google` | Forums, blogs, official pages. Also supplies related questions and related searches. |
| Fact checkers | `google` with the claim plus "fact check" | Fact checking organisations and debunks. |
| Scholarly | `google_scholar` | Papers on the topic, dated by publication year. |

One trace uses 4 search credits. Responses are cached on disk in `.cache/` for 24 hours, so repeating a claim costs nothing. A partial failure shows a warning and the trace continues with the searches that succeeded. SerpApi errors, such as an invalid key, are shown as returned.

## How the analysis works

All logic is in `server/provenance.ts` and `server/stance.ts` and runs without an LLM, so results are deterministic and explainable.

1. Keywords are extracted from the claim with stop word removal and light stemming (English and common Hindi stop words).
2. Results are deduplicated by normalised URL.
3. Each result gets a match score: the share of claim keywords in its title and snippet. Weak matches are dropped.
4. Dates come from ISO values, absolute dates, and relative text such as "3 days ago".
5. Sources are classified as official, fact check, scholarly, news, or web.
6. Stance is set from dispute and support cues in the text. A close news or web item with no cue and no question mark counts as repeating the claim.
7. The origin candidate is the earliest dated news or web result with a strong match.
8. Each source is linked to the earlier source whose wording it most resembles. This drives the timeline curves and the network rings.
9. Verification coverage adds points for an official source (30), fact checkers (25), outlet diversity (15), corroboration (10), scholarly background (10), and dated timeline (10).

The coverage score measures how much checkable material exists. It does not say whether the claim is true. Origin candidates and stance labels are heuristics, not proof, and the interface says so.

## Project layout

```
shared/types.ts                  Types shared by server and client
server/index.ts                  Express API, streams progress as NDJSON
server/serpapi.ts                SerpApi requests, parsing, progress reporting
server/provenance.ts             Matching, classification, origin, graph, score, verdict
server/stance.ts                 Keyword stance rules
server/dates.ts                  Date parsing
server/cache.ts                  24 hour disk cache
server/sample.ts                 Three demo cases
src/App.tsx                      Page shell and state
src/theme.ts                     Mantine theme and surface colours
src/meta.ts                      Labels and colours for source types and stances
src/api.ts, src/history.ts       Streaming client and local history
src/report.ts                    Report text, chat reply, download helpers
src/components/                  Dossier, OriginGraph, NetworkGraph, SpreadCharts,
                                 SourceList, SourceDetail, ScoreCard, RelatedPanel,
                                 ClaimIntake, CaseGallery, TraceProgress,
                                 HistoryDrawer, Specimen, Brand, Panel
```

## Scripts

| Command | Action |
| --- | --- |
| `npm start` | Runs the API on port 5174 and the Vite client on port 5173 |
| `npm run typecheck` | Type checks server and client |
| `npm run build` | Type checks and builds the client |

## Submission notes

Disclose any AI tools used in the submission form. Record the demo with a live key so it shows real SerpApi data. A good demo claim has news coverage, an official page, and a fact check.
