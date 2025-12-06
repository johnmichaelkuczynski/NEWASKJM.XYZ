import { db } from "./db";
import { paperChunks } from "@shared/schema";
import { sql } from "drizzle-orm";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Structured chunk data for API responses
export interface StructuredChunk {
  author: string; // REQUIRED: Author attribution for every chunk
  paperTitle: string;
  content: string;
  chunkIndex: number;
  distance: number;
  source: 'own' | 'common';
  figureId: string;
  tokens: number;
}

/**
 * VERBATIM TEXT SEARCH: Returns ONLY verbatim text chunks (not summaries)
 * Used when MaxIntel/clients request actual quotable passages
 * significance = 'VERBATIM_TEXT' ensures real text from source books
 */
export async function searchVerbatimChunks(
  question: string,
  topK: number = 10,
  authorFilter?: string
): Promise<StructuredChunk[]> {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: question,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // Search ONLY verbatim text chunks (actual quotable content)
    const whereClause = authorFilter 
      ? sql`WHERE figure_id = 'common' AND significance = 'VERBATIM_TEXT' AND author ILIKE ${'%' + authorFilter + '%'}`
      : sql`WHERE figure_id = 'common' AND significance = 'VERBATIM_TEXT'`;
    
    const results = await db.execute(
      sql`
        SELECT author, paper_title, content, chunk_index, 
               embedding <=> ${JSON.stringify(queryEmbedding)}::vector as distance
        FROM ${paperChunks}
        ${whereClause}
        ORDER BY distance
        LIMIT ${topK}
      `
    );
    
    return (results.rows || []).map((row: any) => {
      const r = row as { author: string; paper_title: string; content: string; chunk_index: number; distance: number };
      return {
        author: r.author,
        paperTitle: r.paper_title,
        content: r.content,
        chunkIndex: r.chunk_index,
        distance: r.distance,
        source: 'common' as const,
        figureId: 'common',
        tokens: Math.ceil(r.content.split(/\s+/).length * 1.3)
      };
    });
  } catch (error) {
    console.error("Error in searchVerbatimChunks:", error);
    return [];
  }
}

/**
 * UNIFIED KNOWLEDGE BASE: Core semantic search with MANDATORY author prioritization
 * Returns structured chunk data from unified Common Fund containing ALL philosophical texts
 * Used by both chat UX (findRelevantChunks) and internal knowledge API
 * 
 * CRITICAL BEHAVIOR: When authorFilter is specified, ONLY returns that author's content.
 * This ensures "KUCZYNSKI QUOTES" → 100% Kuczynski, never other authors.
 */
export async function searchPhilosophicalChunks(
  question: string,
  topK: number = 6,
  figureId: string = "common", // Default to unified knowledge base
  authorFilter?: string // Optional: filter by author name (partial match) - STRICTLY ENFORCED
): Promise<StructuredChunk[]> {
  try {
    // Generate embedding for the question
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: question,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // TWO-TIER APPROACH: If author specified, ONLY search that author's content
    // This guarantees author-specific requests return ONLY that author, never mixed results
    if (authorFilter) {
      console.log(`[Vector Search] STRICT author filter: "${authorFilter}" - will return ONLY this author's content`);
      
      // Search ONLY the specified author's chunks - check BOTH common AND author-specific figure_id
      const authorResults = await db.execute(
        sql`
          SELECT author, paper_title, content, chunk_index, figure_id,
                 embedding <=> ${JSON.stringify(queryEmbedding)}::vector as distance
          FROM ${paperChunks}
          WHERE (figure_id = 'common' OR figure_id = ${figureId})
            AND author ILIKE ${'%' + authorFilter + '%'}
          ORDER BY distance
          LIMIT ${topK}
        `
      );
      
      const authorChunks = (authorResults.rows || []).map((row: any) => {
        const r = row as { author: string; paper_title: string; content: string; chunk_index: number; distance: number };
        return {
          author: r.author,
          paperTitle: r.paper_title,
          content: r.content,
          chunkIndex: r.chunk_index,
          distance: r.distance,
          source: 'common' as const,
          figureId: 'common',
          tokens: Math.ceil(r.content.split(/\s+/).length * 1.3)
        };
      });
      
      console.log(`[Vector Search] Found ${authorChunks.length} chunks from author matching "${authorFilter}"`);
      
      // STRICT MODE: Return ONLY author's content, even if fewer than requested
      // This prevents mixing in other authors' content when user explicitly requests one author
      return authorChunks;
    }
    
    // NO AUTHOR FILTER: Search all content (normal semantic search) - check BOTH common AND specific figureId
    const results = await db.execute(
      sql`
        SELECT author, paper_title, content, chunk_index, figure_id,
               embedding <=> ${JSON.stringify(queryEmbedding)}::vector as distance
        FROM ${paperChunks}
        WHERE (figure_id = 'common' OR figure_id = ${figureId})
        ORDER BY distance
        LIMIT ${topK}
      `
    );
    
    // Convert to structured format
    return (results.rows || []).map((row: any) => {
      const r = row as { author: string; paper_title: string; content: string; chunk_index: number; distance: number };
      return {
        author: r.author,
        paperTitle: r.paper_title,
        content: r.content,
        chunkIndex: r.chunk_index,
        distance: r.distance,
        source: 'common' as const,
        figureId: 'common',
        tokens: Math.ceil(r.content.split(/\s+/).length * 1.3) // Rough token estimate
      };
    });
    
  } catch (error) {
    console.error("Vector search error:", error);
    return [];
  }
}

