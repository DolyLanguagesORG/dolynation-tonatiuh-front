import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

jest.mock("@/context", () => ({
  useAuth: () => ({
    user: { id: 1, email: "student@test.com" },
    isAuthenticated: true,
  }),
}));

import { useReadingEvaluation } from "@/app/readings/[id]/evaluate/_hooks/use-reading-evaluation";
import { LocaleProvider } from "@/i18n";
import { type ReadingDto, readingsService } from "@/lib";

function Wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider initialLocale="es">{children}</LocaleProvider>;
}

const SAMPLE_READING: ReadingDto = {
  id: 14,
  userId: 1,
  title: "Sustainable Mobility",
  description: "Urban transit evolution",
  content:
    "Modern cities redesign public corridors to accelerate sustainable electric mobility and pedestrian safety.",
  category: "technology",
  difficulty: "medium",
  language: "en",
  wordCount: 15,
  status: "pending",
  score: null,
  feedback: null,
  userResponse: null,
  passed: null,
  createdAt: "2026-11-13T00:00:00.000Z",
  updatedAt: null,
  deletedAt: null,
};

describe("useReadingEvaluation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    jest.spyOn(readingsService, "getById").mockResolvedValue({
      message: "OK",
      data: SAMPLE_READING,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("blocks submission under 15 words, persists local draft, and clears draft after successful evaluation", async () => {
    const evaluateSpy = jest
      .spyOn(readingsService, "evaluate")
      .mockResolvedValue({
        message: "Evaluated",
        data: {
          score: 92,
          passed: true,
          feedback: "Clear synthesis.",
          userResponse:
            "Cities are transforming urban mobility corridors with electric transit systems to reduce emissions and improve safety.",
          reading: { ...SAMPLE_READING, status: "completed", score: 92, passed: true },
        },
      });

    const { result } = renderHook(() => useReadingEvaluation("14"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.updateResponseText("too short summary");
    });

    expect(window.localStorage.getItem("doly-eval-draft-14")).toBe(
      "too short summary",
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.validationError).toBeTruthy();
    expect(evaluateSpy).not.toHaveBeenCalled();

    const validSummary =
      "Modern cities are redesigning public corridors to accelerate sustainable electric mobility and make pedestrian streets much safer for daily commuters.";

    act(() => {
      result.current.updateResponseText(validSummary);
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(evaluateSpy).toHaveBeenCalledWith(14, {
      userResponse: validSummary,
    });
    expect(window.localStorage.getItem("doly-eval-draft-14")).toBeNull();
    expect(mockPush).toHaveBeenCalledWith("/readings/14/result");
  });
});
