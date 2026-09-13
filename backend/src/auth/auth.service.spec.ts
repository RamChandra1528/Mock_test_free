import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { Language } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  const tx = {
    studentDailyLoginReward: { createMany: jest.fn() },
    userStatistic: { findUnique: jest.fn(), upsert: jest.fn() },
  };
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn() },
    $transaction: jest.fn((callback) => callback(tx)),
  } as any;
  const jwt = { signAsync: jest.fn().mockResolvedValue("signed-token") } as any;
  const service = new AuthService(prisma, jwt);
  beforeEach(() => {
    jest.clearAllMocks();
    tx.studentDailyLoginReward.createMany.mockResolvedValue({ count: 1 });
    tx.userStatistic.findUnique.mockResolvedValue(null);
    tx.userStatistic.upsert.mockResolvedValue({
      points: 10,
      currentStreak: 1,
      longestStreak: 1,
    });
  });

  it("rejects mismatched registration passwords", async () => {
    await expect(
      service.register({
        fullName: "A User",
        email: "a@example.com",
        password: "Strong@123",
        confirmPassword: "Other@123",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it("rejects an invalid login without revealing which credential failed", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: "missing@example.com", password: "wrong" }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it("persists the language selected before registration", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: "1",
      fullName: "A User",
      email: "a@example.com",
      preferredLanguage: Language.HI,
      role: { code: "STUDENT" },
    });

    const result = await service.register({
      fullName: "A User",
      email: "a@example.com",
      password: "Strong@123",
      confirmPassword: "Strong@123",
      preferredLanguage: Language.HI,
    });

    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ preferredLanguage: Language.HI }),
      }),
    );
    expect(result.user.preferredLanguage).toBe(Language.HI);
  });
  it("returns a JWT and never returns the password hash", async () => {
    const passwordHash = await bcrypt.hash("Strong@123", 4);
    prisma.user.findUnique.mockResolvedValue({
      id: "1",
      fullName: "A User",
      email: "a@example.com",
      passwordHash,
      role: { code: "STUDENT" },
      status: "ACTIVE",
      preferredLanguage: Language.HI,
    });
    const result = await service.login({
      email: "a@example.com",
      password: "Strong@123",
    });
    expect(result).toMatchObject({
      token: "signed-token",
      user: { email: "a@example.com", preferredLanguage: Language.HI },
    });
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(result.dailyReward).toMatchObject({
      awardedPoints: 10,
      totalPoints: 10,
      currentStreak: 1,
    });
  });

  it("does not award login points twice on the same calendar day", async () => {
    const passwordHash = await bcrypt.hash("Strong@123", 4);
    prisma.user.findUnique.mockResolvedValue({
      id: "1",
      fullName: "A User",
      email: "a@example.com",
      passwordHash,
      role: { code: "STUDENT" },
      status: "ACTIVE",
      preferredLanguage: Language.EN,
    });
    tx.studentDailyLoginReward.createMany.mockResolvedValue({ count: 0 });
    tx.userStatistic.findUnique.mockResolvedValue({
      points: 40,
      currentStreak: 4,
      longestStreak: 4,
    });

    const result = await service.login({
      email: "a@example.com",
      password: "Strong@123",
    });

    expect(result.dailyReward).toEqual({
      awardedPoints: 0,
      totalPoints: 40,
      currentStreak: 4,
      longestStreak: 4,
    });
    expect(tx.userStatistic.upsert).not.toHaveBeenCalled();
  });
});
