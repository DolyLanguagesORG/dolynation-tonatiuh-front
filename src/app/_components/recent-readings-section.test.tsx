import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";

import { RecentReadingsSection } from "@/app/_components/recent-readings-section";
import { mapDtoToHomeReading } from "@/app/_hooks/use-home-dashboard";
import { dictionaries as i18nDictionaries } from "@/i18n";
import { type ReadingDto } from "@/lib";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

function makeReading(overrides: Partial<ReadingDto>): ReadingDto {
  return {
    id: 1,
    userId: 10,
    title: "Sample Reading",
    description: "Short reading summary.",
    content: "Word ".repeat(144).trim(),
    category: "philosophy",
    difficulty: "easy",
    language: "en",
    wordCount: 144,
    status: "pending",
    score: null,
    feedback: null,
    userResponse: null,
    passed: null,
    createdAt: "2026-11-14T10:00:00.000Z",
    updatedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

describe("RecentReadingsSection & mapDtoToHomeReading per-card immersion", () => {
  it("immerses each Home reading card in its own reading language while keeping outer section in global UI locale", () => {
    const items = [
      mapDtoToHomeReading(
        makeReading({
          id: 101,
          language: "en",
          difficulty: "easy",
          title: "Neon Skulls on City Walls for Dia de Muertos",
          status: "pending",
          score: null,
        }),
        "es",
      ),
      mapDtoToHomeReading(
        makeReading({
          id: 102,
          language: "fr",
          difficulty: "medium",
          title: "L'architecture durable au XXIe siècle",
          status: "completed",
          score: 88,
          passed: true,
        }),
        "es",
      ),
      mapDtoToHomeReading(
        makeReading({
          id: 103,
          language: "it",
          difficulty: "hard",
          title: "La filosofia del mattino",
          status: "pending",
          score: null,
        }),
        "es",
      ),
      mapDtoToHomeReading(
        makeReading({
          id: 104,
          language: "es",
          difficulty: "easy",
          title: "El perro filósofo y la luz del sol",
          status: "completed",
          score: 94,
          passed: true,
        }),
        "es",
      ),
    ];

    render(
      <RecentReadingsSection
        t={i18nDictionaries.es}
        locale="es"
        isAuthenticated
        isLoadingData={false}
        searchQuery=""
        totalCount={items.length}
        readings={items}
        onSearchChange={() => {}}
      />,
    );

    // Outer dashboard section stays in Spanish
    expect(screen.getByText("ÚLTIMAS LECTURAS REALIZADAS")).toBeTruthy();
    expect(screen.getByText("HISTORIAL COMPLETO")).toBeTruthy();

    const articles = screen.getAllByRole("article");
    expect(articles).toHaveLength(4);

    // English pending card
    const enCard = within(articles[0]);
    expect(articles[0].getAttribute("lang")).toBe("en");
    expect(enCard.getByText("[EN] ENGLISH")).toBeTruthy();
    expect(enCard.getByText("EASY")).toBeTruthy();
    expect(enCard.getByText("PENDING EVALUATION")).toBeTruthy();
    expect(enCard.getByText("2 MIN READ • 144 WORDS")).toBeTruthy();
    expect(enCard.getByRole("link", { name: "EVALUATE" })).toBeTruthy();
    expect(enCard.getByRole("link", { name: "READ" })).toBeTruthy();

    // French completed card
    const frCard = within(articles[1]);
    expect(articles[1].getAttribute("lang")).toBe("fr");
    expect(frCard.getByText("[FR] FRANÇAIS")).toBeTruthy();
    expect(frCard.getByText("MOYEN")).toBeTruthy();
    expect(frCard.getByText("TERMINÉE (88/100)")).toBeTruthy();
    expect(frCard.getByText("2 MIN DE LECTURE • 144 MOTS")).toBeTruthy();
    expect(frCard.getByRole("link", { name: "RETOUR" })).toBeTruthy();
    expect(frCard.getByRole("link", { name: "RELIRE" })).toBeTruthy();

    // Italian pending card
    const itCard = within(articles[2]);
    expect(articles[2].getAttribute("lang")).toBe("it");
    expect(itCard.getByText("[IT] ITALIANO")).toBeTruthy();
    expect(itCard.getByText("DIFFICILE")).toBeTruthy();
    expect(itCard.getByText("IN ATTESA DI VALUTAZIONE")).toBeTruthy();
    expect(itCard.getByText("2 MIN DI LETTURA • 144 PAROLE")).toBeTruthy();
    expect(itCard.getByRole("link", { name: "VALUTA" })).toBeTruthy();
    expect(itCard.getByRole("link", { name: "LEGGI" })).toBeTruthy();

    // Spanish completed card
    const esCard = within(articles[3]);
    expect(articles[3].getAttribute("lang")).toBe("es");
    expect(esCard.getByText("[ES] ESPAÑOL")).toBeTruthy();
    expect(esCard.getByText("FÁCIL")).toBeTruthy();
    expect(esCard.getByText("COMPLETADA (94/100)")).toBeTruthy();
    expect(esCard.getByText("2 MIN LECTURA • 144 PALABRAS")).toBeTruthy();
    expect(esCard.getByRole("link", { name: "FEEDBACK" })).toBeTruthy();
    expect(esCard.getByRole("link", { name: "RELEER" })).toBeTruthy();

    expect(screen.queryByText(/A1|B1|C1|CEFR/)).toBeNull();

    // Bilingual search keywords allow searching by either UI language ("inglés") or immersed label ("english")
    expect(items[0].searchKeywords).toContain("[en] inglés");
    expect(items[0].searchKeywords).toContain("[en] english");
  });
});
