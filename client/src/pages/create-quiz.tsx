import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QuizFormType, quizFormSchema } from "@shared/schema";
import { QuizFormData, QuizFormQuestion } from "@/types/quiz";
import { getQuestionTypeName } from "@/lib/utils";

export default function CreateQuiz() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      duration: 30,
      questions: []
    }
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions"
  });

  const createQuizMutation = useMutation({
    mutationFn: (data: QuizFormType) => {
      return apiRequest('POST', '/api/quizzes', data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "تم إنشاء الاختبار بنجاح",
        description: `رمز الاختبار: ${data.code}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes'] });
      setLocation(`/quiz-admin/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "حدث خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const addQuestion = (type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'ESSAY') => {
    const order = fields.length + 1;
    
    let newQuestion: QuizFormQuestion = {
      text: "",
      type,
      options: type === 'MULTIPLE_CHOICE' ? ["", "", "", ""] : undefined,
      correctAnswer: type === 'ESSAY' ? [] : "",
      order
    };
    
    if (type === 'MULTIPLE_CHOICE') {
      newQuestion.options = ["", "", "", ""];
    }
    
    append(newQuestion);
  };
  
  const onSubmit = (data: QuizFormData) => {
    // تأكد من أن البيانات مكتملة قبل الإرسال
    if (data.questions.length === 0) {
      toast({
        title: "لا يمكن إنشاء اختبار بدون أسئلة",
        description: "الرجاء إضافة سؤال واحد على الأقل",
        variant: "destructive",
      });
      return;
    }
    
    // التأكد من أن جميع الأسئلة لها إجابات
    for (const question of data.questions) {
      if (question.type === "MULTIPLE_CHOICE" && (!question.options || question.options.filter(o => o).length < 2)) {
        toast({
          title: "خطأ في بيانات السؤال",
          description: "يجب أن يحتوي سؤال الاختيار من متعدد على خيارين صالحين على الأقل",
          variant: "destructive",
        });
        return;
      }
      
      if (!question.correctAnswer || 
          (Array.isArray(question.correctAnswer) && question.correctAnswer.length === 0) ||
          (typeof question.correctAnswer === "string" && question.correctAnswer.trim() === "")) {
        toast({
          title: "خطأ في بيانات السؤال",
          description: "يجب تحديد الإجابة الصحيحة لكل سؤال",
          variant: "destructive",
        });
        return;
      }
    }
    
    // تنسيق البيانات بالشكل المطلوب للخادم
    // ملاحظة: رمز الاختبار (code) سيتم توليده في الخادم وليس هنا
    // تنسيق البيانات بشكل متوافق مع متطلبات النمط
    const formattedQuestions = data.questions.map(q => ({
      text: q.text,
      type: q.type,
      options: q.options || undefined, // تحويل null إلى undefined عند الحاجة
      correctAnswer: q.correctAnswer,
      order: q.order
    }));

    createQuizMutation.mutate({
      title: data.title,
      description: data.description,
      category: data.category,
      duration: data.duration,
      questions: formattedQuestions
    });
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="إنشاء اختبار جديد | QuizMe" />
      
      <main className="container mx-auto px-4 py-10 flex-grow">
        <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">إنشاء اختبار جديد</h2>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">معلومات الاختبار</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="block text-gray-700 dark:text-gray-300 mb-2">عنوان الاختبار</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="أدخل عنوان الاختبار" 
                              className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="block text-gray-700 dark:text-gray-300 mb-2">المادة</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary">
                                <SelectValue placeholder="اختر المادة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="رياضيات">رياضيات</SelectItem>
                              <SelectItem value="عربي">عربي</SelectItem>
                              <SelectItem value="انجليزي">انجليزي</SelectItem>
                              <SelectItem value="كيمياء">كيمياء</SelectItem>
                              <SelectItem value="فيزياء">فيزياء</SelectItem>
                              <SelectItem value="احياء">احياء</SelectItem>
                              <SelectItem value="جيولوجيا">جيولوجيا</SelectItem>
                              <SelectItem value="دستور">دستور</SelectItem>
                              <SelectItem value="اجتماعيات">اجتماعيات</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="block text-gray-700 dark:text-gray-300 mb-2">الوقت المخصص (بالدقائق)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="مثال: 30" 
                              className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary" 
                              {...field}
                              onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="block text-gray-700 dark:text-gray-300 mb-2">الوصف</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="وصف مختصر للاختبار" 
                              className="w-full px-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">الأسئلة</h3>
                    <div className="flex space-x-4 space-x-reverse">
                      <Button
                        type="button"
                        onClick={() => addQuestion('TRUE_FALSE')}
                        variant="outline"
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-lg text-sm flex items-center"
                      >
                        <span className="material-icons text-sm ml-1">add</span>
                        صواب وخطأ
                      </Button>
                      <Button
                        type="button"
                        onClick={() => addQuestion('MULTIPLE_CHOICE')}
                        variant="outline"
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-lg text-sm flex items-center"
                      >
                        <span className="material-icons text-sm ml-1">add</span>
                        اختيار من متعدد
                      </Button>
                      <Button
                        type="button"
                        onClick={() => addQuestion('ESSAY')}
                        variant="outline"
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-lg text-sm flex items-center"
                      >
                        <span className="material-icons text-sm ml-1">add</span>
                        سؤال مقالي
                      </Button>
                    </div>
                  </div>
                  
                  {fields.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                      <span className="material-icons text-gray-400 text-4xl mb-2">help_outline</span>
                      <p className="text-gray-500 dark:text-gray-400">لم تقم بإضافة أي أسئلة بعد. اضغط على زر الإضافة لبدء إنشاء اختبارك.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {fields.map((field, index) => {
                        const questionType = form.getValues(`questions.${index}.type`);
                        
                        return (
                          <div key={field.id} className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-semibold text-gray-800 dark:text-white">سؤال {index + 1}: {getQuestionTypeName(questionType)}</h4>
                              <Button
                                type="button"
                                onClick={() => remove(index)}
                                variant="ghost"
                                className="text-gray-500 hover:text-red-500"
                              >
                                <span className="material-icons">delete</span>
                              </Button>
                            </div>
                            
                            <FormField
                              control={form.control}
                              name={`questions.${index}.text`}
                              render={({ field }) => (
                                <FormItem className="mb-3">
                                  <FormControl>
                                    <Input 
                                      placeholder="نص السؤال" 
                                      className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            {questionType === 'TRUE_FALSE' && (
                              <div className="flex space-x-4 space-x-reverse">
                                <FormField
                                  control={form.control}
                                  name={`questions.${index}.correctAnswer`}
                                  render={({ field }) => (
                                    <FormItem className="space-y-3">
                                      <FormControl>
                                        <RadioGroup
                                          onValueChange={field.onChange}
                                          defaultValue={field.value as string}
                                          className="flex space-x-4 space-x-reverse"
                                        >
                                          <div className="flex items-center space-x-2 space-x-reverse">
                                            <RadioGroupItem value="true" id={`q${index}_true`} />
                                            <label
                                              htmlFor={`q${index}_true`}
                                              className="text-gray-700 dark:text-gray-300"
                                            >
                                              صواب
                                            </label>
                                          </div>
                                          <div className="flex items-center space-x-2 space-x-reverse">
                                            <RadioGroupItem value="false" id={`q${index}_false`} />
                                            <label
                                              htmlFor={`q${index}_false`}
                                              className="text-gray-700 dark:text-gray-300"
                                            >
                                              خطأ
                                            </label>
                                          </div>
                                        </RadioGroup>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            )}
                            
                            {questionType === 'MULTIPLE_CHOICE' && (
                              <div className="space-y-3">
                                <FormField
                                  control={form.control}
                                  name={`questions.${index}.correctAnswer`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="block text-gray-700 dark:text-gray-300 mb-1">الإجابة الصحيحة</FormLabel>
                                      <FormControl>
                                        <RadioGroup
                                          onValueChange={field.onChange}
                                          value={field.value as string}
                                          className="space-y-2"
                                        >
                                          {[0, 1, 2, 3].map((optionIndex) => {
                                            const optionValue = form.getValues(`questions.${index}.options.${optionIndex}`) || "";
                                            return (
                                              <div key={optionIndex} className="flex items-center space-x-2 space-x-reverse">
                                                <RadioGroupItem 
                                                  value={optionValue}
                                                  id={`q${index}_option${optionIndex}_radio`}
                                                  className="ml-2"
                                                  disabled={!optionValue.trim()}
                                                />
                                                <label
                                                  htmlFor={`q${index}_option${optionIndex}_radio`}
                                                  className="text-gray-700 dark:text-gray-300 flex-grow"
                                                >
                                                  {optionValue || `الخيار ${optionIndex + 1} (أدخل نص الخيار أولاً)`}
                                                </label>
                                              </div>
                                            );
                                          })}
                                        </RadioGroup>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <h3 className="text-gray-700 dark:text-gray-300 mt-3 mb-2">خيارات السؤال</h3>
                                {[0, 1, 2, 3].map((optionIndex) => (
                                  <div key={`input_${optionIndex}`} className="flex items-center">
                                    <FormField
                                      control={form.control}
                                      name={`questions.${index}.options.${optionIndex}`}
                                      render={({ field }) => (
                                        <FormItem className="flex-grow">
                                          <FormControl>
                                            <Input 
                                              placeholder={`الخيار ${optionIndex + 1}`}
                                              className="flex-grow px-3 py-1 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                              {...field}
                                              onChange={(e) => {
                                                field.onChange(e);
                                                
                                                // تحديث RadioGroup (إعادة تقديم المكون) بعد تغيير قيمة الخيار
                                                form.trigger(`questions.${index}.options.${optionIndex}`);
                                                
                                                // إذا كان هذا الخيار هو الإجابة الصحيحة المختارة، قم بتحديث قيمتها
                                                const currentCorrect = form.getValues(`questions.${index}.correctAnswer`);
                                                const prevValue = field.value;
                                                if (currentCorrect === prevValue) {
                                                  form.setValue(`questions.${index}.correctAnswer`, e.target.value);
                                                }
                                              }}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {questionType === 'ESSAY' && (
                              <div>
                                <FormLabel className="block text-gray-700 dark:text-gray-300 mb-2">الإجابات المقبولة</FormLabel>
                                
                                {form.watch(`questions.${index}.correctAnswer`) && 
                                 typeof form.watch(`questions.${index}.correctAnswer`) !== 'string' && 
                                 Array.isArray(form.watch(`questions.${index}.correctAnswer`)) && 
                                 form.watch(`questions.${index}.correctAnswer`).length > 0 ? (
                                  <div className="space-y-2 mb-3">
                                    {(form.watch(`questions.${index}.correctAnswer`) as string[]).map((_, answerIndex) => (
                                      <div key={answerIndex} className="flex items-center gap-2">
                                        <FormField
                                          control={form.control}
                                          name={`questions.${index}.correctAnswer.${answerIndex}`}
                                          render={({ field }) => (
                                            <FormItem className="flex-grow">
                                              <FormControl>
                                                <Input 
                                                  placeholder={`الإجابة المقبولة ${answerIndex + 1}`}
                                                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                                                  {...field}
                                                />
                                              </FormControl>
                                            </FormItem>
                                          )}
                                        />
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="icon"
                                          onClick={() => {
                                            // للتأكد من أن البيانات حالية قبل التعديل
                                            const currentAnswers = [...form.watch(`questions.${index}.correctAnswer`) as string[]];
                                            currentAnswers.splice(answerIndex, 1);
                                            form.setValue(`questions.${index}.correctAnswer`, currentAnswers);
                                          }}
                                        >
                                          <span className="material-icons">delete</span>
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="mb-2">لم يتم إضافة إجابات بعد</div>
                                )}
                                
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // تحديث مباشر لكائن المصفوفة
                                    const currentValue = form.watch(`questions.${index}.correctAnswer`);
                                    let currentAnswers: string[] = [];
                                    
                                    if (Array.isArray(currentValue)) {
                                      currentAnswers = [...currentValue];
                                    } else if (typeof currentValue === 'string') {
                                      currentAnswers = currentValue ? [currentValue] : [];
                                    }
                                    
                                    // إضافة إجابة جديدة فارغة
                                    currentAnswers.push("");
                                    form.setValue(`questions.${index}.correctAnswer`, currentAnswers);
                                  }}
                                  className="mt-2"
                                >
                                  <span className="material-icons ml-1">add</span>
                                  إضافة إجابة مقبولة
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-4 space-x-reverse">
                  <Button
                    type="button"
                    onClick={() => setLocation('/')}
                    variant="outline"
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={createQuizMutation.isPending}
                    className="px-6 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg"
                  >
                    {createQuizMutation.isPending ? "جاري الحفظ..." : "حفظ الاختبار"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
