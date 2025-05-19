import { nanoid } from "nanoid";
import { 
  users, 
  quizzes, 
  questions, 
  participations, 
  responses,
  type User, 
  type InsertUser, 
  type QuizType, 
  type QuestionType, 
  type ParticipationType, 
  type ResponseType, 
  type InsertQuizType, 
  type InsertQuestionType, 
  type InsertParticipationType, 
  type InsertResponseType 
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Quiz methods
  createQuiz(quiz: InsertQuizType): Promise<QuizType>;
  getQuiz(id: number): Promise<QuizType | undefined>;
  getQuizByCode(code: string): Promise<QuizType | undefined>;
  getQuizzes(): Promise<QuizType[]>;
  getQuizzesByCreator(creatorId: number): Promise<QuizType[]>;
  updateQuiz(id: number, quiz: Partial<InsertQuizType>): Promise<QuizType | undefined>;
  deleteQuiz(id: number): Promise<boolean>;

  // Question methods
  createQuestion(question: InsertQuestionType): Promise<QuestionType>;
  getQuestionsByQuizId(quizId: number): Promise<QuestionType[]>;
  updateQuestion(id: number, question: Partial<InsertQuestionType>): Promise<QuestionType | undefined>;
  deleteQuestion(id: number): Promise<boolean>;

  // Participation methods
  createParticipation(participation: InsertParticipationType): Promise<ParticipationType>;
  getParticipation(id: number): Promise<ParticipationType | undefined>;
  getParticipationsByQuizId(quizId: number): Promise<ParticipationType[]>;
  updateParticipation(id: number, participation: Partial<ParticipationType>): Promise<ParticipationType | undefined>;

  // Response methods
  createResponse(response: InsertResponseType): Promise<ResponseType>;
  getResponsesByParticipationId(participationId: number): Promise<ResponseType[]>;
  updateResponse(id: number, response: Partial<ResponseType>): Promise<ResponseType | undefined>;
  getResponsesByQuizId(quizId: number): Promise<ResponseType[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private quizzes: Map<number, QuizType>;
  private questions: Map<number, QuestionType>;
  private participations: Map<number, ParticipationType>;
  private responses: Map<number, ResponseType>;
  
  private userId: number = 1;
  private quizId: number = 1;
  private questionId: number = 1;
  private participationId: number = 1;
  private responseId: number = 1;

  constructor() {
    this.users = new Map();
    this.quizzes = new Map();
    this.questions = new Map();
    this.participations = new Map();
    this.responses = new Map();
    
    // Add some sample data
    this.addSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Quiz methods
  async createQuiz(insertQuiz: InsertQuizType): Promise<QuizType> {
    const id = this.quizId++;
    const code = nanoid(6);
    const createdAt = new Date();
    // Ensure all required fields are present with defaults if needed
    const quiz: QuizType = { 
      ...insertQuiz, 
      id, 
      code, 
      createdAt,
      description: insertQuiz.description || null,
      category: insertQuiz.category || null,
      duration: insertQuiz.duration || null,
      creatorId: insertQuiz.creatorId || null
    };
    this.quizzes.set(id, quiz);
    return quiz;
  }

  async getQuiz(id: number): Promise<QuizType | undefined> {
    return this.quizzes.get(id);
  }

  async getQuizByCode(code: string): Promise<QuizType | undefined> {
    return Array.from(this.quizzes.values()).find(quiz => quiz.code === code);
  }

  async getQuizzes(): Promise<QuizType[]> {
    return Array.from(this.quizzes.values());
  }

  async getQuizzesByCreator(creatorId: number): Promise<QuizType[]> {
    return Array.from(this.quizzes.values()).filter(
      quiz => quiz.creatorId === creatorId
    );
  }

  async updateQuiz(id: number, quiz: Partial<InsertQuizType>): Promise<QuizType | undefined> {
    const existingQuiz = this.quizzes.get(id);
    
    if (!existingQuiz) {
      return undefined;
    }

    const updatedQuiz = { ...existingQuiz, ...quiz };
    this.quizzes.set(id, updatedQuiz);
    
    return updatedQuiz;
  }

  async deleteQuiz(id: number): Promise<boolean> {
    return this.quizzes.delete(id);
  }

  // Question methods
  async createQuestion(insertQuestion: InsertQuestionType): Promise<QuestionType> {
    const id = this.questionId++;
    // Ensure options is always defined, even if null
    const question: QuestionType = { 
      ...insertQuestion, 
      id,
      options: insertQuestion.options || null 
    };
    this.questions.set(id, question);
    return question;
  }

  async getQuestion(id: number): Promise<QuestionType | undefined> {
    return this.questions.get(id);
  }

  async getQuestionsByQuizId(quizId: number): Promise<QuestionType[]> {
    return Array.from(this.questions.values())
      .filter(question => question.quizId === quizId)
      .sort((a, b) => a.order - b.order);
  }

  async updateQuestion(id: number, question: Partial<InsertQuestionType>): Promise<QuestionType | undefined> {
    const existingQuestion = this.questions.get(id);
    
    if (!existingQuestion) {
      return undefined;
    }

    const updatedQuestion = { ...existingQuestion, ...question };
    this.questions.set(id, updatedQuestion);
    
    return updatedQuestion;
  }

  async deleteQuestion(id: number): Promise<boolean> {
    return this.questions.delete(id);
  }

  // Participation methods
  async createParticipation(insertParticipation: InsertParticipationType): Promise<ParticipationType> {
    const id = this.participationId++;
    const startedAt = new Date();
    const participation: ParticipationType = { 
      ...insertParticipation, 
      id, 
      startedAt,
      score: 0,
      completed: false,
      timeSpent: 0,
      finishedAt: null
    };
    this.participations.set(id, participation);
    return participation;
  }

  async getParticipation(id: number): Promise<ParticipationType | undefined> {
    return this.participations.get(id);
  }

  async getParticipationsByQuizId(quizId: number): Promise<ParticipationType[]> {
    return Array.from(this.participations.values())
      .filter(participation => participation.quizId === quizId);
  }

  async updateParticipation(id: number, participation: Partial<ParticipationType>): Promise<ParticipationType | undefined> {
    const existingParticipation = this.participations.get(id);
    
    if (!existingParticipation) {
      return undefined;
    }

    const updatedParticipation = { ...existingParticipation, ...participation };
    this.participations.set(id, updatedParticipation);
    
    return updatedParticipation;
  }

  // Response methods
  async createResponse(insertResponse: InsertResponseType & { isCorrect?: boolean }): Promise<ResponseType> {
    const id = this.responseId++;
    const response: ResponseType = { 
      ...insertResponse, 
      id,
      isMarkedForReview: insertResponse.isMarkedForReview || false,
      challengeReason: insertResponse.challengeReason || null,
      isCorrect: insertResponse.isCorrect === undefined ? null : insertResponse.isCorrect
    };
    this.responses.set(id, response);
    return response;
  }

  async getResponsesByParticipationId(participationId: number): Promise<ResponseType[]> {
    return Array.from(this.responses.values())
      .filter(response => response.participationId === participationId);
  }

  async updateResponse(id: number, response: Partial<ResponseType>): Promise<ResponseType | undefined> {
    const existingResponse = this.responses.get(id);
    
    if (!existingResponse) {
      return undefined;
    }

    const updatedResponse = { ...existingResponse, ...response };
    this.responses.set(id, updatedResponse);
    
    return updatedResponse;
  }

  async getResponsesByQuizId(quizId: number): Promise<ResponseType[]> {
    const participations = await this.getParticipationsByQuizId(quizId);
    const participationIds = participations.map(p => p.id);
    
    return Array.from(this.responses.values())
      .filter(response => participationIds.includes(response.participationId));
  }

  private addSampleData() {
    // Add sample user
    const user: User = {
      id: this.userId++,
      username: "user1",
      password: "password123"
    };
    this.users.set(user.id, user);
    
    // في هذه النسخة لا نضيف بيانات نموذجية للاختبارات
  }
}

export const storage = new MemStorage();
