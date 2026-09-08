import {
  ArrowRight,
  BarChart3,
  Clock3,
  ListChecks,
  RotateCcw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import type { ExamCard as ExamCardType } from "../types";
import { Badge } from "./ui";

export function ExamCard({ exam }: { exam: ExamCardType }) {
  const { language, localize, t } = useLanguage();
  const action =
    exam.attemptStatus === "RESUME" && exam.activeAttemptId
      ? `/student/test/${exam.activeAttemptId}`
      : `/student/exams/${exam.id}`;
  return (
    <article className="card group flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:border-[#baccc3]">
      <div className="h-1.5 bg-forest">
        <div className="h-full w-1/3 bg-lime transition-all duration-500 group-hover:w-2/3" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-3">
          <Badge
            tone={
              exam.difficulty === "EASY"
                ? "green"
                : exam.difficulty === "HARD"
                  ? "red"
                  : "amber"
            }
          >
            {language === "hi"
              ? { EASY: "आसान", MEDIUM: "मध्यम", HARD: "कठिन" }[
                  exam.difficulty
                ]
              : exam.difficulty}
          </Badge>
          <span className="text-xs font-bold text-[#78857e]">
            {localize(exam.category, exam.categoryHi)}
          </span>
        </div>
        <h3 className="mt-4 font-display text-lg font-extrabold leading-snug">
          {localize(exam.title, exam.titleHi)}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#6f7b75]">
          {localize(exam.description, exam.descriptionHi) ||
            (language === "hi"
              ? "आपकी तैयारी को मजबूत करने के लिए बनाया गया एक केंद्रित मॉक टेस्ट।"
              : "A focused mock test designed to strengthen your preparation.")}
        </p>
        <div className="my-5 grid grid-cols-3 gap-2 border-y border-[#ecece6] py-4 text-center">
          <div>
            <ListChecks className="mx-auto h-4 w-4 text-[#759087]" />
            <b className="mt-1 block text-sm">{exam.questionCount}</b>
            <span className="text-[10px] text-[#8b9690]">
              {t("questions")}
            </span>
          </div>
          <div className="border-x border-[#ecece6]">
            <Clock3 className="mx-auto h-4 w-4 text-[#759087]" />
            <b className="mt-1 block text-sm">
              {exam.durationMinutes}{language === "hi" ? " मि" : "m"}
            </b>
            <span className="text-[10px] text-[#8b9690]">
              {t("duration")}
            </span>
          </div>
          <div>
            <BarChart3 className="mx-auto h-4 w-4 text-[#759087]" />
            <b className="mt-1 block text-sm">{exam.totalMarks}</b>
            <span className="text-[10px] text-[#8b9690]">{t("marks")}</span>
          </div>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div>
            {exam.bestScore != null ? (
              <>
                <span className="block text-[10px] font-bold uppercase text-[#8a958f]">
                  {t("bestScore")}
                </span>
                <b className="text-sm text-forest">{exam.bestScore}%</b>
              </>
            ) : (
              <span className="text-xs font-semibold text-[#8a958f]">
                {t("notAttempted")}
              </span>
            )}
          </div>
          <Link to={action} className="btn-primary px-4 py-2.5">
            {exam.attemptStatus === "RESUME" ? (
              <>
                <RotateCcw className="h-4 w-4" />
                {t("resume")}
              </>
            ) : exam.attemptStatus === "COMPLETED" ? (
              <>
                {t("tryAgain")}
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                {t("startTest")}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Link>
        </div>
      </div>
    </article>
  );
}
