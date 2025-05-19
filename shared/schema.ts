import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const questionTypes = ["MULTIPLE_CHOICE", "TRUE_FALSE", "ESSAY"] as const;

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  duration: integer("duration"), // in minutes
  creatorId: integer("creator_id").references(() => users.id),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => quizzes.id).notNull(),
  text: text("text").notNull(),
  type: text("type", { enum: questionTypes }).notNull(),
  options: jsonb("options"), // For MULTIPLE_CHOICE questions
  correctAnswer: jsonb("correct_answer").notNull(), // String for TRUE_FALSE and MULTIPLE_CHOICE, array for ESSAY
  order: integer("order").notNull(),
});

export const participations = pgTable("participations", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").references(() => quizzes.id).notNull(),
  participantName: text("participant_name").notNull(),
  score: integer("score"),
  timeSpent: integer("time_spent"), // in seconds
  completed: boolean("completed").default(false),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  finishedAt: timestamp("finished_at"),
});

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  participationId: integer("participation_id").references(() => participations.id).notNull(),
  questionId: integer("question_id").references(() => questions.id).notNull(),
  answer: jsonb("answer").notNull(),
  isCorrect: boolean("is_correct"),
  isMarkedForReview: boolean("is_marked_for_review").default(false),
  challengeReason: text("challenge_reason"),
});

// Insert Schemas
export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertParticipationSchema = createInsertSchema(participations).omit({
  id: true,
  score: true,
  completed: true,
  timeSpent: true,
  finishedAt: true,
  startedAt: true,
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  isCorrect: true,
}).extend({
  isCorrect: z.boolean().optional(),
});

// Types
export type QuizType = typeof quizzes.$inferSelect;
export type InsertQuizType = z.infer<typeof insertQuizSchema>;

export type QuestionType = typeof questions.$inferSelect;
export type InsertQuestionType = z.infer<typeof insertQuestionSchema>;

export type ParticipationType = typeof participations.$inferSelect;
export type InsertParticipationType = z.infer<typeof insertParticipationSchema>;

export type ResponseType = typeof responses.$inferSelect;
export type InsertResponseType = z.infer<typeof insertResponseSchema>;

// Extended schemas for frontend validation
export const quizFormSchema = insertQuizSchema.extend({
  questions: z.array(
    z.object({
      text: z.string().min(1, "نص السؤال مطلوب"),
      type: z.enum(questionTypes),
      options: z.array(z.string()).optional(),
      correctAnswer: z.union([
        z.string(),
        z.array(z.string())
      ]),
      order: z.number()
    })
  ).min(1, "يجب إضافة سؤال واحد على الأقل")
}).omit({ code: true }).extend({ code: z.string().optional() });

export type QuizFormType = z.infer<typeof quizFormSchema>;
