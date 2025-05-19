import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 py-6 mt-12">
      <div className="container mx-auto px-4">        
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          جميع الحقوق محفوظة لصالح محمد أحمد 🙂 &copy; {new Date().getFullYear()}
        </div>
      </div>
    </footer>
  );
}
