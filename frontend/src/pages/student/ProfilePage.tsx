import {
  CalendarDays,
  LoaderCircle,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LanguageToggle } from "../../components/LanguageToggle";
import { ErrorState, Loading, PageHeader } from "../../components/ui";
import { api } from "../../lib/api";
import { dateLabel } from "../../lib/format";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useToast } from "../../contexts/ToastContext";
import type { User } from "../../types";
type Profile = {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  preferredLanguage: "EN" | "HI";
  _count: { attempts: number };
};
export function ProfilePage() {
  const [fullName, setFullName] = useState("");
  const qc = useQueryClient();
  const toast = useToast();
  const { login } = useAuth();
  const { language, t } = useLanguage();
  const bi = (english: string, hindi: string) =>
    language === "hi" ? hindi : english;
  const query = useQuery({
    queryKey: ["profile"],
    queryFn: () => api.get<Profile>("/student/profile").then((r) => r.data),
  });
  useEffect(() => {
    if (query.data) setFullName(query.data.fullName);
  }, [query.data]);
  const save = useMutation({
    mutationFn: () =>
      api
        .patch<User>("/student/profile", { fullName })
        .then((response) => response.data),
    onSuccess: (user) => {
      login(user);
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.show(bi("Profile updated", "प्रोफ़ाइल अपडेट हो गई"));
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorState error={query.error} />;
  const p = query.data!;
  return (
    <>
      <PageHeader
        eyebrow={bi("Your profile", "आपकी प्रोफ़ाइल")}
        title={bi("Account details", "खाते का विवरण")}
        description={bi(
          "Your basic MockMaster account information.",
          "आपके MockMaster खाते की मूल जानकारी।",
        )}
      />
      <div className="grid max-w-4xl gap-5 md:grid-cols-[280px_1fr]">
        <div className="card grid place-items-center p-8 text-center">
          <div className="grid h-24 w-24 place-items-center rounded-[2rem] bg-forest font-display text-4xl font-extrabold text-lime">
            {p.fullName.charAt(0)}
          </div>
          <h2 className="mt-5 font-display text-xl font-extrabold">
            {p.fullName}
          </h2>
          <p className="mt-1 text-sm text-[#77847d]">
            {bi("Student account", "विद्यार्थी खाता")}
          </p>
          <span className="mt-5 rounded-full bg-mint px-3 py-1 text-xs font-extrabold text-forest">
            {bi("ACTIVE", "सक्रिय")}
          </span>
        </div>
        <div className="card p-6 sm:p-8">
          <h2 className="font-display text-xl font-extrabold">
            {bi("Personal information", "व्यक्तिगत जानकारी")}
          </h2>
          <form
            className="mt-6 rounded-2xl border border-[#e4e7e0] bg-[#fafbf8] p-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (fullName.trim().length >= 2) save.mutate();
            }}
          >
            <label>
              <span className="label">{bi("Full name", "पूरा नाम")}</span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="input"
                  minLength={2}
                  maxLength={120}
                  required
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
                <button
                  className="btn-primary whitespace-nowrap"
                  disabled={save.isPending || fullName.trim() === p.fullName}
                >
                  {save.isPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {bi("Save", "सहेजें")}
                </button>
              </div>
            </label>
          </form>
          <section className="mt-5 rounded-2xl border border-[#e4e7e0] bg-mint/40 p-4">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-extrabold">
                  {bi("Preferred test language", "पसंदीदा परीक्षा भाषा")}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#68766f]">
                  {t("switchInstantly")}
                </p>
              </div>
              <LanguageToggle />
            </div>
          </section>
          <div className="mt-6 divide-y divide-[#ecece7]">
            {[
              [UserRound, bi("Full name", "पूरा नाम"), p.fullName],
              [Mail, bi("Email address", "ईमेल पता"), p.email],
              [
                CalendarDays,
                bi("Member since", "सदस्यता की तारीख"),
                dateLabel(p.createdAt, language === "hi" ? "hi-IN" : "en-IN"),
              ],
              [
                ShieldCheck,
                bi("Tests on record", "दर्ज टेस्ट"),
                p._count.attempts,
              ],
            ].map(([Icon, label, value]) => {
              const I = Icon as typeof UserRound;
              return (
                <div
                  className="flex items-center gap-4 py-4"
                  key={String(label)}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-forest">
                    <I className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#7f8b85]">
                      {label as string}
                    </p>
                    <p className="mt-0.5 text-sm font-extrabold">
                      {value as React.ReactNode}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
