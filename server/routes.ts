import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertQuizSchema, 
  insertQuestionSchema, 
  insertParticipationSchema, 
  insertResponseSchema,
  quizFormSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { generatePdf } from "./utils/pdf-generator";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.get('/api/health', async (req, res) => {
    res.json({ status: 'ok' });
  });

  // Quiz routes
  app.post('/api/quizzes', async (req: Request, res: Response) => {
    try {
      console.log("بيانات الاختبار المستلمة:", JSON.stringify(req.body));
      
      // نحضر البيانات المرسلة
      const data = req.body;
      
      // نجهز رمز فريد للاختبار
      const randomCode = nanoid(6).toUpperCase();
      
      // تجهيز بيانات الاختبار للتخزين
      const quizData = {
        title: data.title,
        description: data.description || "",
        category: data.category || "",
        duration: data.duration || 30,
        creatorId: 1, // نستخدم المستخدم الافتراضي حتى الآن
        code: randomCode
      };
      
      // إنشاء الاختبار في قاعدة البيانات
      const quiz = await storage.createQuiz(quizData);
      
      // إنشاء الأسئلة المرتبطة بالاختبار
      const createdQuestions = [];
      
      if (data.questions && Array.isArray(data.questions)) {
        for (const question of data.questions) {
          const createdQuestion = await storage.createQuestion({
            quizId: quiz.id,
            text: question.text,
            type: question.type,
            options: question.options,
            correctAnswer: question.correctAnswer,
            order: question.order
          });
          
          createdQuestions.push(createdQuestion);
        }
      }
      
      // إرجاع الاختبار مع الأسئلة المنشأة
      res.status(201).json({ ...quiz, questions: createdQuestions });
    } catch (error) {
      console.error("خطأ في إنشاء الاختبار:", error);
      res.status(500).json({ message: "فشل في إنشاء الاختبار، الرجاء المحاولة مرة أخرى" });
    }
  });

  app.get('/api/quizzes', async (req, res) => {
    try {
      const quizzes = await storage.getQuizzes();
      res.json(quizzes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch quizzes" });
    }
  });

  app.get('/api/quizzes/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quiz = await storage.getQuiz(id);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      const questions = await storage.getQuestionsByQuizId(id);
      
      res.json({ ...quiz, questions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  app.get('/api/quizzes/code/:code', async (req, res) => {
    try {
      const code = req.params.code;
      const quiz = await storage.getQuizByCode(code);
      
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      const questions = await storage.getQuestionsByQuizId(quiz.id);
      
      res.json({ ...quiz, questions });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch quiz" });
    }
  });

  // Participation routes
  app.post('/api/participations', async (req, res) => {
    try {
      const participationData = insertParticipationSchema.parse(req.body);
      const participation = await storage.createParticipation(participationData);
      
      res.status(201).json(participation);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error(error);
        res.status(500).json({ message: "Failed to create participation" });
      }
    }
  });

  app.get('/api/quizzes/:quizId/participations', async (req, res) => {
    try {
      const quizId = parseInt(req.params.quizId);
      
      const quiz = await storage.getQuiz(quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      const participations = await storage.getParticipationsByQuizId(quizId);
      
      res.json(participations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch participations" });
    }
  });

  // Response routes
  app.post('/api/responses', async (req, res) => {
    try {
      const responseData = insertResponseSchema.parse(req.body);
      
      // Get question to check correctness
      const question = await storage.getQuestion(responseData.questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Check if the answer is correct
      let isCorrect = false;
      if (question.type === "ESSAY") {
        // For essay questions, check if any correct answer is included
        const correctAnswers = question.correctAnswer as string[];
        const answer = responseData.answer as string;
        
        isCorrect = correctAnswers.some(correctAnswer => 
          answer.toLowerCase().includes(correctAnswer.toLowerCase())
        );
      } else if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
        isCorrect = responseData.answer === question.correctAnswer;
      }
      
      // Save the response with correctness status
      const responseWithCorrectness = {
        participationId: responseData.participationId,
        questionId: responseData.questionId,
        answer: responseData.answer,
        isCorrect,
        isMarkedForReview: responseData.isMarkedForReview || false,
        challengeReason: responseData.challengeReason || null
      };
      
      const response = await storage.createResponse(responseWithCorrectness);
      
      res.status(201).json(response);
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: fromZodError(error).message });
      } else {
        console.error(error);
        res.status(500).json({ message: "Failed to create response" });
      }
    }
  });

  app.put('/api/responses/:id/challenge', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { challengeReason } = req.body;
      
      if (!challengeReason) {
        return res.status(400).json({ message: "Challenge reason is required" });
      }
      
      const response = await storage.updateResponse(id, { challengeReason });
      
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }
      
      res.json(response);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to challenge response" });
    }
  });

  app.get('/api/participations/:participationId/responses', async (req, res) => {
    try {
      const participationId = parseInt(req.params.participationId);
      
      const participation = await storage.getParticipation(participationId);
      if (!participation) {
        return res.status(404).json({ message: "Participation not found" });
      }
      
      const responses = await storage.getResponsesByParticipationId(participationId);
      
      res.json(responses);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });

  // Submit quiz and calculate score
  app.post('/api/participations/:participationId/submit', async (req, res) => {
    try {
      const participationId = parseInt(req.params.participationId);
      const timeSpent = req.body.timeSpent; // in seconds
      
      const participation = await storage.getParticipation(participationId);
      if (!participation) {
        return res.status(404).json({ message: "Participation not found" });
      }
      
      const responses = await storage.getResponsesByParticipationId(participationId);
      
      // Calculate score
      const correctResponses = responses.filter(response => response.isCorrect);
      const score = correctResponses.length;
      
      // Update participation
      const updatedParticipation = await storage.updateParticipation(participationId, {
        score,
        completed: true,
        timeSpent,
        finishedAt: new Date()
      });
      
      res.json({
        participation: updatedParticipation,
        responses,
        totalQuestions: responses.length,
        correctAnswers: correctResponses.length,
        percentage: responses.length > 0 ? (correctResponses.length / responses.length) * 100 : 0
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to submit quiz" });
    }
  });

  // Generate PDF with quiz results
  app.get('/api/participations/:participationId/pdf', async (req, res) => {
    try {
      const participationId = parseInt(req.params.participationId);
      
      const participation = await storage.getParticipation(participationId);
      if (!participation) {
        return res.status(404).json({ message: "Participation not found" });
      }
      
      const quiz = await storage.getQuiz(participation.quizId);
      if (!quiz) {
        return res.status(404).json({ message: "Quiz not found" });
      }
      
      const questions = await storage.getQuestionsByQuizId(quiz.id);
      const responses = await storage.getResponsesByParticipationId(participationId);
      
      // Generate PDF
      const pdfBuffer = await generatePdf({
        quiz,
        participation,
        questions,
        responses
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=quiz-${quiz.code}-results.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
