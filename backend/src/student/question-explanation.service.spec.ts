import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { Logger } from "@nestjs/common";
import { validate } from "class-validator";
import { QuestionExplanationService } from "./question-explanation.service";
import { ExplainQuestionDto } from "./student.dto";
import { StudentService } from "./student.service";

const providerResponse = (text = "**B: 4.** Two plus two is four.") => ({
  ok: true,
  json: async () => ({
    status: "completed",
    output: [{ type: "message", content: [{ type: "output_text", text }] }],
  }),
});

describe("per-question AI explanations", () => {
  const setup = (apiKey = "test-key") => {
    const question = {
      id: "q1",
      order: 1,
      text: "What is 2 + 2?",
      textHi: "दो और दो कितने हैं?",
      explanation: "Add two twice.",
      explanationHi: null,
      imageUrl: null,
      options: [
        {
          id: "a",
          label: "A",
          text: "3",
          textHi: null,
          isCorrect: false,
          imageUrl: null,
        },
        {
          id: "b",
          label: "B",
          text: "4",
          textHi: null,
          isCorrect: true,
          imageUrl: null,
        },
      ],
    };
    const attempt = {
      status: "SUBMITTED",
      exam: {
        title: "Private exam title",
        settings: { showResultImmediately: true, allowAnswerReview: true },
        questions: [
          question,
          { ...question, id: "q2", text: "Unrelated private question" },
        ],
      },
      answers: [
        {
          questionId: "q1",
          selectedOptionId: "a",
          isCorrect: false,
          marksAwarded: 0,
        },
      ],
    };
    const prisma = {
      attempt: { findFirst: jest.fn().mockResolvedValue(attempt) },
    };
    const student = new StudentService(prisma as any);
    const config = new ConfigService({ OPENAI_API_KEY: apiKey });
    return {
      question,
      attempt,
      prisma,
      service: new QuestionExplanationService(student, config),
    };
  };

  let fetchMock: jest.SpyInstance;
  beforeEach(() => {
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(providerResponse() as Response);
  });
  afterEach(() => jest.restoreAllMocks());

  it("sends only the requested question's saved context, not other questions or personal identifiers", async () => {
    const { service, prisma } = setup();
    await expect(
      service.explain("student", "attempt", "q1"),
    ).resolves.toMatchObject({
      questionId: "q1",
      language: "en",
      explanation: expect.stringContaining("B: 4"),
    });
    expect(prisma.attempt.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "attempt", userId: "student" },
        include: expect.objectContaining({
          answers: { where: { questionId: "q1" } },
          exam: {
            include: expect.objectContaining({
              questions: expect.objectContaining({ where: { id: "q1" } }),
            }),
          },
        }),
      }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    const context = JSON.parse(body.input[0].content[0].text);
    expect(context).toMatchObject({
      question: "What is 2 + 2?",
      selectedAnswer: "A",
      correctAnswers: ["B"],
      options: [{ selected: true }, { correctInAnswerKey: true }],
    });
    expect(JSON.stringify(context)).not.toMatch(
      /Unrelated private|Private exam title|student|attempt/,
    );
    expect(body.store).toBe(false);
  });

  it.each(["active", "unreleased", "disabled", "not-owned", "wrong-question"])(
    "denies %s access without contacting the provider",
    async (scenario) => {
      const { service, attempt, prisma } = setup();
      if (scenario === "active") attempt.status = "IN_PROGRESS";
      if (scenario === "unreleased")
        attempt.exam.settings.showResultImmediately = false;
      if (scenario === "disabled")
        attempt.exam.settings.allowAnswerReview = false;
      if (scenario === "not-owned")
        prisma.attempt.findFirst.mockResolvedValue(null);
      await expect(
        service.explain(
          "student",
          "attempt",
          scenario === "wrong-question" ? "q3" : "q1",
        ),
      ).rejects.toThrow();
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("supports unattempted questions without a key and Hindi with English fallback", async () => {
    const { service, attempt, question } = setup();
    attempt.answers = [];
    question.options[1].isCorrect = false;
    await service.explain("student", "attempt", "q1", "hi");
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.instructions).toContain("Write in Hindi");
    expect(JSON.parse(body.input[0].content[0].text)).toMatchObject({
      question: question.textHi,
      selectedAnswer: null,
      correctAnswers: [],
      existingExplanation: "Add two twice.",
    });
  });

  it("returns an actionable error when no API key is configured", async () => {
    await expect(
      setup("").service.explain("student", "attempt", "q1"),
    ).rejects.toThrow("not configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["http", "timeout", "empty", "incomplete"])(
    "handles %s provider failures and allows retry",
    async (failure) => {
      if (failure === "http") fetchMock.mockResolvedValueOnce({ ok: false });
      if (failure === "timeout")
        fetchMock.mockRejectedValueOnce(new Error("timeout with secret"));
      if (failure === "empty")
        fetchMock.mockResolvedValueOnce(providerResponse(""));
      if (failure === "incomplete")
        fetchMock.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ status: "incomplete", output: [] }),
        });
      const { service } = setup();
      await expect(service.explain("student", "attempt", "q1")).rejects.toThrow(
        "AI could not explain this question right now. Please try again.",
      );
      await expect(
        service.explain("student", "attempt", "q1"),
      ).resolves.toHaveProperty("explanation");
    },
  );

  it.each([
    ["credit_balance_exhausted", "insufficient_quota", 429, 503, "API credits"],
    ["insufficient_quota", "invalid_request_error", 429, 503, "API credits"],
    [
      "billing_hard_limit_reached",
      "invalid_request_error",
      400,
      503,
      "billing limit",
    ],
    ["rate_limit_exceeded", "rate_limit_error", 429, 429, "wait a minute"],
    ["invalid_api_key", "invalid_request_error", 401, 503, "credentials"],
    ["permission_denied", "invalid_request_error", 403, 503, "permissions"],
    [
      "model_not_found",
      "invalid_request_error",
      404,
      503,
      "model is unavailable",
    ],
    ["server_error", "server_error", 500, 502, "Please try again"],
  ])(
    "classifies %s without exposing provider details",
    async (code, type, status, expectedStatus, message) => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status,
        json: async () => ({
          error: {
            code,
            type,
            message: "secret-key and private question content",
          },
        }),
      });
      const { service } = setup();
      const error = await service
        .explain("student", "attempt", "q1")
        .catch((value) => value);
      expect(error.getStatus()).toBe(expectedStatus);
      expect(error.message).toContain(message);
      expect(error.message).not.toContain("secret-key");
      expect(
        JSON.stringify(jest.mocked(Logger.prototype.warn).mock.calls),
      ).not.toContain("secret-key");
      await expect(
        service.explain("student", "attempt", "q1"),
      ).resolves.toHaveProperty("explanation");
    },
  );

  it.each([
    [
      Object.assign(new Error("private timeout details"), {
        name: "TimeoutError",
      }),
      504,
      "too long",
    ],
    [new TypeError("fetch failed"), 503, "could not be reached"],
  ])(
    "reports a transport failure safely: %s",
    async (failure, status, message) => {
      fetchMock.mockRejectedValueOnce(failure);
      const error = await setup()
        .service.explain("student", "attempt", "q1")
        .catch((value) => value);
      expect(error.getStatus()).toBe(status);
      expect(error.message).toContain(message);
    },
  );

  it("deduplicates simultaneous requests for the same question", async () => {
    const { service } = setup();
    const results = await Promise.all([
      service.explain("student", "attempt", "q1"),
      service.explain("student", "attempt", "q1"),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results[0]).toEqual(results[1]);
  });

  it("includes associated remote question and option images", async () => {
    const { service, question } = setup();
    Object.assign(question, { imageUrl: "https://example.com/question.png" });
    Object.assign(question.options[0], {
      imageUrl: "https://example.com/option.png",
    });
    await service.explain("student", "attempt", "q1");
    const content = JSON.parse(fetchMock.mock.calls[0][1].body).input[0]
      .content;
    expect(
      content.filter((part: { type: string }) => part.type === "input_image"),
    ).toEqual([
      { type: "input_image", image_url: question.imageUrl, detail: "auto" },
      {
        type: "input_image",
        image_url: question.options[0].imageUrl,
        detail: "auto",
      },
    ]);
  });

  it("rejects unsafe local image paths without calling AI", async () => {
    const { service, question } = setup();
    Object.assign(question, { imageUrl: "/uploads/../private/secret.png" });
    await expect(service.explain("student", "attempt", "q1")).rejects.toThrow(
      "image is unavailable",
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("validates the requested response language", async () => {
    expect(
      await validate(
        Object.assign(new ExplainQuestionDto(), { language: null }),
      ),
    ).toHaveLength(1);
    expect(
      await validate(
        Object.assign(new ExplainQuestionDto(), { language: "fr" }),
      ),
    ).toHaveLength(1);
    expect(await validate(new ExplainQuestionDto())).toHaveLength(0);
  });
});
