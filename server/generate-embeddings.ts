import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./db";
import { paperChunks } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// UNIFIED KNOWLEDGE BASE: ALL texts go into Common Fund
// This makes all philosophical texts available to ANY querying app via the /api/internal/knowledge endpoint
// Previous architecture: Each philosopher had separate embeddings (jmk, freud, veblen, etc.)
// New architecture: Everything stored in unified 'common' pool for centralized knowledge serving
const batchToFigure: Record<string, string> = {
  "jmk_batch1": "common",
  "jmk_batch2": "common",
  "jmk_batch3": "common",
  "jmk_missing": "common",
  "jmk_literal_meaning": "common",
  "jmk_new_texts": "common",
  "jmk_intentions_legal": "common",
  "jmk_misc_essays": "common",
  "jmk_russell_frege": "common",
  "jmk_mind_meaning": "common",
  "jmk_epistem_dialogues": "common",
  "jmk_legal_intention_epistem": "common",
  "jmk_college_papers": "common",
  "jmk_logic_mathematics": "common",
  "jmk_russell_math": "common",
  "jmk_conception": "common",
  "jmk_ama_epistem": "common",
  "luther_batch1": "common",
  "whewell_batch1": "common",
  "voltaire_batch1": "common",
  "veblen_batch1": "common",
  "veblen_batch2": "common",
  "veblen_batch3": "common",
  "rousseau": "common",
  "leibniz": "common",
  "hobbes_complete": "common",
  "berkeley": "common",
  "math_classics": "common",
  "reich": "common",
  "orwell": "common",
  "dostoevsky_crime_punishment": "common",
  "tolstoy_war_and_peace": "common",
  "goldman_anarchism": "common",
  "tocqueville_democracy": "common",
  "confucius_analects": "common",
  "aesop_fables": "common",
  "grimm_household_tales": "common",
};

// REQUIRED: Author attribution mapping for every chunk
// Maps batchId to author name for explicit attribution in all API responses
const batchToAuthor: Record<string, string> = {
  "jmk_batch1": "J.-M. Kuczynski",
  "jmk_batch2": "J.-M. Kuczynski",
  "jmk_batch3": "J.-M. Kuczynski",
  "jmk_missing": "J.-M. Kuczynski",
  "jmk_literal_meaning": "J.-M. Kuczynski",
  "jmk_new_texts": "J.-M. Kuczynski",
  "jmk_intentions_legal": "J.-M. Kuczynski",
  "jmk_misc_essays": "J.-M. Kuczynski",
  "jmk_russell_frege": "J.-M. Kuczynski",
  "jmk_mind_meaning": "J.-M. Kuczynski",
  "jmk_epistem_dialogues": "J.-M. Kuczynski",
  "jmk_legal_intention_epistem": "J.-M. Kuczynski",
  "jmk_college_papers": "J.-M. Kuczynski",
  "jmk_logic_mathematics": "J.-M. Kuczynski",
  "jmk_russell_math": "J.-M. Kuczynski",
  "jmk_conception": "J.-M. Kuczynski",
  "jmk_ama_epistem": "J.-M. Kuczynski",
  "jmk": "J.-M. Kuczynski",
  "luther_batch1": "Martin Luther",
  "whewell_batch1": "William Whewell",
  "voltaire_batch1": "Voltaire",
  "veblen_batch1": "Thorstein Veblen",
  "veblen_batch2": "Thorstein Veblen",
  "veblen_batch3": "Thorstein Veblen",
  "veblen": "Thorstein Veblen",
  "freud": "Sigmund Freud",
  "bacon": "Francis Bacon",
  "spinoza": "Baruch Spinoza",
  "nietzsche": "Friedrich Nietzsche",
  "russell": "Bertrand Russell",
  "darwin": "Charles Darwin",
  "dewey": "John Dewey",
  "kant": "Immanuel Kant",
  "descartes": "René Descartes",
  "lenin": "Vladimir Lenin",
  "hegel": "G.W.F. Hegel",
  "hobbes": "Thomas Hobbes",
  "hobbes_complete": "Thomas Hobbes",
  "berkeley": "George Berkeley",
  "rousseau": "Jean-Jacques Rousseau",
  "mill": "John Stuart Mill",
  "engels": "Friedrich Engels",
  "mises": "Ludwig von Mises",
  "smith": "Adam Smith",
  "spencer": "Herbert Spencer",
  "marden": "Orison Swett Marden",
  "adler": "Alfred Adler",
  "peirce": "Charles Sanders Peirce",
  "leibniz": "Gottfried Wilhelm Leibniz",
  "william-james": "William James",
  "poincare": "Henri Poincaré",
  "poe": "Edgar Allan Poe",
  "math_classics": "Various Mathematicians",
  "reich": "Wilhelm Reich",
  "orwell": "George Orwell",
  "dostoevsky_crime_punishment": "Fyodor Dostoevsky",
  "tolstoy_war_and_peace": "Leo Tolstoy",
  "goldman_anarchism": "Emma Goldman",
  "tocqueville_democracy": "Alexis de Tocqueville",
  "confucius_analects": "Confucius",
  "aesop_fables": "Aesop",
  "grimm_household_tales": "Brothers Grimm",
  "common": "Various Authors",
};

