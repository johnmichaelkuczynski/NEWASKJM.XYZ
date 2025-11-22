import {
  users,
  personaSettings,
  goals,
  conversations,
  messages,
  figures,
  figureConversations,
  figureMessages,
  type User,
  type InsertUser,
  type UpsertUser,
  type PersonaSettings,
  type InsertPersonaSettings,
  type Goal,
  type InsertGoal,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Figure,
  type InsertFigure,
  type FigureConversation,
  type InsertFigureConversation,
  type FigureMessage,
  type InsertFigureMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations (Replit Auth integration)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: InsertUser): Promise<User>;
  getCurrentUser(): Promise<User | undefined>;

  // Persona settings operations
  getPersonaSettings(userId: string): Promise<PersonaSettings | undefined>;
  upsertPersonaSettings(
    userId: string,
    settings: InsertPersonaSettings
  ): Promise<PersonaSettings>;

  // Goals operations
  getGoals(userId: string): Promise<Goal[]>;
  createGoal(userId: string, goal: InsertGoal): Promise<Goal>;
  deleteGoal(id: string, userId: string): Promise<void>;

  // Conversation operations
  getCurrentConversation(userId: string): Promise<Conversation | undefined>;
  createConversation(userId: string, conversation: InsertConversation): Promise<Conversation>;

  // Message operations
  getMessages(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: number): Promise<void>;

  // Figure operations
  getAllFigures(): Promise<Figure[]>;
  getFigure(id: string): Promise<Figure | undefined>;
  upsertFigure(figure: InsertFigure): Promise<Figure>;

  // Figure conversation operations
  getFigureConversation(userId: string, figureId: string): Promise<FigureConversation | undefined>;
  createFigureConversation(userId: string, conversation: InsertFigureConversation): Promise<FigureConversation>;

  // Figure message operations
  getFigureMessages(conversationId: string): Promise<FigureMessage[]>;
  createFigureMessage(message: InsertFigureMessage): Promise<FigureMessage>;
  deleteFigureMessages(conversationId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Replit Auth integration
  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getCurrentUser(): Promise<User | undefined> {
    const [user] = await db.select().from(users).limit(1);
    return user || undefined;
  }

  async getPersonaSettings(userId: string): Promise<PersonaSettings | undefined> {
    const [settings] = await db
      .select()
      .from(personaSettings)
      .where(eq(personaSettings.userId, userId));
    return settings || undefined;
  }

  async upsertPersonaSettings(
    userId: string,
    settings: InsertPersonaSettings
  ): Promise<PersonaSettings> {
    const [result] = await db
      .insert(personaSettings)
      .values({ userId, ...settings })
      .onConflictDoUpdate({
        target: personaSettings.userId,
        set: settings,
      })
      .returning();
    return result;
  }

  async getGoals(userId: string): Promise<Goal[]> {
    return db
      .select()
      .from(goals)
      .where(eq(goals.userId, userId))
      .orderBy(desc(goals.createdAt));
  }

  async createGoal(userId: string, goal: InsertGoal): Promise<Goal> {
    const [result] = await db
      .insert(goals)
      .values({ userId, ...goal })
      .returning();
    return result;
  }

  async deleteGoal(id: string, userId: string): Promise<void> {
    await db
      .delete(goals)
      .where(and(eq(goals.id, id), eq(goals.userId, userId)));
  }

  async getCurrentConversation(userId: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt))
      .limit(1);
    return conversation || undefined;
  }

  async createConversation(
    userId: string,
    conversation: InsertConversation
  ): Promise<Conversation> {
    const [result] = await db
      .insert(conversations)
      .values({ userId, ...conversation })
      .returning();
    return result;
  }

  async getMessages(conversationId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(message).returning();
    return result;
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  async getAllFigures(): Promise<Figure[]> {
    return db
      .select()
      .from(figures)
      .orderBy(figures.sortOrder);
  }

  async getFigure(id: string): Promise<Figure | undefined> {
    const [figure] = await db
      .select()
      .from(figures)
      .where(eq(figures.id, id));
    return figure || undefined;
  }

  async upsertFigure(figureData: InsertFigure): Promise<Figure> {
    const [figure] = await db
      .insert(figures)
      .values(figureData)
      .onConflictDoUpdate({
        target: figures.id,
        set: figureData,
      })
      .returning();
    return figure;
  }

  async getFigureConversation(userId: string, figureId: string): Promise<FigureConversation | undefined> {
    const [conversation] = await db
      .select()
      .from(figureConversations)
      .where(
        and(
          eq(figureConversations.userId, userId),
          eq(figureConversations.figureId, figureId)
        )
      )
      .orderBy(desc(figureConversations.createdAt))
      .limit(1);
    return conversation || undefined;
  }

  async createFigureConversation(
    userId: string,
    conversation: InsertFigureConversation
  ): Promise<FigureConversation> {
    const [result] = await db
      .insert(figureConversations)
      .values({ userId, ...conversation })
      .returning();
    return result;
  }

  async getFigureMessages(conversationId: string): Promise<FigureMessage[]> {
    return db
      .select()
      .from(figureMessages)
      .where(eq(figureMessages.conversationId, conversationId))
      .orderBy(figureMessages.createdAt);
  }

  async createFigureMessage(message: InsertFigureMessage): Promise<FigureMessage> {
    const [result] = await db.insert(figureMessages).values(message).returning();
    return result;
  }

  async deleteFigureMessages(conversationId: string): Promise<void> {
    await db.delete(figureMessages).where(eq(figureMessages.conversationId, conversationId));
  }
}

export const storage = new DatabaseStorage();
