import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { PaperAssistantService } from "./paper-assistant.service";

describe("Moni paper assistant", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loads the owned review context on the server and sends no browser supplied paper data", async () => {
    const review = jest.fn().mockResolvedValue({
      exam: { title: "Private exam", titleHi: null },
      questions: [
        {
          id: "q1",
          order: 1,
          text: "What is 2 + 2?",
          textHi: null,
          explanation: "Add two twice.",
          explanationHi: null,
          selectedOptionId: "a",
          options: [
            { id: "a", label: "A", text: "3", textHi: null, isCorrect: false },
            { id: "b", label: "B", text: "4", textHi: null, isCorrect: true },
          ],
        },
      ],
    });
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: "**B: 4**" } }] }),
    } as Response);
    const service = new PaperAssistantService(
      { review } as any,
      new ConfigService({ OPENAI_API_KEY: "test-key" }),
    );

    await expect(service.ask("student", "attempt", "Why is B correct?", "en")).resolves.toEqual({
      answer: "**B: 4**",
    });
    expect(review).toHaveBeenCalledWith("student", "attempt");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.messages[1].content).toContain("Why is B correct?");
    expect(body.messages[1].content).toContain("What is 2 + 2?");
    expect(body.messages[1].content).not.toContain("student");
    expect(body.messages[1].content).not.toContain("attempt");
  });
});
