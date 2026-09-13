import { StudentService } from "./student.service";

describe("StudentService leaderboard", () => {
  it("ranks all active students by period points and highlights the current user", async () => {
    const prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "student-a",
            fullName: "A Student",
            statistics: {
              points: 40,
              currentStreak: 4,
              longestStreak: 4,
            },
            dailyLoginRewards: [{ points: 10 }, { points: 10 }],
          },
          {
            id: "student-b",
            fullName: "B Student",
            statistics: {
              points: 80,
              currentStreak: 2,
              longestStreak: 7,
            },
            dailyLoginRewards: [{ points: 10 }, { points: 10 }, { points: 10 }],
          },
          {
            id: "student-c",
            fullName: "C Student",
            statistics: null,
            dailyLoginRewards: [],
          },
        ]),
      },
    } as any;
    const service = new StudentService(prisma);

    const result = await service.leaderboard("student-a", "weekly");

    expect(result.items.map(({ id, rank, periodPoints }) => ({ id, rank, periodPoints })))
      .toEqual([
        { id: "student-b", rank: 1, periodPoints: 30 },
        { id: "student-a", rank: 2, periodPoints: 20 },
        { id: "student-c", rank: 3, periodPoints: 0 },
      ]);
    expect(result.currentUser).toMatchObject({
      id: "student-a",
      rank: 2,
      isCurrentUser: true,
    });
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: "ACTIVE", role: { code: "STUDENT" } },
      }),
    );
  });
});
