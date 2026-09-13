import { useQuery } from "@tanstack/react-query";
import { Coins, Flame, Medal, Trophy } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { ErrorState, Loading, PageHeader } from "../../components/ui";
import { useLanguage } from "../../contexts/LanguageContext";
import { api } from "../../lib/api";

type Period = "daily" | "weekly" | "monthly";
type LeaderboardStudent = {
  id: string;
  fullName: string;
  rank: number;
  periodPoints: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  isCurrentUser: boolean;
};
type Leaderboard = {
  period: Period;
  currentUser: LeaderboardStudent | null;
  items: LeaderboardStudent[];
};

const periods: Period[] = ["daily", "weekly", "monthly"];

export function LeaderboardPage() {
  const { language } = useLanguage();
  const copy = leaderboardCopy[language];
  const [searchParams, setSearchParams] = useSearchParams();
  const period = (searchParams.get("period") ?? "weekly") as Period;
  const activePeriod = periods.includes(period) ? period : "weekly";
  const query = useQuery({
    queryKey: ["student-leaderboard", activePeriod],
    queryFn: () =>
      api
        .get<Leaderboard>(`/student/leaderboard?period=${activePeriod}`)
        .then((response) => response.data),
  });

  if (query.isLoading) return <Loading label={copy.loading} />;
  if (query.error) return <ErrorState error={query.error} />;
  const data = query.data!;
  const topThree = data.items.slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />

      <div className="mb-6 flex w-fit gap-1 rounded-2xl border border-[#dfe3dc] bg-white p-1.5 shadow-sm">
        {periods.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setSearchParams({ period: item })}
            className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
              item === activePeriod
                ? "bg-forest text-white shadow-sm"
                : "text-[#6c7972] hover:bg-mint hover:text-forest"
            }`}
          >
            {copy.periods[item]}
          </button>
        ))}
      </div>

      {data.currentUser && (
        <section className="mb-6 grid gap-4 rounded-3xl bg-forest p-5 text-white shadow-lg sm:grid-cols-3 sm:p-6">
          <Metric
            icon={<Trophy />}
            label={copy.yourRank}
            value={`#${data.currentUser.rank}`}
          />
          <Metric
            icon={<Coins />}
            label={copy.periodPoints}
            value={data.currentUser.periodPoints}
          />
          <Metric
            icon={<Flame />}
            label={copy.currentStreak}
            value={`${data.currentUser.currentStreak} ${copy.days}`}
          />
        </section>
      )}

      <section className="mb-7 grid gap-4 md:grid-cols-3">
        {topThree.map((student, index) => (
          <div
            key={student.id}
            className={`card relative overflow-hidden p-5 ${student.isCurrentUser ? "ring-2 ring-lime" : ""}`}
          >
            <div
              className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl ${
                index === 0
                  ? "bg-amber-100 text-amber-700"
                  : index === 1
                    ? "bg-slate-100 text-slate-600"
                    : "bg-orange-100 text-orange-700"
              }`}
            >
              {index === 0 ? <Trophy /> : <Medal />}
            </div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#849089]">
              {copy.rank} #{student.rank}
            </p>
            <h2 className="mt-1 truncate font-display text-xl font-extrabold">
              {student.fullName}
            </h2>
            <p className="mt-4 text-3xl font-extrabold text-forest">
              {student.periodPoints}
              <span className="ml-1 text-sm font-bold text-[#748179]">
                {copy.points}
              </span>
            </p>
            {student.isCurrentUser && (
              <span className="absolute right-4 top-4 rounded-full bg-lime px-2.5 py-1 text-[10px] font-extrabold uppercase text-forest">
                {copy.you}
              </span>
            )}
          </div>
        ))}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[#e4e7e1] px-5 py-4">
          <h2 className="font-display text-xl font-extrabold">{copy.allStudents}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table min-w-[680px]">
            <thead>
              <tr>
                <th>{copy.rank}</th>
                <th>{copy.student}</th>
                <th>{copy.periodPoints}</th>
                <th>{copy.totalPoints}</th>
                <th>{copy.currentStreak}</th>
                <th>{copy.bestStreak}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((student) => (
                <tr
                  key={student.id}
                  className={student.isCurrentUser ? "bg-lime/15" : ""}
                >
                  <td className="font-display text-lg font-extrabold text-forest">
                    #{student.rank}
                  </td>
                  <td className="font-bold">
                    {student.fullName}
                    {student.isCurrentUser && (
                      <span className="ml-2 rounded-full bg-forest px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">
                        {copy.you}
                      </span>
                    )}
                  </td>
                  <td className="font-extrabold">{student.periodPoints}</td>
                  <td>{student.totalPoints}</td>
                  <td>{student.currentStreak} 🔥</td>
                  <td>{student.longestStreak} {copy.days}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10 text-lime">
        {icon}
      </span>
      <div>
        <p className="text-xs font-bold text-white/60">{label}</p>
        <p className="font-display text-2xl font-extrabold">{value}</p>
      </div>
    </div>
  );
}

const leaderboardCopy = {
  en: {
    loading: "Loading leaderboard…",
    eyebrow: "Student rankings",
    title: "Leaderboard",
    description: "Keep your daily streak alive, collect points and climb the rankings.",
    periods: { daily: "Daily", weekly: "Weekly", monthly: "Monthly" },
    yourRank: "Your rank",
    periodPoints: "Period points",
    currentStreak: "Current streak",
    days: "days",
    rank: "Rank",
    points: "points",
    you: "You",
    allStudents: "All students",
    student: "Student",
    totalPoints: "Total points",
    bestStreak: "Best streak",
  },
  hi: {
    loading: "लीडरबोर्ड लोड हो रहा है…",
    eyebrow: "विद्यार्थी रैंकिंग",
    title: "लीडरबोर्ड",
    description: "रोज़ लॉग इन करें, अंक पाएँ और रैंकिंग में आगे बढ़ें।",
    periods: { daily: "दैनिक", weekly: "साप्ताहिक", monthly: "मासिक" },
    yourRank: "आपकी रैंक",
    periodPoints: "इस अवधि के अंक",
    currentStreak: "वर्तमान स्ट्रीक",
    days: "दिन",
    rank: "रैंक",
    points: "अंक",
    you: "आप",
    allStudents: "सभी विद्यार्थी",
    student: "विद्यार्थी",
    totalPoints: "कुल अंक",
    bestStreak: "सर्वश्रेष्ठ स्ट्रीक",
  },
} as const;
