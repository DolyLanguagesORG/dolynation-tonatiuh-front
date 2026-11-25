"use client";

import {
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import {
  Alert,
  Badge,
  Button,
  ChoiceChip,
  Eyebrow,
  Heading,
  Select,
  Text,
} from "@/components/ui";
import { type Dictionary, formatMessage, type Locale } from "@/i18n";
import {
  type CatalogItem,
  formatReadingLanguageBadge,
  type FriendStreakDto,
  type ProposeFriendStreakInput,
  type ReadingDifficulty,
  type ReadingSize,
  type TargetLanguageCode,
  type UpdateFriendStreakCategoriesInput,
} from "@/lib";

export type FriendStreakFormMode = "propose" | "accept" | "edit";

export interface FriendStreakFormModalProps {
  open: boolean;
  mode: FriendStreakFormMode;
  partnerName: string;
  availableCategories: readonly CatalogItem[];
  friendAvailableCategories?: readonly CatalogItem[];
  languageOptions: readonly { id: TargetLanguageCode; name: string }[];
  streak?: FriendStreakDto | null;
  defaultLanguage?: TargetLanguageCode;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  t: Dictionary;
  locale: Locale;
  onClose: () => void;
  onSubmitPropose?: (input: ProposeFriendStreakInput) => Promise<void> | void;
  onSubmitAccept?: (
    streakId: number,
    updatedCategories?: string[],
  ) => Promise<void> | void;
  onSubmitEdit?: (
    streakId: number,
    input: UpdateFriendStreakCategoriesInput,
  ) => Promise<void> | void;
}

const DIFFICULTY_VALUES: readonly ReadingDifficulty[] = [
  "easy",
  "medium",
  "hard",
];
const SIZE_VALUES: readonly ReadingSize[] = ["short", "medium", "long"];

function isPointerOutsideDialog(
  dialog: HTMLDialogElement,
  clientX: number,
  clientY: number,
): boolean {
  const rect = dialog.getBoundingClientRect();
  return (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  );
}

function areCategorySetsEqual(
  first: readonly string[],
  second: readonly string[],
): boolean {
  if (first.length !== second.length) {
    return false;
  }
  const firstKeys = new Set(first.map((item) => item.trim().toLowerCase()));
  const secondKeys = new Set(second.map((item) => item.trim().toLowerCase()));
  if (firstKeys.size !== secondKeys.size) {
    return false;
  }
  for (const key of firstKeys) {
    if (!secondKeys.has(key)) {
      return false;
    }
  }
  return true;
}

interface StreakModalFormBodyProps {
  mode: FriendStreakFormMode;
  partnerName: string;
  availableCategories: readonly CatalogItem[];
  friendAvailableCategories: readonly CatalogItem[];
  languageOptions: readonly { id: TargetLanguageCode; name: string }[];
  streak?: FriendStreakDto | null;
  defaultLanguage?: TargetLanguageCode;
  isSubmitting: boolean;
  errorMessage?: string | null;
  t: Dictionary;
  locale: Locale;
  titleId: string;
  descriptionId: string;
  onClose: () => void;
  onSubmitPropose?: (input: ProposeFriendStreakInput) => Promise<void> | void;
  onSubmitAccept?: (
    streakId: number,
    updatedCategories?: string[],
  ) => Promise<void> | void;
  onSubmitEdit?: (
    streakId: number,
    input: UpdateFriendStreakCategoriesInput,
  ) => Promise<void> | void;
}

function StreakModalFormBody({
  mode,
  partnerName,
  availableCategories,
  friendAvailableCategories,
  languageOptions,
  streak,
  defaultLanguage,
  isSubmitting,
  errorMessage,
  t,
  locale,
  titleId,
  descriptionId,
  onClose,
  onSubmitPropose,
  onSubmitAccept,
  onSubmitEdit,
}: StreakModalFormBodyProps) {
  const mergedMyCategories: CatalogItem[] = (() => {
    const seen = new Set<string>();
    const items: CatalogItem[] = [];
    for (const cat of availableCategories) {
      const key = cat.name.trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        items.push(cat);
      }
    }
    if (mode === "accept" || mode === "edit") {
      for (const raw of streak?.myCategories ?? []) {
        const clean = raw.trim();
        const key = clean.toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          items.push({ id: clean, name: clean });
        }
      }
    }
    return items;
  })();

  const availableNameByKey = new Map(
    mergedMyCategories.map((c) => [c.name.trim().toLowerCase(), c.name]),
  );

  const initialCategories =
    (mode === "edit" || mode === "accept") && streak
      ? streak.myCategories
          .map((c) => availableNameByKey.get(c.trim().toLowerCase()) ?? c)
          .filter(Boolean)
          .slice(0, 2)
      : [];

  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(initialCategories);
  const [selectedFriendCategories, setSelectedFriendCategories] = useState<
    string[]
  >([]);
  const [language, setLanguage] = useState<TargetLanguageCode>(
    defaultLanguage ?? languageOptions[0]?.id ?? "en",
  );
  const [difficulty, setDifficulty] = useState<ReadingDifficulty>("medium");
  const [size, setSize] = useState<ReadingSize>("medium");
  const [validationError, setValidationError] = useState<string | null>(null);

  const toggleCategory = (categoryName: string) => {
    setValidationError(null);
    setSelectedCategories((prev) => {
      if (prev.includes(categoryName)) {
        return prev.filter((item) => item !== categoryName);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, categoryName];
    });
  };

  const toggleFriendCategory = (categoryName: string) => {
    setValidationError(null);
    setSelectedFriendCategories((prev) => {
      if (prev.includes(categoryName)) {
        return prev.filter((item) => item !== categoryName);
      }
      if (prev.length >= 2) {
        return prev;
      }
      return [...prev, categoryName];
    });
  };

  const title =
    mode === "propose"
      ? formatMessage(t.friends.streakModal.proposeTitle, { name: partnerName })
      : mode === "accept"
        ? formatMessage(t.friends.streakModal.acceptTitle, {
            name: partnerName,
          })
        : t.friends.streakModal.editTitle;

  const description =
    mode === "propose"
      ? formatMessage(t.friends.streakModal.proposeDesc, { name: partnerName })
      : mode === "accept"
        ? formatMessage(t.friends.streakModal.acceptDesc, { name: partnerName })
        : t.friends.streakModal.editDesc;

  const submitLabel =
    mode === "propose"
      ? t.friends.streakModal.proposeSubmit
      : mode === "accept"
        ? t.friends.streakModal.acceptSubmit
        : t.friends.streakModal.editSubmit;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedCategories.length !== 2) {
      setValidationError(t.friends.streakModal.exactlyTwoError);
      return;
    }

    if (mode === "propose" && selectedFriendCategories.length !== 2) {
      setValidationError(
        formatMessage(t.friends.streakModal.exactlyTwoFriendError, {
          name: partnerName,
        }),
      );
      return;
    }

    setValidationError(null);
    if (mode === "propose" && onSubmitPropose) {
      await onSubmitPropose({
        categories: selectedCategories,
        friendCategories: selectedFriendCategories,
        language,
        difficulty,
        size,
      });
      return;
    }

    if (mode === "accept" && streak && onSubmitAccept) {
      const unchanged = areCategorySetsEqual(
        selectedCategories,
        streak.myCategories,
      );
      await onSubmitAccept(
        streak.id,
        unchanged ? undefined : selectedCategories,
      );
      return;
    }

    if (mode === "edit" && streak && onSubmitEdit) {
      await onSubmitEdit(streak.id, { categories: selectedCategories });
    }
  };

  const languageSelectOptions =
    languageOptions.length > 0
      ? languageOptions.map((item) => ({
          value: item.id,
          label: `${formatReadingLanguageBadge(item.id, locale)} — ${item.name}`,
        }))
      : [
          {
            value: language,
            label: formatReadingLanguageBadge(language, locale),
          },
        ];

  const isSubmitDisabled =
    mode === "propose"
      ? mergedMyCategories.length < 2 ||
        friendAvailableCategories.length < 2 ||
        selectedCategories.length !== 2 ||
        selectedFriendCategories.length !== 2
      : mergedMyCategories.length < 2 || selectedCategories.length !== 2;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
      <div className="flex flex-col gap-1.5">
        <Eyebrow tone="muted">{t.friends.streakModal.eyebrow}</Eyebrow>
        <Heading id={titleId} as="h2" variant="subsection">
          {title}
        </Heading>
        <Text id={descriptionId} variant="small" tone="body">
          {description}
        </Text>
      </div>

      {(errorMessage || validationError) && (
        <Alert variant="error" title={t.friends.common.errorTitle}>
          {validationError ?? errorMessage}
        </Alert>
      )}

      {mode === "accept" && streak && (
        <div className="flex flex-col gap-2 rounded-base border border-default bg-neutral-secondary-soft p-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary">
              {formatReadingLanguageBadge(streak.language, locale)}
            </Badge>
            <Badge variant="outline">
              {t.study.difficulties[streak.difficulty]?.label ??
                streak.difficulty}
            </Badge>
            <Badge variant="outline">
              {t.study.sizeOptions[streak.size]?.label ?? streak.size}
            </Badge>
          </div>
          <Text variant="caption" tone="muted">
            {formatMessage(t.friends.streakModal.partnerCategoriesSummary, {
              name: partnerName,
            })}{" "}
            <strong className="text-heading">
              {streak.partnerCategories.join(", ")}
            </strong>
          </Text>
        </div>
      )}

      {mode === "propose" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label={t.friends.streakModal.languageLabel}
            value={language}
            disabled={isSubmitting}
            options={languageSelectOptions}
            onChange={(event) =>
              setLanguage(event.target.value as TargetLanguageCode)
            }
          />
          <Select
            label={t.friends.streakModal.difficultyLabel}
            value={difficulty}
            disabled={isSubmitting}
            options={DIFFICULTY_VALUES.map((diff) => ({
              value: diff,
              label: `${t.study.difficulties[diff].label} (${t.study.difficulties[diff].cefr})`,
            }))}
            onChange={(event) =>
              setDifficulty(event.target.value as ReadingDifficulty)
            }
          />
          <Select
            label={t.friends.streakModal.sizeLabel}
            value={size}
            disabled={isSubmitting}
            options={SIZE_VALUES.map((sz) => ({
              value: sz,
              label: `${t.study.sizeOptions[sz].label} (${t.study.sizeOptions[sz].wordsLabel})`,
            }))}
            onChange={(event) => setSize(event.target.value as ReadingSize)}
          />
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Text variant="small" className="font-semibold text-heading">
            {mode === "propose"
              ? t.friends.streakModal.myCategoriesSectionTitle
              : t.friends.streakModal.categoriesHint}
          </Text>
          <Badge
            variant={selectedCategories.length === 2 ? "primary" : "outline"}
          >
            {formatMessage(t.friends.streakModal.categoriesCounter, {
              count: selectedCategories.length,
            })}
          </Badge>
        </div>

        {mergedMyCategories.length < 2 ? (
          <Alert variant="warning">
            {t.friends.streakModal.noCategoriesWarning}
          </Alert>
        ) : (
          <div
            role="group"
            aria-label={
              mode === "propose"
                ? t.friends.streakModal.myCategoriesSectionTitle
                : t.friends.streakModal.categoriesHint
            }
            className="flex flex-wrap gap-2 pt-1"
          >
            {mergedMyCategories.map((category) => {
              const isSelected = selectedCategories.includes(category.name);
              const isLocked =
                !isSelected && selectedCategories.length >= 2;
              return (
                <ChoiceChip
                  key={category.id}
                  selected={isSelected}
                  indicator="plus-check"
                  disabled={isSubmitting || isLocked}
                  onClick={() => toggleCategory(category.name)}
                >
                  {category.name}
                </ChoiceChip>
              );
            })}
          </div>
        )}
      </div>

      {mode === "propose" && (
        <div className="flex flex-col gap-2 border-t border-default pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Text variant="small" className="font-semibold text-heading">
              {formatMessage(
                t.friends.streakModal.friendCategoriesSectionTitle,
                { name: partnerName },
              )}
            </Text>
            <Badge
              variant={
                selectedFriendCategories.length === 2 ? "primary" : "outline"
              }
            >
              {formatMessage(t.friends.streakModal.categoriesCounter, {
                count: selectedFriendCategories.length,
              })}
            </Badge>
          </div>

          {friendAvailableCategories.length < 2 ? (
            <Alert variant="warning">
              {formatMessage(t.friends.streakModal.noFriendCategoriesWarning, {
                name: partnerName,
              })}
            </Alert>
          ) : (
            <div
              role="group"
              aria-label={formatMessage(
                t.friends.streakModal.friendCategoriesSectionTitle,
                { name: partnerName },
              )}
              className="flex flex-wrap gap-2 pt-1"
            >
              {friendAvailableCategories.map((category) => {
                const isSelected = selectedFriendCategories.includes(
                  category.name,
                );
                const isLocked =
                  !isSelected && selectedFriendCategories.length >= 2;
                return (
                  <ChoiceChip
                    key={`friend-${category.id}`}
                    selected={isSelected}
                    indicator="plus-check"
                    disabled={isSubmitting || isLocked}
                    onClick={() => toggleFriendCategory(category.name)}
                  >
                    {category.name}
                  </ChoiceChip>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-default pt-4">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isSubmitting}
          onClick={onClose}
        >
          {t.friends.common.cancelButton}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          isLoading={isSubmitting}
          disabled={isSubmitDisabled}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

/**
 * Modal editorial (`<dialog>` nativo) para proponer, aceptar o actualizar las 2 categorías de una racha diaria.
 */
export function FriendStreakFormModal({
  open,
  mode,
  partnerName,
  availableCategories,
  friendAvailableCategories = [],
  languageOptions,
  streak,
  defaultLanguage,
  isSubmitting = false,
  errorMessage,
  t,
  locale,
  onClose,
  onSubmitPropose,
  onSubmitAccept,
  onSubmitEdit,
}: FriendStreakFormModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const startedOutsideRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    dialog.setAttribute("closedby", isSubmitting ? "none" : "any");

    if (open) {
      if (typeof dialog.showModal === "function") {
        if (!dialog.open) {
          dialog.showModal();
        }
      } else {
        dialog.setAttribute("open", "");
      }
      return;
    }

    if (typeof dialog.close === "function") {
      if (dialog.open) {
        dialog.close();
      }
    } else {
      dialog.removeAttribute("open");
    }
  }, [isSubmitting, open]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || isSubmitting) {
      startedOutsideRef.current = false;
      return;
    }
    startedOutsideRef.current = isPointerOutsideDialog(
      dialog,
      event.clientX,
      event.clientY,
    );
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog || isSubmitting) {
      startedOutsideRef.current = false;
      return;
    }
    const supportsNativeClosedBy = "closedBy" in HTMLDialogElement.prototype;
    if (
      !supportsNativeClosedBy &&
      startedOutsideRef.current &&
      isPointerOutsideDialog(dialog, event.clientX, event.clientY)
    ) {
      startedOutsideRef.current = false;
      onClose();
      return;
    }
    startedOutsideRef.current = false;
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!isSubmitting) {
          onClose();
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className="m-auto w-[min(100%-2rem,36rem)] rounded-base border border-default bg-neutral-primary-soft p-0 text-heading shadow-xl"
    >
      {open && (
        <StreakModalFormBody
          key={`${mode}-${streak?.id ?? "new"}`}
          mode={mode}
          partnerName={partnerName}
          availableCategories={availableCategories}
          friendAvailableCategories={friendAvailableCategories}
          languageOptions={languageOptions}
          streak={streak}
          defaultLanguage={defaultLanguage}
          isSubmitting={isSubmitting}
          errorMessage={errorMessage}
          t={t}
          locale={locale}
          titleId={titleId}
          descriptionId={descriptionId}
          onClose={onClose}
          onSubmitPropose={onSubmitPropose}
          onSubmitAccept={onSubmitAccept}
          onSubmitEdit={onSubmitEdit}
        />
      )}
    </dialog>
  );
}
