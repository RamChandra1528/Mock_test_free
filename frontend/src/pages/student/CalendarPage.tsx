import {
  Check,
  CheckCircle2,
  ClipboardList,
  FileText,
  Flame,
  Pencil,
  Pin,
  Plus,
  Sparkles,
  Target,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CalendarGrid,
  type CalendarView,
} from "../../features/calendar/CalendarGrid";
import {
  dateKey,
  eventOccursOn,
  formatDate,
  monthGrid,
  weekDays,
} from "../../features/calendar/date";
import type {
  CalendarNote,
  CalendarTask,
  StickyNote,
  StudentCalendarData,
} from "../../features/calendar/types";
import {
  Empty,
  ErrorState,
  Loading,
  Modal,
  PageHeader,
} from "../../components/ui";
import { useToast } from "../../contexts/ToastContext";
import { api } from "../../lib/api";

const blankGoals = {
  overallTarget: "",
  longTermGoal: "",
  shortTermGoal: "",
  todayGoal: "",
};
const stickyStyles = {
  yellow: "bg-[#fff1a8] text-[#594700]",
  pink: "bg-[#ffdce6] text-[#722942]",
  blue: "bg-[#d9efff] text-[#164b68]",
  green: "bg-[#dff4d4] text-[#255a35]",
  lavender: "bg-[#e9defe] text-[#4d337a]",
};

