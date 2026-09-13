import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Loading } from "./components/ui";
import { AppLayout } from "./layouts/AppLayout";
import { GlobalRemindersTicker } from "./components/GlobalRemindersTicker";

const page = <T extends Record<string, React.ComponentType<any>>>(
  loader: () => Promise<T>,
  name: keyof T,
) => lazy(() => loader().then((module) => ({ default: module[name] })));
const LandingPage = page(
  () => import("./pages/public/LandingPage"),
  "LandingPage",
);
const LoginPage = page(() => import("./pages/public/AuthPages"), "LoginPage");
const RegisterPage = page(
  () => import("./pages/public/AuthPages"),
  "RegisterPage",
);
const NotFound = page(() => import("./pages/NotFound"), "NotFound");
const StudentDashboard = page(
  () => import("./pages/student/DashboardPage"),
  "StudentDashboard",
);
const ExamsPage = page(() => import("./pages/student/ExamsPage"), "ExamsPage");
const ExamDetailsPage = page(
  () => import("./pages/student/ExamDetailsPage"),
  "ExamDetailsPage",
);
const TestPage = page(() => import("./pages/student/TestPage"), "TestPage");
const ResultPage = page(
  () => import("./pages/student/ResultPage"),
  "ResultPage",
);
const ReviewPage = page(
  () => import("./pages/student/ReviewPage"),
  "ReviewPage",
);
const AttemptsPage = page(
  () => import("./pages/student/AttemptsPage"),
  "AttemptsPage",
);
const PerformancePage = page(
  () => import("./pages/student/PerformancePage"),
  "PerformancePage",
);
const LeaderboardPage = page(
  () => import("./pages/student/LeaderboardPage"),
  "LeaderboardPage",
);
const ProfilePage = page(
  () => import("./pages/student/ProfilePage"),
  "ProfilePage",
);
const StudentCalendarPage = page(
  () => import("./pages/student/CalendarPage"),
  "StudentCalendarPage",
);
const AdminDashboard = page(
  () => import("./pages/admin/AdminDashboard"),
  "AdminDashboard",
);
const ExamsAdminPage = page(
  () => import("./pages/admin/ExamsAdminPage"),
  "ExamsAdminPage",
);
const ExamFormPage = page(
  () => import("./pages/admin/ExamFormPage"),
  "ExamFormPage",
);
const ExamPreviewPage = page(
  () => import("./pages/admin/ExamPreviewPage"),
  "ExamPreviewPage",
);
const ExamSectionsPage = page(
  () => import("./pages/admin/ExamSectionsPage"),
  "ExamSectionsPage",
);
const QuestionManagementPage = page(
  () => import("./pages/admin/QuestionManagementPage"),
  "QuestionManagementPage",
);
const ImportPage = page(
  () => import("./pages/admin/ImportPages"),
  "ImportPage",
);
const ImportReviewPage = page(
  () => import("./pages/admin/ImportPages"),
  "ImportReviewPage",
);
const StudentsAdminPage = page(
  () => import("./pages/admin/AdminRecordsPages"),
  "StudentsAdminPage",
);
const AttemptsAdminPage = page(
  () => import("./pages/admin/AdminRecordsPages"),
  "AttemptsAdminPage",
);
const AdminAnalyticsPage = page(
  () => import("./pages/admin/AdminRecordsPages"),
  "AdminAnalyticsPage",
);
const CategoriesPage = page(
  () => import("./pages/admin/TaxonomyPages"),
  "CategoriesPage",
);
const SubjectsPage = page(
  () => import("./pages/admin/TaxonomyPages"),
  "SubjectsPage",
);
const AdminSettingsPage = page(
  () => import("./pages/admin/TaxonomyPages"),
  "AdminSettingsPage",
);
const ExamAnalyticsPage = page(
  () => import("./pages/admin/DetailAnalyticsPages"),
  "ExamAnalyticsPage",
);
const StudentDetailPage = page(
  () => import("./pages/admin/DetailAnalyticsPages"),
  "StudentDetailPage",
);
const AdminCalendarPage = page(
  () => import("./pages/admin/CalendarPage"),
  "AdminCalendarPage",
);

export function App() {
  return (
    <Suspense fallback={<Loading label="Loading MockMaster…" />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute role="STUDENT" />}>
          <Route
            path="/student/test/:attemptId"
            element={<StudentTestPage />}
          />
          <Route element={<AppLayout role="STUDENT" />}>
            <Route
              path="/student"
              element={<Navigate to="dashboard" replace />}
            />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/exams" element={<ExamsPage />} />
            <Route path="/student/exams/:id" element={<ExamDetailsPage />} />
            <Route path="/student/result/:attemptId" element={<ResultPage />} />
            <Route
              path="/student/result/:attemptId/review"
              element={<ReviewPage />}
            />
            <Route path="/student/attempts" element={<AttemptsPage />} />
            <Route path="/student/performance" element={<PerformancePage />} />
            <Route path="/student/leaderboard" element={<LeaderboardPage />} />
            <Route path="/student/calendar" element={<StudentCalendarPage />} />
            <Route path="/student/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute role="ADMIN" />}>
          <Route element={<AppLayout role="ADMIN" />}>
            <Route
              path="/admin"
              element={<Navigate to="dashboard" replace />}
            />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/exams" element={<ExamsAdminPage />} />
            <Route path="/admin/exams/create" element={<ExamFormPage />} />
            <Route path="/admin/exams/:id" element={<ExamFormPage />} />
            <Route
              path="/admin/exams/:id/questions"
              element={<QuestionManagementPage />}
            />
            <Route
              path="/admin/exams/:id/preview"
              element={<ExamPreviewPage />}
            />
            <Route
              path="/admin/exams/:id/sections"
              element={<ExamSectionsPage />}
            />
            <Route
              path="/admin/exams/:id/analytics"
              element={<ExamAnalyticsPage />}
            />
            <Route
              path="/admin/questions"
              element={<QuestionManagementPage />}
            />
            <Route path="/admin/import" element={<ImportPage />} />
            <Route
              path="/admin/import/:id/review"
              element={<ImportReviewPage />}
            />
            <Route path="/admin/students" element={<StudentsAdminPage />} />
            <Route path="/admin/students/:id" element={<StudentDetailPage />} />
            <Route path="/admin/attempts" element={<AttemptsAdminPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
            <Route path="/admin/calendar" element={<AdminCalendarPage />} />
            <Route path="/admin/categories" element={<CategoriesPage />} />
            <Route path="/admin/subjects" element={<SubjectsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

function StudentTestPage() {
  return (
    <>
      <GlobalRemindersTicker />
      <TestPage />
    </>
  );
}
