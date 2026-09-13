import { CalendarDays, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, useEffect } from "react";
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
  AcademicEvent,
  CalendarNote,
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

type AdminCalendarData = { events: AcademicEvent[]; notes: CalendarNote[] };
type EventForm = {
  title: string;
  eventType: AcademicEvent["eventType"];
  startAt: string;
  endAt: string;
  description: string;
};

export function AdminCalendarPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<CalendarView>("month");
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [editor, setEditor] = useState<AcademicEvent | "new" | null>(null);
  const [noteEditor, setNoteEditor] = useState<CalendarNote | "new" | null>(
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
    queryKey: ["admin-calendar", range],
    queryFn: () =>
      api
        .get<AdminCalendarData>("/admin/calendar", { params: range })
        .then((response) => response.data),
  });
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-calendar"] });
  const save = useMutation({
    mutationFn: ({ id, values }: { id?: string; values: EventForm }) =>
      id
        ? api.put(`/admin/calendar/events/${id}`, toEventPayload(values))
        : api.post("/admin/calendar/events", toEventPayload(values)),
    onSuccess: () => {
      toast.show("Academic event saved");
      setEditor(null);
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/calendar/events/${id}`),
    onSuccess: () => {
      toast.show("Academic event deleted");
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const saveNote = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: { title: string; content: string };
    }) => {
      if (id) return await api.put(`/admin/calendar/notes/${id}`, values);
      return await api.post("/admin/calendar/notes", {
        ...values,
        date: selectedDate,
      });
    },
    onSuccess: () => {
      toast.show("Planning note saved");
      setNoteEditor(null);
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const removeNote = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/calendar/notes/${id}`),
    onSuccess: () => {
      toast.show("Planning note deleted");
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  if (query.isLoading) return <Loading label="Opening academic calendar…" />;
  if (query.error) return <ErrorState error={query.error} />;
  const events = query.data!.events;
  const notes = query.data!.notes;
  const selectedNotes = notes.filter(
    (note) => dateKey(note.date) === selectedDate,
  );
  const selectedEvents = events.filter((event) =>
    eventOccursOn(event, selectedDate),
  );
  return (
    <>
      <PageHeader
        eyebrow="Academic planning"
        title="Academic calendar"
        description="Publish important exam dates, assignments, classes, holidays, and announcements for every student."
        action={
          <button className="btn-primary" onClick={() => setEditor("new")}>
            <Plus className="h-4 w-4" />
            Add academic event
          </button>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.8fr)]">
        <CalendarGrid
          cursor={cursor}
          selectedDate={selectedDate}
          view={view}
          notes={notes}
          tasks={[]}
          events={events}
          onCursorChange={setCursor}
          onSelectDate={(day) => {
            setSelectedDate(day);
            setCursor(new Date(`${day}T12:00:00Z`));
          }}
          onViewChange={setView}
        />
        <aside className="card p-5">
          <p className="eyebrow">Selected date</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">
            {formatDate(selectedDate)}
          </h2>
          <button
            className="btn-secondary mt-4 w-full"
            onClick={() => setEditor("new")}
          >
            <Plus className="h-4 w-4" />
            Add event on this date
          </button>
          <div className="mt-5 border-t border-[#e8ece8] pt-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display font-extrabold">
                Private planning notes
              </h3>
              <button
                className="text-sm font-bold text-forest"
                onClick={() => setNoteEditor("new")}
              >
                Add note
              </button>
            </div>
            {selectedNotes.length ? (
              <div className="mt-3 space-y-2">
                {selectedNotes.map((note) => (
                  <article className="rounded-xl bg-amber-50 p-3" key={note.id}>
                    <div className="flex justify-between gap-2">
                      <h4 className="text-sm font-extrabold">{note.title}</h4>
                      <div className="flex">
                        <button
                          aria-label="Edit note"
                          className="p-1"
                          onClick={() => setNoteEditor(note)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          aria-label="Delete note"
                          className="p-1 text-rose-600"
                          onClick={() => removeNote.mutate(note.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-[#59665f]">
                      {note.content}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[#718076]">
                No private planning notes for this date.
              </p>
            )}
          </div>
          <div className="mt-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <h3 className="font-display font-extrabold">Academic events</h3>
            </div>
            {selectedEvents.length ? (
              <div className="mt-3 space-y-3">
                {selectedEvents.map((event) => (
                  <article
                    className="rounded-xl border border-violet-100 bg-violet-50 p-3"
                    key={event.id}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wide text-violet-700">
                          {event.eventType}
                        </span>
                        <h4 className="mt-1 text-sm font-extrabold text-violet-950">
                          {event.title}
                        </h4>
                      </div>
                      <div className="flex">
                        <button
                          className="rounded p-1 hover:bg-white/60"
                          aria-label="Edit event"
                          onClick={() => setEditor(event)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          className="rounded p-1 text-rose-600 hover:bg-white/60"
                          aria-label="Delete event"
                          onClick={() => remove.mutate(event.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-violet-800">
                      {formatTime(event.startAt)}
                      {event.endAt ? ` – ${formatTime(event.endAt)}` : ""}
                    </p>
                    {event.description && (
                      <p className="mt-2 text-sm leading-5 text-violet-900">
                        {event.description}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <Empty
                title="No events planned"
                description="Create an event to make it visible to students on this date."
                action={
                  <button
                    className="btn-primary"
                    onClick={() => setEditor("new")}
                  >
                    <CalendarDays className="h-4 w-4" />
                    Create event
                  </button>
                }
              />
            )}
          </div>
        </aside>
      </div>
      <section className="card mt-6 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">All visible events</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">
              Academic schedule
            </h2>
          </div>
          <span className="text-sm font-bold text-[#6d7b73]">
            {events.length} events
          </span>
        </div>
        {events.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => (
              <article
                className="rounded-xl border border-[#e1e6e1] p-4"
                key={event.id}
              >
                <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-extrabold text-violet-700">
                  {event.eventType}
                </span>
                <h3 className="mt-3 font-display font-extrabold">
                  {event.title}
                </h3>
                <p className="mt-1 text-sm text-[#68766e]">
                  {formatDate(event.startAt, { weekday: "short" })}
                </p>
                <p className="mt-1 text-xs font-bold text-[#809087]">
                  {formatTime(event.startAt)}
                  {event.endAt ? ` – ${formatTime(event.endAt)}` : ""}
                </p>
                <div className="mt-3 flex gap-1">
                  <button
                    className="btn-secondary !px-3 !py-2"
                    onClick={() => setEditor(event)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    className="btn-danger !px-3 !py-2"
                    onClick={() => remove.mutate(event.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty
            title="No academic events yet"
            description="Create your first event to share it automatically with students."
          />
        )}
      </section>
      <EventEditor
        open={!!editor}
        event={editor}
        defaultDate={selectedDate}
        onClose={() => setEditor(null)}
        onSave={(values) =>
          save.mutate({
            id: editor && typeof editor === "object" ? editor.id : undefined,
            values,
          })
        }
        saving={save.isPending}
      />
      <NoteEditor
        open={!!noteEditor}
        note={noteEditor}
        onClose={() => setNoteEditor(null)}
        onSave={(values) =>
          saveNote.mutate({
            id:
              noteEditor && typeof noteEditor === "object"
                ? noteEditor.id
                : undefined,
            values,
          })
        }
        saving={saveNote.isPending}
      />
    </>
  );
}

function NoteEditor({
  open,
  note,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  note: CalendarNote | "new" | null;
  onClose: () => void;
  onSave: (values: { title: string; content: string }) => void;
  saving: boolean;
}) {
  const [values, setValues] = useState({ title: "", content: "" });
  useEffect(
    () =>
      setValues(
        note && typeof note === "object"
          ? { title: note.title, content: note.content }
          : { title: "", content: "" },
      ),
    [note],
  );
  return (
    <Modal
      open={open}
      title={note === "new" ? "Add planning note" : "Edit planning note"}
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
            Save note
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
            placeholder="Planning note"
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
            placeholder="Write a private admin planning note"
          />
        </label>
      </div>
    </Modal>
  );
}

const toEventPayload = (values: EventForm) => ({
  ...values,
  startAt: new Date(values.startAt).toISOString(),
  endAt: values.endAt ? new Date(values.endAt).toISOString() : undefined,
  description: values.description || undefined,
});
const asLocalInput = (value: string) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const formatTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

function EventEditor({
  open,
  event,
  defaultDate,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  event: AcademicEvent | "new" | null;
  defaultDate: string;
  onClose: () => void;
  onSave: (values: EventForm) => void;
  saving: boolean;
}) {
  const [values, setValues] = useState<EventForm>({
    title: "",
    eventType: "OTHER",
    startAt: "",
    endAt: "",
    description: "",
  });
  useEffect(() => {
    const start = `${defaultDate}T09:00`;
    setValues(
      event && typeof event === "object"
        ? {
            title: event.title,
            eventType: event.eventType,
            startAt: asLocalInput(event.startAt),
            endAt: event.endAt ? asLocalInput(event.endAt) : "",
            description: event.description ?? "",
          }
        : {
            title: "",
            eventType: "OTHER",
            startAt: start,
            endAt: "",
            description: "",
          },
    );
  }, [event, defaultDate]);
  return (
    <Modal
      open={open}
      title={event === "new" ? "Add academic event" : "Edit academic event"}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!values.title.trim() || !values.startAt || saving}
            onClick={() => onSave(values)}
          >
            Save event
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label>
          <span className="label">Event title</span>
          <input
            className="input"
            value={values.title}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
            placeholder="e.g. DBMS Mid-Term Exam"
          />
        </label>
        <label>
          <span className="label">Event type</span>
          <select
            className="input"
            value={values.eventType}
            onChange={(e) =>
              setValues({
                ...values,
                eventType: e.target.value as AcademicEvent["eventType"],
              })
            }
          >
            <option value="EXAM">Exam</option>
            <option value="ASSIGNMENT">Assignment deadline</option>
            <option value="CLASS">Class schedule</option>
            <option value="HOLIDAY">Holiday</option>
            <option value="ANNOUNCEMENT">Announcement</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="label">Start</span>
            <input
              className="input"
              type="datetime-local"
              value={values.startAt}
              onChange={(e) =>
                setValues({ ...values, startAt: e.target.value })
              }
            />
          </label>
          <label>
            <span className="label">End (optional)</span>
            <input
              className="input"
              type="datetime-local"
              value={values.endAt}
              onChange={(e) => setValues({ ...values, endAt: e.target.value })}
            />
          </label>
        </div>
        <label>
          <span className="label">Description</span>
          <textarea
            className="input min-h-28"
            value={values.description}
            onChange={(e) =>
              setValues({ ...values, description: e.target.value })
            }
            placeholder="Add helpful details for students"
          />
        </label>
      </div>
    </Modal>
  );
}
