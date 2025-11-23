import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, index, uniqueIndex, jsonb, vector, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const personaSettings = pgTable("persona_settings", {
  userId: varchar("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  responseLength: integer("response_length").notNull().default(1000),
  writePaper: boolean("write_paper").notNull().default(false),
  quoteFrequency: integer("quote_frequency").notNull().default(10),
  selectedModel: text("selected_model").notNull().default("zhi1"),
  enhancedMode: boolean("enhanced_mode").notNull().default(true),
});

export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  verseText: text("verse_text"),
  verseReference: text("verse_reference"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Religious figures for "Talk with X" feature
export const figures = pgTable("figures", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Conversations with specific religious figures
export const figureConversations = pgTable("figure_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  figureId: varchar("figure_id").notNull().references(() => figures.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Messages in figure conversations
export const figureMessages = pgTable("figure_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => figureConversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Paper chunks with vector embeddings for RAG
// Supports both raw text chunks AND pre-extracted philosophical positions
export const paperChunks = pgTable("paper_chunks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  figureId: varchar("figure_id").notNull().references(() => figures.id, { onDelete: "cascade" }),
  author: text("author").notNull(), // REQUIRED: Explicit author attribution for every chunk
  paperTitle: text("paper_title").notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }), // OpenAI ada-002 dimensions
  chunkIndex: integer("chunk_index").notNull(),
  
  // Fields for pre-extracted philosophical positions (optional, only for DB v25 positions)
  positionId: text("position_id"), // e.g., "EP-001", "MIND-018"
  domain: text("domain"), // e.g., "epistemology", "philosophy_of_mind"
  philosophicalEngagements: jsonb("philosophical_engagements"), // { challenges: [...], supports: [...] }
  sourceWork: text("source_work"), // e.g., "WORK-001", "WORK-011"
  significance: text("significance"), // e.g., "FOUNDATIONAL", "HIGH"
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("paper_chunks_figure_idx").on(table.figureId),
  index("paper_chunks_author_idx").on(table.author),
  index("paper_chunks_position_idx").on(table.positionId),
  index("paper_chunks_domain_idx").on(table.domain),
  // Unique constraint prevents duplicate chunks and enables idempotent resume
  uniqueIndex("paper_chunks_unique_idx").on(table.figureId, table.paperTitle, table.chunkIndex),
]);

export const usersRelations = relations(users, ({ one, many }) => ({
  personaSettings: one(personaSettings, {
    fields: [users.id],
    references: [personaSettings.userId],
  }),
  goals: many(goals),
  conversations: many(conversations),
  figureConversations: many(figureConversations),
}));

export const personaSettingsRelations = relations(personaSettings, ({ one }) => ({
  user: one(users, {
    fields: [personaSettings.userId],
    references: [users.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const figuresRelations = relations(figures, ({ many }) => ({
  figureConversations: many(figureConversations),
}));

export const figureConversationsRelations = relations(figureConversations, ({ one, many }) => ({
  user: one(users, {
    fields: [figureConversations.userId],
    references: [users.id],
  }),
  figure: one(figures, {
    fields: [figureConversations.figureId],
    references: [figures.id],
  }),
  messages: many(figureMessages),
}));

export const figureMessagesRelations = relations(figureMessages, ({ one }) => ({
  conversation: one(figureConversations, {
    fields: [figureMessages.conversationId],
    references: [figureConversations.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const upsertUserSchema = createInsertSchema(users);

export const insertPersonaSettingsSchema = createInsertSchema(personaSettings).omit({
  userId: true,
}).extend({
  responseLength: z.number().int().min(0).optional(),
  writePaper: z.boolean().optional(),
  quoteFrequency: z.number().int().min(0).max(50).optional(),
  enhancedMode: z.boolean().optional(),
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertFigureSchema = createInsertSchema(figures).omit({
  createdAt: true,
});

export const insertFigureConversationSchema = createInsertSchema(figureConversations).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertFigureMessageSchema = createInsertSchema(figureMessages).omit({
  id: true,
  createdAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;

export type PersonaSettings = typeof personaSettings.$inferSelect;
export type InsertPersonaSettings = z.infer<typeof insertPersonaSettingsSchema>;

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Figure = typeof figures.$inferSelect;
export type InsertFigure = z.infer<typeof insertFigureSchema>;

export type FigureConversation = typeof figureConversations.$inferSelect;
export type InsertFigureConversation = z.infer<typeof insertFigureConversationSchema>;

export type FigureMessage = typeof figureMessages.$inferSelect;
export type InsertFigureMessage = z.infer<typeof insertFigureMessageSchema>;

export const insertPaperChunkSchema = createInsertSchema(paperChunks).omit({
  id: true,
  createdAt: true,
});

export type PaperChunk = typeof paperChunks.$inferSelect;
export type InsertPaperChunk = z.infer<typeof insertPaperChunkSchema>;
