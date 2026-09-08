import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Check,
  Clock3,
  FileSearch,
  FileUp,
  History,
  Menu,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../../components/Logo";
import { LanguageToggle } from "../../components/LanguageToggle";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";

const features = [
  [
    FileUp,
    "Previous paper import",
    "Turn PDF, DOCX, Excel, CSV, or JSON papers into structured test questions.",
    "पुराने प्रश्नपत्र आयात करें",
    "PDF, DOCX, Excel, CSV या JSON प्रश्नपत्रों को व्यवस्थित टेस्ट प्रश्नों में बदलें।",
  ],
  [
    Clock3,
    "Real exam experience",
    "Practice in a focused CBT interface with a secure server-synced timer.",
    "वास्तविक परीक्षा अनुभव",
    "सुरक्षित सर्वर-सिंक टाइमर वाले केंद्रित CBT इंटरफ़ेस में अभ्यास करें।",
  ],
  [
    Target,
    "Instant results",
    "See your score, accuracy, timing, and section performance the moment you finish.",
    "तुरंत परिणाम",
    "टेस्ट पूरा होते ही अपना स्कोर, सटीकता, समय और खंडवार प्रदर्शन देखें।",
  ],
  [
    BookOpenCheck,
    "Detailed explanations",
    "Review every response alongside the correct answer and a clear explanation.",
    "विस्तृत व्याख्या",
    "हर उत्तर की सही विकल्प और स्पष्ट व्याख्या के साथ समीक्षा करें।",
  ],
  [
    BarChart3,
    "Performance analytics",
    "Track score progression and discover the subjects that need your attention.",
    "प्रदर्शन विश्लेषण",
    "स्कोर की प्रगति देखें और उन विषयों को पहचानें जिन पर ध्यान देना है।",
  ],
  [
    History,
    "Attempt history",
    "Keep every attempt organized and compare improvement across multiple tests.",
    "प्रयास इतिहास",
    "हर प्रयास व्यवस्थित रखें और कई टेस्ट में अपनी प्रगति की तुलना करें।",
  ],
] as const;
const steps = [
  ["Upload previous paper", "पुराना प्रश्नपत्र अपलोड करें"],
  ["Review questions", "प्रश्नों की समीक्षा करें"],
  ["Publish mock test", "मॉक टेस्ट प्रकाशित करें"],
  ["Students take test", "विद्यार्थी टेस्ट दें"],
  ["Get detailed results", "विस्तृत परिणाम पाएँ"],
] as const;

