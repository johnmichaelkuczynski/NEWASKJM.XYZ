# Ask A Philosopher - Philosophical Q&A Application

### Overview
"Ask A Philosopher" is a unified application for deep philosophical discourse with 59 philosophical and literary figures. It offers seven operational sections: philosophical Q&A chat, Model Builder, Paper Writer, Quote Generator, Dialogue Creator, Interview Creator, and Debate Creator. The platform uses actual writings and advanced AI to provide nuanced, contextually rich responses, enabling multi-author conversations through a Retrieval-Augmented Generation (RAG) system. Its purpose is to provide a robust platform for exploring complex philosophical and literary concepts, enhancing understanding through direct engagement with historical thinkers, with significant market potential in education and intellectual discourse. The application is powered by a comprehensive RAG database containing 34,445 embedded chunks across 407 works from 8 major sources: Kuczynski, Freud, Leibniz, Plato, Russell, Spinoza, Aristotle, and Aesop.

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
- **Username Login**: Simple username-only login (no password) for convenience.
- **Chat History**: Logged-in users can access past conversations.
- **Download**: Each conversation can be downloaded as a text file.
- **Guest Migration**: In-progress conversations are automatically migrated when users log in.

#### UI/UX Decisions
- **Layout**: A unified single-page layout with 3 columns (philosophers sidebar, settings, main content) containing seven vertically stacked sections.
- **Visuals**: Animated Kuczynski icon, AI-generated portrait avatars, minimalistic design with elegant typography, dark mode support, and visual section dividers.

#### Technical Implementations
- **Frontend**: React, TypeScript, Wouter, TanStack Query, Shadcn UI, and Tailwind CSS.
- **Backend**: Express.js with Node.js and Drizzle ORM.
- **AI Interaction**: User-selectable from 5 LLMs: ZHI 1 (OpenAI GPT-4o), ZHI 2 (Claude Sonnet 4.5), ZHI 3 (DeepSeek), ZHI 4 (Perplexity), ZHI 5 (Grok - default). Temperature 0.7, aggressive direct reasoning.
- **Streaming**: Server-Sent Events (SSE) for real-time word-by-word AI response streaming.
- **Cross-Section Content Transfer**: Bidirectional content flow using "Send to" dropdown buttons.
- **ZHI Knowledge Provider API**: Secure internal API endpoint at `/zhi/query` for authenticated database queries with Bearer token authentication, returning structured JSON.
- **Key Features**: Model Builder, Paper Writer (up to 1500 words), Quote Generator, Dialogue Creator, Interview Creator (500-10000 words with various modes and tones), and Debate Creator (1500-2500 word synthetic debates with RAG grounding and various options).
- **RAG System**: Papers are chunked, embedded, and stored in a PostgreSQL database with `pgvector` for semantic search across 87 authors. Retrieves 8 most relevant positions per query.
- **Document Upload Feature**: Users can upload text documents (.txt, .md, .doc, .docx, .pdf up to 5MB) across multiple sections.
- **Standalone SQLite Databases**: Plato Database (182 positions) and Nietzsche Database (706 positions) with APIs for searching.

### External Dependencies
- **AI Providers**: OpenAI GPT-4o, Anthropic Claude Sonnet 4.5, DeepSeek, Perplexity, Grok.
- **Database**: PostgreSQL (Neon) with pgvector extension.
- **Embeddings**: OpenAI `text-embedding-ada-002`.
- **File Parsing (Quote Generator)**: Multer, pdf-parse, mammoth.
- **ZHI Knowledge Provider**: `https://analyticphilosophy.net/zhi/query` (for `/zhi/query` endpoint).

### RAG Database Corpus (34,445 chunks across 407 works)

**Kuczynski Corpus** (205 works, 23,256 chunks):
- Core philosophical papers on semantics, philosophy of mind, epistemology, ethics, mathematics
- Position statement collections: Intensionality (50), Empiricism & Psychology (148), Free Will & Collected Papers (150), Conceptual Atomism & CTM (148), Quote Library Vol 6 (84), AI & Philosophy (142), Conception & Causation (107), Business (50), Analytic Philosophy Ch1 (113), OCD/Bureaucracy/Psychopathy (100), Neurosis vs Psychosis (50), Kant/Hume/Induction (100)
- Key themes: all contexts extensional, semantics/presemantics distinction, subpersonal mentation, emotions as beliefs, Libet experiment (consciousness as spectator), CTM refutation, content-externalism false, type-token distinction, Frege's revolution, System L vs classical logic, LLMs vindicate compositional semantics, philosophy as category analysis, metaknowledge, logical vs grammatical form, analog-digital distinction, hard analyticity

**Russell Corpus** (22 works, 1,427 chunks):
- Major works: Analysis of Matter, Analysis of Mind, Principles of Mathematics, Introduction to Mathematical Philosophy, Human Knowledge, Philosophy of Leibniz, History of Western Philosophy, Our Knowledge of the External World, Principia Mathematica (Vols 1-3), Philosophy of Logical Atomism, Mathematical Logic as Based on Theory of Types
- Key themes: neutral monism, sense-data, knowledge by acquaintance, logicism, theory of types, structural realism, logical constructions, atomic facts

**Freud Corpus** (75 works, 4,366 chunks):
- Clinical works: Studies on Hysteria, Rat Man Case, Wolf Man Case, Schreber Case, Dora Case, Little Hans, Beyond Pleasure Principle, Metapsychological Papers, Introductory Lectures, Outline of Psychoanalysis
- Cultural works: Totem and Taboo, Civilization and Its Discontents, Future of an Illusion, Moses and Monotheism, Question of Lay Analysis
- Position statements: Sublimation (100), OCD (200), Sexuality in OCD (100), Neurosis (100), Psychosis (297), Neurosis vs Psychosis (100+), Resistance (199), Occult & Childhood (100), Creative Writers (100), Transference (100), Sadism/Masochism (100), Aggression/Psychopathy (100), Humor (100), Philosophy comparisons (95), Civilization (80), Bureaucrats/Astrology (100)
- Key themes: pleasure principle, death drive, repetition compulsion, unconscious, repression, cathartic method, talking cure, hysteria, obsessional neurosis, psychosis, transference, resistance, sublimation, civilization vs instinct

**Leibniz Corpus** (17 works, 3,195 chunks):
- Major works: Discourse on Metaphysics, Monadology, New Essays on Human Understanding, Theodicy, Correspondence with Arnauld, Correspondence with Clarke, Ars Combinatoria, On Universal Synthesis and Analysis, Political Writings, Mathematical Writings
- Key themes: monads, pre-established harmony, principle of sufficient reason, best of all possible worlds, innate ideas, substance, perception vs apperception, freedom and determinism, universal characteristic, calculus, combinatorics

**Plato Corpus** (36 dialogues, 1,510 chunks):
- Major dialogues: Apology, Crito, Republic, Phaedo, Symposium, Phaedrus, Theaetetus, Parmenides, Sophist, Timaeus, Laws
- Key themes: Theory of Forms, immortality of soul, knowledge as recollection, philosopher-king, dialectic, justice, virtue, beauty, love, the Good

**Spinoza Corpus** (6 works, 370 chunks):
- Major works: Ethics, Tractatus Theologico-Politicus, Tractatus Politicus, Principles of Cartesian Philosophy, Treatise on the Emendation of the Intellect, Correspondence
- Key themes: substance monism (Deus sive Natura), conatus, mind-body parallelism, adequate ideas, intellectual love of God, freedom as understanding necessity, democracy, separation of church and state

**Aristotle Corpus** (44 works, 213 chunks)
**Aesop Corpus** (2 works, 108 chunks)