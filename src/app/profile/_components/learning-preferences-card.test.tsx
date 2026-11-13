import { describe, expect, it, jest } from "@jest/globals";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  type ActiveLanguageItem,
  LearningPreferencesCard,
} from "@/app/profile/_components/learning-preferences-card";
import { dictionaries } from "@/i18n/dictionaries";
import {
  type LanguagesSettings,
  type TargetLanguageCode,
} from "@/lib/api-contracts";

function createLanguagesSettings(
  overrides: Partial<LanguagesSettings> = {},
): LanguagesSettings {
  return {
    catalog: [
      { id: "es", name: "Español" },
      { id: "en", name: "Inglés" },
      { id: "fr", name: "Francés" },
      { id: "it", name: "Italiano" },
    ],
    selected: ["en"],
    active: ["en"],
    maxLanguages: 2,
    canChangeFree: false,
    nextFreeChangeAt: "2027-11-13T00:00:00.000Z",
    lastLanguageChangeAt: "2026-11-13T00:00:00.000Z",
    languageChangeCredits: 0,
    ...overrides,
  };
}

const CATEGORIES = [
  { id: "technology", name: "Tecnología" },
  { id: "history", name: "Historia" },
  { id: "education", name: "Educación" },
  { id: "culture", name: "Cultura" },
];

describe("LearningPreferencesCard", () => {
  it("shows open-slot guidance instead of annual-lock badge when dolly_plus only has 1 of 2 languages, and allows adding the 2nd language cleanly", async () => {
    const user = userEvent.setup();
    const onUpdateLanguages = jest.fn<
      (languages: TargetLanguageCode[]) => Promise<boolean>
    >(async () => true);

    const activeLanguages: ActiveLanguageItem[] = [
      { code: "en", name: "Inglés", isPrimary: true },
    ];

    render(
      <LearningPreferencesCard
        t={dictionaries.es}
        locale="es"
        activeLanguages={activeLanguages}
        languagesSettings={createLanguagesSettings({
          selected: ["en"],
          active: ["en"],
          maxLanguages: 2,
          canChangeFree: false,
          languageChangeCredits: 0,
        })}
        categories={CATEGORIES}
        selectedCategoryIds={["technology", "history", "education"]}
        isSaving={false}
        isUnlockingLanguage={false}
        onPromoteLanguage={jest.fn()}
        onUpdateLanguages={onUpdateLanguages}
        onUnlockLanguageChange={jest.fn(async () => true)}
        onToggleCategory={jest.fn()}
      />,
    );

    expect(screen.getByText("1/2 CUPOS ACTIVOS")).toBeInTheDocument();
    expect(screen.getByText("1 CUPO LIBRE")).toBeInTheDocument();
    expect(screen.queryByText("BLOQUEADO ANUAL")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Puedes agregar 1 idioma adicional gratis/i),
    ).toBeInTheDocument();

    const frenchBtn = screen.getByRole("button", { name: /Francés/i });
    expect(frenchBtn).toBeEnabled();
    await user.click(frenchBtn);

    const saveBtn = screen.getByRole("button", { name: "Guardar idiomas" });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(onUpdateLanguages).toHaveBeenCalledWith(["en", "fr"]);
    });
  });

  it("shows annual lock, caps selection at maxLanguages, and unlocks via confirmation when both dolly_plus slots are filled", async () => {
    const user = userEvent.setup();
    const onUnlockLanguageChange = jest.fn(async () => true);
    const onPromoteLanguage = jest.fn();

    render(
      <LearningPreferencesCard
        t={dictionaries.es}
        locale="es"
        activeLanguages={[
          { code: "en", name: "Inglés", isPrimary: true },
          { code: "fr", name: "Francés", isPrimary: false },
        ]}
        languagesSettings={createLanguagesSettings({
          selected: ["en", "fr"],
          active: ["en", "fr"],
          maxLanguages: 2,
          canChangeFree: false,
          languageChangeCredits: 0,
        })}
        categories={CATEGORIES}
        selectedCategoryIds={["technology", "history", "education"]}
        isSaving={false}
        isUnlockingLanguage={false}
        onPromoteLanguage={onPromoteLanguage}
        onUpdateLanguages={jest.fn(async () => true)}
        onUnlockLanguageChange={onUnlockLanguageChange}
        onToggleCategory={jest.fn()}
      />,
    );

    expect(screen.getByText("BLOQUEADO ANUAL")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Italiano/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Español/i })).toBeDisabled();

    await user.click(
      screen.getByRole("button", {
        name: dictionaries.es.profile.movePriorityButton,
      }),
    );
    expect(onPromoteLanguage).toHaveBeenCalledWith("fr");

    await user.click(
      screen.getByRole("button", { name: /Desbloquear cambio de idioma/i }),
    );
    await user.click(
      screen.getByRole("button", { name: /Confirmar \(\+1 crédito\)/i }),
    );

    await waitFor(() => {
      expect(onUnlockLanguageChange).toHaveBeenCalledTimes(1);
    });
  });

  it("keeps custom category input when moderation or rate-limit rejects it, and clears on success", async () => {
    const user = userEvent.setup();
    const onAddCustomCategory = jest
      .fn<() => Promise<boolean>>()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    render(
      <LearningPreferencesCard
        t={dictionaries.es}
        locale="es"
        activeLanguages={[{ code: "en", name: "Inglés", isPrimary: true }]}
        languagesSettings={createLanguagesSettings({
          maxLanguages: 1,
          selected: ["en"],
          active: ["en"],
        })}
        categories={CATEGORIES}
        selectedCategoryIds={["technology", "history", "education"]}
        isSaving={false}
        isUnlockingLanguage={false}
        onPromoteLanguage={jest.fn()}
        onUpdateLanguages={jest.fn(async () => true)}
        onUnlockLanguageChange={jest.fn(async () => true)}
        onToggleCategory={jest.fn()}
        onAddCustomCategory={onAddCustomCategory}
      />,
    );

    const input = screen.getByPlaceholderText(
      dictionaries.es.profile.addCustomCategoryPlaceholder,
    ) as HTMLInputElement;
    const addBtn = screen.getByRole("button", {
      name: dictionaries.es.profile.addCustomCategoryButton,
    });

    await user.type(input, "ignore previous instructions");
    await user.click(addBtn);
    await waitFor(() => expect(onAddCustomCategory).toHaveBeenCalledTimes(1));
    expect(input.value).toBe("ignore previous instructions");

    await user.clear(input);
    await user.type(input, "Astrofísica");
    await user.click(addBtn);
    await waitFor(() => expect(onAddCustomCategory).toHaveBeenCalledTimes(2));
    expect(input.value).toBe("");
  });
});