export async function findRelevantChunks(
  question: string,
  topK: number = 6,
  figureId: string = "jmk"
): Promise<string> {
  // Convert figureId to author name for filtering
  const authorNameMap: Record<string, string> = {
    "jmk": "Kuczynski",
    "freud": "Freud",
    "nietzsche": "Nietzsche",
    "marx": "Marx",
    "berkeley": "Berkeley",
    "james": "James",
    "dostoevsky": "Dostoevsky",
    "plato": "Plato",
    "spinoza": "Spinoza",
    "russell": "Russell",
    "galileo": "Galileo",
    "bacon": "Bacon",
    "leibniz": "Leibniz",
    "aristotle": "Aristotle",
    "kant": "Kant",
    "darwin": "Darwin",
    "bergson": "Bergson",
    "schopenhauer": "Schopenhauer",
    "jung": "Jung",
    "aesop": "Aesop"
  };
  
  const authorFilter = authorNameMap[figureId] || undefined;
  
  // Use the structured search helper WITH AUTHOR FILTER - pass figureId to search its specific embeddings
  const chunks = await searchPhilosophicalChunks(question, topK, figureId, authorFilter);
  
  // Get figure name for messages
  const figureName = authorFilter || "this author";
  
  if (chunks.length === 0) {
    return `
=== NO EMBEDDINGS FOUND ===

The vector database appears empty. Please run the embedding generation script:
npm run generate-embeddings

Until then, use your full philosophical intelligence informed by ${figureName}'s overall approach.
`;
  }
  
  let response = `
=== CONCEPTUAL BRIEFING: RELEVANT MATERIAL ===

Retrieved ${chunks.length} semantically relevant passage(s) from the UNIFIED KNOWLEDGE BASE.
This includes works from ALL philosophical figures (Kuczynski, Freud, James, Veblen, Russell, and 40+ others).
Results are sorted by semantic relevance to your question.

These are REFERENCE MATERIAL, not answers. Use them to inform your reasoning.

`;
  
  // Display chunks in order of semantic relevance
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    response += `
[Reference ${i + 1}] ${chunk.paperTitle} by ${chunk.author}
${chunk.content}

`;
  }
  
  response += `
=== END OF BRIEFING MATERIAL ===

HOW TO USE THIS BRIEFING:

✅ DO: Treat these as research notes that inform your thinking
✅ DO: Extract core principles and apply them to THIS question
✅ DO: Reason in your authentic philosophical voice
✅ DO: Reference paper titles when relevant
✅ DO: Synthesize ideas from multiple sources when appropriate

❌ DON'T: Recite or summarize these passages
❌ DON'T: Quote extensively - use your own words
❌ DON'T: Treat these as the answer - they're the conceptual foundation
❌ DON'T: Teach ABOUT philosophy - DO philosophy with these tools

Your task: Apply the ideas in these references to analyze THIS specific question.
Deploy your core reasoning method. Think with these concepts, don't report on them.
Be yourself - reason as YOU reason, not as a textbook explains you.
`;
  
  return response;
}

/**
 * Author name normalization mapping - COMPREHENSIVE COVERAGE
 * Maps ANY variation of author names to their canonical database form
 * Handles: full names, abbreviated names, punctuation variants, case variants
 */
