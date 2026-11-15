import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";

import { ReadingsHistoryTable } from "@/app/readings/_components/readings-history-table";
import { dictionaries } from "@/i18n";
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

const MIXED_READINGS: ReadingDto[] = [
  {
    id: 1,
    userId: 10,
    title: "Neon Skulls on City Walls",
    description: "Street art in modern cities.",
    content: "Street artists paint walls ".repeat(40).trim(),
    category: "art",
    difficulty: "easy",
    language: "en",
    wordCount: 160,
    status: "pending",
    score: null,
    feedback: null,
    userResponse: null,
    passed: null,
    createdAt: "2026-11-14T10:00:00.000Z",
    updatedAt: null,
    deletedAt: null,
  },
  {
    id: 2,
    userId: 10,
    title: "L'éthique de la lecture",
    description: "Réflexion contemporaine.",
    content: "La lecture critique ouvre des horizons ".repeat(45).trim(),
    category: null,
    difficulty: "medium",
    language: "fr",
    wordCount: 320,
    status: "completed",
    score: 91,
    feedback: "Très bien.",
    userResponse: "Résumé complet.",
    passed: true,
    createdAt: "2026-11-13T10:00:00.000Z",
    updatedAt: "2026-11-13T10:20:00.000Z",
    deletedAt: null,
  },
  {
    id: 3,
    userId: 10,
    title: "Architettura e luce",
    description: "Un saggio breve.",
    content: "La luce modella gli spazi urbani ".repeat(40).trim(),
    category: "design",
    difficulty: "hard",
    language: "it",
    wordCount: 160,
    status: "pending",
    score: null,
    feedback: null,
    userResponse: null,
    passed: null,
    createdAt: "2026-11-12T10:00:00.000Z",
    updatedAt: null,
    deletedAt: null,
  },
];

