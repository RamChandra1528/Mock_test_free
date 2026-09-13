import { Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ExamCard } from "../../components/ExamCard";
import { Empty, ErrorState, Loading } from "../../components/ui";
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
    totalPracticeTimeSeconds: number;
  };
  engagement: {
    points: number;
    currentStreak: number;
    longestStreak: number;
    dailyRewardPoints: number;
  };
  availableExams: ExamCardType[];
  recentAttempts: AttemptRow[];
};

function DashboardMetric({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <article className="flex min-h-[86px] flex-col items-center justify-center rounded-xl border border-[#e0e8ef] bg-white px-3 py-4 text-center shadow-[0_2px_4px_rgba(15,23,42,0.08)]">
      <p className="text-xs font-bold text-[#537095]">{label}</p>
      <p className="mt-1.5 flex items-center justify-center gap-1 font-display text-2xl font-extrabold leading-none text-[#071d3d]">
        {value}
      </p>
    </article>
  );
}

export function StudentDashboard() {
  const { user } = useAuth();
  const { language, localize, t } = useLanguage();
  const copy = dashboardCopy[language];
  const [preparation, setPreparation] = useState("");
  const query = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: () => api.get<Dashboard>("/student/dashboard").then((r) => r.data),
  });
  if (query.isLoading) return <Loading label={copy.loading} />;
  if (query.error) return <ErrorState error={query.error} />;
  const data = query.data!;
  const preparationOptions = [
    ...new Set(data.availableExams.map((exam) => exam.category)),
  ];
  const selectedPreparation = preparationOptions.includes(preparation)
    ? preparation
    : (preparationOptions[0] ?? "");
  const completedAvailableTests = data.availableExams.filter(
    (exam) => exam.attemptStatus === "COMPLETED",
  ).length;
  const completionRate = data.availableExams.length
    ? Math.round((completedAvailableTests / data.availableExams.length) * 100)
    : 0;
  const needsPractice =
    data.stats.testsAttempted === 0 || data.stats.averageAccuracy < 60;
  return (
    <>
      <section className="mb-6 overflow-hidden rounded-[18px] border border-[#e0e8ef] bg-white shadow-[0_2px_4px_rgba(15,23,42,0.08)]">
        <div className="grid gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-center lg:px-7">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#0087d1]">
              {copy.eyebrow}
            </p>
            <h1 className="mt-1.5 font-display text-[25px] font-extrabold tracking-[-.035em] text-[#071d3d] sm:text-[27px]">
              {copy.welcomeBack}, {user?.fullName.split(" ")[0]}
            </h1>
            <div className="mt-4 flex flex-col gap-3 text-sm font-semibold text-[#8094b8] sm:flex-row sm:items-center sm:gap-4">
              <label className="flex flex-wrap items-center gap-2">
                <span>{copy.preparingFor}</span>
                <select
                  value={selectedPreparation}
                  onChange={(event) => setPreparation(event.target.value)}
                  className="h-8 max-w-full rounded-lg border border-[#dce5ef] bg-[#f8fafc] px-3 text-xs font-bold text-[#102c54] outline-none focus:border-[#0087d1] focus:ring-2 focus:ring-[#0087d11a]"
                  aria-label={copy.preparingFor}
                >
                  {preparationOptions.length ? (
                    preparationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))
                  ) : (
                    <option value="">{copy.selectExam}</option>
                  )}
                </select>
              </label>
              <p>
                {copy.examDate}:{" "}
                <span className="font-extrabold text-[#385579]">
                  {copy.notScheduled}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-5 self-stretch border-t border-[#dbe4ee] pt-5 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
            <div className="min-w-[92px] text-center">
              <p className="font-display text-[32px] font-extrabold leading-none text-[#0087d1]">
                —
              </p>
              <p className="mt-2 text-[10px] font-extrabold uppercase tracking-wide text-[#476487]">
                {copy.daysRemaining}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wide text-[#476487]">
                {copy.preparationStatus}
              </p>
              <span
                className={`mt-1.5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold ${needsPractice ? "border-[#ffc6cf] bg-[#fff4f5] text-[#d81742]" : "border-[#bcebd5] bg-[#effbf5] text-[#18724b]"}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${needsPractice ? "bg-[#f12652]" : "bg-[#21a56d]"}`}
                />
                {needsPractice ? copy.needsPractice : copy.onTrack}
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <DashboardMetric
          label={copy.testsCompleted}
          value={data.stats.testsAttempted}
        />
        <DashboardMetric
          label={copy.averageAccuracy}
          value={`${data.stats.averageAccuracy}%`}
        />
        <DashboardMetric
          label={copy.practiceTime}
          value={formatPracticeTime(data.stats.totalPracticeTimeSeconds)}
        />
        <DashboardMetric
          label={copy.completionRate}
          value={`${completionRate}%`}
        />
        <DashboardMetric
          label={copy.highestScore}
          value={data.stats.bestScore}
        />
        <DashboardMetric
          label={copy.currentStreak}
          value={
            <>
              <Flame className="h-6 w-6 fill-[#ff9f00] text-[#ee6500]" />{" "}
              {data.engagement.currentStreak} {copy.days}
            </>
          }
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
          <Empty title={copy.noTests} description={copy.noTestsDescription} />
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
                    <td className="font-bold">{localize(a.test, a.testHi)}</td>
                    <td className="text-[#6e7a74]">{dateLabel(a.date)}</td>
                    <td>
                      <span
                        className={`rounded-lg px-2 py-1 font-extrabold ${a.resultAvailable ? scoreTone(a.percentage ?? 0) : "text-[#6d7973]"}`}
                      >
                        {a.resultAvailable ? `${a.score}/${a.totalMarks}` : "—"}
                      </span>
                    </td>
                    <td>{a.resultAvailable ? `${a.accuracy}%` : "—"}</td>
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

const formatPracticeTime = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours
    ? `${hours} hrs${minutes ? ` ${minutes} min` : ""}`
    : `${minutes} min`;
};

const dashboardCopy = {
  en: {
    loading: "Preparing your dashboard…",
    eyebrow: "Personal dashboard",
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
    noAttemptsDescription: "Your completed tests and results will appear here.",
    firstTest: "Take your first test",
    totalPoints: "Total login points",
    loginStreak: "Daily login streak",
    days: "days",
    viewLeaderboard: "View leaderboard",
    pointsPerDay: "points every login day",
    welcomeBack: "Welcome Back",
    preparingFor: "Preparing for:",
    selectExam: "Select an exam",
    examDate: "Exam date",
    dateToBeAnnounced: "To be announced",
    notScheduled: "Not scheduled",
    daysRemaining: "Days remaining",
    preparationStatus: "Preparation status",
    needsPractice: "Needs more practice",
    onTrack: "On track",
    testsCompleted: "Tests Completed",
    practiceTime: "Practice Time",
    completionRate: "Completion Rate",
    highestScore: "Highest Score",
    currentStreak: "Current Streak",
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
    totalPoints: "कुल लॉगिन अंक",
    loginStreak: "दैनिक लॉगिन स्ट्रीक",
    days: "दिन",
    viewLeaderboard: "लीडरबोर्ड देखें",
    pointsPerDay: "अंक हर लॉगिन दिन",
    welcomeBack:
      "\u0935\u093e\u092a\u0938 \u0906\u092a\u0915\u093e \u0938\u094d\u0935\u093e\u0917\u0924 \u0939\u0948",
    preparingFor: "\u0924\u0948\u092f\u093e\u0930\u0940:",
    selectExam:
      "\u092a\u0930\u0940\u0915\u094d\u0937\u093e \u091a\u0941\u0928\u0947\u0902",
    examDate:
      "\u092a\u0930\u0940\u0915\u094d\u0937\u093e \u0924\u093f\u0925\u093f",
    dateToBeAnnounced:
      "\u091c\u0932\u094d\u0926 \u0918\u094b\u0937\u093f\u0924 \u0939\u094b\u0917\u0940",
    daysRemaining: "\u0936\u0947\u0937 \u0926\u093f\u0928",
    preparationStatus:
      "\u0924\u0948\u092f\u093e\u0930\u0940 \u0915\u0940 \u0938\u094d\u0925\u093f\u0924\u093f",
    needsPractice:
      "\u0905\u092d\u0940 \u0914\u0930 \u0905\u092d\u094d\u092f\u093e\u0938 \u0915\u0940 \u091c\u0930\u0942\u0930\u0924 \u0939\u0948",
    onTrack:
      "\u0906\u092a \u0938\u0939\u0940 \u0930\u093e\u0938\u094d\u0924\u0947 \u092a\u0930 \u0939\u0948\u0902",
    testsCompleted:
      "\u092a\u0942\u0930\u0947 \u0915\u093f\u090f \u0917\u090f \u091f\u0947\u0938\u094d\u091f",
    practiceTime: "\u0905\u092d\u094d\u092f\u093e\u0938 \u0938\u092e\u092f",
    completionRate:
      "\u0938\u092e\u094d\u092a\u0928\u094d\u0928\u0924\u093e \u0926\u0930",
    highestScore:
      "\u0938\u092c\u0938\u0947 \u0905\u0927\u093f\u0915 \u0938\u094d\u0915\u094b\u0930",
    currentStreak:
      "\u0935\u0930\u094d\u0924\u092e\u093e\u0928 \u0938\u094d\u091f\u094d\u0930\u0940\u0915",
    notScheduled:
      "\u0928\u093f\u0930\u094d\u0927\u093e\u0930\u093f\u0924 \u0928\u0939\u0940\u0902 \u0939\u0948",
  },
} as const;