const AUTHOR_ALIASES: Record<string, string> = {
  // Kuczynski variants
  'john-michael kuczynski': 'Kuczynski',
  'johnmichael kuczynski': 'Kuczynski',
  'j-m kuczynski': 'Kuczynski',
  'jm kuczynski': 'Kuczynski',
  'j.m. kuczynski': 'Kuczynski',
  'j.-m. kuczynski': 'Kuczynski',
  'j m kuczynski': 'Kuczynski',
  
  // Russell variants
  'bertrand russell': 'Russell',
  'bertrand arthur william russell': 'Russell',
  'b russell': 'Russell',
  'b. russell': 'Russell',
  
  // Galileo variants
  'galileo galilei': 'Galileo',
  
  // Nietzsche variants
  'friedrich nietzsche': 'Nietzsche',
  'friedrich wilhelm nietzsche': 'Nietzsche',
  'f nietzsche': 'Nietzsche',
  'f. nietzsche': 'Nietzsche',
  
  // Freud variants
  'sigmund freud': 'Freud',
  's freud': 'Freud',
  's. freud': 'Freud',
  
  // James variants
  'william james': 'James',
  'w james': 'James',
  'w. james': 'James',
  
  // Leibniz variants
  'gottfried leibniz': 'Leibniz',
  'gottfried wilhelm leibniz': 'Leibniz',
  'g leibniz': 'Leibniz',
  'g. leibniz': 'Leibniz',
  'g.w. leibniz': 'Leibniz',
  
  // Le Bon variants
  'gustave le bon': 'Le Bon',
  'le bon': 'Le Bon',
  
  // Darwin variants
  'charles darwin': 'Darwin',
  'charles robert darwin': 'Darwin',
  'c darwin': 'Darwin',
  'c. darwin': 'Darwin',
  
  // Kant variants
  'immanuel kant': 'Kant',
  'i kant': 'Kant',
  'i. kant': 'Kant',
  
  // Schopenhauer variants
  'arthur schopenhauer': 'Schopenhauer',
  'a schopenhauer': 'Schopenhauer',
  'a. schopenhauer': 'Schopenhauer',
  
  // Jung variants
  'carl jung': 'Jung',
  'carl gustav jung': 'Jung',
  'c jung': 'Jung',
  'c. jung': 'Jung',
  'c.g. jung': 'Jung',
  'cg jung': 'Jung',
  
  // Poe variants
  'edgar allan poe': 'Poe',
  'edgar poe': 'Poe',
  'e.a. poe': 'Poe',
  'e. a. poe': 'Poe',
  
  // Marx variants
  'karl marx': 'Marx',
  'k marx': 'Marx',
  'k. marx': 'Marx',
  
  // Keynes variants
  'john maynard keynes': 'Keynes',
  'j.m. keynes': 'Keynes',
  'jm keynes': 'Keynes',
  
  // Locke variants
  'john locke': 'Locke',
  'j locke': 'Locke',
  'j. locke': 'Locke',
  
  // Newton variants
  'isaac newton': 'Newton',
  'i newton': 'Newton',
  'i. newton': 'Newton',
  'sir isaac newton': 'Newton',
  
  // Hume variants
  'david hume': 'Hume',
  'd hume': 'Hume',
  'd. hume': 'Hume',
  
  // Machiavelli variants
  'niccolo machiavelli': 'Machiavelli',
  'niccolò machiavelli': 'Machiavelli',
  'n machiavelli': 'Machiavelli',
  'n. machiavelli': 'Machiavelli',
  
  // Bierce variants
  'ambrose bierce': 'Bierce',
  'a bierce': 'Bierce',
  'a. bierce': 'Bierce',
  
  // Poincare variants
  'henri poincare': 'Poincare',
  'henri poincaré': 'Poincare',
  'h poincare': 'Poincare',
  'h. poincare': 'Poincare',
  'h. poincaré': 'Poincare',
  
  // Bergson variants
  'henri bergson': 'Bergson',
  'h bergson': 'Bergson',
  'h. bergson': 'Bergson',
  
  // London variants
  'jack london': 'London',
  'john griffith london': 'London',
  'j london': 'London',
  'j. london': 'London',
  
  // Adler variants
  'alfred adler': 'Adler',
  'a adler': 'Adler',
  'a. adler': 'Adler',
  
  // Engels variants
  'friedrich engels': 'Engels',
  'f engels': 'Engels',
  'f. engels': 'Engels',
  
  // Rousseau variants
  'jean-jacques rousseau': 'Rousseau',
  'jeanjacques rousseau': 'Rousseau',
  'j.j. rousseau': 'Rousseau',
  'jj rousseau': 'Rousseau',
  'j-j rousseau': 'Rousseau',
  
  // Von Mises variants
  'ludwig von mises': 'Mises',
  'von mises': 'Mises',
  'l von mises': 'Mises',
  'l. von mises': 'Mises',
  
  // Veblen variants
  'thorstein veblen': 'Veblen',
  'thorstein bunde veblen': 'Veblen',
  't veblen': 'Veblen',
  't. veblen': 'Veblen',
  
  // Swett variants
  'sophia swett': 'Swett',
  's swett': 'Swett',
  's. swett': 'Swett',
  
  // Berkeley variants
  'george berkeley': 'Berkeley',
  'bishop berkeley': 'Berkeley',
  'g berkeley': 'Berkeley',
  'g. berkeley': 'Berkeley',
  
  // Maimonides variants
  'moses maimonides': 'Maimonides',
  'rabbi moses ben maimon': 'Maimonides',
  'rambam': 'Maimonides',
  
  // Gibbon variants
  'edward gibbon': 'Edward Gibbon',
  'e gibbon': 'Edward Gibbon',
  'e. gibbon': 'Edward Gibbon',
  
  // Additional common variants
  'hegel': 'Hegel',
  'georg hegel': 'Hegel',
  'g.w.f. hegel': 'Hegel',
  'gwf hegel': 'Hegel',
  'descartes': 'Descartes',
  'rené descartes': 'Descartes',
  'rene descartes': 'Descartes',
  'dewey': 'Dewey',
  'john dewey': 'Dewey',
  'lenin': 'Lenin',
  'vladimir lenin': 'Lenin',
  'vladimir ilyich lenin': 'Lenin',
  'spinoza': 'Spinoza',
  'baruch spinoza': 'Spinoza',
  'benedict spinoza': 'Spinoza',
  'hobbes': 'Hobbes',
  'thomas hobbes': 'Hobbes',
  'mill': 'Mill',
  'john stuart mill': 'Mill',
  'j.s. mill': 'Mill',
  'smith': 'Smith',
  'adam smith': 'Smith',
  'spencer': 'Spencer',
  'herbert spencer': 'Spencer',
  'peirce': 'Peirce',
  'charles peirce': 'Peirce',
  'charles sanders peirce': 'Peirce',
  'c.s. peirce': 'Peirce',
  'plato': 'Plato',
  'aristotle': 'Aristotle',
};

