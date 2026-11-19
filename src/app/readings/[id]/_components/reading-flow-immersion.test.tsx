import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import type { ReactNode } from "react";

const mockPush = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  usePathname: () => "/readings/42",
  useSearchParams: () => new URLSearchParams(),
}));

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

jest.mock("@/context", () => ({
  useAuth: () => ({
    user: {
      id: 7,
      email: "learner@example.com",
      fullName: "Ada Lovelace",
      subscriptionTier: "dolly_pro",
      currentStreak: 3,
      lastStreakDate: null,
      emailVerifiedAt: "2026-11-10T10:00:00.000Z",
      locale: "es",
      createdAt: "2026-11-10T10:00:00.000Z",
    },
    accessPhase: "ready",
    isAuthenticated: true,
  }),
}));

import { ReadingDetailView } from "@/app/readings/[id]/_components/reading-detail-view";
import { EvaluationView } from "@/app/readings/[id]/evaluate/_components/evaluation-view";
import { EvaluationResultView } from "@/app/readings/[id]/result/_components/evaluation-result-view";
import { LocaleProvider } from "@/i18n";
import { type ReadingDto, readingsService } from "@/lib";

function Wrapper({ children }: { children: ReactNode }) {
  return <LocaleProvider initialLocale="es">{children}</LocaleProvider>;
}

const FRENCH_READING: ReadingDto = {
  id: 42,
  userId: 7,
  title: "La philosophie quotidienne à Paris",
  description: "Une introduction claire à la réflexion critique.",
  content:
    "La philosophie antique encourage chaque citoyen curieux à réfléchir avec méthode et discernement dans sa vie quotidienne.",
  category: "Día de Muertos",
  difficulty: "easy",
  language: "fr",
  wordCount: 16,
  status: "pending",
  score: null,
  feedback: null,
  userResponse: null,
  passed: null,
  createdAt: "2026-11-13T12:00:00.000Z",
  updatedAt: null,
  deletedAt: null,
};

