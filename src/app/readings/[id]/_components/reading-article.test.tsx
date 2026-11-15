import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ReadingArticle } from "@/app/readings/[id]/_components/reading-article";
import { dictionaries } from "@/i18n/dictionaries";

const SAMPLE_PARAGRAPHS = [
  "En el exilio de mil novecientos treinta y nueve, marcado por la ruptura histórica. Lejos de concebir la melancolía como un estado pasivo.",
  "Esta perspectiva innovadora desafió la separación tradicional entre pensamiento y poesía.",
];

function renderArticle(
  overrides: Partial<React.ComponentProps<typeof ReadingArticle>> = {},
) {
  const onSelectWord = jest.fn<(word: string, ctx: string) => void>();
  const t = dictionaries.es.readings;

  const result = render(
    <ReadingArticle
      paragraphs={SAMPLE_PARAGRAPHS}
      language="es"
      fontScale={1}
      selectedWord={null}
      selectionActionLabel={t.selectionActionLabel}
      clearSelectionLabel={t.clearSelectionLabel}
      selectionTooLongNotice={t.selectionTooLongNotice}
      selectionCrossParagraphNotice={t.selectionCrossParagraphNotice}
      onSelectWord={onSelectWord}
      {...overrides}
    />,
  );

  return { ...result, onSelectWord, t };
}

