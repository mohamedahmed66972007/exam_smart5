import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQuizTimer } from "@/hooks/use-quiz-timer";
import { QuizWithQuestions, NavigationItem, QuizNavStatus } from "@/types/quiz";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export default function TakeQuiz() {
  const { code } = useParams<{ code: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [participantName, setParticipantName] = useState("");
  const [isNameEntered, setIsNameEntered] = useState(false);
  const [participationId, setParticipationId] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [navigation, setNavigation] = useState<NavigationItem[]>([]);
  const [confirmingFinish, setConfirmingFinish] = useState(false);

  // Fetch quiz
  const { data: quiz, isLoading } = useQuery<QuizWithQuestions>({
    queryKey: [`/api/quizzes/code/${code}`],
    enabled: !!code
  });

  // Timer setup
  const { formattedTime, isRunning, start, end, getTimeSpent } = useQuizTimer({ 
    duration: quiz?.duration || 30,
    onTimeUp: () => {
      toast({
        title: "انتهى الوقت!",
        description: "لقد انتهى الوقت المحدد للاختبار، سيتم حفظ إجاباتك وإرسالها.",
        variant: "destructive"
      });
      handleFinishQuiz();
    }
  });

  // Setup navigation status
  useEffect(() => {
    if (quiz?.questions) {
      const nav = quiz.questions.map((question) => ({
        id: question.id,
        status: 'unanswered' as QuizNavStatus,
        order: question.order
      }));
      setNavigation(nav);
    }
  }, [quiz]);

  // Start participation
  const startParticipation = useMutation({
    mutationFn: (data: { quizId: number, participantName: string }) => {
      return apiRequest('POST', '/api/participations', data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setParticipationId(data.id);
      start(); // Start the timer
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Submit response
  const submitResponse = useMutation({
    mutationFn: (data: { participationId: number, questionId: number, answer: any }) => {
      return apiRequest('POST', '/api/responses', data);
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ في حفظ الإجابة",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Submit quiz
  const submitQuiz = useMutation({
    mutationFn: (data: { timeSpent: number }) => {
      if (!participationId) throw new Error("No participation ID");
      return apiRequest('POST', `/api/participations/${participationId}/submit`, data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      setLocation(`/quiz-results/${participationId}`);
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ في إرسال الاختبار",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleNameSubmit = () => {
    if (!participantName.trim()) {
      toast({
        title: "الاسم مطلوب",
        description: "يرجى إدخال اسمك قبل بدء الاختبار",
        variant: "destructive"
      });
      return;
    }

    if (!quiz) return;

    setIsNameEntered(true);
    startParticipation.mutate({
      quizId: quiz.id,
      participantName
    });
  };

  const handleAnswerChange = (questionId: number, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Update navigation status
    setNavigation(prev => prev.map(item => 
      item.id === questionId 
        ? { ...item, status: 'answered' as QuizNavStatus } 
        : item
    ));

    // Save answer to backend
    if (participationId) {
      submitResponse.mutate({
        participationId,
        questionId,
        answer
      });
    }
  };

  const handleMarkForReview = (questionId: number) => {
    setNavigation(prev => prev.map(item => 
      item.id === questionId 
        ? { ...item, status: item.status === 'marked' ? (answers[questionId] ? 'answered' : 'unanswered') : 'marked' } 
        : item
    ));
  };

  const navigateToQuestion = (index: number) => {
    if (index >= 0 && quiz?.questions && index < quiz.questions.length) {
      setCurrentQuestionIndex(index);
      // Update current question in navigation
      setNavigation(prev => prev.map((item, idx) => ({
        ...item,
        status: idx === index ? 'current' : item.status === 'current' ? (answers[item.id] ? 'answered' : 'unanswered') : item.status
      })));
    }
  };

  const handleNextQuestion = () => {
    if (quiz?.questions && currentQuestionIndex < quiz.questions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      navigateToQuestion(currentQuestionIndex - 1);
    }
  };

  const handleFinishQuiz = () => {
    if (participationId) {
      end(); // Stop the timer
      submitQuiz.mutate({
        timeSpent: getTimeSpent()
      });
    }
  };

  // If still loading or no quiz, show loading state
  if (isLoading || !quiz) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="جاري التحميل... | QuizMe" />
        <main className="container mx-auto px-4 py-10 flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary m-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">جاري تحميل الاختبار...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Name entry screen
  if (!isNameEntered) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title={`${quiz.title} | QuizMe`} />
        <main className="container mx-auto px-4 py-10 flex-grow">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4">{quiz.title}</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-300">{quiz.description}</p>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="material-icons text-sm align-middle ml-1">help_outline</span>
                  {quiz.questions.length} سؤال
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="material-icons text-sm align-middle ml-1">timer</span>
                  {quiz.duration} دقيقة
                </p>
              </div>

              <div className="mt-6">
                <label className="block text-gray-700 dark:text-gray-300 mb-2">
                  الرجاء إدخال اسمك قبل بدء الاختبار
                </label>
                <Input 
                  type="text"
                  placeholder="اسمك الكامل"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  className="mb-4"
                />
                <Button 
                  onClick={handleNameSubmit} 
                  className="w-full"
                  disabled={startParticipation.isPending}
                >
                  {startParticipation.isPending ? "جاري البدء..." : "بدء الاختبار"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Quiz content
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const navStatus = navigation.find(n => n.id === currentQuestion?.id)?.status || 'current';

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={`${quiz.title} | QuizMe`} />

      <main className="container mx-auto px-4 py-6 flex-grow">
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{quiz.title}</h2>
              <div className="bg-primary bg-opacity-20 text-primary dark:text-primary-light px-4 py-2 rounded-lg flex items-center">
                <span className="material-icons mr-2">timer</span>
                <span>{formattedTime}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm font-medium">
                    سؤال {currentQuestionIndex + 1} من {quiz.questions.length}
                  </span>
                </div>
                <div className="flex space-x-2 space-x-reverse">
                  <Button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                    className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center"
                  >
                    <span>السابق</span>
                  </Button>
                  <Button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === quiz.questions.length - 1}
                    variant="outline"
                    className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center"
                  >
                    <span>التالي</span>
                  </Button>
                </div>
              </div>
            </div>

            {currentQuestion && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">{currentQuestion.text}</h3>

                {currentQuestion.type === 'TRUE_FALSE' && (
                  <div className="space-y-3 mt-6">
                    <RadioGroup 
                      value={answers[currentQuestion.id] || ""} 
                      onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                    >
                      <div className="flex flex-col space-y-3">
                        <label className="block p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">
                          <div className="flex items-center">
                            <RadioGroupItem value="true" className="ml-3" />
                            <span className="text-gray-800 dark:text-white">صواب</span>
                          </div>
                        </label>

                        <label className="block p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">
                          <div className="flex items-center">
                            <RadioGroupItem value="false" className="ml-3" />
                            <span className="text-gray-800 dark:text-white">خطأ</span>
                          </div>
                        </label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-3 mt-6">
                    <RadioGroup 
                      value={answers[currentQuestion.id] || ""} 
                      onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                    >
                      <div className="flex flex-col space-y-3">
                        {currentQuestion.options?.map((option, i) => (
                          <label key={i} className="block p-3 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer">
                            <div className="flex items-center">
                              <RadioGroupItem value={option} className="ml-3" />
                              <span className="text-gray-800 dark:text-white">{option}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {currentQuestion.type === 'ESSAY' && (
                  <div className="mt-6">
                    <Textarea 
                      value={answers[currentQuestion.id] || ""}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="اكتب إجابتك هنا..."
                      className="w-full p-3 min-h-[150px] rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center">
              <Button
                onClick={() => handleMarkForReview(currentQuestion.id)}
                variant="outline"
                className={`flex items-center ${navStatus === 'marked' ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20' : 'text-gray-600 dark:text-gray-400'} hover:underline`}
              >
                <span className="material-icons text-sm ml-1">flag</span>
                {navStatus === 'marked' ? 'إلغاء التحديد' : 'تحديد للمراجعة'}
              </Button>

              <Dialog open={confirmingFinish} onOpenChange={setConfirmingFinish}>
                <DialogTrigger asChild>
                  <Button className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg">
                    إنهاء الاختبار
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>هل أنت متأكد من إنهاء الاختبار؟</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-gray-600 dark:text-gray-300">
                      هل أنت متأكد من رغبتك في إنهاء الاختبار وإرسال إجاباتك؟ لن تتمكن من العودة وتغيير إجاباتك بعد ذلك.
                    </p>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        عدد الأسئلة التي تمت الإجابة عليها: {Object.keys(answers).length} من {quiz.questions.length}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmingFinish(false)}
                    >
                      لا، العودة للاختبار
                    </Button>
                    <Button
                      type="button"
                      onClick={handleFinishQuiz}
                      disabled={submitQuiz.isPending}
                    >
                      {submitQuiz.isPending ? "جاري الإرسال..." : "نعم، إنهاء الاختبار"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Question Navigation */}
        <Card className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">تنقل بين الأسئلة</h3>
            <div className="grid grid-cols-8 gap-2">
              {quiz.questions.map((question, index) => {
                const navItem = navigation.find(n => n.id === question.id);
                let bgColor = 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white';

                if (index === currentQuestionIndex) {
                  bgColor = 'bg-blue-500 text-white';
                } else if (navItem?.status === 'answered') {
                  bgColor = 'bg-green-500 text-white';
                } else if (navItem?.status === 'marked') {
                  bgColor = 'bg-yellow-500 text-white';
                }

                return (
                  <button 
                    key={question.id} 
                    className={`h-10 w-10 rounded-full ${bgColor} flex items-center justify-center`}
                    onClick={() => navigateToQuestion(index)}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap mt-4 gap-4">
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">تمت الإجابة</span>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">السؤال الحالي</span>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">محدد للمراجعة</span>
              </div>
              <div className="flex items-center">
                <div className="h-4 w-4 rounded-full bg-gray-200 dark:bg-gray-700 mr-2"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">لم تتم الإجابة</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
