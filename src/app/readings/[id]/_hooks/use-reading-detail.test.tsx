import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";

jest.mock("@/context", () => ({
  useAuth: () => ({
    user: { id: 1, email: "student@test.com" },
    isAuthenticated: true,
  }),
}));

import { useReadingDetail } from "@/app/readings/[id]/_hooks/use-reading-detail";
import { LocaleProvider } from "@/i18n";
import {
  type ExplanationResultDto,
  iaService,
  type ReadingDto,
  readingsService,
} from "@/lib";

function Wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider initialLocale="es">{children}</LocaleProvider>;
}

const SAMPLE_READING: ReadingDto = {
  id: 21,
  userId: 1,
  title: "Principes essentiels",
  description: "Texte analytique",
  content: "L'observation attentive des procédés permet de saisir chaque étape.",
  category: "history",
  difficulty: "hard",
  language: "fr",
  wordCount: 10,
  status: "pending",
  score: null,
  feedback: null,
  userResponse: null,
  passed: null,
  createdAt: "2026-11-20T00:00:00.000Z",
  updatedAt: null,
  deletedAt: null,
};

const SAMPLE_EXPLANATION: ExplanationResultDto = {
  id: 5,
  word: "procédés",
  entryType: "word",
  language: "fr",
  difficulty: "hard",
  literalMeaning: null,
  explanation: "Méthodes employées.",
  wordBreakdown: [],
  otherWaysToSay: [],
  otherContexts: [],
  isSaved: false,
  cached: false,
  reading: SAMPLE_READING,
};

describe("useReadingDetail.requestDetailedExplanation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest
      .spyOn(readingsService, "getById")
      .mockResolvedValue({ message: "OK", data: SAMPLE_READING });
    jest
      .spyOn(readingsService, "listExplanations")
      .mockResolvedValue({ message: "OK", data: [] });
    jest
      .spyOn(readingsService, "explain")
      .mockResolvedValue({ message: "OK", data: SAMPLE_EXPLANATION });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses the deep explanation endpoint instead of the open /ia/chat", async () => {
    const deepSpy = jest
      .spyOn(readingsService, "deepExplain")
      .mockResolvedValue({
        message: "Deep explanation",
        data: { text: "Explication approfondie." },
      });
    const chatSpy = jest.spyOn(iaService, "chat");

    const { result } = renderHook(() => useReadingDetail("21"), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.selectWord(
        "procédés",
        "L'observation attentive des procédés.",
      );
    });
    await act(async () => {
      await result.current.requestDetailedExplanation();
    });

    expect(deepSpy).toHaveBeenCalledWith(21, {
      word: "procédés",
      context: "L'observation attentive des procédés.",
    });
    expect(chatSpy).not.toHaveBeenCalled();
    expect(result.current.deepExplanation).toBe("Explication approfondie.");
  });
});