// Multi-author configuration: each figure has their own set of papers
const figuresPapers = {
  "jmk_batch1": [
    // BATCH 1: Latest versions + core works (completes in ~9 mins)
    { file: "kuczynski_analytic_philosophy_v2.txt", title: "Analytic Philosophy (Latest)" },
    { file: "kuczynski_logico_linguistic_v2.txt", title: "Logico-Linguistic Papers (Latest)" },
    { file: "kuczynski_neurosis_psychosis_v2.txt", title: "Neurosis vs. Psychosis Vignettes (Latest)" },
    { file: "kuczynski_chomsky_contributions.txt", title: "Chomsky's Two Contributions (Latest)" },
    { file: "kuczynski_pragmatism.txt", title: "Pragmatism: Epistemology Posing as Metaphysics" },
    { file: "kuczynski_ocd_philosophy.txt", title: "OCD and Philosophy" },
    { file: "kuczynski_ocd_philosophy_v2.txt", title: "OCD and Philosophy: Short Papers on Psychopathology" },
    { file: "kuczynski_borderline_personality.txt", title: "What is Borderline Personality Disorder?" },
    { file: "kuczynski_ai_philosophy.txt", title: "AI and Philosophy" },
    { file: "kuczynski_apriori.txt", title: "A Priori Knowledge" },
    { file: "kuczynski_empiricism.txt", title: "Empiricism and Its Limits" },
  ],
  "jmk_batch2": [
    // BATCH 2: Epistemology works
    { file: "kuczynski_philosophical_knowledge.txt", title: "Philosophical Knowledge" },
    { file: "kuczynski_crash_course_analytic_philosophy.txt", title: "A Crash Course in Analytic Philosophy" },
    { file: "kuczynski_theory_of_knowledge.txt", title: "Outline of a Theory of Knowledge" },
    { file: "kuczynski_theoretical_knowledge.txt", title: "Theoretical Knowledge and Inductive Inference" },
    { file: "kuczynski_knowledge_chapter.txt", title: "Knowledge (Chapter 10)" },
    { file: "kuczynski_analysis_of_analysis.txt", title: "The Analysis of Analysis" },
    { file: "kuczynski_thought_language.txt", title: "The Relationship between Thought and Language" },
    { file: "kuczynski_cartesian_skepticism.txt", title: "Cartesian Skepticism and the Birth of Epistemology" },
  ],
  "jmk_batch3": [
    // BATCH 3: AI & specialized topics
    { file: "kuczynski_ai_epistemology.txt", title: "How AI Resolves Traditional Epistemological Debates" },
    { file: "kuczynski_ai_induction.txt", title: "How AI Falsifies the Enumerative Model of Induction" },
    { file: "kuczynski_ai_anomaly_minimization.txt", title: "Anomaly Minimization in Knowledge and AI" },
    { file: "kuczynski_ai_logic.txt", title: "From Organization to Generation: Rethinking Formalization in Light of AI" },
    { file: "kuczynski_ai_binary_logic.txt", title: "AI Architecture and the Binary Nature of Truth" },
    { file: "kuczynski_ai_ctm.txt", title: "AI and the Inadequacy of the Computational Theory of Mind" },
    { file: "kuczynski_causation.txt", title: "Causation" },
    { file: "kuczynski_possible_worlds.txt", title: "Possible World Semantics" },
    { file: "kuczynski_counterfactuals.txt", title: "Counterfactuals" },
    { file: "kuczynski_russell.txt", title: "Russell's Improvements on Frege's Work" },
    { file: "kuczynski_frege_logicism.txt", title: "Frege's Formalization of Logic and Logicism" },
    { file: "kuczynski_putnam_burge.txt", title: "Putnam's Insight and Burge's Blunder" },
    { file: "kuczynski_kant_writings.txt", title: "2020 Writings on Kant: God and Theology" },
    { file: "kuczynski_dictionary.txt", title: "Dictionary of Analytic Philosophy" },
    { file: "kuczynski_ocd_dialogue.txt", title: "OCD: Two Kinds of Insanity" },
  ],
  "jmk_missing": [
    // Missing papers from batch 3 that need to be loaded
    { file: "kuczynski_frege_logicism.txt", title: "Frege's Formalization of Logic and Logicism" },
    { file: "kuczynski_putnam_burge.txt", title: "Putnam's Insight and Burge's Blunder" },
  ],
  "jmk_literal_meaning": [
    // BATCH 4: Major work on semantics - 37,340 lines
    { file: "kuczynski_literal_meaning_cognitive_content.txt", title: "Literal Meaning & Cognitive Content" },
  ],
  "jmk_new_texts": [
    // BATCH 5: New texts - AI Philosophy Comprehensive & Religion vs. Spirituality
    { file: "kuczynski_ai_philosophy_comprehensive.txt", title: "AI and Philosophy: Comprehensive Collection" },
    { file: "kuczynski_religion_vs_spirituality.txt", title: "Religion vs. Spirituality" },
    { file: "kuczynski_libet.txt", title: "Libet's Experiment: Why It Matters and What It Means" },
    { file: "kuczynski_incompleteness_deductive_logic.txt", title: "The Incompleteness of Deductive Logic: Rationality Beyond Recursion" },
    { file: "kuczynski_philosophy_psychoanalysis.txt", title: "Philosophy and Psychoanalysis: Selected Dialogues" },
    { file: "kuczynski_quantum_determinism.txt", title: "Quantum Physics and Universal Determinism: A Dialogue" },
    { file: "kuczynski_quantum_determinism_essay.txt", title: "Quantum Determinism" },
    { file: "kuczynski_methodological_individualism.txt", title: "Beyond Methodological Individualism: The Primacy of Collective Psychology" },
    { file: "kuczynski_frege_montague.txt", title: "The Spuriousness of Frege-Montague Grammar" },
    { file: "kuczynski_personality_typology.txt", title: "A Ten-Dimensional Evolutionary Typology for Personality Assessment" },
    { file: "kuczynski_white_knight_equality.txt", title: "White-Knight Equality: Rawls, Trafficking Rhetoric, and the Paternalism of Modern Protection" },
    { file: "kuczynski_calhoun_zimbardo.txt", title: "Two Experiments in Human Nature: Calhoun and Zimbardo Compared" },
    { file: "kuczynski_rawls_mouse_world.txt", title: "The Philosophy of the Full Stomach: Rawls-World and Mouse-World" },
    { file: "kuczynski_rawls_mouse_collapse.txt", title: "Rawls-World and Mouse-World: The Same Paradise, the Same Collapse" },
    { file: "kuczynski_conceptual_atomism_ctm.txt", title: "Conceptual Atomism and the Computational Theory of Mind" },
    { file: "kuczynski_stanford_prison_morality_play.txt", title: "The Stanford Prison Experiment: A Manufactured Morality Play" },
    { file: "kuczynski_incompleteness_logic.txt", title: "The Incompleteness of Logic: A Recursion-Theoretic Generalization of Gödel's Theorem" },
    { file: "kuczynski_neuroticism_neurosis.txt", title: "Neuroticism vs Neurosis: Distinguishing Trait and Structure" },
    { file: "kuczynski_terminal_humanities.txt", title: "The Terminal Humanities: Why Philosophy No Longer Generates Knowledge" },
    { file: "kuczynski_hegel_app.txt", title: "From Commentary to Code: Why an App Would Teach Hegel Better Than Hegel Scholars" },
    { file: "kuczynski_hegel_illusion_depth.txt", title: "Hegel and the Illusion of Depth: How the Master-Slave Dialectic Reveals an Intellectual Real-Estate Problem" },
    { file: "kuczynski_guardians_photo_album.txt", title: "Guardians of the Photo Album While the House Burns: The Collapse of the Humanities' Civilizational Role" },
    { file: "kuczynski_philosophy_ai_without_ai.txt", title: "The Philosophy of AI Without AI: How a Discipline Preserves Itself by Substituting Placeholders for Thought" },
    { file: "kuczynski_vietnam_epistemic_engines.txt", title: "When Victory Is Incoherent (Vietnam), I Refute It Thus (Epistemic Engines), and The Scarcity Trap (Philosophy's Hostility)" },
    { file: "What is a formal language__ Philosophy Shorts Volume 24_1762816911377.txt", title: "What Is a Formal Language? Philosophy Shorts Volume 24" },
    { file: "Functional vs. Structural Delusiveness_1762816911377.txt", title: "Functional vs. Structural Delusiveness" },
    { file: "Straw Jobs Being Created to Fill in for Techno-obsolete Jobs_1762816911377.txt", title: "Straw Jobs Being Created to Fill in for Techno-obsolete Jobs" },
    { file: "Determinism, Freedom, Psychopathy_1762816911378.txt", title: "Determinism, Freedom, Psychopathy" },
    { file: "Ask Me Anything about Psychopathy!_ With Link to Video Version of Book!_1762816911378.txt", title: "Ask Me Anything about Psychopathy!" },
  ],
  "jmk_intentions_legal": [
    // BATCH 6: Philosophy of Mind and Legal Philosophy - November 2025
    { file: "kuczynski_what_is_intention.txt", title: "What Is an Intention?" },
    { file: "kuczynski_moral_structure_legal_obligation.txt", title: "The Moral Structure of Legal Obligation" },
  ],
  "jmk_misc_essays": [
    // BATCH 7: Miscellaneous Essays - Kant, Political Philosophy, Logic, Psychopathology - November 2025
    { file: "kuczynski_kant_god_conception.txt", title: "What Does Kant Conceive God to Be?" },
    { file: "kuczynski_kant_god_belief.txt", title: "What Does Kant Believe God to Be?" },
    { file: "kuczynski_goldman_rousseau_hayek_state.txt", title: "Goldman, Rousseau and von Hayek on the Ideal State" },
    { file: "kuczynski_observations_aphorisms.txt", title: "Observations and Aphorisms" },
    { file: "kuczynski_symbolic_logic_lie.txt", title: "The Lie of the Discipline of Symbolic Logic" },
    { file: "kuczynski_late_onset_psychopathy.txt", title: "Two Kinds of Late-onset Psychopathy" },
    { file: "kuczynski_panic_attacks.txt", title: "Panic Attacks Have an Objective Basis" },
  ],
  "jmk_russell_frege": [
    // BATCH 8: Russell & Frege - Theory of Descriptions, Logical Analysis - November 2025
    { file: "kuczynski_russell_ch6.txt", title: "Russell's Improvements on Frege's Work (Chapter 6)" },
  ],
  "jmk_mind_meaning": [
    // BATCH 9: Mind, Meaning & Scientific Explanation - Major Work on Philosophy of Mind & Language - November 2025
    { file: "kuczynski_mind_meaning_scientific.txt", title: "Mind, Meaning, and Scientific Explanation" },
  ],
  "jmk_epistem_dialogues": [
    // BATCH 10: Epistemology, Dialogues & Political Philosophy - November 2025
    { file: "kuczynski_quantum_determinism_full.txt", title: "Quantum Determinism (Full Essay)" },
    { file: "kuczynski_philosophical_knowledge_full.txt", title: "Philosophical Knowledge: What It Is and Why Philosophy Departments Don't Want You to Have It" },
    { file: "kuczynski_philosophical_dialogues.txt", title: "Philosophical Dialogues" },
    { file: "kuczynski_originalism.txt", title: "Originalism" },
  ],
  "jmk_legal_intention_epistem": [
    // BATCH 11: Legal Philosophy, Philosophy of Mind/Action & Epistemology - November 2025
    { file: "kuczynski_moral_structure_legal_obligation.txt", title: "The Moral Structure of Legal Obligation" },
    { file: "kuczynski_what_is_intention.txt", title: "What Is an Intention?" },
    { file: "kuczynski_theoretical_knowledge_inductive.txt", title: "Theoretical Knowledge and Inductive Inference (2024)" },
    { file: "kuczynski_semantics_philosophy_shorts.txt", title: "Semantics (Philosophy Shorts Volume 8)" },
  ],
  "jmk_college_papers": [
    // BATCH 12: Interdisciplinary College Papers - Accounting, Business, Economics, Politics, Psychology - November 2025
    { file: "kuczynski_college_papers_plus_2019.txt", title: "Papers on Accounting, Business, Economics, Politics, and Psychology (College Papers Plus 2019)" },
  ],
  "jmk_logic_mathematics": [
    // BATCH 13: Logic, Set Theory, and Philosophy of Mathematics - November 2025
    { file: "kuczynski_logic_set_theory_mathematics.txt", title: "Logic, Set-theory, and Philosophy of Mathematics: Selected Papers" },
  ],
  "luther_batch1": [
    // BATCH 12: Martin Luther - Reformation Theology - November 2025
    { file: "luther_works_volume1.txt", title: "Works of Martin Luther with Introductions and Notes (Volume I)" },
  ],
  "whewell_batch1": [
    // BATCH 14: William Whewell - History and Philosophy of Science - November 2025
    { file: "whewell_history_inductive_sciences.txt", title: "History of the Inductive Sciences, from the Earliest to the Present Time" },
  ],
  "voltaire_batch1": [
    // BATCH 16: Voltaire - Works - November 2025
    { file: "voltaire_works.txt", title: "Works of Voltaire: Candide, Philosophical Dictionary, Letters on England, and More" },
  ],
  "jmk_russell_math": [
    // BATCH 15A: J.-M. Kuczynski - Russell's Mathematical Philosophy - November 2025
    { file: "kuczynski_russell_mathematical_philosophy.txt", title: "Russell's Mathematical Philosophy: A Chapter-by-Chapter Exposition" },
  ],
  "jmk_conception": [
    // BATCH 15B: J.-M. Kuczynski - Conception and Causation - November 2025
    { file: "kuczynski_conception_causation.txt", title: "Conception and Causation: Selected Early Philosophical Papers" },
  ],
  "jmk_ama_epistem": [
    // BATCH 15C: J.-M. Kuczynski - AMA Epistemology - November 2025
    { file: "kuczynski_ama_epistemology.txt", title: "Ask Me Anything about Epistemology!" },
  ],
  "jmk": [
    // LEGACY: For backward compatibility - use batch approach above
    { file: "kuczynski_analytic_philosophy_v2.txt", title: "Analytic Philosophy (Latest)" },
  ],
  "veblen_batch1": [
    // BATCH 1: First ~735 chunks - Theory of the Leisure Class, Theory of Business Enterprise, etc.
    { file: "veblen_batch1.txt", title: "The Complete Works of Thorstein Veblen (Part 1)" },
  ],
  "veblen_batch2": [
    // BATCH 2: Next ~735 chunks - Instinct of Workmanship, Imperial Germany, etc.
    { file: "veblen_batch2.txt", title: "The Complete Works of Thorstein Veblen (Part 2)" },
  ],
  "veblen_batch3": [
    // BATCH 3: Final ~735 chunks - Essays and Articles
    { file: "veblen_batch3.txt", title: "The Complete Works of Thorstein Veblen (Part 3)" },
  ],
  "veblen": [
    // LEGACY: For backward compatibility
    { file: "veblen_complete_works.txt", title: "The Complete Works of Thorstein Veblen" },
  ],
  "freud": [
    { file: "freud_dictionary.txt", title: "Freud: Dictionary of Psychoanalysis" },
    { file: "freud_general_introduction.txt", title: "A General Introduction to Psychoanalysis" },
    { file: "freud_totem_and_taboo.txt", title: "Totem and Taboo" },
  ],
  "bacon": [
    { file: "bacon_complete_works.txt", title: "Francis Bacon: Complete Works" },
  ],
  "spinoza": [
    { file: "spinoza_philosophy.txt", title: "The Philosophy of Spinoza" },
  ],
  "nietzsche": [
    { file: "nietzsche_basic_writings.txt", title: "Basic Writings of Nietzsche" },
  ],
  "russell": [
    { file: "russell_abc_relativity.txt", title: "The ABC of Relativity" },
    { file: "russell_mysticism_and_logic.txt", title: "Mysticism and Logic and Other Essays" },
    { file: "russell_human_knowledge.txt", title: "Human Knowledge: Its Scope and Value" },
    { file: "russell_bolshevism.txt", title: "The Practice and Theory of Bolshevism" },
    { file: "russell_free_thought.txt", title: "Free Thought and Official Propaganda" },
    { file: "russell_time.txt", title: "On the Experience of Time" },
    { file: "russell_principles_mathematics.txt", title: "The Principles of Mathematics" },
    { file: "russell_political_ideals.txt", title: "Political Ideals" },
  ],
  "darwin": [
    { file: "darwin_complete_works.txt", title: "On the Origin of Species, The Expression of the Emotions in Man and Animals & The Descent of Man" },
    { file: "darwin_autobiography.txt", title: "The Autobiography of Charles Darwin" },
  ],
  "dewey": [
    { file: "dewey_collected_works.txt", title: "The Collected Works of John Dewey" },
  ],
  "kant": [
    { file: "kant_kuczynski_analysis.txt", title: "Kuczynski's Analysis: Kant on God and Theology" },
  ],
  "descartes": [
    { file: "descartes_collected_works.txt", title: "The Collected Works of René Descartes" },
    { file: "descartes_meditations_guide.txt", title: "Kuczynski's Guide to Descartes' Meditations (Cartesian Epistemology)" },
  ],
  "lenin": [
    { file: "lenin_collected_works.txt", title: "Collected Works of Vladimir Lenin (25+ Texts)" },
    { file: "lenin_materialism_empirio_criticism.txt", title: "Materialism and Empirio-Criticism" },
  ],
  "hegel": [
    { file: "hegel_science_of_logic.txt", title: "The Logic of Hegel (Science of Logic)" },
    { file: "hegel_philosophy_of_mind.txt", title: "Philosophy of Mind" },
  ],
  "hobbes": [
    { file: "hobbes_collected_works.txt", title: "The Collected Works of Thomas Hobbes (Delphi Classics)" },
  ],
  "hobbes_complete": [
    // Project Gutenberg Complete Works - 3 volumes, ~90k lines total
    { file: "hobbes_complete_vol01_elements.txt", title: "Elements of Philosophy (The English Works of Thomas Hobbes, Volume 1)" },
    { file: "hobbes_complete_vol03_leviathan.txt", title: "Leviathan - The Matter, Form, and Power of a Commonwealth (The English Works of Thomas Hobbes, Volume 3)" },
    { file: "hobbes_complete_vol05_liberty_necessity.txt", title: "Questions Concerning Liberty, Necessity, and Chance (The English Works of Thomas Hobbes, Volume 5)" },
  ],
  "berkeley": [
    // Three Dialogues Between Hylas and Philonous (34,228 lines - Project Gutenberg)
    { file: "berkeley_three_dialogues.txt", title: "Three Dialogues Between Hylas and Philonous, in Opposition to Sceptics and Atheists" },
  ],
  "math_classics": [
    // Classical Mathematical Texts: Discrete Math, Analysis, Geometry, Number Theory
    { file: "DISCRETE MATH LEVIN_1762900474631.txt", title: "Discrete Mathematics: An Open Introduction by Oscar Levin" },
    { file: "RIEMANN_1762900474631.txt", title: "On Riemann's Theory of Algebraic Functions and their Integrals by Felix Klein" },
    { file: "GAUSS_1762900474632.txt", title: "General Investigations of Curved Surfaces of 1827 and 1825 by Karl Friedrich Gauss" },
    { file: "DEDEKIND_1762900474632.txt", title: "Essays on the Theory of Numbers by Richard Dedekind" },
  ],
  "reich": [
    // Wilhelm Reich - Psychoanalysis, Orgone Energy, Mass Psychology (123,812 lines total)
    { file: "reich_character_analysis.txt", title: "Character Analysis" },
    { file: "reich_cancer_biopathy.txt", title: "The Cancer Biopathy: Discovery of the Orgone Vol. II" },
    { file: "reich_function_orgasm.txt", title: "The Function of the Orgasm: Discovery of the Orgone Vol. I" },
    { file: "reich_people_in_trouble.txt", title: "People in Trouble: The Emotional Plague of Mankind Vol. II" },
    { file: "reich_invasion_sex_morality.txt", title: "The Invasion of Compulsory Sex-Morality" },
    { file: "reich_speaks_freud.txt", title: "Reich Speaks of Freud" },
  ],
  "orwell": [
    // George Orwell - Political writing, dystopian fiction, essays on language and truth
    { file: "orwell_collected_works.txt", title: "George Orwell: Collected Essays and Passages" },
  ],
  "rousseau": [
    { file: "rousseau_complete_works.txt", title: "The Complete Works of Jean-Jacques Rousseau" },
  ],
  "mill": [
    { file: "mill_system_of_logic.txt", title: "A System of Logic, Ratiocinative and Inductive" },
  ],
  "engels": [
    { file: "engels_complete_works.txt", title: "Complete Works of Friedrich Engels" },
  ],
  "mises": [
    { file: "mises_human_action.txt", title: "Human Action: A Treatise on Economics" },
    { file: "mises_theory_money_credit.txt", title: "The Theory of Money and Credit" },
    { file: "mises_liberalism.txt", title: "Liberalism: In The Classical Tradition" },
    { file: "mises_bureaucracy.txt", title: "Bureaucracy" },
    { file: "mises_marxism_unmasked.txt", title: "Marxism Unmasked: From Delusion to Destruction" },
    { file: "mises_ultimate_foundation.txt", title: "The Ultimate Foundation of Economic Science" },
  ],
  "smith": [
    { file: "smith_moral_sentiments.txt", title: "The Theory of Moral Sentiments" },
    { file: "smith_wealth_of_nations.txt", title: "An Inquiry into the Nature and Causes of the Wealth of Nations" },
  ],
  "spencer": [
    { file: "spencer_right_to_ignore_state.txt", title: "The Right To Ignore The State" },
  ],
  "marden": [
    { file: "marden_character.txt", title: "Character: The Grandest Thing in the World" },
    { file: "marden_he_can_who_thinks_he_can.txt", title: "He Can Who Thinks He Can & Other Papers on Success in Life" },
    { file: "marden_self_investment.txt", title: "Self Investment" },
    { file: "marden_keeping_fit.txt", title: "Keeping Fit" },
  ],
  "adler": [
    { file: "adler_neurotic_constitution.txt", title: "The Neurotic Constitution: Outlines of a Comparative Individualistic Psychology and Psychotherapy" },
    { file: "adler_what_life_could_mean_to_you.txt", title: "What Life Could Mean to You" },
    { file: "adler_pattern_of_life.txt", title: "The Pattern of Life" },
  ],
  "peirce": [
    { file: "peirce_writings.txt", title: "The Essential Peirce: Selected Philosophical Writings, Volume 2 (1893-1913)" },
  ],
  "leibniz": [
    { file: "leibniz_complete_works.txt", title: "The Collected Works of Gottfried Wilhelm Leibniz" },
    { file: "leibniz_monadology_kuczynski.txt", title: "Analytic Summary of Leibniz's Monadology by J.-M. Kuczynski" },
  ],
  "william-james": [
    { file: "james_collected_works.txt", title: "The Collected Works of William James" },
    { file: "james_memories_and_studies.txt", title: "Memories and Studies" },
  ],
  "poincare": [
    { file: "poincare_science_hypothesis.txt", title: "Science and Hypothesis" },
  ],
  "poe": [
    { file: "poe_volume_1.txt", title: "The Works of Edgar Allan Poe — Volume 1" },
    { file: "poe_volume_2.txt", title: "The Works of Edgar Allan Poe — Volume 2" },
    { file: "poe_volume_3.txt", title: "The Works of Edgar Allan Poe — Volume 3" },
    { file: "poe_volume_4.txt", title: "The Works of Edgar Allan Poe — Volume 4" },
    { file: "poe_volume_5.txt", title: "The Works of Edgar Allan Poe — Volume 5" },
  ],
  "dostoevsky_crime_punishment": [
    // DOSTOEVSKY: Crime and Punishment - November 2025
    { file: "data/dostoevsky/crime_and_punishment.txt", title: "Crime and Punishment by Fyodor Dostoevsky" },
  ],
  "tolstoy_war_and_peace": [
    // TOLSTOY: War and Peace - November 2025
    { file: "data/tolstoy/war_and_peace.txt", title: "War and Peace by Leo Tolstoy" },
  ],
  "goldman_anarchism": [
    // GOLDMAN: Anarchism and Other Essays - November 2025
    { file: "data/goldman/anarchism_and_other_essays.txt", title: "Anarchism and Other Essays by Emma Goldman" },
  ],
  "tocqueville_democracy": [
    // TOCQUEVILLE: Democracy in America - November 2025
    { file: "data/tocqueville/democracy_in_america.txt", title: "Democracy in America by Alexis de Tocqueville" },
  ],
  "confucius_analects": [
    // CONFUCIUS: The Analects - November 2025
    { file: "data/confucius/analects.txt", title: "The Analects of Confucius" },
  ],
  "aesop_fables": [
    // AESOP: Aesop's Fables - November 2025
    { file: "data/aesop/fables.txt", title: "Aesop's Fables" },
  ],
  "grimm_household_tales": [
    // BROTHERS GRIMM: Household Tales - November 2025
    { file: "data/grimm/household_tales.txt", title: "Grimm's Household Tales" },
  ],
  "common": [
    // Common Fund of Knowledge - shared knowledge base accessible to ALL philosophers
    { file: "lawrence_fantasia_unconscious.txt", title: "Fantasia of the Unconscious by D.H. Lawrence" },
    { file: "gandolfi_logic_of_information.txt", title: "Logic of Information by Italo Gandolfi" },
    { file: "physics_outline.txt", title: "Outline of Physics" },
    { file: "confucius_sayings.txt", title: "The Sayings of Confucius" },
    { file: "mach_scientific_lectures.txt", title: "Popular Scientific Lectures by Ernst Mach" },
    { file: "lippmann_preface_politics.txt", title: "A Preface to Politics by Walter Lippmann" },
    { file: "playfair_decline_fall_nations.txt", title: "An Inquiry into the Permanent Causes of the Decline and Fall of Powerful and Wealthy Nations by William Playfair" },
    { file: "hoppe_short_history_man.txt", title: "A Short History of Man: Progress and Decline by Hans-Hermann Hoppe" },
    { file: "weir_dawn_of_reason.txt", title: "The Dawn of Reason or, Mental Traits in the Lower Animals by James Weir, Jr." },
    { file: "spargo_bolshevism.txt", title: "Bolshevism: The Enemy of Political and Industrial Democracy by John Spargo" },
    { file: "bohm_bawerk_marx.txt", title: "Karl Marx and the Close of His System by Eugen von Böhm-Bawerk" },
    { file: "physics_cosmology_concepts.txt", title: "Clarifying Concepts in Physics: New Ideas & Answers in Quantum Cosmology" },
    { file: "elementary_chemistry.txt", title: "An Elementary Study of Chemistry" },
    { file: "russell_analysis_mind.txt", title: "The Analysis of Mind by Bertrand Russell" },
    { file: "marshall_principles_economics.txt", title: "Principles of Economics by Alfred Marshall" },
    { file: "popper_quantum_schism.txt", title: "Quantum Theory and the Schism in Physics by Karl Popper" },
    { file: "bohm_quantum_theory.txt", title: "Quantum Theory by David Bohm" },
    { file: "oscar_wilde_aphorisms_soul_of_man.txt", title: "Miscellaneous Aphorisms and The Soul of Man by Oscar Wilde" },
    { file: "pyle_science_human_nature.txt", title: "The Science of Human Nature: A Psychology for Beginners by William Henry Pyle" },
    { file: "myerson_foundations_personality.txt", title: "The Foundations of Personality by Abraham Myerson" },
    { file: "woodworth_psychology_mental_life.txt", title: "Psychology: A Study of Mental Life by Robert S. Woodworth" },
    { file: "scott_increasing_human_efficiency.txt", title: "Increasing Human Efficiency in Business by Walter Dill Scott" },
    { file: "smith_chaos_vsi.txt", title: "Chaos: A Very Short Introduction by Leonard Smith" },
    { file: "chinese_literature_confucius_mencius.txt", title: "Chinese Literature: The Analects of Confucius, The Sayings of Mencius, The Shi-King, and The Travels of Fâ-Hien" },
    { file: "dasgupta_economics_vsi.txt", title: "Economics: A Very Short Introduction by Partha Dasgupta" },
    { file: "binmore_game_theory_vsi.txt", title: "Game Theory: A Very Short Introduction by Ken Binmore" },
    { file: "kuczynski_emotivism.txt", title: "Emotivism by J.-M. Kuczynski" },
    { file: "kuczynski_freedom.txt", title: "Freedom by J.-M. Kuczynski" },
    { file: "kuczynski_language.txt", title: "What Is a Language? by J.-M. Kuczynski" },
    { file: "kuczynski_modality_nonexistence.txt", title: "Modality and Non-existence by J.-M. Kuczynski" },
    { file: "keyser_rigorous_thinking.txt", title: "The Human Worth of Rigorous Thinking: Essays and Addresses by Cassius J. Keyser" },
    { file: "cochran_harpending_10000_year_explosion.txt", title: "The 10,000 Year Explosion: How Civilization Accelerated Human Evolution by Gregory Cochran and Henry Harpending" },
    { file: "carroll_symbolic_logic.txt", title: "Symbolic Logic by Lewis Carroll" },
    { file: "rumsey_statistics_essentials.txt", title: "Statistics Essentials For Dummies by Deborah Rumsey" },
    { file: "electronics_for_dummies.txt", title: "Electronics For Dummies" },
    { file: "freud_beyond_pleasure_principle.txt", title: "Beyond the Pleasure Principle by Sigmund Freud" },
    { file: "bastiat_economics_freedom.txt", title: "The Economics of Freedom: Selected Works by Frédéric Bastiat" },
    { file: "einstein_relativity.txt", title: "Relativity: The Special and General Theory by Albert Einstein" },
    { file: "jevons_money_mechanism.txt", title: "Money and the Mechanism of Exchange by William Stanley Jevons" },
    { file: "prescott_conquest_peru.txt", title: "History of the Conquest of Peru by William H. Prescott" },
    { file: "clark_economic_theory.txt", title: "Essentials of Economic Theory by John Bates Clark" },
    { file: "klein_envy_gratitude.txt", title: "Envy and Gratitude and Other Works by Melanie Klein" },
    { file: "labossiere_42_fallacies.txt", title: "42 Fallacies by Michael C. LaBossiere" },
    { file: "gibbon_memoirs.txt", title: "Memoirs of My Life and Writings by Edward Gibbon" },
    { file: "marcus_aurelius_meditations.txt", title: "Meditations by Marcus Aurelius" },
    { file: "davis_medieval_europe.txt", title: "Medieval Europe by H. W. C. Davis" },
    { file: "hebraic_literature_talmud.txt", title: "Hebraic Literature: Translations from the Talmud, Midrashim and Kabbala" },
    { file: "whibley_book_scoundrels.txt", title: "A Book of Scoundrels by Charles Whibley" },
    { file: "galsworthy_the_mob.txt", title: "The Mob by John Galsworthy" },
    { file: "giles_civilization_china.txt", title: "The Civilization of China by Herbert A. Giles" },
    { file: "tacitus_histories.txt", title: "The Histories, Volumes I and II by Tacitus" },
    { file: "rashdall_philosophy_religion.txt", title: "Philosophy and Religion: Six Lectures by Hastings Rashdall" },
    { file: "A History of The Inquisition of The Middle Ages; volume I_1762813953180.txt", title: "A History of The Inquisition of The Middle Ages, Volume I by Henry Charles Lea" },
    { file: "Philosophy of Science_ The Link Between Science and Philosophy_1762813953181.txt", title: "Philosophy of Science: The Link Between Science and Philosophy by Philipp Frank" },
    { file: "Mathematical Logic for Computer Science_1762813953182.txt", title: "Mathematical Logic for Computer Science by Mordechai Ben-Ari" },
    { file: "Introductory Real Analysis (Dover Books on Mathematics)_1762813953182.txt", title: "Introductory Real Analysis by A. N. Kolmogorov and S. V. Fomin" },
    { file: "Contributions to the Founding of the Theory of Transfinite Numbers (Dover Books on Mathematics)_1762813953182.txt", title: "Contributions to the Founding of the Theory of Transfinite Numbers by Georg Cantor" },
    { file: "The Complete Tacitus Anthology_ The Histories, The Annals, Germania, Agricola, A Dialogue on Oratory (Illustrated) (Texts From Ancient Rome)_1762813991727.txt", title: "The Complete Tacitus Anthology: The Histories, The Annals, Germania, Agricola, A Dialogue on Oratory" },
    { file: "The Einstein Theory of Relativity A Concise Statement_1762813991728.txt", title: "The Einstein Theory of Relativity: A Concise Statement by H.A. Lorentz" },
    { file: "The Golden Bough (Vol. 1 of 2)_1762814001536.txt", title: "The Golden Bough, Volume I: A Study in Comparative Religion by James George Frazer" },
    { file: "The Principles of Economics With Applications to Practical Problems_1762814010740.txt", title: "The Principles of Economics With Applications to Practical Problems by Frank A. Fetter" },
  ]
};