export function StudentCalendarPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const goalsSectionRef = useRef<HTMLElement>(null);
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [noteDraft, setNoteDraft] = useState({
    id: "",
    title: "",
    content: "",
  });
  const [goals, setGoals] = useState(blankGoals);
  const [taskEditor, setTaskEditor] = useState<CalendarTask | "new" | null>(
    null,
  );
  const [stickyEditor, setStickyEditor] = useState<StickyNote | "new" | null>(
    null,
  );
  const range = useMemo(() => {
    const dates =
      view === "month"
        ? monthGrid(cursor)
        : view === "week"
          ? weekDays(cursor)
          : [cursor];
    return { from: dateKey(dates[0]), to: dateKey(dates[dates.length - 1]) };
  }, [cursor, view]);
  const query = useQuery({
    queryKey: ["student-calendar", range],
    queryFn: () =>
      api
        .get<StudentCalendarData>("/student/calendar", { params: range })
        .then((response) => response.data),
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["student-calendar"] });
  useEffect(() => {
    const next = query.data?.goals;
    setGoals(
      next
        ? {
            overallTarget: next.overallTarget ?? "",
            longTermGoal: next.longTermGoal ?? "",
            shortTermGoal: next.shortTermGoal ?? "",
            todayGoal: next.todayGoal ?? "",
          }
        : blankGoals,
    );
  }, [query.data?.goals?.id, query.data?.goals?.updatedAt]);
  useEffect(
    () => setNoteDraft({ id: "", title: "", content: "" }),
    [selectedDate],
  );
  useEffect(() => {
    const focus = searchParams.get("focus");
    const id = searchParams.get("id");
    if (!focus || !query.data) return;
    if (focus === "sticky") {
      const note = query.data.stickyNotes.find((item) => item.id === id);
      if (note) setStickyEditor(note);
    }
    if (focus === "task") {
      const task = query.data.tasks.find(
        (item) => item.id === id && !item.completed,
      );
      if (task) setTaskEditor(task);
    }
    if (focus === "goal") {
      goalsSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
    setSearchParams({}, { replace: true });
  }, [query.data, searchParams, setSearchParams]);

  const noteMutation = useMutation({
    mutationFn: async () => {
      if (noteDraft.id) {
        await api.put(`/student/calendar/notes/${noteDraft.id}`, {
          title: noteDraft.title,
          content: noteDraft.content,
        });
      } else {
        await api.post("/student/calendar/notes", {
          date: selectedDate,
          title: noteDraft.title,
          content: noteDraft.content,
        });
      }
    },
    onSuccess: () => {
      toast.show("Note saved");
      setNoteDraft({ id: "", title: "", content: "" });
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const deleteNote = useMutation({
    mutationFn: (id: string) => api.delete(`/student/calendar/notes/${id}`),
    onSuccess: () => {
      toast.show("Note deleted");
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const goalsMutation = useMutation({
    mutationFn: () => api.put("/student/calendar/goals", goals),
    onSuccess: () => {
      toast.show("Goals saved");
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const taskMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id?: string;
      values: Omit<CalendarTask, "id" | "createdAt" | "updatedAt">;
    }) =>
      id
        ? api.patch(`/student/calendar/tasks/${id}`, values)
        : api.post("/student/calendar/tasks", values),
    onSuccess: () => {
      toast.show("Task saved");
      setTaskEditor(null);
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const toggleTask = useMutation({
    mutationFn: (task: CalendarTask) =>
      api.patch(`/student/calendar/tasks/${task.id}`, {
        completed: !task.completed,
      }),
    onSuccess: refresh,
    onError: (error) => toast.show(error.message, "error"),
  });
  const deleteTask = useMutation({
    mutationFn: (id: string) => api.delete(`/student/calendar/tasks/${id}`),
    onSuccess: () => {
      toast.show("Task deleted");
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const stickyMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id?: string;
      values: Omit<StickyNote, "id" | "updatedAt">;
    }) =>
      id
        ? api.put(`/student/calendar/sticky-notes/${id}`, values)
        : api.post("/student/calendar/sticky-notes", values),
    onSuccess: () => {
      toast.show("Sticky note saved");
      setStickyEditor(null);
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const deleteSticky = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/student/calendar/sticky-notes/${id}`),
    onSuccess: () => {
      toast.show("Sticky note deleted");
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });

  if (query.isLoading) return <Loading label="Opening your calendar…" />;
  if (query.error) return <ErrorState error={query.error} />;
  const data = query.data!;
  const dateNotes = data.notes.filter(
    (note) => dateKey(note.date) === selectedDate,
  );
  const dateTasks = data.tasks.filter(
    (task) => task.dueDate && dateKey(task.dueDate) === selectedDate,
  );
  const dateEvents = data.events.filter((event) =>
    eventOccursOn(event, selectedDate),
  );
  const completed = data.tasks.filter((task) => task.completed).length;
  const progress = data.tasks.length
    ? Math.round((completed / data.tasks.length) * 100)
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Calendar & productivity"
        title="Plan your study time"
        description="Keep your study notes, tasks, goals, and academic schedule in one place."
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.8fr)]">
        <CalendarGrid
          cursor={cursor}
          selectedDate={selectedDate}
          view={view}
          notes={data.notes}
          tasks={data.tasks}
          events={data.events}
          onCursorChange={setCursor}
          onSelectDate={(day) => {
            setSelectedDate(day);
            setCursor(new Date(`${day}T12:00:00Z`));
          }}
          onViewChange={setView}
        />
        <DateDetails
          date={selectedDate}
          notes={dateNotes}
          tasks={dateTasks}
          events={dateEvents}
          draft={noteDraft}
          onDraftChange={setNoteDraft}
          onSave={() => noteMutation.mutate()}
          saving={noteMutation.isPending}
          onEdit={(note) =>
            setNoteDraft({
              id: note.id,
              title: note.title,
              content: note.content,
            })
          }
          onDelete={(id) => deleteNote.mutate(id)}
          onToggleTask={(task) => toggleTask.mutate(task)}
          onAddTask={() => setTaskEditor("new")}
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
        <section ref={goalsSectionRef} className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Pinboard</p>
              <h2 className="mt-1 font-display text-xl font-extrabold">
                Sticky notes
              </h2>
            </div>
            <button
              className="btn-secondary !px-3 !py-2"
              onClick={() => setStickyEditor("new")}
            >
              <Plus className="h-4 w-4" />
              Add note
            </button>
          </div>
          {data.stickyNotes.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {data.stickyNotes.map((note, index) => (
                <article
                  key={note.id}
                  className={`min-h-44 p-4 shadow-md transition hover:-translate-y-1 ${stickyStyles[note.color] ?? stickyStyles.yellow}`}
                  style={{ transform: `rotate(${index % 2 ? 1.2 : -0.8}deg)` }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-extrabold">
                      {note.title}
                    </h3>
                    <div className="flex">
                      <button
                        aria-label="Edit sticky note"
                        className="rounded p-1 hover:bg-white/30"
                        onClick={() => setStickyEditor(note)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label="Delete sticky note"
                        className="rounded p-1 hover:bg-white/30"
                        onClick={() => deleteSticky.mutate(note.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap font-[cursive] text-sm leading-6">
                    {note.content}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <Empty
              title="Your pinboard is empty"
              description="Pin a quick reminder, study thought, or revision plan here."
              action={
                <button
                  className="btn-primary"
                  onClick={() => setStickyEditor("new")}
                >
                  <Pin className="h-4 w-4" />
                  Create sticky note
                </button>
              }
            />
          )}
        </section>
        <section className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Focus</p>
              <h2 className="mt-1 font-display text-xl font-extrabold">
                Your goals
              </h2>
            </div>
            <Target className="text-forest" />
          </div>
          <div className="mt-5 grid gap-3">
            <GoalField
              label="🎯 Overall target"
              value={goals.overallTarget}
              onChange={(value) => setGoals({ ...goals, overallTarget: value })}
              placeholder="Your big preparation target"
            />
            <GoalField
              label="🚀 Long-term goal"
              value={goals.longTermGoal}
              onChange={(value) => setGoals({ ...goals, longTermGoal: value })}
              placeholder="What will you achieve over the next few months?"
            />
            <GoalField
              label="⚡ Short-term goal"
              value={goals.shortTermGoal}
              onChange={(value) => setGoals({ ...goals, shortTermGoal: value })}
              placeholder="Your next milestone"
            />
            <GoalField
              label="📅 Today's goal"
              value={goals.todayGoal}
              onChange={(value) => setGoals({ ...goals, todayGoal: value })}
              placeholder="What matters most today?"
            />
          </div>
          <button
            className="btn-primary mt-4 w-full"
            disabled={goalsMutation.isPending}
            onClick={() => goalsMutation.mutate()}
          >
            {goalsMutation.isPending ? "Saving…" : "Save goals"}
          </button>
        </section>
      </div>

      <section className="card mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Action list</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">
              To-do list
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#62716a]">
              {completed}/{data.tasks.length} complete · {progress}%
            </span>
            <button
              className="btn-primary"
              onClick={() => setTaskEditor("new")}
            >
              <Plus className="h-4 w-4" />
              Add task
            </button>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8ece8]">
          <div
            className="h-full rounded-full bg-forest transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        {data.tasks.length ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {data.tasks.map((task) => (
              <article
                key={task.id}
                className={`flex items-start gap-3 rounded-xl border p-4 ${task.completed ? "border-[#dce6df] bg-[#f7faf7]" : "border-[#e1e6e1] bg-white"}`}
              >
                <button
                  aria-label={
                    task.completed ? "Mark task pending" : "Mark task complete"
                  }
                  className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${task.completed ? "border-forest bg-forest text-white" : "border-[#aab8ae]"}`}
                  onClick={() => toggleTask.mutate(task)}
                >
                  {task.completed && <Check className="h-3.5 w-3.5" />}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3
                      className={`font-bold ${task.completed ? "text-[#77847d] line-through" : ""}`}
                    >
                      {task.title}
                    </h3>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  {task.description && (
                    <p className="mt-1 text-sm text-[#68776f]">
                      {task.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs font-bold text-[#7c8982]">
                    {task.dueDate
                      ? `Due ${formatDate(task.dueDate, { weekday: undefined, year: undefined })}`
                      : "No due date"}
                  </p>
                </div>
                <div className="flex">
                  <button
                    className="rounded-lg p-2 hover:bg-[#eef2ee]"
                    aria-label="Edit task"
                    onClick={() => setTaskEditor(task)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                    aria-label="Delete task"
                    onClick={() => deleteTask.mutate(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="No tasks yet"
            description="Add a study task with a priority and due date to get started."
            action={
              <button
                className="btn-primary"
                onClick={() => setTaskEditor("new")}
              >
                <ClipboardList className="h-4 w-4" />
                Add your first task
              </button>
            }
          />
        )}
      </section>

      <TaskEditor
        open={!!taskEditor}
        task={taskEditor}
        initialDate={selectedDate}
        onClose={() => setTaskEditor(null)}
        onSave={(values) =>
          taskMutation.mutate({
            id:
              taskEditor && typeof taskEditor === "object"
                ? taskEditor.id
                : undefined,
            values,
          })
        }
        saving={taskMutation.isPending}
      />
      <StickyEditor
        open={!!stickyEditor}
        note={stickyEditor}
        onClose={() => setStickyEditor(null)}
        onSave={(values) =>
          stickyMutation.mutate({
            id:
              stickyEditor && typeof stickyEditor === "object"
                ? stickyEditor.id
                : undefined,
            values,
          })
        }
        saving={stickyMutation.isPending}
      />
    </>
  );
}

function DateDetails({
  date,
  notes,
  tasks,
  events,
  draft,
  onDraftChange,
  onSave,
  saving,
  onEdit,
  onDelete,
  onToggleTask,
  onAddTask,
}: {
  date: string;
  notes: CalendarNote[];
  tasks: CalendarTask[];
  events: StudentCalendarData["events"];
  draft: { id: string; title: string; content: string };
  onDraftChange: (value: {
    id: string;
    title: string;
    content: string;
  }) => void;
  onSave: () => void;
  saving: boolean;
  onEdit: (note: CalendarNote) => void;
  onDelete: (id: string) => void;
  onToggleTask: (task: CalendarTask) => void;
  onAddTask: () => void;
}) {
  return (
    <aside className="card p-5">
      <p className="eyebrow">Selected date</p>
      <h2 className="mt-1 font-display text-xl font-extrabold">
        {formatDate(date)}
      </h2>
      <section className="mt-5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-amber-600" />
          <h3 className="font-display font-extrabold">Notes</h3>
        </div>
        {notes.map((note) => (
          <article className="mt-3 rounded-xl bg-[#fff9df] p-3" key={note.id}>
            <div className="flex items-start justify-between gap-2">
              <b className="text-sm">{note.title}</b>
              <div className="flex">
                <button
                  className="p-1"
                  aria-label="Edit note"
                  onClick={() => onEdit(note)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  className="p-1 text-rose-600"
                  aria-label="Delete note"
                  onClick={() => onDelete(note.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[#5e5739]">
              {note.content}
            </p>
          </article>
        ))}
        <div className="mt-3 space-y-2">
          <input
            className="input !py-2"
            placeholder="Note title"
            value={draft.title}
            onChange={(event) =>
              onDraftChange({ ...draft, title: event.target.value })
            }
          />
          <textarea
            className="input min-h-20 !py-2"
            placeholder="Write your notes here…"
            value={draft.content}
            onChange={(event) =>
              onDraftChange({ ...draft, content: event.target.value })
            }
          />
          <button
            className="btn-primary w-full !py-2"
            disabled={!draft.content.trim() || saving}
            onClick={onSave}
          >
            {draft.id ? "Update note" : "Save note"}
          </button>
        </div>
      </section>
      <section className="mt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-forest" />
            <h3 className="font-display font-extrabold">Tasks</h3>
          </div>
          <button
            className="text-xs font-extrabold text-forest hover:underline"
            onClick={onAddTask}
          >
            + Add
          </button>
        </div>
        {tasks.length ? (
          <div className="mt-3 space-y-2">
            {tasks.map((task) => (
              <button
                key={task.id}
                className="flex w-full items-center gap-2 rounded-lg bg-[#f5f8f5] px-3 py-2 text-left text-sm"
                onClick={() => onToggleTask(task)}
              >
                <span
                  className={`grid h-4 w-4 place-items-center rounded border ${task.completed ? "border-forest bg-forest text-white" : "border-[#9ca99f]"}`}
                >
                  {task.completed && <Check className="h-3 w-3" />}
                </span>
                <span
                  className={
                    task.completed
                      ? "line-through text-[#7c8982]"
                      : "font-semibold"
                  }
                >
                  {task.title}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#7b8880]">
            No tasks due on this date.
          </p>
        )}
      </section>
      <section className="mt-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <h3 className="font-display font-extrabold">Academic events</h3>
        </div>
        {events.length ? (
          <div className="mt-3 space-y-2">
            {events.map((event) => (
              <div key={event.id} className="rounded-lg bg-violet-50 p-3">
                <p className="text-sm font-bold text-violet-900">
                  {event.title}
                </p>
                <p className="mt-1 text-xs text-violet-700">
                  {new Intl.DateTimeFormat("en-IN", {
                    hour: "numeric",
                    minute: "2-digit",
                  }).format(new Date(event.startAt))}{" "}
                  · {event.eventType.toLowerCase()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#7b8880]">
            No academic events on this date.
          </p>
        )}
      </section>
    </aside>
  );
}

function GoalField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label>
      <span className="label">{label}</span>
      <textarea
        className="input min-h-16"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
function PriorityBadge({ priority }: { priority: CalendarTask["priority"] }) {
  const tone =
    priority === "HIGH"
      ? "bg-rose-50 text-rose-700"
      : priority === "LOW"
        ? "bg-[#edf1ee] text-[#65746a]"
        : "bg-amber-50 text-amber-700";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${tone}`}
    >
      {priority}
    </span>
  );
}

function TaskEditor({
  open,
  task,
  initialDate,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  task: CalendarTask | "new" | null;
  initialDate: string;
  onClose: () => void;
  onSave: (
    values: Omit<CalendarTask, "id" | "createdAt" | "updatedAt">,
  ) => void;
  saving: boolean;
}) {
  const [values, setValues] = useState({
    title: "",
    description: "",
    dueDate: initialDate,
    priority: "MEDIUM" as CalendarTask["priority"],
    completed: false,
  });
  useEffect(() => {
    setValues(
      task && typeof task === "object"
        ? {
            title: task.title,
            description: task.description ?? "",
            dueDate: task.dueDate?.slice(0, 10) ?? "",
            priority: task.priority,
            completed: task.completed,
          }
        : {
            title: "",
            description: "",
            dueDate: initialDate,
            priority: "MEDIUM",
            completed: false,
          },
    );
  }, [task, initialDate]);
  return (
    <Modal
      open={open}
      title={task === "new" ? "Add task" : "Edit task"}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!values.title.trim() || saving}
            onClick={() => onSave(values)}
          >
            Save task
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label>
          <span className="label">Task</span>
          <input
            className="input"
            value={values.title}
            onChange={(event) =>
              setValues({ ...values, title: event.target.value })
            }
            placeholder="e.g. Revise DBMS normalization"
          />
        </label>
        <label>
          <span className="label">Optional notes</span>
          <textarea
            className="input min-h-24"
            value={values.description}
            onChange={(event) =>
              setValues({ ...values, description: event.target.value })
            }
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">Due date</span>
            <input
              className="input"
              type="date"
              value={values.dueDate}
              onChange={(event) =>
                setValues({ ...values, dueDate: event.target.value })
              }
            />
          </label>
          <label>
            <span className="label">Priority</span>
            <select
              className="input"
              value={values.priority}
              onChange={(event) =>
                setValues({
                  ...values,
                  priority: event.target.value as CalendarTask["priority"],
                })
              }
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </label>
        </div>
      </div>
    </Modal>
  );
}

function StickyEditor({
  open,
  note,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  note: StickyNote | "new" | null;
  onClose: () => void;
  onSave: (values: Omit<StickyNote, "id" | "updatedAt">) => void;
  saving: boolean;
}) {
  const [values, setValues] = useState({
    title: "",
    content: "",
    color: "yellow" as StickyNote["color"],
    positionX: 0,
    positionY: 0,
  });
  useEffect(() => {
    setValues(
      note && typeof note === "object"
        ? {
            title: note.title,
            content: note.content,
            color: note.color,
            positionX: note.positionX,
            positionY: note.positionY,
          }
        : {
            title: "",
            content: "",
            color: "yellow",
            positionX: 0,
            positionY: 0,
          },
    );
  }, [note]);
  return (
    <Modal
      open={open}
      title={note === "new" ? "Create sticky note" : "Edit sticky note"}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!values.content.trim() || saving}
            onClick={() => onSave(values)}
          >
            Save sticky note
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label>
          <span className="label">Title</span>
          <input
            className="input"
            value={values.title}
            onChange={(event) =>
              setValues({ ...values, title: event.target.value })
            }
            placeholder="Study plan"
          />
        </label>
        <label>
          <span className="label">Note</span>
          <textarea
            className="input min-h-32"
            value={values.content}
            onChange={(event) =>
              setValues({ ...values, content: event.target.value })
            }
            placeholder="Write a quick reminder…"
          />
        </label>
        <label>
          <span className="label">Paper color</span>
          <select
            className="input"
            value={values.color}
            onChange={(event) =>
              setValues({
                ...values,
                color: event.target.value as StickyNote["color"],
              })
            }
          >
            {Object.keys(stickyStyles).map((color) => (
              <option key={color} value={color}>
                {color[0].toUpperCase() + color.slice(1)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Modal>
  );
}
