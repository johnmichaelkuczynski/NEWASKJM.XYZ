# Ask A Philosopher - Philosophical Q&A Application

### Overview
"Ask A Philosopher" is a unified application for deep philosophical discourse with 59 philosophical and literary figures. It offers seven operational sections: philosophical Q&A chat, Model Builder, Paper Writer, Quote Generator, Dialogue Creator, Interview Creator, and Debate Creator. The platform uses actual writings and advanced AI to provide nuanced, contextually rich responses, enabling multi-author conversations through a Retrieval-Augmented Generation (RAG) system. Its purpose is to provide a robust platform for exploring complex philosophical and literary concepts, enhancing understanding through direct engagement with historical thinkers, with significant market potential in education and intellectual discourse. The application is powered by a comprehensive RAG database containing 24,472 embedded chunks across 273 works from 5 major sources: Kuczynski, Russell, Freud, Aristotle, and Aesop.

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
- **AI Interaction**: Anthropic Claude Sonnet 4.5 (0.7 temperature) configured for aggressive direct reasoning.
- **Streaming**: Server-Sent Events (SSE) for real-time word-by-word AI response streaming.
- **Cross-Section Content Transfer**: Bidirectional content flow using "Send to" dropdown buttons.
- **ZHI Knowledge Provider API**: Secure internal API endpoint at `/zhi/query` for authenticated database queries with Bearer token authentication, returning structured JSON.
- **Key Features**: Model Builder, Paper Writer (up to 1500 words), Quote Generator, Dialogue Creator, Interview Creator (500-10000 words with various modes and tones), and Debate Creator (1500-2500 word synthetic debates with RAG grounding and various options).
- **RAG System**: Papers are chunked, embedded, and stored in a PostgreSQL database with `pgvector` for semantic search across 87 authors. Retrieves 8 most relevant positions per query.
- **Document Upload Feature**: Users can upload text documents (.txt, .md, .doc, .docx, .pdf up to 5MB) across multiple sections.
- **Standalone SQLite Databases**: Plato Database (182 positions) and Nietzsche Database (706 positions) with APIs for searching.

### External Dependencies
- **AI Providers**: Anthropic Claude Sonnet 4.5, OpenAI GPT-4o, DeepSeek, Perplexity.
- **Database**: PostgreSQL (Neon) with pgvector extension.
- **Embeddings**: OpenAI `text-embedding-ada-002`.
- **File Parsing (Quote Generator)**: Multer, pdf-parse, mammoth.
- **ZHI Knowledge Provider**: `https://analyticphilosophy.net/zhi/query` (for `/zhi/query` endpoint).