function chunkText(text: string, targetWordsPerChunk: number = 300): string[] {
  // Split into sentences (rough split on periods, exclamation marks, question marks)
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  const chunks: string[] = [];
  let currentChunk = "";
  let wordCount = 0;
  
  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).length;
    
    // If single sentence is too long, split it further
    if (sentenceWords > targetWordsPerChunk) {
      // If we have accumulated content, save it first
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
        wordCount = 0;
      }
      
      // Split long sentence by words
      const words = sentence.split(/\s+/);
      for (let i = 0; i < words.length; i += targetWordsPerChunk) {
        const chunk = words.slice(i, i + targetWordsPerChunk).join(" ");
        chunks.push(chunk);
      }
      continue;
    }
    
    // Check if adding this sentence would exceed limit
    if (wordCount + sentenceWords > targetWordsPerChunk && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
      wordCount = sentenceWords;
    } else {
      currentChunk += (currentChunk ? " " : "") + sentence;
      wordCount += sentenceWords;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.filter(c => c.split(/\s+/).length > 20); // Filter out very small chunks
}

async function generateEmbedding(text: string, retryHalved: boolean = false): Promise<number[] | null> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error: any) {
    // If chunk is too large, try to split and retry once
    // OpenAI SDK v4 stores the message at error.error.message
    const errorMessage = error?.error?.message || error?.message || '';
    if (error?.status === 400 && errorMessage.includes('maximum context length')) {
      const wordCount = text.split(/\s+/).length;
      
      // If we haven't retried yet and chunk is splittable, split in half and return special marker
      if (!retryHalved && wordCount > 100) {
        console.log(` ⚠️  Chunk too large (~${wordCount} words), will split and retry`);
        return null; // Caller will detect and split
      }
      
      // If already retried or too small to split, skip
      console.log(` ⚠️  Chunk too large (~${wordCount} words), skipping`);
      return null;
    }
    // Re-throw other errors
    throw error;
  }
}

