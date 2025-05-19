import { QuizType, QuestionType, ParticipationType, ResponseType } from "@shared/schema";

export interface QuizWithQuestions extends QuizType {
  questions: QuestionType[];
}

export interface ParticipationWithDetails extends ParticipationType {
  responses?: ResponseType[];
  percentage?: number;
}

export type QuizNavStatus = 'answered' | 'unanswered' | 'current' | 'marked';

export interface NavigationItem {
  id: number;
  status: QuizNavStatus;
  order: number;
}

export interface QuizFormQuestion {
  text: string;
  type: 'TRUE_FALSE' | 'MULTIPLE_CHOICE' | 'ESSAY';
  options?: string[] | undefined;
  correctAnswer: string | string[];
  order: number;
}

export interface QuizFormData {
  title: string;
  description: string;
  category: string;
  duration: number;
  questions: QuizFormQuestion[];
}
