import { ArrowLeft, LoaderCircle, Save } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ErrorState, Loading, PageHeader } from "../../components/ui";
import { LanguageToggle } from "../../components/LanguageToggle";
import { useLanguage } from "../../contexts/LanguageContext";
import { useToast } from "../../contexts/ToastContext";
import { api } from "../../lib/api";
import { buildExamPayload, type ExamForm as Form } from "../../features/admin/examPayload";

type Taxonomy = { id: string; name: string; nameHi?: string | null };
const defaults: Form = {
  title: "",
  titleHi: "",
  description: "",
  descriptionHi: "",
  instructions:
    "Read each question carefully. Select the best answer. The test will submit automatically when time expires.",
  instructionsHi: "",
  categoryId: "",
  subjectId: "",
  durationMinutes: 60,
  totalMarks: 100,
  marksPerQuestion: 2,
  negativeMarks: 0.5,
  difficulty: "MEDIUM",
  attemptLimit: "",
  randomizeQuestions: false,
  randomizeOptions: false,
  showResultImmediately: false,
  allowAnswerReview: true,
  requireExplanations: false,
  allowResume: true,
};
export function ExamFormPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const edit = !!id;
  const navigate = useNavigate();
  const toast = useToast();
  const { language, localize } = useLanguage();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<Form>({ defaultValues: defaults });
  const values = watch();
  const taxonomy = useQuery({
    queryKey: ["admin-taxonomy"],
    queryFn: async () => {
      const [c, s] = await Promise.all([
        api.get<Taxonomy[]>("/admin/categories"),
        api.get<Taxonomy[]>("/admin/subjects"),
      ]);
      return { categories: c.data, subjects: s.data };
    },
  });
  const exam = useQuery({
    queryKey: ["admin-exam", id],
    enabled: edit,
    queryFn: () => api.get<Form>(`/admin/exams/${id}`).then((r) => r.data),
  });
  useEffect(() => {
    if (exam.data)
      reset({
        ...buildExamPayload(exam.data),
        titleHi: exam.data.titleHi ?? "",
        descriptionHi: exam.data.descriptionHi ?? "",
        instructionsHi: exam.data.instructionsHi ?? "",
        subjectId: exam.data.subjectId ?? "",
        attemptLimit: exam.data.attemptLimit ?? "",
      });
  }, [exam.data, reset]);
  const save = useMutation({
    mutationFn: (values: Form) => {
      const payload = buildExamPayload(values);
      return edit
        ? api.put(`/admin/exams/${id}`, payload)
        : api.post("/admin/exams", payload);
    },
    onSuccess: (r) => {
      toast.show(edit ? "Exam settings saved" : "Exam created as a draft");
      const returnTo = params.get("returnTo");
      navigate(
        returnTo
          ? `${returnTo}?examId=${r.data.id}`
          : `/admin/exams/${r.data.id}/questions`,
      );
    },
    onError: (e) => toast.show(e.message, "error"),
  });
  if (taxonomy.isLoading || exam.isLoading) return <Loading />;
  if (taxonomy.error || exam.error)
    return <ErrorState error={taxonomy.error ?? exam.error} />;
  return (
    <>
      <Link
        to="/admin/exams"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#6c7973]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to exams
      </Link>
      <PageHeader
        eyebrow={edit ? "Edit exam" : "New exam"}
        title={edit ? "Exam configuration" : "Create a mock test"}
        description="Set the scoring rules and student experience. Questions can be added on the next step."
        action={<LanguageToggle />}
      />
      <form
        onSubmit={handleSubmit((v) => save.mutate(v))}
        className="grid gap-5 xl:grid-cols-[1fr_360px]"
      >
        <section className="card p-5 sm:p-7">
          <h2 className="font-display text-xl font-extrabold">
            Basic information
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field
              label="Exam title (English, required)"
              error={errors.title?.message}
              wide
            >
              <input
                className="input"
                {...register("title", {
                  required: "Title is required",
                  minLength: { value: 3, message: "Use at least 3 characters" },
                })}
                placeholder="e.g. SSC CGL Full Mock Test 02"
              />
            </Field>
            <Field label="Exam title (Hindi, optional)" wide>
              <input
                className="input"
                {...register("titleHi")}
                placeholder="जैसे एसएससी सीजीएल पूर्ण मॉक टेस्ट 02"
                lang="hi"
              />
            </Field>
            <Field label="Description (English)" wide>
              <textarea
                className="input min-h-24 resize-y"
                {...register("description")}
                placeholder="Tell students what this test covers."
              />
            </Field>
            <Field label="Description (Hindi, optional)" wide>
              <textarea
                className="input min-h-24 resize-y"
                {...register("descriptionHi")}
                placeholder="विद्यार्थियों को बताएं कि यह टेस्ट किन विषयों को कवर करता है।"
                lang="hi"
              />
            </Field>
            <Field label="Category" error={errors.categoryId?.message}>
              <select
                className="input"
                {...register("categoryId", { required: "Choose a category" })}
              >
                <option value="">Select category</option>
                {taxonomy.data!.categories.map((x) => (
                  <option key={x.id} value={x.id}>
                    {localize(x.name, x.nameHi)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Primary subject">
              <select className="input" {...register("subjectId")}>
                <option value="">Multi-subject / general</option>
                {taxonomy.data!.subjects.map((x) => (
                  <option key={x.id} value={x.id}>
                    {localize(x.name, x.nameHi)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Difficulty">
              <select className="input" {...register("difficulty")}>
                <option>EASY</option>
                <option>MEDIUM</option>
                <option>HARD</option>
              </select>
            </Field>
            <Field label="Attempt limit">
              <input
                className="input"
                type="number"
                min="1"
                {...register("attemptLimit")}
                placeholder="Unlimited"
              />
            </Field>
            <Field label="Instructions (English)" wide>
              <textarea
                className="input min-h-32 resize-y"
                {...register("instructions")}
              />
            </Field>
            <Field label="Instructions (Hindi, optional)" wide>
              <textarea
                className="input min-h-32 resize-y"
                {...register("instructionsHi")}
                placeholder="परीक्षा के निर्देश हिन्दी में लिखें।"
                lang="hi"
              />
            </Field>
            <div className="rounded-2xl border border-[#d9e3dc] bg-mint/40 p-5 sm:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <p className="eyebrow">Live {language === "hi" ? "Hindi" : "English"} preview</p>
                {language === "hi" && !values.titleHi?.trim() && (
                  <span className="text-xs font-bold text-amber-700">
                    Falling back to English
                  </span>
                )}
              </div>
              <h3 className="mt-2 font-display text-xl font-extrabold">
                {localize(values.title, values.titleHi) || "Untitled exam"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#5a6a62]">
                {localize(values.description, values.descriptionHi) ||
                  "The exam description will appear here."}
              </p>
              <p className="mt-3 rounded-xl bg-white/75 p-3 text-sm leading-6 text-[#50635a]">
                {localize(values.instructions, values.instructionsHi) ||
                  "The exam instructions will appear here."}
              </p>
            </div>
          </div>
        </section>
        <aside className="space-y-5">
          <section className="card p-5">
            <h2 className="font-display text-lg font-extrabold">
              Scoring & timing
            </h2>
            <div className="mt-5 grid grid-cols-2 gap-4">
              <Field label="Duration (min)">
                <input
                  className="input"
                  type="number"
                  min="1"
                  {...register("durationMinutes", {
                    valueAsNumber: true,
                    required: true,
                  })}
                />
              </Field>
              <Field label="Total marks">
                <input
                  className="input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  {...register("totalMarks", {
                    valueAsNumber: true,
                    required: true,
                  })}
                />
              </Field>
              <Field label="Marks / answer">
                <input
                  className="input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  {...register("marksPerQuestion", {
                    valueAsNumber: true,
                    required: true,
                  })}
                />
              </Field>
              <Field label="Negative marks">
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("negativeMarks", {
                    valueAsNumber: true,
                    required: true,
                  })}
                />
              </Field>
            </div>
          </section>
          <section className="card p-5">
            <h2 className="font-display text-lg font-extrabold">
              Student experience
            </h2>
            <div className="mt-4 space-y-1">
              <Toggle
                label="Randomize questions"
                {...register("randomizeQuestions")}
              />
              <Toggle
                label="Randomize options"
                {...register("randomizeOptions")}
              />
              <Toggle
                label="Show result immediately"
                {...register("showResultImmediately")}
              />
              <p className="px-2 pb-3 text-xs text-[#6d7973]">
                Leave off to hold scores until you select Declare Result on the Exams page.
              </p>
              <Toggle
                label="Allow answer review"
                {...register("allowAnswerReview")}
              />
              <Toggle
                label="Require explanations to publish"
                {...register("requireExplanations")}
              />
              <Toggle label="Allow resume" {...register("allowResume")} />
            </div>
          </section>
          <button
            className="btn-primary w-full py-3.5"
            disabled={save.isPending}
          >
            {save.isPending ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {edit
                  ? "Save and manage questions"
                  : "Create draft and continue"}
              </>
            )}
          </button>
        </aside>
      </form>
    </>
  );
}
function Field({
  label,
  error,
  wide,
  children,
}: {
  label: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="label">{label}</span>
      {children}
      {error && (
        <span className="mt-1 text-xs font-bold text-rose-600">{error}</span>
      )}
    </label>
  );
}
function Toggle({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl px-2 py-3 text-sm font-bold hover:bg-[#f7f8f4]">
      <span>{label}</span>
      <input type="checkbox" className="h-5 w-5 accent-[#173f35]" {...props} />
    </label>
  );
}
