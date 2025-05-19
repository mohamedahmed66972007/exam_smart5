import { QuizType } from "@shared/schema";
import { Link } from "wouter";

type QuizCardProps = {
  quiz: QuizType;
  questionCount?: number;
  participantCount?: number;
};

export function QuizCard({ quiz, questionCount = 15, participantCount = 0 }: QuizCardProps) {
  return (
    <div className="quiz-card bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{quiz.title}</h3>
        <span className={`${getCategoryClass(quiz.category || 'أخرى')} text-xs font-medium px-2.5 py-0.5 rounded-full`}>{quiz.category}</span>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{quiz.description}</p>
      <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-4">
        <span className="material-icons text-sm ml-1">help_outline</span>
        <span>{questionCount} سؤال</span>
        <span className="mx-2">•</span>
        <span className="material-icons text-sm ml-1">schedule</span>
        <span>{quiz.duration} دقيقة</span>
      </div>
      <div className="flex justify-between items-center">
        <Link href={`/quiz/${quiz.code}`}>
          <a className="text-primary dark:text-primary-light hover:underline">بدء الاختبار</a>
        </Link>
        <div className="flex items-center">
          <span className="material-icons text-gray-400 ml-1">person</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{participantCount} مشارك</span>
        </div>
      </div>
    </div>
  );
}

function getCategoryClass(category: string) {
  const categories: Record<string, string> = {
    'رياضيات': 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100',
    'علوم': 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100',
    'لغة عربية': 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100',
    'لغة إنجليزية': 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100',
    'اجتماعيات': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100',
    'أخرى': 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100'
  };
  
  return categories[category] || categories['أخرى'];
}
