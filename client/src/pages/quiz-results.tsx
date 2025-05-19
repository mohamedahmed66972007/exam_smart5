import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { ParticipationType, ResponseType, QuestionType, QuizType } from "@shared/schema";
import { calculateScore, formatTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ResultsData {
  participation: ParticipationType;
  totalQuestions: number;
  correctAnswers: number;
  percentage: number;
  responses: ResponseType[];
}

interface QuestionResponseMap {
  question: QuestionType;
  response: ResponseType;
}

export default function QuizResults() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [challengeReason, setChallengeReason] = useState("");
  const [challengeResponseId, setChallengeResponseId] = useState<number | null>(null);

  const { data: resultsData, isLoading: isLoadingResults } = useQuery<ResultsData>({
    queryKey: [`/api/participations/${id}/submit`],
  });

  const { data: quiz, isLoading: isLoadingQuiz } = useQuery<QuizType>({
    queryKey: [`/api/quizzes/${resultsData?.participation.quizId}`],
    enabled: !!resultsData?.participation.quizId,
  });

  const { data: questions, isLoading: isLoadingQuestions } = useQuery<QuestionType[]>({
    queryKey: [`/api/quizzes/${resultsData?.participation.quizId}/questions`],
    enabled: !!resultsData?.participation.quizId,
  });

  const challengeMutation = useMutation({
    mutationFn: (data: { challengeReason: string }) => {
      if (!challengeResponseId) throw new Error("No response ID selected");
      return apiRequest('PUT', `/api/responses/${challengeResponseId}/challenge`, data);
    },
    onSuccess: () => {
      toast({
        title: "تم إرسال التحدي",
        description: "سيتم مراجعة إجابتك من قبل المشرف",
      });
      setChallengeResponseId(null);
      setChallengeReason("");
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const downloadPdfMutation = useMutation({
    mutationFn: () => {
      return apiRequest('GET', `/api/participations/${id}/pdf`);
    },
    onSuccess: async (response) => {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-results-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ في تحميل الملف",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleChallengeSubmit = () => {
    if (!challengeReason.trim()) {
      toast({
        title: "سبب التحدي مطلوب",
        description: "يرجى إدخال سبب التحدي",
        variant: "destructive",
      });
      return;
    }

    challengeMutation.mutate({ challengeReason });
  };

  const handleRetakeQuiz = () => {
    if (quiz) {
      setLocation(`/quiz/${quiz.code}`);
    }
  };

  const handleBackToHome = () => {
    setLocation('/');
  };

  const handleDownloadPDF = () => {
    downloadPdfMutation.mutate();
  };

  if (isLoadingResults || isLoadingQuiz || isLoadingQuestions) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="جاري التحميل... | QuizMe" />
        <main className="container mx-auto px-4 py-10 flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary m-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">جاري تحميل النتائج...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!resultsData || !quiz || !questions) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="نتائج الاختبار | QuizMe" />
        <main className="container mx-auto px-4 py-10 flex-grow">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <span className="material-icons text-red-500 text-4xl mb-4">error</span>
                <h2 className="text-xl font-bold mb-2">لم يتم العثور على النتائج</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  لم نتمكن من العثور على نتائج هذا الاختبار. ربما تم حذفه أو انتهت صلاحيته.
                </p>
                <Button onClick={handleBackToHome}>العودة للصفحة الرئيسية</Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Map questions to responses
  const questionsWithResponses: QuestionResponseMap[] = questions.map(question => {
    const response = resultsData.responses.find(r => r.questionId === question.id);
    return {
      question,
      response: response || {
        id: 0,
        participationId: parseInt(id),
        questionId: question.id,
        answer: "",
        isCorrect: false,
        isMarkedForReview: false,
        challengeReason: null
      }
    };
  });

  const { participation, percentage } = resultsData;
  const formattedTime = participation.timeSpent ? formatTime(participation.timeSpent) : "غير متاح";

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="نتائج الاختبار | QuizMe" />
      
      <main className="container mx-auto px-4 py-10 flex-grow">
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">نتيجة الاختبار</h2>
              <div className="inline-flex items-center justify-center h-32 w-32 rounded-full bg-primary bg-opacity-20 mb-4">
                <span className="text-3xl font-bold text-primary dark:text-primary-light">
                {participation.score !== undefined ? participation.score : 0}/{resultsData.totalQuestions}
              </span>
              </div>
              <p className="text-xl text-gray-600 dark:text-gray-300">الدرجة: {percentage.toFixed(1)}%</p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">الوقت المستغرق: {formattedTime}</p>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">تفاصيل الأسئلة</h3>
              
              <div className="space-y-4">
                {questionsWithResponses.map(({ question, response }) => {
                  const isCorrect = response.isCorrect;
                  const bgColor = isCorrect 
                    ? "bg-green-50 dark:bg-green-900 dark:bg-opacity-20 border border-green-200 dark:border-green-800" 
                    : "bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border border-red-200 dark:border-red-800";
                  const icon = isCorrect 
                    ? "check_circle" 
                    : "cancel";
                  const iconColor = isCorrect 
                    ? "text-green-500 dark:text-green-400" 
                    : "text-red-500 dark:text-red-400";
                  
                  return (
                    <div key={question.id} className={`${bgColor} rounded-lg p-4`}>
                      <div className="flex items-start">
                        <span className={`material-icons ${iconColor} ml-2`}>{icon}</span>
                        <div className="flex-grow">
                          <h4 className="font-semibold text-gray-800 dark:text-white">{question.text}</h4>
                          <p className="text-gray-600 dark:text-gray-300 mt-1">
                            إجابتك: {response?.answer ? String(response.answer) : "لم يتم الإجابة"}
                            {isCorrect && " (صحيحة)"}
                            {!isCorrect && " (خاطئة)"}
                          </p>
                          
                          {!isCorrect && question.type !== 'ESSAY' && (
                            <p className="text-green-600 dark:text-green-400 mt-1">
                              الإجابة الصحيحة: {Array.isArray(question.correctAnswer) 
                                ? question.correctAnswer.join(', ') 
                                : String(question.correctAnswer)}
                            </p>
                          )}
                          
                          {/* For essay questions, offer challenge button */}
                          {!isCorrect && question.type === 'ESSAY' && !response.challengeReason && (
                            <div className="flex justify-end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="link" 
                                    className="mt-2 flex items-center text-primary dark:text-primary-light hover:underline"
                                    onClick={() => setChallengeResponseId(response.id)}
                                  >
                                    <span className="material-icons text-sm ml-1">gavel</span>
                                    طلب مراجعة
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                  <DialogHeader>
                                    <DialogTitle>طلب مراجعة الإجابة</DialogTitle>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                      يرجى توضيح سبب اعتقادك أن إجابتك صحيحة:
                                    </p>
                                    <Textarea 
                                      value={challengeReason}
                                      onChange={(e) => setChallengeReason(e.target.value)}
                                      placeholder="اكتب سبب طلب المراجعة هنا..."
                                      className="w-full min-h-[100px]"
                                    />
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      type="button"
                                      onClick={handleChallengeSubmit}
                                      disabled={challengeMutation.isPending}
                                    >
                                      {challengeMutation.isPending ? "جاري الإرسال..." : "إرسال طلب المراجعة"}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          )}
                          
                          {/* If challenge already submitted */}
                          {response.challengeReason && (
                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                                <span className="font-bold">طلب مراجعة:</span> {response.challengeReason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                className="flex items-center text-primary dark:text-primary-light hover:underline"
                disabled={downloadPdfMutation.isPending}
              >
                <span className="material-icons text-sm ml-1">download</span>
                {downloadPdfMutation.isPending ? "جاري التحميل..." : "تحميل النتيجة كـ PDF"}
              </Button>
              
              <div className="flex space-x-4 space-x-reverse">
                <Button
                  onClick={handleRetakeQuiz}
                  variant="outline"
                  className="px-6 py-2 border border-primary dark:border-primary-light text-primary dark:text-primary-light rounded-lg hover:bg-primary-light hover:bg-opacity-20"
                >
                  إعادة الاختبار
                </Button>
                <Button
                  onClick={handleBackToHome}
                  className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg"
                >
                  العودة للرئيسية
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}

// Using the utility function from lib/utils.ts instead of a local implementation
// to avoid duplicate function declaration
