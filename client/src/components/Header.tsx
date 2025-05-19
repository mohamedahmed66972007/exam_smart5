import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface HeaderProps {
  title?: string;
}

export function Header({ title = "اختبارات الكترونية" }: HeaderProps) {
  const { toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center space-x-4 space-x-reverse cursor-pointer">
            <i className="bi bi-mortarboard-fill text-primary-dark dark:text-primary-light text-3xl"></i>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h1>
          </div>
        </Link>
        <div className="flex items-center space-x-4 space-x-reverse">
          {/* زر تسجيل الدخول */}
          <Link href="/login">
            <Button
              variant="ghost"
              className="px-3 py-2 mr-4 hover:bg-gray-100 dark:hover:bg-gray-700 text-primary-dark dark:text-primary-light"
            >
              <i className="bi bi-box-arrow-in-left ml-1"></i>
              تسجيل الدخول
            </Button>
          </Link>
          
          {/* زر تسجيل حساب جديد */}
          <Link href="/register">
            <Button
              variant="outline"
              className="px-3 py-2 border border-primary-dark dark:border-primary-light text-primary-dark dark:text-primary-light hover:bg-primary-light/10"
            >
              <i className="bi bi-person-plus ml-1"></i>
              حساب جديد
            </Button>
          </Link>
          
          {/* زر تبديل الوضع المظلم */}
          <Button
            onClick={toggleTheme}
            variant="ghost"
            size="icon"
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="تبديل الوضع المظلم"
          >
            <i className="bi bi-brightness-high text-gray-600 dark:text-gray-300 text-xl"></i>
          </Button>
        </div>
      </div>
    </header>
  );
}
