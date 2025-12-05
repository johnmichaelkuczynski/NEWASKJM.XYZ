# Ask A Philosopher - Philosophical Q&A Application

### Overview
"Ask A Philosopher" is a unified application for deep philosophical discourse with 59 philosophical and literary figures. It offers seven operational sections: philosophical Q&A chat, Model Builder, Paper Writer, Quote Generator, Dialogue Creator, Interview Creator, and Debate Creator. The platform uses actual writings and advanced AI to provide nuanced, contextually rich responses, enabling multi-author conversations through a Retrieval-Augmented Generation (RAG) system. Its purpose is to provide a robust platform for exploring complex philosophical and literary concepts, enhancing understanding through direct engagement with historical thinkers, with significant market potential in education and intellectual discourse. The application is powered by a comprehensive RAG database containing **23,236 embedded chunks** across 245 works from 4 major sources: Kuczynski (190 works, 22,331 chunks), Freud (9 works, 584 chunks), Aristotle (44 works, 213 chunks), and Aesop (2 works, 108 chunks). The system uses OpenAI text-embedding-ada-002 for semantic search with pgvector in PostgreSQL.

### User Preferences
- **Response Style**: Crisp, direct, no academic bloat. Short sentences. Clear logic. No throat-clearing. Get to the point immediately. Default is Auto mode (no word limit); user can specify word count if desired.
- **Quote Control**: Default is 0 (no mandatory quotes). User can request quotes only if they strengthen the argument.
- **Paper Writing Mode**: Toggle for formal academic papers when specifically needed.
- **Citation Format**: Database filenames converted to readable titles (e.g., "Analog Digital Distinction" not "CORPUS_ANALYSIS_Analog_Digital_Distinction").
- **RAG Approach**: Retrieved passages are injected as "research notes" that the AI internalizes and reasons FROM - not excerpts to stitch together or quote verbatim.
- **Epistemic Humility Override**: All philosophers are programmed with intellectual honesty protocols requiring them to acknowledge decisive evidence against their positions, admit logical contradictions they cannot resolve, show genuine understanding of challenges, attempt responses using their actual resources, and admit limits when stuck. Intellectual honesty comes FIRST, commitment to views SECOND. Great thinkers update beliefs; defending untenable positions is what mediocrities do.
- **Contradiction Handling Protocol**: When retrieved database positions contradict each other, philosophers must: (1) acknowledge the tension explicitly ("I recognize this creates a tension with what I said earlier..."), (2) attempt reconciliation through chronological development, scope limitations, or theoretical tensions, (3) admit unresolved contradictions honestly rather than pretending coherence, (4) maintain philosophical authenticity by representing real intellectual evolution. Goal is self-awareness of contradictions, not elimination.

### System Architecture
The application acts as a centralized knowledge server providing unified access to philosophical and psychoanalytic texts via a secure internal API. It features a 3-column layout with optional username-based login for chat history access. All philosophical texts are consolidated into a unified "Common Fund" knowledge base.

#### User Authentication
- **Username Login**: Simple username-only login (no password) for convenience, suitable for demo/casual use
- **Chat History**: Logged-in users can access their past conversations via "My Chats" dropdown
- **Download**: Each conversation can be downloaded as a text file
- **Guest Migration**: In-progress conversations are automatically migrated when users log in (no data loss)

#### UI/UX Decisions
- **Layout**: A unified single-page layout with 3 columns (philosophers sidebar, settings, main content) containing seven vertically stacked sections, accessible by scrolling.
- **Visuals**: Animated Kuczynski icon, AI-generated portrait avatars, minimalistic design with elegant typography, dark mode support, and visual section dividers.

#### Technical Implementations
- **Frontend**: React, TypeScript, Wouter, TanStack Query, Shadcn UI, and Tailwind CSS.
- **Backend**: Express.js with Node.js and Drizzle ORM.
- **AI Interaction**: Anthropic Claude Sonnet 4.5 (0.7 temperature) configured for aggressive direct reasoning.
- **Streaming**: Server-Sent Events (SSE) for real-time word-by-word AI response streaming.
- **Cross-Section Content Transfer**: Bidirectional content flow using "Send to" dropdown buttons.
- **ZHI Knowledge Provider API**: Secure internal API endpoint at `/zhi/query` for authenticated database queries with Bearer token authentication, returning structured JSON with excerpts, citations, and relevance scores.
- **Key Features**: Model Builder, Paper Writer (up to 1500 words), Quote Generator, Dialogue Creator (Kuczynski-style dialogues), Interview Creator (in-depth interviews with thinkers featuring Conservative/Aggressive modes, Neutral/Dialectical/Hostile interviewer tones, topic or file-based discussions, 500-10000 word length with chapter breaks for long outputs), and Debate Creator (1500-2500 word synthetic debates with Auto/Custom modes, paper upload, RAG grounding with 6 positions per thinker, word-by-word streaming, plain text output with no markdown formatting, download as .txt file, and full-height responsive layout).
- **RAG System**: Papers are chunked, embedded, and stored in a PostgreSQL database with `pgvector` for semantic search across 87 authors. Retrieves 8 most relevant positions per query, injected into AI's system prompt with mandatory instructions.
- **Document Upload Feature**: Users can upload text documents (.txt, .md, .doc, .docx, .pdf up to 5MB) across multiple sections using a reusable `DragDropUpload` component.
- **Standalone SQLite Databases**:
    - **Plato Database (plato-positions.db)**: 182 positions, 14 speakers, with API for searching dialogues, speakers, and positions with security hardening.
    - **Nietzsche Database (nietzsche-positions.db)**: 706 positions across 16 works, with API for searching works, years, and positions with security hardening.

