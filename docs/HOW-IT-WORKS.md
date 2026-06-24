# How Story Scout Works — Architecture & Request Flow

A reference for understanding how the pieces fit together. Read this when you're
in doubt about *what stores what* or *how a recommendation actually happens*.

---

## The three core tools (and who does what)

Story Scout combines three different tools. They each do **one thing well** and
**do not talk to each other directly** — the backend code orchestrates them.

| Tool | What it is | Its job |
|---|---|---|
| **Postgres** (SQLite locally) | A relational (SQL) database | The **source of truth** — stores all real data: users, books, shelves, recommendations, feedback |
| **Chroma** | A vector store | A **search-by-meaning index** — finds *which* books are relevant, returns only IDs + scores |
| **LLM** (Ollama / OpenAI / Anthropic) | A language model | **Understands** the user's request and **writes** the recommendation in human words |

> The **backend (FastAPI + LangGraph)** is the glue that talks to all three.

Library analogy:
- **Postgres = the shelves** (the actual books / full records).
- **Chroma = a smart card catalog** (a "by-meaning" lookup → points to shelf IDs).
- **LLM = the librarian** (reads your request, writes you a recommendation).

---

## What is stored where

### Postgres — the system of record (`backend/app/models/`)
Everything real and authoritative. One table per model:

| Table | Stores |
|---|---|
| `users` | Account: email, username, full name, **hashed** password |
| `user_preferences` | Long-term taste profile (the "memory") |
| `books` | Full catalog: title, description, cover URL, mood, pacing, themes, tropes, ratings |
| `authors` | Author records (linked to books) |
| `genres` | Genre list (linked to books) |
| `reading_history` | Your shelves: book + status (read / reading / want-to-read) + dates |
| `recommendations` | Each book the agent recommended, with its explanation note |
| `feedback` | Ratings/thumbs on recommendations |

### Chroma — the semantic search index (`backend/app/rag/`)
**Only books**, in one collection, purely so they can be searched *by meaning*.
For each book it stores three things:
1. **`id`** — the book id (maps back to the Postgres row).
2. **`document`** — a text blob (title, author, genres, mood, pacing, themes, tropes, summary) that gets turned into an embedding.
3. **`metadata`** — small dict (`book_id`, `title`) for filtering/display.

> **Chroma is always rebuildable from Postgres.** Postgres can never be rebuilt
> from Chroma. That's why Postgres comes first.

---

## What is an embedding? (the heart of Chroma)

An **embedding** turns text into a list of numbers that represents its *meaning*.
Texts with similar meaning get similar numbers. So:

```
"cozy mystery"  and  "gentle whodunit by the fire"   → land close together
```

Postgres can only match exact words. Chroma matches **meaning**. That's the
whole reason Chroma exists alongside the database.

---

## Build order (important!)

You always get **Postgres right first**, then Chroma is filled *from* it.

1. **Schema** — `alembic upgrade head` creates the Postgres tables.
2. **Populate Postgres** — `python -m scripts.seed` (20 baseline books + demo user),
   and/or `python -m scripts.ingest_openlibrary --subject fantasy --limit 30`.
3. **Chroma fills automatically** — the seed/ingest scripts insert the book row
   **and** embed it into Chroma in the same step (`upsert_book`). You never manage
   Chroma by hand.
4. **Verify** — Postgres book count should match the Chroma vector count.

If Chroma ever breaks or drifts, just re-run ingest — it regenerates from Postgres.

---

## The recommendation pipeline (LangGraph)

The agent flow lives in `backend/app/agents/`. A shared `AgentState` (a typed
dict) is passed between nodes, accumulating data at each step.

```
preference ──(needs clarification?)──> clarify ──> END
    │ no
    ▼
recommend ──> critic ──> explanation ──> memory ──> END
```

| Node | File | Job |
|---|---|---|
| `preference` | `preference_agent.py` | LLM extracts structured tastes; flags vague requests |
| `clarify` | `graph.py` | Terminal node — asks a follow-up question if needed |
| `recommend` | `recommendation_agent.py` | RAG: retrieves matching books from Chroma → `candidates` |
| `critic` | `critic_agent.py` | Filters/re-ranks, honors disliked tropes → `filtered_candidates` |
| `explanation` | `explanation_agent.py` | LLM writes the personal "why this book" note → `final_recommendations` |
| `memory` | `memory_agent.py` | Updates the user's long-term taste profile |

