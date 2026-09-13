import { useQuery } from "@tanstack/react-query";
import { CheckSquare, Goal, Pin } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { StudentCalendarData } from "../features/calendar/types";
import { api } from "../lib/api";

type Reminder = {
  id: string;
  kind: "sticky" | "goal" | "task";
  goal?: "today" | "short" | "long";
  title: string;
  detail?: string | null;
};

export function GlobalRemindersTicker() {
  const navigate = useNavigate();
  const range = useMemo(() => {
    const now = new Date();
    const from = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const to = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0));
    return {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    };
  }, []);
  const query = useQuery({
    queryKey: ["student-calendar", "global-reminders"],
    queryFn: () =>
      api
        .get<StudentCalendarData>("/student/calendar", {
          params: range,
        })
        .then((response) => response.data),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  const reminders = useMemo<Reminder[]>(() => {
    const data = query.data;
    if (!data) return [];
    const goals = [
      ["today", "Today's goal", data.goals?.todayGoal],
      ["short", "Short-term goal", data.goals?.shortTermGoal],
      ["long", "Long-term goal", data.goals?.longTermGoal],
    ] as const;
    return [
      ...data.stickyNotes.map((note) => ({
        id: note.id,
        kind: "sticky" as const,
        title: note.title,
        detail: note.content,
      })),
      ...goals
        .filter(([, , value]) => value?.trim())
        .map(([goal, title, detail]) => ({
          id: goal,
          kind: "goal" as const,
          goal,
          title,
          detail,
        })),
      ...data.tasks
        .filter((task) => !task.completed)
        .map((task) => ({
          id: task.id,
          kind: "task" as const,
          title: task.title,
          detail:
            task.description ??
            (task.dueDate
              ? `Due ${task.dueDate.slice(0, 10)}`
              : "Pending task"),
        })),
    ];
  }, [query.data]);

  if (!reminders.length) return null;
  const open = (reminder: Reminder) => {
    const params = new URLSearchParams({
      focus: reminder.kind,
      id: reminder.id,
    });
    if (reminder.goal) params.set("goal", reminder.goal);
    navigate(`/student/calendar?${params.toString()}`);
  };

  return (
    <section className="reminder-ticker" aria-label="Study reminders">
      <div className="reminder-ticker__label">Study reminders</div>
      <div className="reminder-ticker__viewport">
        <div className="reminder-ticker__track">
          {[0, 1].map((copy) => (
            <div
              className="reminder-ticker__set"
              aria-hidden={copy === 1}
              key={copy}
            >
              {reminders.map((reminder) => {
                const Icon =
                  reminder.kind === "sticky"
                    ? Pin
                    : reminder.kind === "goal"
                      ? Goal
                      : CheckSquare;
                return (
                  <button
                    className={`reminder-ticker__note reminder-ticker__note--${reminder.kind}`}
                    key={`${reminder.kind}-${reminder.id}-${copy}`}
                    onClick={() => open(reminder)}
                    title={`${reminder.title}: ${reminder.detail ?? ""}`}
                  >
                    <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-[cursive] font-bold">
                      {reminder.title}
                    </span>
                    {reminder.detail && (
                      <span className="max-w-64 truncate text-xs opacity-80">
                        — {reminder.detail}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
