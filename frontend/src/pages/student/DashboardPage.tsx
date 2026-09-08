import {
  Award,
  CheckCircle2,
  ClipboardCheck,
  Crosshair,
  Target,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ExamCard } from "../../components/ExamCard";
import {
  Empty,
  ErrorState,
  Loading,
  PageHeader,
  StatCard,
} from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { api } from "../../lib/api";
import { dateLabel, formatTime, scoreTone } from "../../lib/format";
import type { AttemptRow, ExamCard as ExamCardType } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";

type Dashboard = {
  stats: {
    testsAttempted: number;
    averageScore: number;
    bestScore: number;
    averageAccuracy: number;
    totalQuestionsAttempted: number;
  };
  availableExams: ExamCardType[];
  recentAttempts: AttemptRow[];
};
export function StudentDashboard() {
  const { user } = useAuth();
  const { language, localize, t } = useLanguage();
  const copy = dashboardCopy[language];
  const query = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: () => api.get<Dashboard>("/student/dashboard").then((r) => r.data),
  });
  if (query.isLoading) return <Loading label={copy.loading} />;
  if (query.error) return <ErrorState error={query.error} />;
  const data = query.data!;
  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={`${greeting(language)}, ${user?.fullName.split(" ")[0]}`}
        description={copy.description}
        action={
          <Link className="btn-primary" to="/student/exams">
            {copy.explore}
          </Link>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label={copy.testsAttempted}
          value={data.stats.testsAttempted}
          icon={<ClipboardCheck />}
        />
        <StatCard
          label={copy.averageScore}
          value={`${data.stats.averageScore}%`}
          icon={<Target />}
        />
        <StatCard
          label={t("bestScore")}
          value={`${data.stats.bestScore}%`}
          icon={<Award />}
        />
        <StatCard
          label={copy.averageAccuracy}
          value={`${data.stats.averageAccuracy}%`}
          icon={<Crosshair />}
        />
        <StatCard
          label={copy.questionsAnswered}
          value={data.stats.totalQuestionsAttempted}
          icon={<CheckCircle2 />}
        />
      </section>
      <section className="mt-9">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="eyebrow">{copy.keepMoving}</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">
              {copy.availableTests}
            </h2>
          </div>
          <Link
            to="/student/exams"
            className="text-sm font-extrabold text-forest hover:underline"
          >
            {copy.viewAll} →
          </Link>
        </div>
        {data.availableExams.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.availableExams.map((exam) => (
              <ExamCard exam={exam} key={exam.id} />
            ))}
          </div>
        ) : (
          <Empty
            title={copy.noTests}
            description={copy.noTestsDescription}
          />
        )}
      </section>
      <section className="mt-9">
        <div className="mb-4">
          <p className="eyebrow">{copy.activity}</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">
            {copy.recentAttempts}
          </h2>
        </div>
        {data.recentAttempts.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{copy.test}</th>
                  <th>{copy.date}</th>
                  <th>{copy.score}</th>
                  <th>{t("accuracy")}</th>
                  <th>{copy.time}</th>
                  <th>{copy.action}</th>
                </tr>
              </thead>
              <tbody>
                {data.recentAttempts.map((a) => (
                  <tr key={a.id}>
                    <td className="font-bold">
                      {localize(a.test, a.testHi)}
                    </td>
                    <td className="text-[#6e7a74]">{dateLabel(a.date)}</td>
                    <td>
                      <span
                        className={`rounded-lg px-2 py-1 font-extrabold ${scoreTone(a.percentage)}`}
                      >
                        {a.score}/{a.totalMarks}
                      </span>
                    </td>
                    <td>{a.accuracy}%</td>
                    <td>{formatTime(a.timeTakenSeconds)}</td>
                    <td>
                      {a.resultAvailable ? (
                        <Link
                          className="font-extrabold text-forest hover:underline"
                          to={`/student/result/${a.id}`}
                        >
                          {copy.viewResult}
                        </Link>
                      ) : (
                        <span className="text-xs font-bold text-amber-700">
                          {copy.pendingRelease}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={copy.noAttempts}
            description={copy.noAttemptsDescription}
            action={
              <Link to="/student/exams" className="btn-primary">
                {copy.firstTest}
              </Link>
            }
          />
        )}
      </section>
    </>
  );
}
const greeting = (language: "en" | "hi") => {
  const h = new Date().getHours();
  if (language === "hi")
    return h < 12 ? "सुप्रभात" : h < 17 ? "नमस्कार" : "शुभ संध्या";
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

const dashboardCopy = {
  en: {
    loading: "Preparing your dashboard…",
    eyebrow: "Student dashboard",
    description:
      "Here’s a clear view of your preparation and the best place to continue.",
    explore: "Explore mock tests",
    testsAttempted: "Tests attempted",
    averageScore: "Average score",
    averageAccuracy: "Average accuracy",
    questionsAnswered: "Questions answered",
    keepMoving: "Keep moving",
    availableTests: "Available mock tests",
    viewAll: "View all",
    noTests: "No mock tests available yet",
    noTestsDescription:
      "Published exams will appear here as soon as they are ready.",
    activity: "Your activity",
    recentAttempts: "Recent attempts",
    test: "Test",
    date: "Date",
    score: "Score",
    time: "Time",
    action: "Action",
    viewResult: "View result",
    pendingRelease: "Pending release",
    noAttempts: "No attempts yet",
    noAttemptsDescription:
      "Your completed tests and results will appear here.",
    firstTest: "Take your first test",
  },
  hi: {
    loading: "आपका डैशबोर्ड तैयार हो रहा है…",
    eyebrow: "विद्यार्थी डैशबोर्ड",
    description:
      "यहाँ अपनी तैयारी की स्पष्ट स्थिति देखें और सही जगह से अभ्यास जारी रखें।",
    explore: "मॉक टेस्ट देखें",
    testsAttempted: "दिए गए टेस्ट",
    averageScore: "औसत स्कोर",
    averageAccuracy: "औसत सटीकता",
    questionsAnswered: "उत्तर दिए गए प्रश्न",
    keepMoving: "अभ्यास जारी रखें",
    availableTests: "उपलब्ध मॉक टेस्ट",
    viewAll: "सभी देखें",
    noTests: "अभी कोई मॉक टेस्ट उपलब्ध नहीं है",
    noTestsDescription: "प्रकाशित परीक्षाएँ तैयार होते ही यहाँ दिखाई देंगी।",
    activity: "आपकी गतिविधि",
    recentAttempts: "हाल के प्रयास",
    test: "टेस्ट",
    date: "तारीख",
    score: "स्कोर",
    time: "समय",
    action: "कार्रवाई",
    viewResult: "परिणाम देखें",
    pendingRelease: "जारी होना बाकी",
    noAttempts: "अभी कोई प्रयास नहीं",
    noAttemptsDescription: "आपके पूरे किए गए टेस्ट और परिणाम यहाँ दिखाई देंगे।",
    firstTest: "अपना पहला टेस्ट दें",
  },
} as const;