describe("Immersive reading flow localization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.clear();
    document.documentElement.lang = "es";
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders ReadingDetailView and ContextTranslationPopover in French for a French reading while preserving raw category name", async () => {
    const user = userEvent.setup();
    jest.spyOn(readingsService, "getById").mockResolvedValue({
      message: "OK",
      data: FRENCH_READING,
    });
    jest.spyOn(readingsService, "listExplanations").mockResolvedValue({
      message: "OK",
      data: [],
    });
    jest.spyOn(readingsService, "explain").mockResolvedValue({
      message: "OK",
      data: {
        id: 501,
        word: "philosophie",
        entryType: "word",
        language: "fr",
        difficulty: "easy",
        literalMeaning: "Amour de la sagesse et de la pensée rationnelle.",
        explanation:
          "Dans ce texte, ce nom désigne la pratique structurée de la réflexion critique.",
        wordBreakdown: [
          {
            token: "philosophie",
            lemma: "philosophie",
            partOfSpeech: "Nom féminin",
            literalDefinition: "Recherche rationnelle du savoir.",
            roleInPhrase: "Sujet principal",
          },
        ],
        otherWaysToSay: [
          {
            expression: "réflexion critique",
            register: "Soutenu",
            note: "Met l'accent sur l'analyse méthodique.",
          },
        ],
        otherContexts: [
          {
            contextLabel: "Vie quotidienne",
            explanation: "Principe général qui guide une manière d'agir.",
            example: "Sa philosophie de travail repose sur l'écoute.",
          },
        ],
        isSaved: false,
        cached: false,
        reading: FRENCH_READING,
      },
    });

    const { container } = render(<ReadingDetailView readingId="42" />, {
      wrapper: Wrapper,
    });

    expect(await screen.findByText("RETOUR AUX LECTURES")).toBeInTheDocument();
    expect(screen.getByText("[FR] FRANÇAIS")).toBeInTheDocument();
    expect(screen.getByText("FACILE")).toBeInTheDocument();
    expect(screen.queryByText(/A1–A2/)).not.toBeInTheDocument();
    expect(screen.getByText("DÍA DE MUERTOS")).toBeInTheDocument();
    expect(screen.getByText("1 MIN DE LECTURE")).toBeInTheDocument();
    expect(screen.getByText("CONTINUER L'ÉVALUATION")).toBeInTheDocument();
    expect(screen.getByText("Revenir à la configuration")).toBeInTheDocument();

    // Atajos de navegacion junto al boton de volver a la configuracion.
    expect(screen.getByText("Aller à l'accueil")).toBeInTheDocument();
    expect(screen.getByText("Aller aux lectures")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Aller à l'accueil/i }),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("link", { name: /Aller aux lectures/i }),
    ).toHaveAttribute("href", "/readings");

    expect(screen.queryByText("VOLVER A LECTURAS")).not.toBeInTheDocument();
    expect(screen.queryByText(/FÁCIL|BÁSICO/)).not.toBeInTheDocument();
    expect(
      screen.queryByText("CONTINUAR CON LA EVALUACIÓN"),
    ).not.toBeInTheDocument();

    expect(document.documentElement.lang).toBe("fr");
    expect(container.querySelector('[lang="fr"]')).toBeInTheDocument();

    const vocabChip = screen.getByRole("button", { name: /philosophie/i });
    await user.click(vocabChip);

    const aside = await screen.findByRole("complementary", {
      name: /AIDE & EXPLICATION • IA/i,
    });
    expect(within(aside).getByText("[FR] FRANÇAIS · FACILE")).toBeInTheDocument();
    expect(within(aside).getByText("Sens littéral")).toBeInTheDocument();
    expect(
      within(aside).getByText("Ce que cela signifie dans cette lecture"),
    ).toBeInTheDocument();
    expect(within(aside).getByText("Analyse mot à mot")).toBeInTheDocument();
    expect(
      within(aside).getByText("Autres façons de le dire"),
    ).toBeInTheDocument();
    expect(
      within(aside).getByText("Autres contextes d'usage"),
    ).toBeInTheDocument();
    expect(
      within(aside).getByRole("button", { name: "Fermer l'aide" }),
    ).toBeInTheDocument();
  });

  it("renders EvaluationView completely in Italian for an Italian reading", async () => {
    const italianReading: ReadingDto = {
      ...FRENCH_READING,
      id: 77,
      title: "Architettura rinascimentale a Firenze",
      content:
        "Gli architetti fiorentini studiarono le proporzioni classiche con rigore geometrico.",
      difficulty: "medium",
      language: "it",
    };
    jest.spyOn(readingsService, "getById").mockResolvedValue({
      message: "OK",
      data: italianReading,
    });

    render(<EvaluationView readingId="77" />, { wrapper: Wrapper });

    expect(
      await screen.findByText("Torna al testo originale"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Valutazione della comprensione contestuale"),
    ).toBeInTheDocument();
    expect(screen.getByText("CRITERI DI RISPOSTA")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Invia riassunto per la valutazione IA",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Salva bozza" }),
    ).toBeInTheDocument();
    // El indicador de sesion activa y su temporizador se eliminaron: el
    // backend nunca recibio esa medicion.
    expect(screen.queryByText(/SESSIONE ATTIVA/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d{2}:\d{2}/)).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("lang", "it");
    expect(document.documentElement.lang).toBe("it");
  });

  it("renders EvaluationResultView completely in French and omits the CEFR footer notice", async () => {
    const completedFrenchReading: ReadingDto = {
      ...FRENCH_READING,
      status: "completed",
      score: 88,
      passed: true,
      feedback: "Très bonne synthèse de l'argument principal.",
      userResponse:
        "La philosophie invite chaque citoyen curieux à réfléchir avec méthode dans sa vie quotidienne.",
      updatedAt: "2026-11-14T15:30:00.000Z",
    };
    jest.spyOn(readingsService, "getById").mockResolvedValue({
      message: "OK",
      data: completedFrenchReading,
    });

    render(<EvaluationResultView readingId="42" />, { wrapper: Wrapper });

    expect(await screen.findByText("RETOUR AUX LECTURES")).toBeInTheDocument();
    expect(screen.getByText("• ÉVALUATION TERMINÉE")).toBeInTheDocument();
    expect(
      screen.getByText("INDICE GLOBAL D'ASSIMILATION"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("NIVEAU DE COMPRÉHENSION : VALIDÉ"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("OBSERVATION GÉNÉRALE DE L'IA"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Générer une nouvelle lecture" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voir mes lectures terminées" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Accueil" })).toBeInTheDocument();
    expect(
      screen.queryByText(/Marco de evaluación contextual alineado/i),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(document.documentElement.lang).toBe("fr");
    });
  });
});
