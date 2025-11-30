# Ask A Philosopher - Philosophical Q&A Application

### Overview
"Ask A Philosopher" is a unified application for deep philosophical discourse with 59 philosophical and literary figures. It offers eight operational sections: philosophical Q&A chat, Model Builder, Paper Writer, Quote Generator, Thesis to World, Nightmare Conversion, Philosophical Fiction Writer, and Dialogue Creator. The platform uses actual writings and advanced AI to provide nuanced, contextually rich responses, enabling multi-author conversations through a Retrieval-Augmented Generation (RAG) system. Its purpose is to provide a robust platform for exploring complex philosophical and literary concepts, enhancing understanding through direct engagement with historical thinkers, with significant market potential in education and intellectual discourse. The application is powered by the Kuczynski Philosophical Database (v32_CONCEPTUAL_ATOMISM + WORK-043 + VERBATIM), containing 892 high-quality positions and 1,015 verbatim text chunks from original source works across 5 major philosophers, with an average RAG retrieval relevance of 0.850.

### User Preferences
- **Response Length Control**: User can type desired response length in words, or leave blank for Auto mode. In Auto mode, philosophers MUST produce 3-5 substantial paragraphs separated by blank lines with multi-layered attack structure: Opening (immediate attack/reframing, 1 para), Mechanism (1-3 paragraphs deploying MULTIPLE layers of distinctive method within these paragraphs - e.g., Nietzsche: genealogy + psychological diagnosis + cultural prognosis + hammer-blow rhetoric combined in 1-3 paras; Marx: material base + class dynamics + dialectic + economic mechanisms; Spinoza: geometric proof + causal necessity + modal analysis + ethical implications), Counterattack/Implications (turn it around, 1 para), and Conclusion (decisive verdict, brief). Mandatory self-audit before responding: paragraph count (3-5 with blank lines), multiple method layers deployed within paragraphs, genealogical tracing when applicable, mechanism shown not asserted, counterattack present, voice matches philosopher's style (visceral/geometric/analytic/dialectical). Worked example provided in system prompts showing Nietzsche combining multiple layers within single paragraphs. Standard: responses must have HORSEPOWER - depth and force to fully deploy intellectual firepower. Single paragraph or polite summaries = automatic failure
- **Quote Control**: User can type any number from 0 to 50 for desired quotes per response (0 for none). Quotes are never mandatory - they're weapons deployed only when they strengthen the philosophical attack.
- **Paper Writing Mode**: Toggle to request formal philosophical papers with academic conventions, proper argumentation, and scholarly language
- **Variation**: Never give the same answer twice.
- **Direct Attack Mandate**: All figures attack problems immediately without preambles, commit decisively without hedging, name specific targets rather than vague references, show mechanisms through visible reasoning, reframe confused questions by rejecting false premises, and deploy quotes as logical weapons rather than decoration.
- **Anti-Chickenshit Directive**: Comprehensive 10-point protocol eliminating defensive, pedagogical, and generic responses. No defensive openings, no teaching about philosophy (USE it instead), no decorative quotes, engage actual challenges (not restate positions), reframe confused questions, counterattack when appropriate, show distinctive method visibly (Spinoza's geometric proofs, Russell's logical analysis, Nietzsche's psychological diagnosis, etc.), commit without hedging, eliminate generic academic voice, and when stuck admit it honestly. Every response tested against quality checklist: Did I attack immediately? Did I USE my philosophy or EXPLAIN it? Did I engage the challenge? Is my distinctive method visible? Could another philosopher have written this? Kuczynski bot serves as gold standard for potent, non-evasive responses.
- **Epistemic Humility Override**: All philosophers are programmed with intellectual honesty protocols requiring them to acknowledge decisive evidence against their positions, admit logical contradictions they cannot resolve, show genuine understanding of challenges, attempt responses using their actual resources, and admit limits when stuck. Intellectual honesty comes FIRST, commitment to views SECOND. Great thinkers update beliefs; defending untenable positions is what mediocrities do.
- **Contradiction Handling Protocol**: When retrieved database positions contradict each other, philosophers must: (1) acknowledge the tension explicitly ("I recognize this creates a tension with what I said earlier..."), (2) attempt reconciliation through chronological development, scope limitations, or theoretical tensions, (3) admit unresolved contradictions honestly rather than pretending coherence, (4) maintain philosophical authenticity by representing real intellectual evolution. Goal is self-awareness of contradictions, not elimination.

### System Architecture
The application acts as a centralized knowledge server providing unified access to philosophical and psychoanalytic texts via a secure internal API. It features a 3-column layout without authentication, offering direct access to the chat interface. All philosophical texts are consolidated into a unified "Common Fund" knowledge base.

#### UI/UX Decisions
- **Layout**: A unified single-page layout with 3 columns (philosophers sidebar, settings, main content) containing eight vertically stacked sections, accessible by scrolling.
- **Visuals**: Animated Kuczynski icon, AI-generated portrait avatars, minimalistic design with elegant typography, dark mode support, and visual section dividers.

#### Technical Implementations
- **Frontend**: React, TypeScript, Wouter, TanStack Query, Shadcn UI, and Tailwind CSS.
- **Backend**: Express.js with Node.js and Drizzle ORM.
- **AI Interaction**: Anthropic Claude Sonnet 4.5 (0.7 temperature) configured for aggressive direct reasoning.
- **Streaming**: Server-Sent Events (SSE) for real-time word-by-word AI response streaming.
- **Cross-Section Content Transfer**: Bidirectional content flow using "Send to" dropdown buttons.
- **ZHI Knowledge Provider API**: Secure internal API endpoint at `/zhi/query` for authenticated database queries with Bearer token authentication, returning structured JSON with excerpts, citations, and relevance scores.
- **Key Features**: Model Builder, Paper Writer (up to 1500 words), Quote Generator, Thesis to World, Nightmare Conversion (800-1200 words using 702 narrative templates), Philosophical Fiction Writer (800-1500 words in a selected philosopher's voice), Dialogue Creator (Kuczynski-style dialogues), and Debate Creator (1500-2500 word synthetic debates with Auto/Custom modes, paper upload, RAG grounding with 6 positions per thinker, word-by-word streaming, plain text output with no markdown formatting, download as .txt file, and full-height responsive layout).
- **RAG System**: Papers are chunked, embedded, and stored in a PostgreSQL database with `pgvector` for semantic search across 87 authors. Retrieves 8 most relevant positions per query, injected into AI's system prompt with mandatory instructions.
- **Document Upload Feature**: Users can upload text documents (.txt, .md, .doc, .docx, .pdf up to 5MB) across 6 sections using a reusable `DragDropUpload` component.
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

**Total Kuczynski corpus: 13 files, 1,099 chunks**