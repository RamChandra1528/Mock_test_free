import {
  ArrowUpRight,
  Bookmark,
  BookMarked,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  Eye,
  GraduationCap,
  LibraryBig,
  Target,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Badge, Empty, ErrorState, Loading, PageHeader } from "../../components/ui";
import { api } from "../../lib/api";
import { resolveMediaUrl } from "../../lib/media";

type StudyMaterial = {
  id: string;
  title: string;
  description?: string | null;
  exam?: string | null;
  imageUrl?: string | null;
  fileName: string;
  updatedAt: string;
};

const examSyllabus = [
  {
    exam: "SSC JE",
    subtitle: "Junior Engineer - Civil, Electrical & Mechanical",
    pattern: "Paper I: objective screening | Paper II: engineering knowledge",
    topics: [
      "General Intelligence & Reasoning",
      "General Awareness",
      "General Engineering for your discipline",
      "Paper II: core diploma/degree-level engineering concepts",
    ],
  },
  {
    exam: "SSC Scientific Assistant (IMD)",
    subtitle: "Scientific Assistant in India Meteorological Department",
    pattern: "Computer-based test | general abilities + subject knowledge",
    topics: [
      "Reasoning, quantitative aptitude, English and general awareness",
      "General science and computer fundamentals",
      "Physics & mathematics or electronics / computer-science domain topics",
      "Meteorology-related basics when specified in the notification",
    ],
  },
];

const books = [
  {
    title: "SSC JE Previous Years' Solved Papers",
    focus: "Paper familiarity, recurring concepts, time management",
    note: "Choose the latest edition for your engineering branch.",
  },
  {
    title: "Objective General English - S. P. Bakshi",
    focus: "English practice for Scientific Assistant CBT",
    note: "Work through error spotting, vocabulary and comprehension sections.",
  },
  {
    title: "A Modern Approach to Verbal & Non-Verbal Reasoning - R. S. Aggarwal",
    focus: "Reasoning fundamentals and daily speed drills",
    note: "Use selectively after reviewing the latest official syllabus.",
  },
  {
    title: "Lucent's General Knowledge",
    focus: "Static GK and science revision",
    note: "Pair with current-affairs notes from reliable sources.",
  },
];

const studyPlan = [
  ["1. Map", "Choose your branch and divide the official syllabus into weekly blocks."],
  ["2. Build", "Study one core concept daily, then solve 25-40 topic-wise questions with a timer."],
  ["3. Test", "Take one sectional test each week; move to two full mocks per week in the final month."],
  ["4. Review", "Log every wrong answer: concept gap, calculation slip, or time-pressure mistake."],
  ["5. Revise", "Use 1-7-21 day revision: revisit a topic after 1, 7 and 21 days."],
];

