import { NotFoundException } from "@nestjs/common";
import { CalendarService } from "./calendar.service";

describe("CalendarService privacy", () => {
  it("does not update a task that belongs to another student", async () => {
    const prisma = {
      studentCalendarTask: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
    } as any;
    const service = new CalendarService(prisma);

    await expect(
      service.updateTask("student-a", "student-b-task", { completed: true }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.studentCalendarTask.findFirst).toHaveBeenCalledWith({
      where: { id: "student-b-task", userId: "student-a" },
    });
    expect(prisma.studentCalendarTask.update).not.toHaveBeenCalled();
  });

  it("updates a student's own task after the ownership check", async () => {
    const prisma = {
      studentCalendarTask: {
        findFirst: jest.fn().mockResolvedValue({ id: "task", userId: "student-a" }),
        update: jest.fn().mockResolvedValue({ id: "task", completed: true }),
      },
    } as any;
    const service = new CalendarService(prisma);

    await expect(service.updateTask("student-a", "task", { completed: true })).resolves.toMatchObject({
      completed: true,
    });
    expect(prisma.studentCalendarTask.update).toHaveBeenCalledWith({
      where: { id: "task" },
      data: { completed: true },
    });
  });
});
