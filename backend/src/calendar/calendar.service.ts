import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CalendarRangeDto,
  CreateAcademicEventDto,
  CreateCalendarNoteDto,
  CreateCalendarTaskDto,
  CreateStickyNoteDto,
  UpdateAcademicEventDto,
  UpdateCalendarGoalsDto,
  UpdateCalendarNoteDto,
  UpdateCalendarTaskDto,
  UpdateStickyNoteDto,
} from "./calendar.dto";

const eventFields = {
  id: true,
  title: true,
  eventType: true,
  startAt: true,
  endAt: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AcademicEventSelect;

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async studentCalendar(userId: string, range: CalendarRangeDto) {
    const { from, to } = this.resolveRange(range);
    const [notes, tasks, stickyNotes, goals, events] = await Promise.all([
      this.prisma.studentCalendarNote.findMany({
        where: { userId, date: { gte: from, lte: to } },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      }),
      this.prisma.studentCalendarTask.findMany({
        where: { userId },
        orderBy: [
          { completed: "asc" },
          { dueDate: "asc" },
          { createdAt: "desc" },
        ],
      }),
      this.prisma.studentStickyNote.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.studentCalendarGoal.findUnique({ where: { userId } }),
      this.eventsInRange(from, to),
    ]);
    return { from, to, notes, tasks, stickyNotes, goals, events };
  }

  async adminCalendar(userId: string, range: CalendarRangeDto) {
    const { from, to } = this.resolveRange(range);
    const [notes, events] = await Promise.all([
      this.prisma.studentCalendarNote.findMany({
        where: { userId, date: { gte: from, lte: to } },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      }),
      this.eventsInRange(from, to),
    ]);
    return { from, to, notes, events };
  }

  createNote(userId: string, dto: CreateCalendarNoteDto) {
    return this.prisma.studentCalendarNote.create({
      data: {
        userId,
        date: toDateOnly(dto.date),
        title: dto.title?.trim() || "Note",
        content: dto.content.trim(),
      },
    });
  }

  async updateNote(userId: string, id: string, dto: UpdateCalendarNoteDto) {
    await this.requireNote(userId, id);
    return this.prisma.studentCalendarNote.update({
      where: { id },
      data: {
        ...(dto.date ? { date: toDateOnly(dto.date) } : {}),
        ...(dto.title !== undefined
          ? { title: dto.title.trim() || "Note" }
          : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
      },
    });
  }

  async deleteNote(userId: string, id: string) {
    await this.requireNote(userId, id);
    await this.prisma.studentCalendarNote.delete({ where: { id } });
    return { success: true };
  }

  createStickyNote(userId: string, dto: CreateStickyNoteDto) {
    return this.prisma.studentStickyNote.create({
      data: {
        userId,
        title: dto.title?.trim() || "Quick note",
        content: dto.content.trim(),
        color: dto.color ?? "yellow",
        positionX: dto.positionX ?? 0,
        positionY: dto.positionY ?? 0,
      },
    });
  }

  async updateStickyNote(userId: string, id: string, dto: UpdateStickyNoteDto) {
    await this.requireStickyNote(userId, id);
    return this.prisma.studentStickyNote.update({
      where: { id },
      data: {
        ...(dto.title !== undefined
          ? { title: dto.title.trim() || "Quick note" }
          : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.positionX !== undefined ? { positionX: dto.positionX } : {}),
        ...(dto.positionY !== undefined ? { positionY: dto.positionY } : {}),
      },
    });
  }

  async deleteStickyNote(userId: string, id: string) {
    await this.requireStickyNote(userId, id);
    await this.prisma.studentStickyNote.delete({ where: { id } });
    return { success: true };
  }

  updateGoals(userId: string, dto: UpdateCalendarGoalsDto) {
    const values = compactGoalValues(dto);
    return this.prisma.studentCalendarGoal.upsert({
      where: { userId },
      create: { userId, ...values },
      update: values,
    });
  }

  createTask(userId: string, dto: CreateCalendarTaskDto) {
    return this.prisma.studentCalendarTask.create({
      data: {
        userId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        dueDate: dto.dueDate ? toDateOnly(dto.dueDate) : null,
        priority: dto.priority,
      },
    });
  }

  async updateTask(userId: string, id: string, dto: UpdateCalendarTaskDto) {
    await this.requireTask(userId, id);
    return this.prisma.studentCalendarTask.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: dto.dueDate ? toDateOnly(dto.dueDate) : null }
          : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.completed !== undefined ? { completed: dto.completed } : {}),
      },
    });
  }

  async deleteTask(userId: string, id: string) {
    await this.requireTask(userId, id);
    await this.prisma.studentCalendarTask.delete({ where: { id } });
    return { success: true };
  }

  async createEvent(createdById: string, dto: CreateAcademicEventDto) {
    this.validateEventDates(dto.startAt, dto.endAt);
    return this.prisma.academicEvent.create({
      data: {
        createdById,
        title: dto.title.trim(),
        eventType: dto.eventType,
        startAt: new Date(dto.startAt),
        endAt: dto.endAt ? new Date(dto.endAt) : null,
        description: dto.description?.trim() || null,
      },
      select: eventFields,
    });
  }

  async updateEvent(id: string, dto: UpdateAcademicEventDto) {
    const existing = await this.prisma.academicEvent.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException("Academic event not found");
    const startAt = dto.startAt ?? existing.startAt.toISOString();
    const endAt =
      dto.endAt === undefined ? existing.endAt?.toISOString() : dto.endAt;
    this.validateEventDates(startAt, endAt ?? undefined);
    return this.prisma.academicEvent.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.eventType !== undefined ? { eventType: dto.eventType } : {}),
        ...(dto.startAt !== undefined
          ? { startAt: new Date(dto.startAt) }
          : {}),
        ...(dto.endAt !== undefined
          ? { endAt: dto.endAt ? new Date(dto.endAt) : null }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
      },
      select: eventFields,
    });
  }

  async deleteEvent(id: string) {
    const result = await this.prisma.academicEvent.deleteMany({
      where: { id },
    });
    if (!result.count) throw new NotFoundException("Academic event not found");
    return { success: true };
  }

  private eventsInRange(from: Date, to: Date) {
    return this.prisma.academicEvent.findMany({
      where: {
        startAt: { lte: endOfDay(to) },
        OR: [{ endAt: null }, { endAt: { gte: from } }],
      },
      orderBy: { startAt: "asc" },
      select: eventFields,
    });
  }

  private resolveRange(range: CalendarRangeDto) {
    const now = new Date();
    const from = range.from ? toDateOnly(range.from) : firstDayOfMonth(now);
    const to = range.to ? toDateOnly(range.to) : lastDayOfMonth(now);
    if (from > to) throw new BadRequestException("Calendar range is invalid");
    return { from, to };
  }

  private async requireNote(userId: string, id: string) {
    const note = await this.prisma.studentCalendarNote.findFirst({
      where: { id, userId },
    });
    if (!note) throw new NotFoundException("Note not found");
    return note;
  }

  private async requireStickyNote(userId: string, id: string) {
    const note = await this.prisma.studentStickyNote.findFirst({
      where: { id, userId },
    });
    if (!note) throw new NotFoundException("Sticky note not found");
    return note;
  }

  private async requireTask(userId: string, id: string) {
    const task = await this.prisma.studentCalendarTask.findFirst({
      where: { id, userId },
    });
    if (!task) throw new NotFoundException("Task not found");
    return task;
  }

  private validateEventDates(startAt: string, endAt?: string | null) {
    if (endAt && new Date(endAt) < new Date(startAt))
      throw new BadRequestException(
        "Event end time must be after its start time",
      );
  }
}

const toDateOnly = (value: string) =>
  new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
const endOfDay = (date: Date) =>
  new Date(`${date.toISOString().slice(0, 10)}T23:59:59.999Z`);
const firstDayOfMonth = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const lastDayOfMonth = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
const compactGoalValues = (dto: UpdateCalendarGoalsDto) => ({
  ...(dto.overallTarget !== undefined
    ? { overallTarget: dto.overallTarget.trim() || null }
    : {}),
  ...(dto.longTermGoal !== undefined
    ? { longTermGoal: dto.longTermGoal.trim() || null }
    : {}),
  ...(dto.shortTermGoal !== undefined
    ? { shortTermGoal: dto.shortTermGoal.trim() || null }
    : {}),
  ...(dto.todayGoal !== undefined
    ? { todayGoal: dto.todayGoal.trim() || null }
    : {}),
});