(`reading_coach_agent.py` is separate — it generates the dashboard's coaching message.)

---

## Worked example — tracing one real message

**User types:** *"something cozy like Harry Potter but for adults"*

### The message enters
Frontend (`ChatPage.tsx`) POSTs a `ChatRequest`:
```json
{ "message": "something cozy like Harry Potter but for adults",
  "session_id": "abc-123", "history": [] }
```

### Step 1 — Preference agent · LLM call #1 (understand)
The LLM reads the sentence and returns structured JSON (`ExtractedPreferences`):
```json
{
  "genre": "Fantasy",
  "tone": "cozy, warm, whimsical",
  "pacing": "Slow",
  "themes": ["magic", "belonging", "comfort"],
  "tropes": ["found family", "cozy fantasy"],
  "similar_to": ["Harry Potter"],
  "needs_clarification": false
}
```
This is the only step that understands natural language. → `state["preferences"]`.
(If it were vague, `needs_clarification=true` would route to **clarify** instead.)

### Step 2 — Recommendation agent · RAG retrieval (Chroma finds *which*)
**(a)** The preferences become a query string:
```
"cozy warm whimsical Fantasy, slow pacing, found family, magic belonging comfort, similar to Harry Potter"
```
**(b)** The local embedding model turns it into a ~384-number vector (its "meaning
fingerprint"):
```
[ 0.018, -0.072, 0.143, 0.005, -0.061, ... ]
```
**(c)** Chroma compares it to every book's vector (cosine similarity) and returns
the closest — **IDs + score + light metadata only**:
```python
[
  RetrievedBook(book_id=6, title="The House in the Cerulean Sea", score=0.89),
  RetrievedBook(book_id=3, title="Harry Potter and the Sorcerer's Stone", score=0.81),
  RetrievedBook(book_id=2, title="The Hobbit", score=0.74),
]
```
*Cerulean Sea* wins because its stored document ("Genres: Fantasy, Cozy… Mood:
Heartwarming, Cozy… Tropes: found family, cozy fantasy") is semantically almost
identical to the query — **even though the user never typed those exact words.**
→ `state["candidates"]`.

### Step 3 — Critic agent (filter/clean)
Drops weak/disliked matches and re-ranks:
```python
filtered_candidates = [book_id=6, book_id=2]
removed_reasons = ["Harry Potter — too YA for the 'for adults' request"]
```
→ `state["filtered_candidates"]`.

### Step 4 — Fetch real records from Postgres + Explanation agent · LLM call #2
The backend takes the surviving IDs and fetches the **full, real records** from
Postgres:
```json
{ "id": 6, "title": "The House in the Cerulean Sea", "author": "TJ Klune",
  "description": "A by-the-book caseworker is sent to evaluate a magical orphanage...",
  "cover_url": "https://covers.openlibrary.org/...", "average_rating": 4.4,
  "page_count": 396 }
```
Then the LLM writes the personalized note:
```json
{ "book_id": 6,
  "reasoning": "If you loved the magical comfort of Harry Potter but want something for grown-up hearts, this is your book — a slow, warm tale of a magical orphanage and a found family that feels like a blanket by the fire." }
```
→ `state["final_recommendations"]`.

### Step 5 — Memory + persist, then reply
- `memory_agent` updates the user's taste profile (now leans cozy/found-family) → Postgres `user_preferences`.
- Recommendations saved to Postgres `recommendations` (for history / rating later).
- Backend returns the `ChatResponse`:
```json
{
  "session_id": "abc-123",
  "message": "Here are a couple of cozy reads with that Harry Potter warmth…",
  "recommendations": [
    { "book": { "id": 6, "title": "The House in the Cerulean Sea", "rating": 4.4 },
      "score": 0.89,
      "reasoning": "If you loved the magical comfort of Harry Potter but want something for grown-up hearts…" }
  ]
}
```
The frontend renders the book cards + reasoning.

---

## The whole journey at a glance

```
User: "cozy like Harry Potter, for adults"
   │
   ▼  1. LLM #1  → structured preferences JSON
   ▼  2. RAG: embed query → Chroma returns book IDs [6, 3, 2]
   ▼  3. Critic filters → keeps [6, 2]
   ▼  4a. Postgres: fetch FULL records for [6, 2]
   ▼  4b. LLM #2 → writes personal "why" notes
   ▼  5. Postgres: save recommendation + update taste memory
   ▼
Reply: book cards + reasoning
```

| Tool | Its job in this trace |
|---|---|
| **LLM** (Ollama) | Turned the sentence into structured intent (#1), then wrote the recommendation note (#2) |
| **Chroma** | Found *which* books matched by **meaning** → returned IDs `[6, 3, 2]` |
| **Postgres** | Held the **real** book records; saved the recommendation + updated memory |
| **Backend (LangGraph)** | Orchestrated everything, passing the growing `AgentState` between steps |

**RAG** = steps 2→4: **R**etrieve real books (Chroma + Postgres), then let the LLM
**G**enerate over those real facts — so it recommends actual books from *your*
catalog instead of inventing titles.

---

## Common points of confusion (quick answers)

- **"Is Chroma the communication between the LLM and the DB?"** No. Nothing flows
  *through* Chroma. It's a search index. The backend calls the LLM, Chroma, and
  Postgres *separately*.
- **"Should I set up Chroma first?"** No — Postgres first. Chroma is derived from it.
- **"Could I use MongoDB instead of Postgres?"** Technically yes, but it's a poor
  fit: this data is structured and relational (users ↔ history ↔ books ↔ feedback),
  which is exactly what SQL/Postgres is best at. Switching would mean rewriting the
  whole data layer for no benefit.
- **"Does the LLM read the database?"** No. The LLM only deals in text — it
  understands the user's words and writes words back. The backend feeds it the real
  book data retrieved from Postgres.
