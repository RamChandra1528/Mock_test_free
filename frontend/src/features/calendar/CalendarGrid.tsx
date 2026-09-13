import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import type { AcademicEvent, CalendarNote, CalendarTask } from "./types";
import {
  addDays,
  addMonths,
  dateKey,
  eventOccursOn,
  formatDate,
  formatMonth,
  monthGrid,
  weekDays,
} from "./date";

export type CalendarView = "month" | "week" | "day";

export function CalendarGrid({
  cursor,
  selectedDate,
  view,
  notes,
  tasks,
  events,
  onCursorChange,
  onSelectDate,
  onViewChange,
}: {
  cursor: Date;
  selectedDate: string;
  view: CalendarView;
  notes: CalendarNote[];
  tasks: CalendarTask[];
  events: AcademicEvent[];
  onCursorChange: (next: Date) => void;
  onSelectDate: (day: string) => void;
  onViewChange: (view: CalendarView) => void;
}) {
  const dates =
    view === "month"
      ? monthGrid(cursor)
      : view === "week"
        ? weekDays(cursor)
        : [cursor];
  const today = dateKey(new Date());
  const shift = (amount: number) =>
    onCursorChange(
      view === "month"
        ? addMonths(cursor, amount)
        : addDays(cursor, amount * (view === "week" ? 7 : 1)),
    );
  const heading =
    view === "month"
      ? formatMonth(cursor)
      : view === "week"
        ? `${formatDate(dates[0], { weekday: undefined, month: "short", day: "numeric", year: "numeric" })} – ${formatDate(dates[6], { weekday: undefined, month: "short", day: "numeric", year: "numeric" })}`
        : formatDate(cursor);
  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e8ebe7] p-4 sm:p-5">
        <div>
          <p className="eyebrow">Study planner</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">
            {heading}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn-secondary !px-3 !py-2"
            aria-label="Previous period"
            onClick={() => shift(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            className="btn-secondary !px-3 !py-2"
            onClick={() => onCursorChange(new Date())}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Today
          </button>
          <button
            className="btn-secondary !px-3 !py-2"
            aria-label="Next period"
            onClick={() => shift(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="ml-0 flex rounded-lg border border-[#dce2dc] bg-[#f7f9f6] p-1 sm:ml-1">
            {(["month", "week", "day"] as CalendarView[]).map((item) => (
              <button
                key={item}
                onClick={() => onViewChange(item)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-extrabold capitalize ${view === item ? "bg-forest text-white shadow-sm" : "text-[#607068] hover:bg-white"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
      {view === "month" && (
        <div className="grid grid-cols-7 border-b border-[#e8ebe7] bg-[#fafbf8]">
          {"SMTWTFS".split("").map((label) => (
            <span
              key={label}
              className="py-2 text-center text-[11px] font-extrabold text-[#718078]"
            >
              {label}
            </span>
          ))}
        </div>
      )}
      <div
        className={
          view === "month"
            ? "grid grid-cols-7"
            : view === "week"
              ? "grid gap-px bg-[#e8ebe7] sm:grid-cols-7"
              : "p-4"
        }
      >
        {dates.map((day) => {
          const key = dateKey(day);
          const dayNotes = notes.filter((note) => dateKey(note.date) === key);
          const dayTasks = tasks.filter(
            (task) => task.dueDate && dateKey(task.dueDate) === key,
          );
          const dayEvents = events.filter((event) => eventOccursOn(event, key));
          const currentMonth = day.getUTCMonth() === cursor.getUTCMonth();
          return (
            <button
              key={key}
              onClick={() => onSelectDate(key)}
              className={`${view === "month" ? "min-h-[80px] border-b border-r border-[#edf0ec] p-2 text-left sm:min-h-[98px]" : view === "week" ? "min-h-[142px] bg-white p-3 text-left" : "w-full rounded-xl border border-[#dfe5df] p-4 text-left"} transition hover:bg-mint/35 ${selectedDate === key ? "bg-mint/50 ring-2 ring-inset ring-forest/20" : "bg-white"} ${view === "month" && !currentMonth ? "bg-[#fbfcfa] text-[#a4ada7]" : ""}`}
            >
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-extrabold ${today === key ? "bg-forest text-white" : "text-ink"}`}
              >
                {day.getUTCDate()}
              </span>
              {view !== "month" && (
                <p className="mt-2 text-xs font-bold text-[#718078]">
                  {formatDate(day, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: undefined,
                  })}
                </p>
              )}
              <div
                className="mt-2 flex flex-wrap gap-1.5"
                aria-label={`${dayNotes.length} notes, ${dayTasks.length} tasks and ${dayEvents.length} events`}
              >
                {dayNotes.length > 0 && (
                  <span
                    className="h-2 w-2 rounded-full bg-amber-400"
                    title="Notes"
                  />
                )}
                {dayTasks.length > 0 && (
                  <span
                    className="h-2 w-2 rounded-full bg-forest"
                    title="Tasks"
                  />
                )}
                {dayEvents.length > 0 && (
                  <span
                    className="h-2 w-2 rounded-full bg-violet-500"
                    title="Academic events"
                  />
                )}
              </div>
              {view !== "month" && (
                <div className="mt-3 space-y-1.5">
                  {[
                    ...dayTasks.map((task) => ({
                      id: task.id,
                      label: task.title,
                      tone: task.completed
                        ? "bg-[#e5eae6] text-[#718078] line-through"
                        : "bg-mint text-forest",
                    })),
                    ...dayEvents.map((event) => ({
                      id: event.id,
                      label: event.title,
                      tone: "bg-violet-50 text-violet-800",
                    })),
                  ]
                    .slice(0, 4)
                    .map((item) => (
                      <span
                        key={item.id}
                        className={`block truncate rounded-md px-2 py-1 text-[11px] font-bold ${item.tone}`}
                      >
                        {item.label}
                      </span>
                    ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