export function StudentResourcesPage() {
  const materials = useQuery({
    queryKey: ["study-materials"],
    queryFn: () =>
      api.get<StudyMaterial[]>("/student/materials").then((response) => response.data),
  });
  return (
    <div className="pb-4">
      <PageHeader
        eyebrow="Exam preparation library"
        title="SSC JE & Scientific Assistant resources"
        description="One practical place for your syllabus, cut-off strategy, legal study resources, and an exam-ready routine."
      />

      <section className="relative overflow-hidden rounded-3xl bg-forest px-6 py-7 text-white shadow-soft sm:px-8">
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full border-[28px] border-lime/15" />
        <div className="relative">
          <div>
            <Badge tone="green">Start here</Badge>
            <h2 className="mt-3 max-w-2xl font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
              Prepare with a plan, not a pile of PDFs.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
              Your admin publishes the PDFs for this library. Open any material below without leaving this tab.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Admin book shelf</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">Published books</h2>
          </div>
          <Badge tone="green">PDF viewer</Badge>
        </div>
        {materials.isLoading ? (
          <Loading label="Loading study materials" />
        ) : materials.error ? (
          <ErrorState error={materials.error} />
        ) : materials.data?.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {materials.data.map((material) => (
              <article className="card flex min-h-[420px] flex-col overflow-hidden p-4" key={material.id}>
                <div className="relative h-64 overflow-hidden rounded-2xl bg-[#f4f8f6]">
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-[#e8faf1] px-3 py-1 text-[11px] font-extrabold text-[#17624e] shadow-sm">
                    {material.exam || "General"}
                  </span>
                  <span className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-xl bg-[#effbf5] text-[#17624e] shadow-sm" aria-hidden="true">
                    <Bookmark className="h-4 w-4" />
                  </span>
                  {material.imageUrl ? (
                    <img className="h-full w-full object-contain" src={resolveMediaUrl(material.imageUrl)} alt={`${material.title} cover`} />
                  ) : (
                    <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_110%_100%,#d7f2e3_0,transparent_37%)] px-8 text-center text-[#3e7162]">
                      <div>
                        <FileText className="mx-auto h-14 w-14" />
                        <p className="mt-3 text-sm font-extrabold text-[#155345]">No cover available</p>
                        <p className="mt-1 text-xs leading-5">The document is available in the viewer.</p>
                      </div>
                    </div>
                  )}
                </div>
                <h3 className="mt-4 h-12 overflow-hidden font-display text-[15px] font-extrabold leading-6 text-ink">{material.title}</h3>
                <p className="mt-1 truncate text-sm font-medium text-[#668278]">{material.description || "Internal resource"}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                  <span className="flex items-center gap-2 text-sm font-bold text-[#52766a]"><FileText className="h-5 w-5" /> PDF</span>
                  <Link className="btn-primary !px-4 !py-2.5" to={`/student/resources/${material.id}/viewer`}>
                    <Eye className="h-4 w-4" /> Open in viewer
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="No books published yet" description="Your admin will publish books and preparation PDFs here soon." />
        )}
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-2">
        {examSyllabus.map((item) => (
          <article className="card p-6" key={item.exam}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-forest">
                  <GraduationCap className="h-5 w-5" />
                  <h2 className="font-display text-xl font-extrabold">{item.exam}</h2>
                </div>
                <p className="mt-1 text-sm text-[#6c7973]">{item.subtitle}</p>
              </div>
              <Badge tone="purple">Syllabus guide</Badge>
            </div>
            <p className="mt-5 rounded-xl bg-[#f4f7f5] px-4 py-3 text-xs font-bold text-[#466158]">
              {item.pattern}
            </p>
            <ul className="mt-5 space-y-3">
              {item.topics.map((topic) => (
                <li className="flex gap-3 text-sm text-[#45534c]" key={topic}>
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#4e8a74]" />
                  {topic}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <article className="card overflow-hidden">
          <div className="border-b border-[#e7e9e4] bg-[#fafcf9] px-6 py-5">
            <div className="flex items-center gap-2 text-forest">
              <Target className="h-5 w-5" />
              <h2 className="font-display text-xl font-extrabold">Cut-off strategy</h2>
            </div>
            <p className="mt-1 text-sm text-[#6c7973]">
              Treat cut-offs as a benchmark, not a promise.
            </p>
          </div>
          <div className="space-y-4 p-6 text-sm text-[#45534c]">
            <div className="rounded-xl border border-[#e5e9e4] p-4">
              <p className="font-bold text-ink">SSC JE</p>
              <p className="mt-1 leading-6">Aim to score comfortably above the previous-cycle cut-off for your branch and category. Build accuracy in General Engineering first; it carries the most leverage.</p>
            </div>
            <div className="rounded-xl border border-[#e5e9e4] p-4">
              <p className="font-bold text-ink">Scientific Assistant (IMD)</p>
              <p className="mt-1 leading-6">Set your target after checking the latest notice, category and post-wise results. Protect your score in general sections, then use your domain subject to create separation.</p>
            </div>
            <p className="flex gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Vacancies, normalisation and category rules can change the final cut-off. Always verify the latest official notice and result PDF.
            </p>
          </div>
        </article>

        <article className="card p-6">
          <div className="flex items-center gap-2 text-forest">
            <Clock3 className="h-5 w-5" />
            <h2 className="font-display text-xl font-extrabold">How to study</h2>
          </div>
          <ol className="mt-5 space-y-4">
            {studyPlan.map(([step, description], index) => (
              <li className="flex gap-3" key={step}>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mint text-xs font-extrabold text-forest">{index + 1}</span>
                <p className="text-sm leading-6 text-[#45534c]"><strong className="text-ink">{step}.</strong> {description}</p>
              </li>
            ))}
          </ol>
          <Link className="btn-secondary mt-6 w-full" to="/student/calendar">
            Create your study schedule <ArrowUpRight className="h-4 w-4" />
          </Link>
        </article>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Books & practice</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">Recommended references</h2>
          </div>
          <a className="hidden text-sm font-extrabold text-forest hover:underline sm:inline-flex sm:items-center sm:gap-1" href="https://ssc.gov.in/" rel="noreferrer" target="_blank">
            SSC official notices <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {books.map((book) => (
            <article className="card flex min-h-[205px] flex-col p-5" key={book.title}>
              <BookMarked className="h-5 w-5 text-[#4e8a74]" />
              <h3 className="mt-4 font-display font-extrabold leading-6 text-ink">{book.title}</h3>
              <p className="mt-2 text-xs font-bold text-[#557366]">{book.focus}</p>
              <p className="mt-auto pt-4 text-xs leading-5 text-[#77857e]">{book.note}</p>
            </article>
          ))}
        </div>
        <p className="mt-4 flex gap-2 text-xs leading-5 text-[#708078]">
          <LibraryBig className="mt-0.5 h-4 w-4 shrink-0 text-[#4e8a74]" />
          For copyright and quality, buy or borrow official editions. Your admin can add licensed notes, official notices and original study PDFs to the library above.
        </p>
      </section>
    </div>
  );
}
