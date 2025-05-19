import { jsPDF } from "jspdf";
import { QuizType, QuestionType, ParticipationType, ResponseType } from "@shared/schema";

// Add Arabic font support to jsPDF
// This would ideally use a real Arabic font, but for this implementation we are using a CDN approach

interface PDFGeneratorParams {
  quiz: QuizType;
  participation: ParticipationType;
  questions: QuestionType[];
  responses: ResponseType[];
}

export async function generatePdf(params: PDFGeneratorParams): Promise<Buffer> {
  const { quiz, participation, questions, responses } = params;
  
  // Create a new document
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
  try {
    // Load Arabic font
    // Note: In a real implementation, we would add proper font loading here
    doc.addFont("https://fonts.cdnfonts.com/s/19889/Cairo-Regular.woff", "Cairo", "normal");
    doc.addFont("https://fonts.cdnfonts.com/s/19889/Cairo-Bold.woff", "Cairo", "bold");
    
    // Set default font
    doc.setFont("Cairo");
    
    // Set RTL mode for Arabic text
    doc.setR2L(true);
    
    // Add title
    doc.setFontSize(24);
    doc.setFont("Cairo", "bold");
    doc.text(quiz.title, 105, 20, { align: "center" });
    
    // Add participant info
    doc.setFontSize(14);
    doc.text(`اسم المشارك: ${participation.participantName}`, 20, 40);
    
    // Add score
    const percentage = participation.score && questions.length > 0
      ? Math.round((participation.score / questions.length) * 100)
      : 0;
    
    doc.text(`الدرجة: ${participation.score || 0}/${questions.length} (${percentage}%)`, 20, 50);
    
    // Add time info
    const formattedTime = participation.timeSpent
      ? formatTimeSpent(participation.timeSpent)
      : "غير متاح";
    
    doc.text(`الوقت المستغرق: ${formattedTime}`, 20, 60);
    
    // Add date info
    const formattedDate = participation.finishedAt
      ? new Date(participation.finishedAt).toLocaleDateString("ar-SA")
      : new Date().toLocaleDateString("ar-SA");
    
    doc.text(`تاريخ الاختبار: ${formattedDate}`, 20, 70);
    
    // Add horizontal line
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 80, 190, 80);
    
    // Add questions and responses
    let yPosition = 90;
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const response = responses.find(r => r.questionId === question.id);
      
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Question number and text
      doc.setFont("Cairo", "bold");
      doc.setFontSize(12);
      doc.text(`السؤال ${i + 1}: ${question.text}`, 190, yPosition, { align: "right" });
      yPosition += 10;
      
      // Response information
      doc.setFont("Cairo", "normal");
      doc.setFontSize(10);
      
      // Format based on question type
      if (question.type === "TRUE_FALSE" || question.type === "MULTIPLE_CHOICE") {
        // User answer
        doc.text(`إجابتك: ${response?.answer || "لم يتم الإجابة"}`, 190, yPosition, { align: "right" });
        yPosition += 7;
        
        // Correct answer
        doc.text(`الإجابة الصحيحة: ${question.correctAnswer}`, 190, yPosition, { align: "right" });
        yPosition += 7;
        
        // Is correct
        const isCorrect = response?.isCorrect ? "صحيحة ✓" : "خاطئة ✗";
        doc.text(`(${isCorrect})`, 190, yPosition, { align: "right" });
      } else if (question.type === "ESSAY") {
        // User answer
        doc.text(`إجابتك: ${response?.answer || "لم يتم الإجابة"}`, 190, yPosition, { align: "right" });
        yPosition += 7;
        
        // Correct answer hints
        const correctAnswers = question.correctAnswer as string[];
        doc.text(`الإجابات المقبولة تتضمن: ${correctAnswers.join(', ')}`, 190, yPosition, { align: "right" });
        yPosition += 7;
        
        // Is correct
        const isCorrect = response?.isCorrect ? "صحيحة ✓" : "خاطئة ✗";
        doc.text(`(${isCorrect})`, 190, yPosition, { align: "right" });
        
        // Challenge info if present
        if (response?.challengeReason) {
          yPosition += 7;
          doc.text(`تحدي: ${response.challengeReason}`, 190, yPosition, { align: "right" });
        }
      }
      
      yPosition += 15;
    }
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let j = 1; j <= pageCount; j++) {
      doc.setPage(j);
      doc.setFontSize(10);
      doc.text(`الصفحة ${j} من ${pageCount}`, 105, 290, { align: "center" });
      doc.text("QuizMe | منصة الاختبارات", 105, 297, { align: "center" });
    }
    
    // Return the PDF as a Buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    return pdfBuffer;
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("Failed to generate PDF");
  }
}

function formatTimeSpent(timeInSeconds: number): string {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = timeInSeconds % 60;
  return `${minutes} دقيقة و ${seconds} ثانية`;
}