export function LandingPage() {
  const [menu, setMenu] = useState(false);
  const { user } = useAuth();
  const { localize } = useLanguage();
  const dashboard =
    user?.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard";
  return (
    <div className="min-h-screen overflow-hidden bg-cream">
      <header className="relative z-30 border-b border-[#e2e5de] bg-cream/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center px-5 lg:px-8">
          <Logo />
          <nav className="ml-auto hidden items-center gap-8 text-sm font-bold text-[#55635d] md:flex">
            <a href="#features" className="hover:text-forest">
              {localize("Features", "विशेषताएँ")}
            </a>
            <a href="#how" className="hover:text-forest">
              {localize("How it works", "यह कैसे काम करता है")}
            </a>
            <Link to="/login" className="hover:text-forest">
              {localize("Sign in", "साइन इन")}
            </Link>
            <LanguageToggle compact />
            <Link to={user ? dashboard : "/register"} className="btn-primary">
              {user
                ? localize("Open dashboard", "डैशबोर्ड खोलें")
                : localize("Start practicing", "अभ्यास शुरू करें")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
          <button
            className="ml-auto rounded-xl p-2 md:hidden"
            aria-label={localize("Open menu", "मेन्यू खोलें")}
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
        {menu && (
          <nav className="space-y-1 border-t border-[#e2e5de] bg-white p-4 md:hidden">
            <a
              href="#features"
              className="block rounded-xl p-3 font-bold"
              onClick={() => setMenu(false)}
            >
              {localize("Features", "विशेषताएँ")}
            </a>
            <a
              href="#how"
              className="block rounded-xl p-3 font-bold"
              onClick={() => setMenu(false)}
            >
              {localize("How it works", "यह कैसे काम करता है")}
            </a>
            <Link to="/login" className="block rounded-xl p-3 font-bold">
              {localize("Sign in", "साइन इन")}
            </Link>
            <div className="p-2">
              <LanguageToggle />
            </div>
            <Link
              to={user ? dashboard : "/register"}
              className="btn-primary mt-2 w-full"
            >
              {user
                ? localize("Open dashboard", "डैशबोर्ड खोलें")
                : localize("Start practicing", "अभ्यास शुरू करें")}
            </Link>
          </nav>
        )}
      </header>

      <main>
        <section className="noise relative">
          <div className="hero-grid absolute inset-0" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-24 pt-16 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:pb-32 lg:pt-24">
            <div className="self-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cddbd4] bg-white/80 px-3.5 py-2 text-xs font-extrabold text-forest shadow-sm">
                <Sparkles className="h-4 w-4" />
                {localize(
                  "Preparation, made measurable",
                  "तैयारी, अब मापने योग्य",
                )}
              </div>
              <h1 className="max-w-3xl font-display text-[clamp(3.2rem,7vw,6.8rem)] font-extrabold leading-[.91] tracking-[-.065em] text-ink">
                {localize("Practice smarter.", "समझदारी से अभ्यास करें।")}
                <br />
                <span className="relative text-forest">
                  {localize("Perform better.", "बेहतर प्रदर्शन करें।")}
                  <svg
                    className="absolute -bottom-3 left-0 w-full"
                    viewBox="0 0 410 14"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 10C110 1 275 2 407 6"
                      stroke="#c9ed71"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
              </h1>
              <p className="mt-9 max-w-xl text-lg leading-8 text-[#65746d]">
                {localize(
                  "Turn previous-year papers into realistic online mock tests and understand exactly where you can improve.",
                  "पिछले वर्षों के प्रश्नपत्रों को वास्तविक ऑनलाइन मॉक टेस्ट में बदलें और जानें कि आपको कहाँ सुधार करना है।",
                )}
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={user ? dashboard : "/register"}
                  className="btn-lime px-6 py-4 text-base"
                >
                  {localize("Start practicing", "अभ्यास शुरू करें")}
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  to="/login?role=admin"
                  className="btn-secondary px-6 py-4 text-base"
                >
                  {localize("Admin login", "एडमिन लॉगिन")}
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-[#637069]">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  {localize("Instant analysis", "तुरंत विश्लेषण")}
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  {localize("Secure scoring", "सुरक्षित स्कोरिंग")}
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600" />
                  {localize("Resume anytime", "कभी भी जारी रखें")}
                </span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-8 rounded-full bg-lime/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] bg-forest p-4 shadow-[0_40px_100px_rgba(23,63,53,.28)] sm:p-6">
                <div className="mb-5 flex items-center justify-between text-white">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[.2em] text-white/50">
                      {localize("Live practice", "लाइव अभ्यास")}
                    </p>
                    <p className="mt-1 font-display text-lg font-bold">
                      {localize("SSC CGL Mock Test", "SSC CGL मॉक टेस्ट")}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2 font-mono text-sm font-bold">
                    <Clock3 className="mr-2 inline h-4 w-4 text-lime" />
                    00:24:18
                  </div>
                </div>
                <div className="rounded-[1.35rem] bg-white p-5 sm:p-7">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-mint px-3 py-1 text-[10px] font-extrabold uppercase text-forest">
                      {localize("Question 17 of 20", "20 में से प्रश्न 17")}
                    </span>
                    <span className="text-xs font-bold text-[#8b9690]">
                      {localize("Mathematics", "गणित")}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold leading-snug">
                    {localize("What is 25 × 16?", "25 × 16 कितना है?")}
                  </h3>
                  <div className="mt-5 grid gap-2.5">
                    {["A. 350", "B. 375", "C. 400", "D. 425"].map(
                      (option, i) => (
                        <div
                          key={option}
                          className={`rounded-xl border p-3.5 text-sm font-semibold ${i === 2 ? "border-forest bg-mint text-forest" : "border-[#e3e6df] text-[#637069]"}`}
                        >
                          {option}
                        </div>
                      ),
                    )}
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#87928c]">
                      {localize(
                        "16 answered · 2 marked",
                        "16 उत्तर दिए · 2 चिह्नित",
                      )}
                    </span>
                    <span className="rounded-xl bg-forest px-4 py-2.5 text-xs font-bold text-white">
                      {localize("Save & next →", "सहेजें और आगे जाएँ →")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="absolute -right-5 -top-5 hidden rounded-2xl bg-lime p-4 shadow-xl sm:block">
                <ShieldCheck className="h-7 w-7 text-forest" />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <p className="eyebrow">
              {localize("Everything in one place", "सब कुछ एक ही जगह")}
            </p>
            <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <h2 className="max-w-2xl font-display text-4xl font-extrabold tracking-[-.045em] md:text-5xl">
                {localize(
                  "Preparation tools that show you the whole picture.",
                  "तैयारी के साधन जो आपको पूरी तस्वीर दिखाएँ।",
                )}
              </h2>
              <p className="max-w-md text-[#69766f]">
                {localize(
                  "Built for serious students and the teams who create high-quality practice material.",
                  "गंभीर विद्यार्थियों और उच्च गुणवत्ता की अभ्यास सामग्री बनाने वाली टीमों के लिए।",
                )}
              </p>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map(
                ([Icon, title, text, titleHi, textHi], index) => (
                <article
                  key={title}
                  className={`group rounded-3xl border p-7 transition hover:-translate-y-1 hover:shadow-soft ${index === 0 ? "border-forest bg-forest text-white" : "border-[#e6e7e1] bg-[#fbfbf8]"}`}
                >
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl ${index === 0 ? "bg-lime text-forest" : "bg-mint text-forest"}`}
                  >
                    <Icon />
                  </span>
                  <h3 className="mt-8 font-display text-xl font-bold">
                    {localize(title, titleHi)}
                  </h3>
                  <p
                    className={`mt-3 text-sm leading-6 ${index === 0 ? "text-white/65" : "text-[#6c7972]"}`}
                  >
                    {localize(text, textHi)}
                  </p>
                </article>
                ),
              )}
            </div>
          </div>
        </section>

        <section id="how" className="py-24">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="grid gap-14 lg:grid-cols-[.72fr_1.28fr]">
              <div>
                <p className="eyebrow">
                  {localize("A cleaner workflow", "एक सरल कार्यप्रवाह")}
                </p>
                <h2 className="mt-3 font-display text-4xl font-extrabold tracking-[-.045em] md:text-5xl">
                  {localize(
                    "From paper to progress, in five steps.",
                    "प्रश्नपत्र से प्रगति तक, पाँच चरणों में।",
                  )}
                </h2>
                <p className="mt-5 text-[#6c7972]">
                  {localize(
                    "Every imported question stays in review until an admin approves it. Students only see answer keys after submission.",
                    "हर आयातित प्रश्न प्रशासक की मंज़ूरी तक समीक्षा में रहता है। विद्यार्थी उत्तर-कुंजी केवल टेस्ट जमा करने के बाद देखते हैं।",
                  )}
                </p>
              </div>
              <ol className="space-y-3">
                {steps.map(([step, stepHi], i) => (
                  <li
                    key={step}
                    className="group flex items-center gap-5 rounded-2xl border border-[#e2e4dd] bg-white p-5 transition hover:border-forest"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-mint font-display text-sm font-extrabold text-forest">
                      0{i + 1}
                    </span>
                    <span className="font-display text-lg font-bold">
                      {localize(step, stepHi)}
                    </span>
                    <ArrowRight className="ml-auto h-5 w-5 text-[#9ba39f] transition group-hover:translate-x-1 group-hover:text-forest" />
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <div className="noise relative overflow-hidden rounded-[2rem] bg-forest px-6 py-16 text-center text-white sm:px-12">
            <div className="absolute -left-20 -top-28 h-72 w-72 rounded-full border-[45px] border-white/5" />
            <p className="eyebrow !text-lime">
              {localize("Your next score starts here", "आपका अगला स्कोर यहाँ से शुरू होता है")}
            </p>
            <h2 className="relative mt-4 font-display text-4xl font-extrabold tracking-tight md:text-5xl">
              {localize(
                "Ready to test your preparation?",
                "क्या आप अपनी तैयारी जाँचने के लिए तैयार हैं?",
              )}
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-white/65">
              {localize(
                "Take a realistic mock test today and turn every answer into a useful insight.",
                "आज ही एक वास्तविक मॉक टेस्ट दें और हर उत्तर से उपयोगी सीख पाएँ।",
              )}
            </p>
            <Link
              to={user ? dashboard : "/register"}
              className="btn-lime relative mt-8 px-6 py-4 text-base"
            >
              {localize("Explore mock tests", "मॉक टेस्ट देखें")}
              <ArrowRight />
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-[#e0e3dc] px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs font-semibold text-[#7b8881] sm:flex-row">
          <Logo />
          <p>
            {localize(
              "© 2026 MockMaster. Built for focused preparation.",
              "© 2026 MockMaster. केंद्रित तैयारी के लिए बनाया गया।",
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}