async function main() {
  // Get figure ID from command line args (e.g., "jmk_batch1", "freud", or "all")
  const targetFigure = process.argv[2] || "all";
  
  console.log(`🚀 Starting embedding generation for: ${targetFigure}\n`);
  
  // Filter figures to process
  let figuresToProcess: [string, typeof figuresPapers[keyof typeof figuresPapers]][] = [];
  
  if (targetFigure === "all") {
    figuresToProcess = Object.entries(figuresPapers);
    // Delete ALL embeddings only when processing all figures
    console.log("🗑️  Clearing ALL existing embeddings...");
    await db.delete(paperChunks);
    console.log("✓ Cleared\n");
  } else {
    const papers = figuresPapers[targetFigure as keyof typeof figuresPapers];
    if (!papers) {
      console.error(`❌ Unknown figure: ${targetFigure}`);
      console.log(`Available figures: ${Object.keys(figuresPapers).join(", ")}`);
      process.exit(1);
    }
    figuresToProcess = [[targetFigure, papers]];
    
    // DON'T delete for batch processing - we'll skip existing papers instead
    console.log(`📦 Batch mode: Will skip papers that already exist\n`);
  }
  
  let totalChunks = 0;
  let totalPapers = 0;
  
  // Process each figure's papers
  for (const [batchId, papers] of figuresToProcess) {
    // Get actual figure ID (for batches like jmk_batch1 -> jmk)
    const actualFigureId = batchToFigure[batchId] || batchId;
    
    console.log(`\n📚 Processing ${batchId.toUpperCase()} → ${actualFigureId} (${papers.length} papers)...\n`);
    
    for (const paper of papers) {
      try {
        // Check if this paper already exists - get count to enable resume
        const existing = await db.select().from(paperChunks)
          .where(and(
            eq(paperChunks.figureId, actualFigureId),
            eq(paperChunks.paperTitle, paper.title)
          ));
        
        console.log(`📄 Processing: ${paper.title}`);
        
        const content = readFileSync(join(__dirname, paper.file), "utf-8");
        // Use smaller chunks (300 words) for papers that were too large at 500
        const targetWords = paper.title.includes("Frege") || paper.title.includes("Putnam") ? 300 : 500;
        const chunks = chunkText(content, targetWords);
        
        console.log(`   Found ${chunks.length} chunks`);
        
        // Check if paper is complete by verifying contiguous sequence 0…n-1
        const existingIndices = existing.map(e => e.chunkIndex).sort((a, b) => a - b);
        const isComplete = existing.length === chunks.length && 
                          existingIndices.every((idx, i) => idx === i);
        
        if (isComplete) {
          console.log(`   ✓ Already complete (${existing.length}/${chunks.length} chunks), skipping`);
          totalPapers++;
          continue;
        } else if (existing.length > 0) {
          console.log(`   ⚠️  Resuming: ${existing.length}/${chunks.length} chunks already embedded`);
        }
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          process.stdout.write(`   Embedding chunk ${i + 1}/${chunks.length}...`);
          
          const embedding = await generateEmbedding(chunk);
          
          // Skip chunks that are too large
          if (embedding === null) {
            process.stdout.write(` skipped (too large)\n`);
            continue;
          }
          
          // Use ON CONFLICT DO NOTHING for idempotent inserts (unique constraint on figureId + paperTitle + chunkIndex)
          await db.insert(paperChunks).values({
            figureId: actualFigureId,  // Use actual figure ID, not batch name
            author: batchToAuthor[batchId] || "Unknown Author",  // REQUIRED: Explicit author attribution
            paperTitle: paper.title,
            content: chunk,
            embedding: embedding as any, // pgvector handles array conversion
            chunkIndex: i,
          }).onConflictDoNothing();
          
          process.stdout.write(` ✓\n`);
          totalChunks++;
          
          // Rate limiting: Wait 250ms between requests to avoid hitting OpenAI limits (conservative for batch processing)
          await new Promise(resolve => setTimeout(resolve, 250));
        }
        
        console.log(`✓ ${paper.title} complete\n`);
        totalPapers++;
      } catch (error) {
        console.error(`❌ Error processing ${paper.title}:`, error);
      }
    }
  }
  
  console.log(`\n🎉 Done! Generated ${totalChunks} embeddings across ${totalPapers} papers from ${Object.keys(figuresPapers).length} figures.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
