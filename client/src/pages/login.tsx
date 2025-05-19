import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoggingIn(true);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        toast({
          title: "تم تسجيل الدخول بنجاح",
          description: "سيتم توجيهك إلى لوحة التحكم",
        });
        setLocation('/');
      } else {
        toast({
          title: "فشل تسجيل الدخول",
          description: data.message || "اسم المستخدم أو كلمة المرور غير صحيحة",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء الاتصال بالخادم، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="تسجيل الدخول | اختبارات الكترونية" />

      <main className="container mx-auto px-4 py-10 flex-grow flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">تسجيل الدخول</h1>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                اسم المستخدم
              </label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                كلمة المرور
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-colors"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <>
                  <i className="bi bi-arrow-repeat animate-spin ml-2"></i>
                  جاري تسجيل الدخول...
                </>
              ) : (
                <>
                  <i className="bi bi-box-arrow-in-left ml-2"></i>
                  تسجيل الدخول
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              ليس لديك حساب؟{" "}
              <button
                onClick={() => setLocation('/register')}
                className="text-primary dark:text-primary-light hover:underline"
              >
                إنشاء حساب جديد
              </button>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
