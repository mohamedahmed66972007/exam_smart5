import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";
import { toast } from "@/hooks/use-toast";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [, setLocation] = useLocation();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password || !confirmPassword) {
      toast({
        title: "خطأ في البيانات",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "خطأ في كلمة المرور",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive",
      });
      return;
    }
    
    setIsRegistering(true);
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "يمكنك الآن تسجيل الدخول",
        });
        setLocation('/login');
      } else {
        const data = await response.json();
        toast({
          title: "فشل إنشاء الحساب",
          description: data.message || "حدث خطأ أثناء التسجيل، يرجى المحاولة مرة أخرى",
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
      setIsRegistering(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="إنشاء حساب جديد | اختبارات الكترونية" />

      <main className="container mx-auto px-4 py-10 flex-grow flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 text-center">إنشاء حساب جديد</h1>
          
          <form onSubmit={handleRegister} className="space-y-6">
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
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                تأكيد كلمة المرور
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-colors"
              disabled={isRegistering}
            >
              {isRegistering ? (
                <>
                  <i className="bi bi-arrow-repeat animate-spin ml-2"></i>
                  جاري إنشاء الحساب...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus ml-2"></i>
                  إنشاء حساب
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              لديك حساب بالفعل؟{" "}
              <button
                onClick={() => setLocation('/login')}
                className="text-primary dark:text-primary-light hover:underline"
              >
                تسجيل الدخول
              </button>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}