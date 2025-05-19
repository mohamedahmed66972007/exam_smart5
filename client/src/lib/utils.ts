import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function calculateTimeSpent(startTime: Date, endTime: Date = new Date()): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
}

export function calculateScore(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

export const categoryColors: Record<string, string> = {
  "رياضيات": "blue",
  "علوم": "purple",
  "لغة عربية": "green",
  "لغة إنجليزية": "red",
  "اجتماعيات": "yellow",
  "أخرى": "gray"
};

export function getCategoryStyle(category: string) {
  const color = categoryColors[category] || "gray";
  
  return {
    light: `bg-${color}-100 text-${color}-800`,
    dark: `bg-${color}-900 text-${color}-100`
  };
}

export function getQuestionIcon(type: string) {
  switch (type) {
    case 'TRUE_FALSE':
      return 'rule';
    case 'MULTIPLE_CHOICE':
      return 'ballot';
    case 'ESSAY':
      return 'article';
    default:
      return 'help_outline';
  }
}

export function getQuestionTypeName(type: string) {
  switch (type) {
    case 'TRUE_FALSE':
      return 'صواب وخطأ';
    case 'MULTIPLE_CHOICE':
      return 'اختيار من متعدد';
    case 'ESSAY':
      return 'سؤال مقالي';
    default:
      return 'سؤال';
  }
}