/**
 * Strip diacritics/accents from string (é → e, ñ → n, etc.)
 * Critical for matching "POINCARÉ" to database "Poincare"
 */
function stripDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normalize author name to canonical form for database lookup
 * ROBUST: Handles ANY variation - strips accents, punctuation, normalizes case, extracts last name
 */
export function normalizeAuthorName(authorInput: string): string {
  if (!authorInput) return authorInput;
  
  // Step 1: Normalize to lowercase and remove extra whitespace
  let normalized = authorInput.toLowerCase().trim();
  
  // Step 2: Strip diacritics (é → e, ñ → n, etc.) - CRITICAL for "POINCARÉ" → "Poincare"
  normalized = stripDiacritics(normalized);
  
  // Step 3: Strip all punctuation except hyphens (keep "jean-jacques")
  normalized = normalized.replace(/[.,'";:]/g, '');
  
  // Step 4: Normalize multiple spaces to single space
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Step 5: Check alias map (exact match after normalization)
  if (AUTHOR_ALIASES[normalized]) {
    return AUTHOR_ALIASES[normalized];
  }
  
  // Step 6: Fallback - extract last name intelligently
  // Split on spaces and filter out common prefixes
  const words = normalized.split(/\s+/).filter(w => 
    w.length > 2 && !['von', 'van', 'de', 'del', 'della', 'le', 'la'].includes(w)
  );
  
  if (words.length > 0) {
    // Take the last significant word and capitalize
    const lastName = words[words.length - 1];
    return lastName.charAt(0).toUpperCase() + lastName.slice(1);
  }
  
  // Step 7: If still nothing, just capitalize the input
  return authorInput.charAt(0).toUpperCase() + authorInput.slice(1).toLowerCase();
}

/**
 * Map figureId (from EZHW/external apps) to canonical author name
 * Maintains backward compatibility with figureId-based queries
 */
export function mapFigureIdToAuthor(figureId: string): string | undefined {
  if (!figureId || figureId === 'common') return undefined;
  
  const FIGURE_ID_TO_AUTHOR: Record<string, string> = {
    'jmk': 'J.-M. Kuczynski',
    'russell': 'Bertrand Russell',
    'galileo': 'Galileo',
    'nietzsche': 'Friedrich Nietzsche',
    'spinoza': 'Baruch Spinoza',
    'bacon': 'Francis Bacon',
    'freud': 'Sigmund Freud',
    'william-james': 'William James',
    'leibniz': 'Gottfried Wilhelm Leibniz',
    'aristotle': 'Aristotle',
    'lebon': 'Gustave Le Bon',
    'plato': 'Plato',
    'darwin': 'Charles Darwin',
    'kant': 'Immanuel Kant',
    'schopenhauer': 'Arthur Schopenhauer',
    'bergson': 'Henri Bergson',
    'jung': 'Carl Jung',
    'bierce': 'Ambrose Bierce',
    'marx': 'Karl Marx',
    'poe': 'Edgar Allan Poe',
    'machiavelli': 'Niccolò Machiavelli',
    'keynes': 'John Maynard Keynes',
    'hume': 'David Hume',
    'james-allen': 'James Allen',
    'newton': 'Isaac Newton',
    'locke': 'John Locke',
    'london': 'Jack London',
    'poincare': 'Henri Poincaré',
    'la-rochefoucauld': 'François de La Rochefoucauld',
    'dewey': 'John Dewey',
    'descartes': 'René Descartes',
    'lenin': 'Vladimir Lenin',
    'hegel': 'G.W.F. Hegel',
    'hobbes': 'Thomas Hobbes',
    'berkeley': 'George Berkeley',
    'veblen': 'Thorstein Veblen',
    'rousseau': 'Jean-Jacques Rousseau',
    'mill': 'John Stuart Mill',
    'engels': 'Friedrich Engels',
    'mises': 'Ludwig von Mises',
    'smith': 'Adam Smith',
    'spencer': 'Herbert Spencer',
    'marden': 'Orison Swett Marden',
    'adler': 'Alfred Adler',
    'peirce': 'Charles Sanders Peirce',
    'maimonides': 'Moses Maimonides',
    'gibbon': 'Edward Gibbon',
    'reich': 'Wilhelm Reich',
    'orwell': 'George Orwell',
  };
  
  return FIGURE_ID_TO_AUTHOR[figureId.toLowerCase()];
}

/**
 * Detect author name from query text using database lookup
 * Returns author name if detected, undefined otherwise
 */
export async function detectAuthorFromQuery(queryText: string): Promise<string | undefined> {
  // COMPLETE author list for ZHI external API detection
  const authorPatterns = [
    'Kuczynski', 'Russell', 'Galileo', 'Nietzsche', 'Spinoza', 'Bacon',
    'Freud', 'James', 'Leibniz', 'Aristotle', 'Le Bon', 'Plato',
    'Darwin', 'Kant', 'Schopenhauer', 'Bergson', 'Jung', 'Bierce',
    'Marx', 'Poe', 'Machiavelli', 'Keynes', 'Hume', 'Newton',
    'Locke', 'London', 'Poincare', 'La Rochefoucauld', 'Dewey',
    'Descartes', 'Lenin', 'Hegel', 'Hobbes', 'Berkeley', 'Veblen',
    'Rousseau', 'Mill', 'Engels', 'Mises', 'Smith', 'Spencer',
    'Marden', 'Swett', 'Adler', 'Peirce', 'Maimonides', 'Gibbon',
    'Reich', 'Stekel', 'Orwell', 'Allen'
  ];
  
  const queryUpper = queryText.toUpperCase();
  
  for (const authorName of authorPatterns) {
    if (queryUpper.includes(authorName.toUpperCase())) {
      // Verify this author exists in database
      const chunks = await db.execute(
        sql`SELECT COUNT(*) as count FROM ${paperChunks} 
            WHERE figure_id = 'common' AND author ILIKE ${'%' + authorName + '%'} 
            LIMIT 1`
      );
      
      const count = (chunks.rows[0] as any)?.count;
      if (count && parseInt(count) > 0) {
        return authorName;
      }
    }
  }
  
  return undefined;
}
