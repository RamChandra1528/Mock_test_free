import { Clock3 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";

export const formatExamTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
};
export function ExamTimer({
  expectedEndTime,
  serverTime,
  onExpire,
}: {
  expectedEndTime: string;
  serverTime: string;
  onExpire: () => void;
}) {
  const { t } = useLanguage();
  const callback = useRef(onExpire);
  callback.current = onExpire;
  const offset = useRef(new Date(serverTime).getTime() - Date.now());
  const calculate = () =>
    Math.max(
      0,
      Math.ceil(
        (new Date(expectedEndTime).getTime() - (Date.now() + offset.current)) /
          1000,
      ),
    );
  const [seconds, setSeconds] = useState(calculate);
  const expired = useRef(false);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = calculate();
      setSeconds(next);
      if (next === 0 && !expired.current) {
        expired.current = true;
        callback.current();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [expectedEndTime]);
  const tone =
    seconds <= 60
      ? "bg-rose-600 text-white animate-pulse"
      : seconds <= 300
        ? "bg-amber-100 text-amber-900"
        : seconds <= 600
          ? "bg-yellow-50 text-yellow-800"
          : "bg-white/10 text-white";
  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3.5 py-2 font-mono text-sm font-extrabold tabular-nums ${tone}`}
      aria-live={seconds <= 60 ? "assertive" : "off"}
      aria-label={`${seconds} ${t("secondsRemaining")}`}
    >
      <Clock3 className="h-4 w-4" />
      {formatExamTime(seconds)}
    </div>
  );
}