describe("ReadingsHistoryTable per-row & per-card immersion", () => {
  it("renders table rows and mobile cards immersed in each reading language while keeping headers/pagination in UI locale", async () => {
    const user = userEvent.setup();
    const onDeleteReading = jest.fn<(readingId: number) => Promise<boolean>>(
      async () => true,
    );

    render(
      <ReadingsHistoryTable
        t={dictionaries.es}
        locale="es"
        readings={MIXED_READINGS}
        totalFilteredCount={3}
        currentPage={1}
        totalPages={1}
        hasActiveFilters={false}
        deletingId={null}
        onPageChange={() => {}}
        onResetFilters={() => {}}
        onDeleteReading={onDeleteReading}
      />,
    );

    // Table headers and pagination stay in Spanish global locale
    expect(screen.getByText("TÍTULO DE LA LECTURA")).toBeTruthy();
    expect(screen.getByText("COMPRENSIÓN")).toBeTruthy();
    expect(screen.getByText(/Mostrando 3 de 3 lecturas/i)).toBeTruthy();

    // Desktop rows carry lang attributes and immersed badges/actions
    const rows = screen.getAllByRole("row").slice(1); // skip thead row
    expect(rows).toHaveLength(3);

    const enRow = within(rows[0]);
    expect(rows[0].getAttribute("lang")).toBe("en");
    expect(enRow.getByText("[EN] ENGLISH")).toBeTruthy();
    expect(enRow.getByText("EASY")).toBeTruthy();
    expect(enRow.getByText("PENDING")).toBeTruthy();
    expect(enRow.getByText("ART • 1 MIN READ")).toBeTruthy();
    expect(enRow.getByRole("link", { name: "EVALUATE" })).toBeTruthy();
    expect(enRow.getByRole("link", { name: "READ" })).toBeTruthy();

    const frRow = within(rows[1]);
    expect(rows[1].getAttribute("lang")).toBe("fr");
    expect(frRow.getByText("[FR] FRANÇAIS")).toBeTruthy();
    expect(frRow.getByText("MOYEN")).toBeTruthy();
    expect(frRow.getByText("91/100")).toBeTruthy();
    expect(frRow.getByText("GÉNÉRAL • 2 MIN DE LECTURE")).toBeTruthy();
    expect(frRow.getByRole("link", { name: "DÉTAIL" })).toBeTruthy();
    expect(frRow.getByRole("link", { name: "RELIRE" })).toBeTruthy();

    const itRow = within(rows[2]);
    expect(rows[2].getAttribute("lang")).toBe("it");
    expect(itRow.getByText("[IT] ITALIANO")).toBeTruthy();
    expect(itRow.getByText("DIFFICILE")).toBeTruthy();
    expect(itRow.getByText("IN SOSPESO")).toBeTruthy();
    expect(itRow.getByText("DESIGN • 1 MIN DI LETTURA")).toBeTruthy();
    expect(itRow.getByRole("link", { name: "VALUTA" })).toBeTruthy();
    expect(itRow.getByRole("link", { name: "LEGGI" })).toBeTruthy();

    // Mobile cards also immerse in each reading's language without CEFR codes
    const mobileCards = screen.getAllByRole("article");
    expect(mobileCards).toHaveLength(3);
    expect(mobileCards[0].getAttribute("lang")).toBe("en");
    expect(within(mobileCards[0]).getByText("EASY")).toBeTruthy();
    expect(within(mobileCards[0]).getByText("PENDING")).toBeTruthy();
    expect(mobileCards[1].getAttribute("lang")).toBe("fr");
    expect(within(mobileCards[1]).getByText("[FR] FRANÇAIS")).toBeTruthy();
    expect(within(mobileCards[1]).getByText("MOYEN")).toBeTruthy();
    expect(screen.queryByText(/A1–A2|B1–B2|C1–C2/)).toBeNull();

    // Delete controls inside an English row show English confirmation/cancel buttons
    await user.click(
      enRow.getByRole("button", {
        name: "Delete reading: Neon Skulls on City Walls",
      }),
    );
    expect(enRow.getByRole("button", { name: "Confirm" })).toBeTruthy();
    expect(enRow.getByRole("button", { name: "Cancel" })).toBeTruthy();

    await user.click(enRow.getByRole("button", { name: "Confirm" }));
    expect(onDeleteReading).toHaveBeenCalledWith(1);
  });

  it("switches outer table headers and pagination to French and Italian while keeping rows immersed", () => {
    const noopDelete = jest.fn<(readingId: number) => Promise<boolean>>(
      async () => true,
    );

    const { rerender } = render(
      <ReadingsHistoryTable
        t={dictionaries.fr}
        locale="fr"
        readings={MIXED_READINGS}
        totalFilteredCount={3}
        currentPage={1}
        totalPages={1}
        hasActiveFilters={false}
        deletingId={null}
        onPageChange={() => {}}
        onResetFilters={() => {}}
        onDeleteReading={noopDelete}
      />,
    );

    expect(screen.getByText("TITRE DE LA LECTURE")).toBeTruthy();
    expect(screen.getByText("COMPRÉHENSION")).toBeTruthy();
    expect(screen.getByText(/Affichage de 3 sur 3 lectures/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "PRÉCÉDENT" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "SUIVANT" })).toBeTruthy();

    const rowsFr = screen.getAllByRole("row").slice(1);
    expect(within(rowsFr[0]).getByRole("link", { name: "EVALUATE" })).toBeTruthy();
    expect(within(rowsFr[2]).getByRole("link", { name: "VALUTA" })).toBeTruthy();

    rerender(
      <ReadingsHistoryTable
        t={dictionaries.it}
        locale="it"
        readings={MIXED_READINGS}
        totalFilteredCount={3}
        currentPage={1}
        totalPages={1}
        hasActiveFilters={false}
        deletingId={null}
        onPageChange={() => {}}
        onResetFilters={() => {}}
        onDeleteReading={noopDelete}
      />,
    );

    expect(screen.getByText("TITOLO DELLA LETTURA")).toBeTruthy();
    expect(screen.getByText("COMPRENSIONE")).toBeTruthy();
    expect(screen.getByText(/Visualizzazione di 3 su 3 letture/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "PRECEDENTE" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "SUCCESSIVO" })).toBeTruthy();

    const rowsIt = screen.getAllByRole("row").slice(1);
    expect(within(rowsIt[0]).getByText("PENDING")).toBeTruthy();
    expect(within(rowsIt[1]).getByRole("link", { name: "DÉTAIL" })).toBeTruthy();
  });
});
