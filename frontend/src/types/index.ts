export type Role = "ADMIN" | "STUDENT";
export type User = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  preferredLanguage?: "EN" | "HI";
};
export type ExamCard = {
  id: string;
  title: string;
  titleHi?: string | null;
  description?: string;
  descriptionHi?: string | null;
  category: string;
  categoryHi?: string | null;
  subject?: string;
  subjectHi?: string | null;
  durationMinutes: number;
  totalMarks: number;
  negativeMarks: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  questionCount: number;
  attemptsCount: number;
  attemptStatus: "NEW" | "RESUME" | "COMPLETED";
  activeAttemptId?: string;
  bestScore?: number | null;
};
export type AttemptRow = {
  id: string;
  test: string;
  testHi?: string | null;
  attemptNumber: number;
  date: string;
  score: number | null;
  totalMarks: number;
  percentage: number | null;
  accuracy: number | null;
  timeTakenSeconds: number;
  status: string;
  resultAvailable?: boolean;
  reviewAvailable?: boolean;
};
export type Option = {
  id: string;
  label: string;
  text: string;
  textHi?: string | null;
  imageUrl?: string;
};
export type TestQuestion = {
  id: string;
  order: number;
  text: string;
  textHi?: string | null;
  imageUrl?: string;
  sectionId?: string;
  subject?: { name: string; nameHi?: string | null };
  options: Option[];
};
export type SavedAnswer = {
  questionId: string;
  selectedOptionId: string | null;
  markedForReview: boolean;
  visited: boolean;
};
