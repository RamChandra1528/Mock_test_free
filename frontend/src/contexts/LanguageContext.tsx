import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { api } from "../lib/api";
import { useAuth } from "./AuthContext";

export type Language = "en" | "hi";

const STORAGE_KEY = "mockmaster_language";

const copy = {
  language: ["Language", "भाषा"],
  english: ["English", "अंग्रेज़ी"],
  hindi: ["Hindi", "हिन्दी"],
  dashboard: ["Dashboard", "डैशबोर्ड"],
  mockTests: ["Mock Tests", "मॉक टेस्ट"],
  myAttempts: ["My Attempts", "मेरे प्रयास"],
  performance: ["Performance", "प्रदर्शन"],
  profile: ["Profile", "प्रोफ़ाइल"],
  logout: ["Log out", "लॉग आउट"],
  student: ["Student", "विद्यार्थी"],
  question: ["Question", "प्रश्न"],
  questions: ["Questions", "प्रश्न"],
  of: ["of", "में से"],
  liveExam: ["Live examination", "लाइव परीक्षा"],
  attempt: ["Attempt", "प्रयास"],
  saving: ["Saving…", "सहेजा जा रहा है…"],
  allSaved: ["All changes saved", "सभी बदलाव सहेजे गए"],
  submit: ["Submit", "जमा करें"],
  marked: ["MARKED", "चिह्नित"],
  previous: ["Previous", "पिछला"],
  next: ["Next", "अगला"],
  clearResponse: ["Clear response", "उत्तर हटाएँ"],
  markReview: ["Mark for review", "समीक्षा हेतु चिह्नित करें"],
  unmark: ["Unmark", "चिह्न हटाएँ"],
  saveNext: ["Save & next", "सहेजें और आगे जाएँ"],
  reviewSubmit: ["Review & submit", "समीक्षा करके जमा करें"],
  submitTest: ["Submit test", "टेस्ट जमा करें"],
  submitYourTest: ["Submit your test?", "क्या आप टेस्ट जमा करना चाहते हैं?"],
  cancel: ["Cancel", "रद्द करें"],
  submitting: ["Submitting…", "जमा किया जा रहा है…"],
  questionPalette: ["Question palette", "प्रश्न सूची"],
  jumpQuestion: ["Jump to any question", "किसी भी प्रश्न पर जाएँ"],
  closePalette: ["Close question palette", "प्रश्न सूची बंद करें"],
  openPalette: ["Open question palette", "प्रश्न सूची खोलें"],
  statusLegend: ["Status legend", "स्थिति संकेत"],
  answerOptions: ["Answer options", "उत्तर विकल्प"],
  questionIllustration: ["Question illustration", "प्रश्न चित्र"],
  optionIllustration: ["Option illustration", "विकल्प चित्र"],
  notVisited: ["Not visited", "नहीं देखा"],
  answered: ["Answered", "उत्तर दिया"],
  notAnswered: ["Not answered", "उत्तर नहीं दिया"],
  reviewMarked: ["Marked for review", "समीक्षा हेतु चिह्नित"],
  answeredMarked: ["Answered + marked", "उत्तर दिया + चिह्नित"],
  general: ["General", "सामान्य"],
  examInstructions: ["Exam instructions", "परीक्षा निर्देश"],
  duration: ["Duration", "अवधि"],
  marks: ["Marks", "अंक"],
  sections: ["Sections", "खंड"],
  minutes: ["minutes", "मिनट"],
  startTest: ["Start test", "टेस्ट शुरू करें"],
  resume: ["Resume", "जारी रखें"],
  tryAgain: ["Try again", "फिर प्रयास करें"],
  bestScore: ["Best score", "सर्वश्रेष्ठ स्कोर"],
  notAttempted: ["Not attempted", "प्रयास नहीं किया"],
  reviewAnswers: ["Review answers", "उत्तरों की समीक्षा"],
  backResult: ["Back to result", "परिणाम पर वापस जाएँ"],
  explanation: ["Explanation", "व्याख्या"],
  correctAnswer: ["Correct answer", "सही उत्तर"],
  yourAnswer: ["Your answer", "आपका उत्तर"],
  correct: ["Correct", "सही"],
  wrong: ["Wrong", "गलत"],
  unattempted: ["Unattempted", "अनुत्तरित"],
  accuracy: ["Accuracy", "सटीकता"],
  timeTaken: ["Time taken", "लिया गया समय"],
  sectionAnalysis: ["Section-wise analysis", "खंडवार विश्लेषण"],
  viewHistory: ["View attempt history", "प्रयास इतिहास देखें"],
  restoringExam: ["Restoring your exam…", "आपकी परीक्षा पुनः खोली जा रही है…"],
  openingResult: ["Opening result…", "परिणाम खोला जा रहा है…"],
  examSubmitted: ["Exam submitted successfully", "परीक्षा सफलतापूर्वक जमा हो गई"],
  answersSavingWarning: [
    "Some answers are not saved yet. Check your connection and try again",
    "कुछ उत्तर अभी सहेजे नहीं गए हैं। अपना इंटरनेट जाँचें और फिर प्रयास करें",
  ],
  submissionReadonly: [
    "After submission, this attempt becomes read-only and can no longer be changed.",
    "जमा करने के बाद यह प्रयास केवल पढ़ने योग्य होगा और इसे बदला नहीं जा सकेगा।",
  ],
  answeredSummaryStart: ["You have answered", "आपने"],
  answeredSummaryMiddle: ["out of", "में से"],
  answeredSummaryEnd: ["questions.", "प्रश्नों के उत्तर दिए हैं।"],
  secondsRemaining: ["seconds remaining", "सेकंड शेष"],
  switchInstantly: [
    "You can switch language at any time without affecting your answers or timer.",
    "आप अपने उत्तर या टाइमर को प्रभावित किए बिना कभी भी भाषा बदल सकते हैं।",
  ],
} as const;

export type TranslationKey = keyof typeof copy;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
  localize: (
    english?: string | null,
    hindi?: string | null,
  ) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const storedLanguage = (): Language =>
  typeof window !== "undefined" &&
  window.localStorage.getItem(STORAGE_KEY) === "hi"
    ? "hi"
    : "en";

export function localizeText(
  english: string | null | undefined,
  hindi: string | null | undefined,
  language: Language,
) {
  return language === "hi" && hindi?.trim() ? hindi : (english ?? "");
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setCurrentLanguage] = useState<Language>(storedLanguage);
  const preferenceQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!user?.preferredLanguage) return;
    const preferred = user.preferredLanguage === "HI" ? "hi" : "en";
    setCurrentLanguage(preferred);
  }, [user?.id, user?.preferredLanguage]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback(
    (next: Language) => {
      setCurrentLanguage(next);
      if (user?.role !== "STUDENT") return;
      // Serialize preference writes so a slow earlier response can never overwrite
      // the student's latest rapid EN/HI selection on the server.
      preferenceQueue.current = preferenceQueue.current
        .catch(() => undefined)
        .then(async () => {
          await api.patch("/student/profile/language", {
            preferredLanguage: next === "hi" ? "HI" : "EN",
          });
        })
        .catch(() => undefined);
    },
    [user?.id, user?.role],
  );

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key) => copy[key][language === "hi" ? 1 : 0],
      localize: (english, hindi) => localizeText(english, hindi, language),
    }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("LanguageProvider is missing");
  return value;
}
