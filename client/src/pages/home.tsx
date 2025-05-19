import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { QuizCard } from "@/components/QuizCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuizType } from "@shared/schema";

export default function Home() {
  const [quizCode, setQuizCode] = useState("");
  const [, setLocation] = useLocation();

  const { data: quizzes, isLoading } = useQuery<QuizType[]>({
    queryKey: ["/api/quizzes"],
  });

  const handleCreateQuiz = () => {
    setLocation("/create-quiz");
  };

  const handleExploreQuizzes = () => {
    // Scroll to recent quizzes section
    document.getElementById("recent-quizzes")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEnterQuiz = () => {
    if (quizCode.trim()) {
      setLocation(`/quiz/${quizCode}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-6 flex-grow">
        {/* Hero Section */}
        <section className="py-12 md:py-20 flex flex-col items-center justify-center text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-800 dark:text-white mb-6">
            أنشئ اختباراتك بسهولة وشاركها مع الآخرين
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl">
            منصة متكاملة لإنشاء ومشاركة الاختبارات بطريقة سهلة وسريعة. يمكنك إنشاء اختبارات متنوعة ومشاركتها مع الطلاب أو المتدربين.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <Button 
              onClick={handleCreateQuiz} 
              className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:scale-105">
              <i className="bi bi-plus-circle-fill ml-2"></i>
              إنشاء اختبار جديد
            </Button>
            <Button 
              onClick={handleExploreQuizzes}
              variant="outline" 
              className="bg-white dark:bg-gray-800 text-primary dark:text-primary-light border border-primary dark:border-primary-light font-bold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all">
              <i className="bi bi-search ml-2"></i>
              استكشاف الاختبارات
            </Button>
          </div>
        </section>

        {/* Quiz Code Entry */}
        <section className="py-8 flex justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">لديك رمز اختبار؟</h2>
            <div className="flex">
              <Input 
                type="text" 
                placeholder="أدخل رمز الاختبار هنا" 
                className="flex-grow px-4 py-3 rounded-r-lg border-t border-b border-r dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleEnterQuiz()}
              />
              <Button 
                onClick={handleEnterQuiz}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-l-lg transition-colors">
                <i className="bi bi-arrow-left"></i>
              </Button>
            </div>
          </div>
        </section>

        {/* Recent Quizzes Section */}
        <section id="recent-quizzes" className="py-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">الاختبارات الحديثة</h2>
            <a href="#" className="text-primary dark:text-primary-light hover:underline flex items-center">
              عرض الكل
              <span className="material-icons text-sm ml-1">chevron_left</span>
            </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              // Loading skeletons
              Array(3).fill(null).map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/5"></div>
                  </div>
                </div>
              ))
            ) : quizzes && quizzes.length > 0 ? (
              quizzes.map(quiz => (
                <QuizCard 
                  key={quiz.id} 
                  quiz={quiz} 
                  questionCount={15} // This would come from API in real impl
                  participantCount={45} // This would come from API in real impl
                />
              ))
            ) : (
              <div className="col-span-3 text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">لا توجد اختبارات متاحة حالياً</p>
                <Button
                  onClick={handleCreateQuiz}
                  variant="link"
                  className="text-primary dark:text-primary-light mt-2"
                >
                  إنشاء اختبار جديد
                </Button>
              </div>
            )}
          </div>
        </section>


      </main>

      <Footer />
    </div>
  );
}
