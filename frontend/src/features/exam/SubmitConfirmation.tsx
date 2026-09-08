import { AlertTriangle } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export type SubmitCounts = {
  answered: number;
  answeredMarked: number;
  notAnswered: number;
  marked: number;
  notVisited: number;
};

export function SubmitConfirmation({
  counts,
  total,
}: {
  counts: SubmitCounts;
  total: number;
}) {
  const { t } = useLanguage();
  return (
    <>
      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle className="mr-2 inline h-5 w-5" />
        {t("answeredSummaryStart")} <b>{counts.answered + counts.answeredMarked}</b>{" "}
        {t("answeredSummaryMiddle")} <b>{total}</b> {t("answeredSummaryEnd")}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {[
          [
            t("answered"),
            counts.answered + counts.answeredMarked,
            "text-emerald-700",
          ],
          [t("notAnswered"), counts.notAnswered, "text-rose-700"],
          [
            t("reviewMarked"),
            counts.marked + counts.answeredMarked,
            "text-violet-700",
          ],
          [t("notVisited"), counts.notVisited, "text-[#637069]"],
        ].map(([label, value, color]) => (
          <div
            className="rounded-xl border border-[#e4e6e0] p-3"
            key={String(label)}
          >
            <p className="text-xs text-[#7b8881]">{label as string}</p>
            <p className={`font-display text-2xl font-extrabold ${color}`}>
              {value as number}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-5 text-[#77847d]">
        {t("submissionReadonly")}
      </p>
    </>
  );
}
