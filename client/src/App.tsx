import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import CreateQuiz from "@/pages/create-quiz";
import TakeQuiz from "@/pages/take-quiz";
import QuizResults from "@/pages/quiz-results";
import QuizAdmin from "@/pages/quiz-admin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/create-quiz" component={CreateQuiz} />
      <Route path="/quiz/:code" component={TakeQuiz} />
      <Route path="/quiz-results/:id" component={QuizResults} />
      <Route path="/quiz-admin/:id" component={QuizAdmin} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
