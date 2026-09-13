import {
  indiaCalendarDate,
  leaderboardDateRange,
  previousCalendarDate,
} from "./engagement-period";

describe("engagement calendar periods", () => {
  it("uses the India calendar day even before midnight UTC", () => {
    expect(indiaCalendarDate(new Date("2026-09-12T20:00:00.000Z")))
      .toEqual(new Date("2026-09-13T00:00:00.000Z"));
  });

  it("creates Monday-based weekly and calendar-month ranges", () => {
    const now = new Date("2026-09-13T08:00:00.000Z");
    expect(leaderboardDateRange("weekly", now)).toEqual({
      start: new Date("2026-09-07T00:00:00.000Z"),
      end: new Date("2026-09-14T00:00:00.000Z"),
    });
    expect(leaderboardDateRange("monthly", now)).toEqual({
      start: new Date("2026-09-01T00:00:00.000Z"),
      end: new Date("2026-09-14T00:00:00.000Z"),
    });
    expect(previousCalendarDate(new Date("2026-09-13T00:00:00.000Z")))
      .toEqual(new Date("2026-09-12T00:00:00.000Z"));
  });
});