describe("ReadingArticle interactive selection flow", () => {
  afterEach(() => {
    window.getSelection()?.removeAllRanges();
    jest.restoreAllMocks();
  });

  it("highlights a clicked word and waits for explicit confirmation before calling onSelectWord", async () => {
    const user = userEvent.setup();
    const { onSelectWord, t, rerender } = renderArticle();

    const exilioEl = screen.getByText("exilio");
    await user.click(exilioEl);

    // No consulta automáticamente al primer clic
    expect(onSelectWord).not.toHaveBeenCalled();
    expect(exilioEl).toHaveAttribute("data-selected", "pending");

    const confirmBtn = screen.getByRole("button", {
      name: t.selectionActionLabel,
    });
    expect(confirmBtn).toBeVisible();

    await user.click(confirmBtn);
    expect(onSelectWord).toHaveBeenCalledTimes(1);
    expect(onSelectWord).toHaveBeenCalledWith("exilio", SAMPLE_PARAGRAPHS[0]);

    // Al reflejar selectedWord desde el padre, el término permanece resaltado como confirmado
    rerender(
      <ReadingArticle
        paragraphs={SAMPLE_PARAGRAPHS}
        language="es"
        fontScale={1}
        selectedWord="exilio"
        selectionActionLabel={t.selectionActionLabel}
        clearSelectionLabel={t.clearSelectionLabel}
        selectionTooLongNotice={t.selectionTooLongNotice}
        selectionCrossParagraphNotice={t.selectionCrossParagraphNotice}
        onSelectWord={onSelectWord}
      />,
    );

    expect(screen.getByText("exilio")).toHaveAttribute(
      "data-selected",
      "confirmed",
    );
    expect(
      screen.queryByRole("button", { name: t.selectionActionLabel }),
    ).not.toBeInTheDocument();
  });

  it("toggles off a single selected word when clicked a second time, and clears with X or Escape", async () => {
    const user = userEvent.setup();
    const { onSelectWord, t } = renderArticle();

    const exilioEl = screen.getByText("exilio");
    await user.click(exilioEl);
    expect(exilioEl).toHaveAttribute("data-selected", "pending");

    // Segundo clic sobre la misma palabra única la deselecciona
    await user.click(exilioEl);
    expect(exilioEl).not.toHaveAttribute("data-selected");
    expect(
      screen.queryByRole("button", { name: t.selectionActionLabel }),
    ).not.toBeInTheDocument();

    // Limpiar con botón ×
    await user.click(exilioEl);
    await user.click(
      screen.getByRole("button", { name: t.clearSelectionLabel }),
    );
    expect(exilioEl).not.toHaveAttribute("data-selected");

    // Limpiar con tecla Escape
    await user.click(exilioEl);
    expect(exilioEl).toHaveAttribute("data-selected", "pending");
    await user.keyboard("{Escape}");
    expect(exilioEl).not.toHaveAttribute("data-selected");
    expect(onSelectWord).not.toHaveBeenCalled();
  });

  it("builds a contiguous range across words and sentences within the same paragraph, keeping confirmed highlight", async () => {
    const user = userEvent.setup();
    const { onSelectWord, t, rerender } = renderArticle();

    // Clic inicial en "exilio", luego salto cruzando una oración hasta "melancolía" en el mismo párrafo
    await user.click(screen.getByText("exilio"));
    await user.click(screen.getByText("melancolía"));

    expect(screen.getByText("exilio")).toHaveAttribute(
      "data-selected",
      "pending",
    );
    expect(screen.getByText("ruptura")).toHaveAttribute(
      "data-selected",
      "pending",
    );
    expect(screen.getByText("Lejos")).toHaveAttribute(
      "data-selected",
      "pending",
    );
    expect(screen.getByText("melancolía")).toHaveAttribute(
      "data-selected",
      "pending",
    );
    expect(screen.getByText("En")).not.toHaveAttribute("data-selected");

    await user.click(
      screen.getByRole("button", { name: t.selectionActionLabel }),
    );

    const expectedPhrase =
      "exilio de mil novecientos treinta y nueve, marcado por la ruptura histórica. Lejos de concebir la melancolía";
    expect(onSelectWord).toHaveBeenCalledWith(
      expectedPhrase,
      SAMPLE_PARAGRAPHS[0],
    );

    rerender(
      <ReadingArticle
        paragraphs={SAMPLE_PARAGRAPHS}
        language="es"
        fontScale={1}
        selectedWord={expectedPhrase}
        selectionActionLabel={t.selectionActionLabel}
        clearSelectionLabel={t.clearSelectionLabel}
        selectionTooLongNotice={t.selectionTooLongNotice}
        selectionCrossParagraphNotice={t.selectionCrossParagraphNotice}
        onSelectWord={onSelectWord}
      />,
    );

    expect(screen.getByText("exilio")).toHaveAttribute(
      "data-selected",
      "confirmed",
    );
    expect(screen.getByText("ruptura")).toHaveAttribute(
      "data-selected",
      "confirmed",
    );
    expect(screen.getByText("melancolía")).toHaveAttribute(
      "data-selected",
      "confirmed",
    );
  });

  it("resets selection when clicking a word in a different paragraph", async () => {
    const user = userEvent.setup();
    const { onSelectWord, t } = renderArticle();

    await user.click(screen.getByText("exilio"));
    expect(screen.getByText("exilio")).toHaveAttribute(
      "data-selected",
      "pending",
    );

    // Clic en el segundo párrafo reinicia el rango en el nuevo párrafo
    const innovadoraEl = screen.getByText("innovadora");
    await user.click(innovadoraEl);

    expect(screen.getByText("exilio")).not.toHaveAttribute("data-selected");
    expect(innovadoraEl).toHaveAttribute("data-selected", "pending");

    await user.click(
      screen.getByRole("button", { name: t.selectionActionLabel }),
    );
    expect(onSelectWord).toHaveBeenCalledWith(
      "innovadora",
      SAMPLE_PARAGRAPHS[1],
    );
  });

  it("supports keyboard navigation within a paragraph via Arrow keys, Enter, and Space", async () => {
    const user = userEvent.setup();
    const { container, onSelectWord, t } = renderArticle();

    const paragraphTwo = container.querySelector(
      'p[data-paragraph-index="1"]',
    ) as HTMLParagraphElement;
    paragraphTwo.focus();

    await user.keyboard("{ArrowRight}{Enter}");
    expect(onSelectWord).not.toHaveBeenCalled();
    expect(screen.getByText("Esta")).toHaveAttribute("data-selected", "pending");

    await user.keyboard("{ArrowRight} ");
    expect(screen.getByText("Esta")).toHaveAttribute("data-selected", "pending");
    expect(screen.getByText("perspectiva")).toHaveAttribute(
      "data-selected",
      "pending",
    );

    await user.click(
      screen.getByRole("button", { name: t.selectionActionLabel }),
    );
    expect(onSelectWord).toHaveBeenCalledWith(
      "Esta perspectiva",
      SAMPLE_PARAGRAPHS[1],
    );
  });

  it("warns and prevents lookup when selection exceeds 500 characters", async () => {
    const user = userEvent.setup();
    const longParagraph = `Inicio ${Array.from({ length: 85 }, (_, i) => `palabra${i}`).join(" ")} cierre.`;
    const { onSelectWord, t } = renderArticle({
      paragraphs: [longParagraph],
    });

    await user.click(screen.getByText("Inicio"));
    await user.click(screen.getByText("cierre."));

    expect(screen.getByText(/Máx\. 500 caracteres/)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: t.selectionActionLabel }),
    ).not.toBeInTheDocument();
    expect(onSelectWord).not.toHaveBeenCalled();
  });

  it("captures mouse drag selection within one paragraph and warns on cross-paragraph drag", async () => {
    const user = userEvent.setup();
    const { onSelectWord, t } = renderArticle();

    const startNode = screen.getByText("marcado").firstChild!;
    const endNode = screen.getByText("ruptura").firstChild!;
    const singleParaRange = document.createRange();
    singleParaRange.setStart(startNode, 0);
    singleParaRange.setEnd(endNode, "ruptura".length);

    const mockSel = {
      isCollapsed: false,
      rangeCount: 1,
      getRangeAt: () => singleParaRange,
      toString: () => "marcado por la ruptura",
      removeAllRanges: jest.fn(),
    } as unknown as Selection;

    jest.spyOn(window, "getSelection").mockReturnValue(mockSel);

    fireEvent.mouseUp(screen.getByText("ruptura"));

    expect(screen.getByText("marcado")).toHaveAttribute(
      "data-selected",
      "pending",
    );
    expect(screen.getByText("por")).toHaveAttribute("data-selected", "pending");
    expect(screen.getAllByText("la")[0]).toHaveAttribute(
      "data-selected",
      "pending",
    );
    expect(screen.getByText("ruptura")).toHaveAttribute(
      "data-selected",
      "pending",
    );

    await user.click(
      screen.getByRole("button", { name: t.selectionActionLabel }),
    );
    expect(onSelectWord).toHaveBeenCalledWith(
      "marcado por la ruptura",
      SAMPLE_PARAGRAPHS[0],
    );

    // Ahora probar arrastre entre dos párrafos distintos
    const p1EndNode = screen.getByText("innovadora").firstChild!;
    const crossRange = document.createRange();
    crossRange.setStart(startNode, 0);
    crossRange.setEnd(p1EndNode, "innovadora".length);

    jest.spyOn(window, "getSelection").mockReturnValue({
      isCollapsed: false,
      rangeCount: 1,
      getRangeAt: () => crossRange,
      toString: () => "marcado ... innovadora",
      removeAllRanges: jest.fn(),
    } as unknown as Selection);

    fireEvent.mouseUp(screen.getByText("innovadora"));
    expect(screen.getByText(t.selectionCrossParagraphNotice)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: t.selectionActionLabel }),
    ).not.toBeInTheDocument();
  });
});
