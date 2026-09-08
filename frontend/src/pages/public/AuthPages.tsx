import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { LanguageToggle } from "../../components/LanguageToggle";
import { Logo } from "../../components/Logo";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useToast } from "../../contexts/ToastContext";
import { api } from "../../lib/api";
import type { User } from "../../types";

const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
const registerSchema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/\d/, "Include a number")
      .regex(/[^A-Za-z\d]/, "Include a special character"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { language } = useLanguage();
  const bi = (english: string, hindi: string) =>
    language === "hi" ? hindi : english;
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[.92fr_1.08fr]">
      <aside className="noise relative hidden overflow-hidden bg-forest p-12 text-white lg:flex lg:flex-col">
        <Logo light />
        <div className="my-auto max-w-xl">
          <p className="eyebrow !text-lime">
            {bi("Learn from every attempt", "हर प्रयास से सीखें")}
          </p>
          <h2 className="mt-4 font-display text-5xl font-extrabold leading-[1.06] tracking-[-.05em]">
            {bi(
              "The clearest path from practice to progress.",
              "अभ्यास से प्रगति तक का सबसे स्पष्ट रास्ता।",
            )}
          </h2>
          <div className="mt-10 space-y-4 text-sm text-white/70">
            {[
              bi("Realistic computer-based tests", "वास्तविक कंप्यूटर-आधारित टेस्ट"),
              bi("Secure server-side scoring", "सुरक्षित सर्वर-आधारित स्कोरिंग"),
              bi("Question-wise answer analysis", "प्रश्नवार उत्तर विश्लेषण"),
            ].map((x) => (
              <p className="flex items-center gap-3" key={x}>
                <ShieldCheck className="h-5 w-5 text-lime" />
                {x}
              </p>
            ))}
          </div>
        </div>
        <p className="text-xs text-white/45">
          {bi(
            "MockMaster · Serious preparation, made simple.",
            "MockMaster · गंभीर तैयारी, अब सरल।",
          )}
        </p>
      </aside>
      <main className="relative flex min-h-screen items-center justify-center bg-cream p-5 pt-24 sm:p-10">
        <div className="absolute right-5 top-5 sm:right-10 sm:top-8">
          <LanguageToggle />
        </div>
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-[#68766f] hover:text-forest"
          >
            <ArrowLeft className="h-4 w-4" />
            {bi("Back to home", "होम पर वापस जाएँ")}
          </Link>
          <p className="eyebrow mb-2">
            {bi("Welcome to MockMaster", "MockMaster में आपका स्वागत है")}
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-[-.045em]">
            {title}
          </h1>
          <p className="mt-2 text-sm text-[#6d7973]">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { language } = useLanguage();
  const bi = (english: string, hindi: string) =>
    language === "hi" ? hindi : english;
  const [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  if (user)
    return (
      <Navigate
        to={user.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard"}
        replace
      />
    );
  const submit = handleSubmit(async (values) => {
    try {
      const { data } = await api.post<{ user: User }>("/auth/login", values);
      login(data.user);
      toast.show(bi("Welcome back!", "वापसी पर स्वागत है!"));
      navigate(
        data.user.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard",
      );
    } catch (error) {
      toast.show((error as Error).message, "error");
    }
  });
  return (
    <AuthShell
      title={bi("Sign in to your account", "अपने खाते में साइन इन करें")}
      subtitle={bi(
        "Pick up exactly where you left off.",
        "वहीं से आगे बढ़ें जहाँ आपने छोड़ा था।",
      )}
    >
      <form className="space-y-5" onSubmit={submit}>
        <Field label={bi("Email address", "ईमेल पता")} error={errors.email?.message}>
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </Field>
        <Field label={bi("Password", "पासवर्ड")} error={errors.password?.message}>
          <div className="relative">
            <input
              className="input pr-12"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              placeholder={bi("Enter your password", "अपना पासवर्ड दर्ज करें")}
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-[#79867f]"
              aria-label={
                show
                  ? bi("Hide password", "पासवर्ड छिपाएँ")
                  : bi("Show password", "पासवर्ड दिखाएँ")
              }
              onClick={() => setShow(!show)}
            >
              {show ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </Field>
        <button className="btn-primary w-full py-3.5" disabled={isSubmitting}>
          {isSubmitting ? (
            bi("Signing in…", "साइन इन हो रहा है…")
          ) : (
            <>
              {bi("Sign in", "साइन इन करें")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
      <p className="mt-7 text-center text-sm text-[#6c7973]">
        {bi("New here?", "यहाँ नए हैं?")}{" "}
        <Link
          to="/register"
          className="font-extrabold text-forest underline decoration-lime decoration-4 underline-offset-2"
        >
          {bi("Create an account", "खाता बनाएँ")}
        </Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { language } = useLanguage();
  const bi = (english: string, hindi: string) =>
    language === "hi" ? hindi : english;
  const [show, setShow] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  if (user)
    return (
      <Navigate
        to={user.role === "ADMIN" ? "/admin/dashboard" : "/student/dashboard"}
        replace
      />
    );
  const submit = handleSubmit(async (values) => {
    try {
      const { data } = await api.post<{ user: User }>("/auth/register", {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        preferredLanguage: language === "hi" ? "HI" : "EN",
      });
      login(data.user);
      toast.show(bi("Your account is ready", "आपका खाता तैयार है"));
      navigate("/student/dashboard");
    } catch (error) {
      toast.show((error as Error).message, "error");
    }
  });
  return (
    <AuthShell
      title={bi("Create your student account", "अपना विद्यार्थी खाता बनाएँ")}
      subtitle={bi(
        "Start practicing and make every attempt count.",
        "अभ्यास शुरू करें और हर प्रयास को सार्थक बनाएँ।",
      )}
    >
      <form className="space-y-4" onSubmit={submit}>
        <Field label={bi("Full name", "पूरा नाम")} error={errors.fullName?.message}>
          <input
            className="input"
            autoComplete="name"
            placeholder={bi("Your full name", "अपना पूरा नाम")}
            {...register("fullName")}
          />
        </Field>
        <Field label={bi("Email address", "ईमेल पता")} error={errors.email?.message}>
          <input
            className="input"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register("email")}
          />
        </Field>
        <Field label={bi("Password", "पासवर्ड")} error={errors.password?.message}>
          <div className="relative">
            <input
              className="input pr-12"
              type={show ? "text" : "password"}
              autoComplete="new-password"
              placeholder={bi("Minimum 8 characters", "कम से कम 8 अक्षर")}
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-3 top-3 text-[#79867f]"
              aria-label={bi(
                "Toggle password visibility",
                "पासवर्ड दिखाएँ या छिपाएँ",
              )}
              onClick={() => setShow(!show)}
            >
              {show ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </Field>
        <Field
          label={bi("Confirm password", "पासवर्ड की पुष्टि करें")}
          error={errors.confirmPassword?.message}
        >
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            placeholder={bi("Repeat your password", "पासवर्ड दोबारा लिखें")}
            {...register("confirmPassword")}
          />
        </Field>
        <button className="btn-primary w-full py-3.5" disabled={isSubmitting}>
          {isSubmitting ? (
            bi("Creating account…", "खाता बनाया जा रहा है…")
          ) : (
            <>
              {bi("Create account", "खाता बनाएँ")}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>
      <p className="mt-7 text-center text-sm text-[#6c7973]">
        {bi("Already registered?", "पहले से पंजीकृत हैं?")}{" "}
        <Link
          to="/login"
          className="font-extrabold text-forest underline decoration-lime decoration-4 underline-offset-2"
        >
          {bi("Sign in", "साइन इन करें")}
        </Link>
      </p>
    </AuthShell>
  );
}
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error && (
        <span className="mt-1 block text-xs font-semibold text-rose-600">
          {error}
        </span>
      )}
    </label>
  );
}
