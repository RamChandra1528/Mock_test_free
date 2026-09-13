export type CalendarNote = {
  id: string;
  date: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type StickyNote = {
  id: string;
  title: string;
  content: string;
  color: "yellow" | "pink" | "blue" | "green" | "lavender";
  positionX: number;
  positionY: number;
  updatedAt: string;
};

export type CalendarGoals = {
  id: string;
  overallTarget?: string | null;
  longTermGoal?: string | null;
  shortTermGoal?: string | null;
  todayGoal?: string | null;
  updatedAt: string;
};

export type CalendarTask = {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AcademicEvent = {
  id: string;
  title: string;
  eventType:
    "EXAM" | "ASSIGNMENT" | "CLASS" | "HOLIDAY" | "ANNOUNCEMENT" | "OTHER";
  startAt: string;
  endAt?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StudentCalendarData = {
  notes: CalendarNote[];
  tasks: CalendarTask[];
  stickyNotes: StickyNote[];
  goals?: CalendarGoals | null;
  events: AcademicEvent[];
};