### External Dependencies
- **AI Providers**: Anthropic Claude Sonnet 4.5, OpenAI GPT-4o, DeepSeek, Perplexity.
- **Database**: PostgreSQL (Neon) with pgvector extension.
- **Embeddings**: OpenAI `text-embedding-ada-002`.
- **File Parsing (Quote Generator)**: Multer, pdf-parse, mammoth.
- **ZHI Knowledge Provider**: `https://analyticphilosophy.net/zhi/query` (for `/zhi/query` endpoint).

### Kuczynski Corpus (Intelligence Reports Embedded)

1. ✅ Libet Experiment - Free will, consciousness, epiphenomenalism (4 chunks, distance 0.128)
2. ✅ Chapter 1: Analytic Philosophy - Philosophy as category analysis, Frege, LP critique (16 chunks, distance 0.119)
3. ✅ Chapter 2 Part 1: Properties - Platonism, non-spatiotemporal entities, properties vs sets (21 chunks, distance 0.128)
4. ✅ Chapter 2 Part 2: Properties Continued - Nominalism/conceptualism refutation, third-man argument (18 chunks, distance 0.132)
5. ✅ Dialogue Concerning God - OCD, pseudo-beliefs/pseudo-actions, ambivalence, Freud (20 chunks, distance 0.122)
6. ✅ Knowledge of Past, Present, Future - Causal epistemology, temporal knowledge, Hume (17 chunks, distance 0.134)
7. ✅ Pragmatism - Critique of William James, truth as objective property (97 chunks, distance 0.129)
8. ✅ Functional vs Structural Delusiveness - Ego-syntonic/dystonic, neurosis/psychosis, OCD/schizophrenia (22 chunks, distance 0.117)
9. ✅ Religion and Limits of Rationalism - William James, phenomenology of religion, Freud critique, unseen order (125 chunks, distance 0.124)
10. ✅ Searle vs Turing - Chinese Room argument, Turing test, machine intelligence, thought vs behavior (17 chunks, distance 0.129)
11. ✅ Chapter 11: Analytic Philosophy - Descartes, epistemology, foundationalism, cogito, skepticism, mind-body dualism (234 chunks, distance 0.105)
12. ✅ Analog Digital Distinction - Kant, Hume, causation, induction, synthetic a priori, transcendental arguments (437 chunks, distance 0.114)
13. ✅ Outline Theory of Knowledge - Cults vs religions, worship, supernatural, projection, virtualization, institutionalization (71 chunks, distance 0.146)
14. ✅ Godel's Proof - Incompleteness theorem, formal systems, logicism refutation, diagonal argument, arithmetization (16 chunks, distance 0.133)
15. ✅ What Is An Infinite Number - Cardinal/ordinal arithmetic, transfinite numbers, ℵ₀, reflexive classes, power-set theorem, continuum hypothesis (15 chunks)
16. ✅ Kuczynski Quotes Volume 4: Math and Infinity - Transfinite numbers, reflexive classes, orders of magnitude, bijections, diagonal argument, power-set theorem, cardinal vs ordinal arithmetic, dimension and cardinality (4 chunks)
17. ✅ Heed My Wisdom - Platonism in mathematics, academic critique, economics critique, Zeno's paradox, existentialism, psychology, business productivity, identity/metaphysics, standardized testing (11 sections)

**Total Kuczynski corpus: 190 works, 22,331 chunks**

### Freud Corpus (Position Statements Embedded)

1. ✅ Beyond the Pleasure Principle Positions - 36 positions: pleasure principle, repetition compulsion, death drive (Thanatos), Eros, trauma theory, stimulus barrier, Nirvana principle
2. ✅ Inhibitions, Symptoms and Anxiety Positions - 47 positions: signal anxiety, castration anxiety, symptom formation, obsessional neurosis mechanisms (isolation, undoing), ego defenses
3. ✅ Future of an Illusion Positions - 50 positions: religion as illusion, wish-fulfillment, infantile neurosis, civilization vs instinct, science vs religion, father-projection
4. ✅ Civilization and Its Discontents Positions - 50 positions: Eros vs Thanatos, super-ego, guilt, aggression, cultural super-ego, oceanic feeling
5. ✅ Cocaine Papers (Über Coca) Positions - 50 positions: pharmacology, euphoria, fatigue elimination, anesthetic properties, morphine/alcohol addiction treatment
6. ✅ Civilization and Its Discontents - Analysis and extended analysis of culture and instinct
7. ✅ Dream Formation and Unconscious - Dream work and unconscious processes

**Total Freud corpus: 9 works, 584 chunks**