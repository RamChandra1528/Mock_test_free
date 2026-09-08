import {
  BarChart3,
  BookOpenCheck,
  ChevronRight,
  FileClock,
  FileUp,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shapes,
  Trophy,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { useAuth } from "../contexts/AuthContext";
import {
  useLanguage,
  type TranslationKey,
} from "../contexts/LanguageContext";

const studentLinks = [
  ["/student/dashboard", "dashboard", LayoutDashboard],
  ["/student/exams", "mockTests", BookOpenCheck],
  ["/student/attempts", "myAttempts", FileClock],
  ["/student/performance", "performance", Trophy],
  ["/student/profile", "profile", UserRound],
] as const;
const adminLinks = [
  ["/admin/dashboard", "Overview", LayoutDashboard],
  ["/admin/exams", "Exams", BookOpenCheck],
  ["/admin/questions", "Question Bank", Shapes],
  ["/admin/import", "Import Paper", FileUp],
  ["/admin/students", "Students", Users],
  ["/admin/attempts", "Attempts", FileClock],
  ["/admin/analytics", "Analytics", BarChart3],
  ["/admin/categories", "Categories", Gauge],
  ["/admin/subjects", "Subjects", Shapes],
  ["/admin/settings", "Settings", Settings],
] as const;

export function AppLayout({ role }: { role: "ADMIN" | "STUDENT" }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const navigationRef = useRef<HTMLElement>(null);
  const links =
    role === "ADMIN"
      ? adminLinks
      : studentLinks.map(([path, key, Icon]) => [
          path,
          t(key as TranslationKey),
          Icon,
        ] as const);
  const active =
    links.find(([path]) => location.pathname.startsWith(path))?.[1] ??
    "Dashboard";
  useEffect(() => {
    navigationRef.current
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [location.pathname, open]);
  return (
    <div className="min-h-screen bg-cream">
      {open && (
        <button
          className="fixed inset-0 z-30 bg-[#0d211b99] lg:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[270px] flex-col overflow-hidden bg-forest px-4 py-5 text-white transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-2">
          <Logo light />
          <button
            className="lg:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <X />
          </button>
        </div>
        <div className="mt-8 rounded-2xl bg-white/10 p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-lime font-display font-extrabold text-forest">
              {user?.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user?.fullName}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/55">
                {role === "ADMIN" ? "Administrator" : t("student")}
              </p>
            </div>
          </div>
        </div>
        <nav
          ref={navigationRef}
          className="sidebar-scroll mt-7 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pb-2 pr-1"
          aria-label={`${role} navigation`}
        >
          {links.map(([path, label, Icon]) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${isActive ? "bg-white text-forest shadow-lg" : "text-white/68 hover:bg-white/10 hover:text-white"}`
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
              <ChevronRight className="ml-auto h-4 w-4 opacity-0 transition group-hover:opacity-70" />
            </NavLink>
          ))}
        </nav>
        <button
          className="mt-2 flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold text-white/68 hover:bg-white/10 hover:text-white"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <LogOut className="h-[18px] w-[18px]" />
          {role === "ADMIN" ? "Log out" : t("logout")}
        </button>
      </aside>
      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-[#e4e6df] bg-cream/90 px-4 backdrop-blur-md sm:px-7">
          <button
            className="mr-3 rounded-xl border border-[#dde0da] bg-white p-2 lg:hidden"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu />
          </button>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-[#87928c]">
              {role === "ADMIN" ? "Admin console" : "Learning workspace"}
            </p>
            <p className="font-display text-sm font-bold">{active}</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            {role === "STUDENT" && <LanguageToggle compact />}
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold">{user?.fullName}</p>
              <p className="text-[11px] text-[#7c8982]">{user?.email}</p>
            </div>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-mint text-sm font-extrabold text-forest">
              {user?.fullName.charAt(0)}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
