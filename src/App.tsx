import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Notes from "./pages/Notes";
import Timer from "./pages/Timer";
import Schedule from "./pages/Schedule";
import Subjects from "./pages/Subjects";
import Flashcards from "./pages/Flashcards";
import Coach from "./pages/Coach";
import AIMLRoadmap from "./pages/AIMLRoadmap";
import Gamification from "./pages/Gamification";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks mode="homework" />} />
              <Route path="/exams" element={<Tasks mode="exams" />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/timer" element={<Timer />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/coach" element={<Coach />} />
              <Route path="/aiml-roadmap" element={<AIMLRoadmap />} />
              <Route path="/gamification" element={<Gamification />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
