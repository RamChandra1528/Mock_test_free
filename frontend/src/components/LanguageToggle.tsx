import { Languages } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export function LanguageToggle({
  dark = false,
  compact = false,
}: {
  dark?: boolean;
  compact?: boolean;
}) {
  const { language, setLanguage, t } = useLanguage();
  return (
    <div
      className={`inline-flex items-center rounded-xl border p-1 ${dark ? "border-white/20 bg-white/10" : "border-[#dce1da] bg-white"}`}
      role="group"
      aria-label={t("language")}
    >
      {!compact && (
        <Languages
          className={`mx-2 h-4 w-4 ${dark ? "text-lime" : "text-forest"}`}
          aria-hidden="true"
        />
      )}
      {(["en", "hi"] as const).map((item) => (
        <button
          key={item}
          type="button"
          title={item === "en" ? t("english") : t("hindi")}
          aria-pressed={language === item}
          aria-label={item === "en" ? t("english") : t("hindi")}
          onClick={() => setLanguage(item)}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-extrabold transition ${
            language === item
              ? dark
                ? "bg-lime text-forest"
                : "bg-forest text-white"
              : dark
                ? "text-white/70 hover:text-white"
                : "text-[#69766f] hover:text-forest"
          }`}
        >
          {compact
            ? item === "en"
              ? "EN"
              : "हि"
            : item === "en"
              ? "English"
              : "हिन्दी"}
        </button>
      ))}
    </div>
  );
}
