import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuizWithQuestions, ParticipationWithDetails } from "@/types/quiz";
import { ParticipationType, ResponseType } from "@shared/schema";
import { formatDate, calculateScore, formatTime } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function QuizAdmin() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [viewingParticipationId, setViewingParticipationId] = useState<number | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Fetch quiz data
  const { data: quiz, isLoading: isLoadingQuiz } = useQuery<QuizWithQuestions>({
    queryKey: [`/api/quizzes/${id}`],
  });

  // Fetch participations
  const { data: participations, isLoading: isLoadingParticipations } = useQuery<ParticipationType[]>({
    queryKey: [`/api/quizzes/${id}/participations`],
    enabled: !!id,
  });

  // Fetch response details if viewing a specific participation
  const { data: participationDetails } = useQuery<ParticipationWithDetails>({
    queryKey: [`/api/participations/${viewingParticipationId}/submit`],
    enabled: !!viewingParticipationId,
  });

  const handleEditQuiz = () => {
    // In a real implementation, navigate to edit page
    toast({
      title: "تعديل الاختبار",
      description: "هذه الميزة قيد التطوير",
    });
  };

  const handleCopyQuizLink = () => {
    if (!quiz) return;
    
    const quizUrl = `${window.location.origin}/quiz/${quiz.code}`;
    navigator.clipboard.writeText(quizUrl);
    
    toast({
      title: "تم نسخ الرابط",
      description: "تم نسخ رابط الاختبار إلى الحافظة",
    });
  };

  const handleShareQuiz = () => {
    setShowShareDialog(true);
  };

  const handleViewDetails = (participationId: number) => {
    setViewingParticipationId(participationId);
  };

  const handleCloseDetails = () => {
    setViewingParticipationId(null);
  };

  const handleDownloadAllResults = async () => {
    try {
      toast({
        title: "تحميل النتائج",
        description: "جاري تحميل جميع النتائج...",
      });
      
      // This would be implemented to call an API endpoint that generates a PDF with all results
      const response = await apiRequest('GET', `/api/quizzes/${id}/results-pdf`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz-${id}-all-results.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "حدث خطأ",
        description: "لم نتمكن من تحميل النتائج",
        variant: "destructive",
      });
    }
  };

  const handleExportCsv = () => {
    // This would be implemented to export results to CSV
    toast({
      title: "تصدير إلى CSV",
      description: "هذه الميزة قيد التطوير",
    });
  };

  if (isLoadingQuiz || isLoadingParticipations) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="جاري التحميل... | QuizMe" />
        <main className="container mx-auto px-4 py-10 flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary m-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">جاري تحميل بيانات الاختبار...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="لم يتم العثور على الاختبار | QuizMe" />
        <main className="container mx-auto px-4 py-10 flex-grow">
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <span className="material-icons text-red-500 text-4xl mb-4">error</span>
                <h2 className="text-xl font-bold mb-2">لم يتم العثور على الاختبار</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  لم نتمكن من العثور على هذا الاختبار. ربما تم حذفه أو انتهت صلاحيته.
                </p>
                <Button onClick={() => setLocation('/')}>العودة للصفحة الرئيسية</Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate stats
  const totalParticipants = participations?.length || 0;
  const completedParticipations = participations?.filter(p => p.completed) || [];
  const averageScore = completedParticipations.length > 0
    ? completedParticipations.reduce((acc, p) => acc + (p.score || 0), 0) / completedParticipations.length
    : 0;
  const averagePercentage = quiz.questions.length > 0
    ? (averageScore / quiz.questions.length) * 100
    : 0;
  
  // Calculate average time
  const totalTime = completedParticipations.reduce((acc, p) => acc + (p.timeSpent || 0), 0);
  const averageTime = completedParticipations.length > 0
    ? totalTime / completedParticipations.length
    : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={`إدارة الاختبار: ${quiz.title} | QuizMe`} />
      
      <main className="container mx-auto px-4 py-10 flex-grow">
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <CardContent className="p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">إدارة الاختبار: {quiz.title}</h2>
              <Button
                onClick={handleEditQuiz}
                variant="link"
                className="flex items-center text-primary dark:text-primary-light hover:underline"
              >
                <span className="material-icons text-sm ml-1">edit</span>
                تعديل الاختبار
              </Button>
            </div>
            
            <div className="mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <div className="mb-4 md:mb-0">
                  <p className="text-gray-600 dark:text-gray-300">
                    <span className="font-semibold">رمز الاختبار:</span>
                    <span className="bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded ml-2">{quiz.code}</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    <span className="font-semibold">رابط الاختبار:</span>
                    <a href={`/quiz/${quiz.code}`} className="text-primary dark:text-primary-light hover:underline ml-2">
                      {window.location.origin}/quiz/{quiz.code}
                    </a>
                  </p>
                </div>
                <div className="flex space-x-2 space-x-reverse">
                  <Button
                    onClick={handleCopyQuizLink}
                    variant="outline"
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center"
                  >
                    <span className="material-icons text-sm ml-1">content_copy</span>
                    نسخ الرابط
                  </Button>
                  <Button
                    onClick={handleShareQuiz}
                    className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg flex items-center"
                  >
                    <span className="material-icons text-sm ml-1">share</span>
                    مشاركة
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">نتائج المشاركين</h3>
              
              {totalParticipants === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  <span className="material-icons text-gray-400 text-4xl mb-2">people</span>
                  <p className="text-gray-500 dark:text-gray-400">لم يشارك أحد في هذا الاختبار بعد.</p>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">شارك رمز الاختبار أو الرابط مع المشاركين لبدء الاختبار.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white text-sm leading-normal">
                        <TableHead className="text-right">الاسم</TableHead>
                        <TableHead className="text-center">الدرجة</TableHead>
                        <TableHead className="text-center">النسبة المئوية</TableHead>
                        <TableHead className="text-center">الوقت المستغرق</TableHead>
                        <TableHead className="text-center">تاريخ الإجراء</TableHead>
                        <TableHead className="text-center">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-gray-600 dark:text-gray-300 text-sm">
                      {participations?.map((participation) => {
                        const scorePercentage = quiz.questions.length > 0 
                          ? ((participation.score || 0) / quiz.questions.length) * 100 
                          : 0;
                        
                        return (
                          <TableRow 
                            key={participation.id} 
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <TableCell className="py-3 px-4 text-right">{participation.participantName}</TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              {participation.completed 
                                ? `${participation.score}/${quiz.questions.length}` 
                                : "لم يكمل"}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              {participation.completed 
                                ? `${scorePercentage.toFixed(0)}%` 
                                : "-"}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              {participation.timeSpent 
                                ? formatTime(participation.timeSpent) 
                                : "-"}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              {formatDate(participation.startedAt)}
                            </TableCell>
                            <TableCell className="py-3 px-4 text-center">
                              <Button 
                                variant="link" 
                                className="text-primary dark:text-primary-light hover:underline"
                                onClick={() => handleViewDetails(participation.id)}
                              >
                                التفاصيل
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">إحصائيات الاختبار</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">متوسط الدرجات</h4>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold text-primary dark:text-primary-light">{averagePercentage.toFixed(0)}%</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    متوسط درجات {completedParticipations.length} مشارك
                  </p>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">الأسئلة الأكثر صعوبة</h4>
                  <div className="space-y-2">
                    {/* This would be implemented with actual data in a real application */}
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">لا توجد بيانات كافية</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 dark:text-white mb-2">متوسط وقت الإكمال</h4>
                  <div className="flex items-center">
                    <span className="text-3xl font-bold text-primary dark:text-primary-light">
                      {formatTime(Math.round(averageTime))}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    من أصل {quiz.duration} دقيقة
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button
                onClick={handleDownloadAllResults}
                variant="link"
                className="flex items-center text-primary dark:text-primary-light hover:underline"
                disabled={totalParticipants === 0}
              >
                <span className="material-icons text-sm ml-1">download</span>
                تحميل جميع النتائج (PDF)
              </Button>
              
              <Button
                onClick={handleExportCsv}
                variant="link"
                className="flex items-center text-primary dark:text-primary-light hover:underline"
                disabled={totalParticipants === 0}
              >
                <span className="material-icons text-sm ml-1">table_chart</span>
                تصدير كملف CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />

      {/* Participant Details Dialog */}
      {viewingParticipationId && (
        <Dialog open={!!viewingParticipationId} onOpenChange={() => handleCloseDetails()}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>تفاصيل المشارك</DialogTitle>
            </DialogHeader>
            
            {participationDetails ? (
              <div className="py-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {participationDetails.participantName}
                  </h3>
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">الدرجة:</span> {participationDetails.score}/{quiz.questions.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium">الوقت:</span> {formatTime(participationDetails.timeSpent || 0)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 mt-4">
                  {participationDetails.responses?.map((response) => {
                    const question = quiz.questions.find(q => q.id === response.questionId);
                    if (!question) return null;
                    
                    return (
                      <div 
                        key={response.id}
                        className={`p-3 rounded-lg ${response.isCorrect 
                          ? 'bg-green-50 dark:bg-green-900 dark:bg-opacity-20 border border-green-200 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-900 dark:bg-opacity-20 border border-red-200 dark:border-red-800'
                        }`}
                      >
                        <div className="flex items-start">
                          <span 
                            className={`material-icons ml-2 ${response.isCorrect 
                              ? 'text-green-500 dark:text-green-400' 
                              : 'text-red-500 dark:text-red-400'
                            }`}
                          >
                            {response.isCorrect ? 'check_circle' : 'cancel'}
                          </span>
                          <div>
                            <p className="font-medium">{question.text}</p>
                            <div className="mt-1 text-sm">
                              <p><span className="font-medium">إجابة المشارك:</span> {response.answer}</p>
                              {!response.isCorrect && (
                                <p className="text-green-600 dark:text-green-400">
                                  <span className="font-medium">الإجابة الصحيحة:</span> {
                                    Array.isArray(question.correctAnswer) 
                                      ? question.correctAnswer.join(', ') 
                                      : question.correctAnswer
                                  }
                                </p>
                              )}
                              
                              {response.challengeReason && (
                                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 rounded-md">
                                  <p className="text-yellow-700 dark:text-yellow-300">
                                    <span className="font-medium">طلب مراجعة:</span> {response.challengeReason}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary m-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">جاري تحميل التفاصيل...</p>
              </div>
            )}
            
            <DialogFooter>
              <Button onClick={handleCloseDetails}>إغلاق</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Share Quiz Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>مشاركة الاختبار</DialogTitle>
            <DialogDescription>
              يمكنك مشاركة رابط الاختبار أو رمز الاختبار مع المشاركين.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">رابط الاختبار</h4>
              <div className="flex items-center space-x-2 space-x-reverse">
                <div className="flex-1 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm overflow-auto">
                  {window.location.origin}/quiz/{quiz.code}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyQuizLink}
                >
                  <span className="material-icons text-sm">content_copy</span>
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">رمز الاختبار</h4>
              <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-3xl font-bold tracking-wider">{quiz.code}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                يمكن للمشاركين إدخال هذا الرمز في صفحة "لديك رمز اختبار؟" للوصول إلى الاختبار.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowShareDialog(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
