"use client";

import { useEffect } from "react";

import { dictionaries, type Dictionary, type Locale } from "@/i18n/dictionaries";
import { SUPPORTED_LANGUAGE_IDS, type TargetLanguageCode } from "@/lib/api-contracts";

/**
 * Diccionario completo del flujo inmersivo de lectura, consulta léxica,
 * evaluación de comprensión y resultados, adaptado a los 4 idiomas meta (`es`, `en`, `fr`, `it`).
 */
export interface ReadingFlowDictionary {
  readings: Dictionary["readings"] & {
    aiBadge: string;
    decreaseFontLabel: string;
    increaseFontLabel: string;
    closeHelpLabel: string;
    excerptBadge: string;
    loadingReadingText: string;
    invalidIdTitle: string;
    invalidIdDescription: string;
    loadErrorTitle: string;
    notFoundFallback: string;
    errors: {
      loadReadingFailed: string;
      explainFailed: string;
      deepExplainFailed: string;
      glossaryUpdateFailed: string;
      loadEvaluationFailed: string;
      submitEvaluationFailed: string;
      loadResultFailed: string;
    };
    eval: Dictionary["readings"]["eval"] & {
      submitErrorTitle: string;
      submittingAnalysisNotice: string;
      loadingTitle: string;
      loadErrorTitle: string;
      loadErrorFallback: string;
    };
    result: Dictionary["readings"]["result"] & {
      loadingTitle: string;
      loadErrorTitle: string;
      loadErrorFallback: string;
      pendingTitle: string;
      pendingDescription: string;
      pendingBadge: string;
      pendingActionButton: string;
      evaluatedOnPrefix: string;
      scoreMetricLabel: string;
      scoreMetricUnit: string;
      scoreMetricLevelPrefix: string;
      lengthMetricLabel: string;
      lengthMetricUnit: string;
      lengthMetricDesc: string;
      lexiconMetricLabel: string;
      lexiconMetricUnit: string;
      lexiconMetricDesc: string;
      emptyFeedbackFallback: string;
      emptyResponseFallback: string;
    };
  };
  home: {
    feedbackButton: string;
  };
}

const SUPPORTED_SET = new Set<string>(SUPPORTED_LANGUAGE_IDS);

/**
 * Normaliza un código de idioma de lectura hacia un `TargetLanguageCode` válido,
 * usando el `Locale` global de interfaz como respaldo antes de cargar la lectura.
 */
export function resolveReadingLanguage(
  readingLanguage?: string | null,
  fallbackLocale: Locale = "es",
): TargetLanguageCode {
  if (readingLanguage && SUPPORTED_SET.has(readingLanguage)) {
    return readingLanguage as TargetLanguageCode;
  }
  return fallbackLocale;
}

const ES_FLOW_DICTIONARY: ReadingFlowDictionary = {
  readings: {
    ...dictionaries.es.readings,
    aiBadge: "IA",
    decreaseFontLabel: "Reducir tamaño de lectura",
    increaseFontLabel: "Aumentar tamaño de lectura",
    closeHelpLabel: "Cerrar ayuda",
    excerptBadge: "FRAGMENTO",
    loadingReadingText: "Cargando texto de lectura",
    invalidIdTitle: "Identificador de lectura inválido",
    invalidIdDescription:
      "Verifica el enlace o selecciona una lectura válida desde tu historial.",
    loadErrorTitle: "Error al cargar lectura",
    notFoundFallback: "No se encontró la lectura solicitada.",
    errors: {
      loadReadingFailed: "No fue posible cargar la lectura.",
      explainFailed: "No fue posible explicar el texto seleccionado.",
      deepExplainFailed: "No se pudo ampliar la explicación con el tutor.",
      glossaryUpdateFailed: "No se pudo actualizar el glosario personal.",
      loadEvaluationFailed:
        "No fue posible abrir el módulo de evaluación para esta lectura.",
      submitEvaluationFailed: "No fue posible completar la evaluación.",
      loadResultFailed: "No se pudo cargar el resultado de evaluación.",
    },
    eval: {
      ...dictionaries.es.readings.eval,
      submitErrorTitle: "Error al enviar evaluación",
      submittingAnalysisNotice:
        "Analizando retención temática, léxico contextual y claridad sintáctica...",
      loadingTitle: "Preparando módulo de evaluación",
      loadErrorTitle: "Error al cargar evaluación",
      loadErrorFallback: "No se pudo abrir la lectura para evaluación.",
    },
    result: {
      ...dictionaries.es.readings.result,
      loadingTitle: "Cargando resultados de evaluación",
      loadErrorTitle: "Error al cargar resultados",
      loadErrorFallback: "No encontramos los resultados de esta lectura.",
      pendingTitle: "Evaluación pendiente",
      pendingDescription:
        "Esta lectura aún no cuenta con una evaluación enviada. Redacta tu resumen para recibir retroalimentación e índice de comprensión.",
      pendingBadge: "PENDIENTE",
      pendingActionButton: dictionaries.es.readings.continueEvaluationButton,
      evaluatedOnPrefix: "Evaluada el",
      scoreMetricLabel: "CALIFICACIÓN IA",
      scoreMetricUnit: "/ 100",
      scoreMetricLevelPrefix: "Nivel evaluado:",
      lengthMetricLabel: "EXTENSIÓN DE SÍNTESIS",
      lengthMetricUnit: "palabras",
      lengthMetricDesc: "Objetivo de referencia académica: 100 palabras.",
      lexiconMetricLabel: "LÉXICO REUTILIZADO",
      lexiconMetricUnit: "términos",
      lexiconMetricDesc: "Coincidencia de vocabulario clave en tu resumen.",
      emptyFeedbackFallback:
        "Evaluación registrada por el sistema sin comentarios adicionales.",
      emptyResponseFallback: "Sin texto de resumen disponible.",
    },
  },
  home: {
    feedbackButton: dictionaries.es.home.feedbackButton,
  },
};

const EN_FLOW_DICTIONARY: ReadingFlowDictionary = {
  readings: {
    ...dictionaries.en.readings,
    aiBadge: "AI",
    decreaseFontLabel: "Decrease reading text size",
    increaseFontLabel: "Increase reading text size",
    closeHelpLabel: "Close help",
    excerptBadge: "EXCERPT",
    loadingReadingText: "Loading reading text",
    invalidIdTitle: "Invalid reading identifier",
    invalidIdDescription:
      "Check the link or choose a valid reading from your history.",
    loadErrorTitle: "Failed to load reading",
    notFoundFallback: "Requested reading was not found.",
    errors: {
      loadReadingFailed: "Could not load the reading.",
      explainFailed: "Could not explain the selected text.",
      deepExplainFailed: "Could not load deeper tutor explanation.",
      glossaryUpdateFailed: "Could not update your personal glossary.",
      loadEvaluationFailed:
        "Could not open the evaluation module for this reading.",
      submitEvaluationFailed: "Could not submit your evaluation.",
      loadResultFailed: "Could not load evaluation results.",
    },
    eval: {
      ...dictionaries.en.readings.eval,
      submitErrorTitle: "Failed to submit evaluation",
      submittingAnalysisNotice:
        "Analyzing thematic retention, contextual lexicon, and syntactic clarity...",
      loadingTitle: "Preparing evaluation module",
      loadErrorTitle: "Failed to load evaluation",
      loadErrorFallback: "Could not open reading for evaluation.",
    },
    result: {
      ...dictionaries.en.readings.result,
      loadingTitle: "Loading evaluation results",
      loadErrorTitle: "Failed to load results",
      loadErrorFallback: "Could not find evaluation results for this reading.",
      pendingTitle: "Evaluation pending",
      pendingDescription:
        "This reading has not been evaluated yet. Submit your comprehension summary to receive AI feedback and your score.",
      pendingBadge: "PENDING",
      pendingActionButton: dictionaries.en.readings.continueEvaluationButton,
      evaluatedOnPrefix: "Evaluated on",
      scoreMetricLabel: "AI COMPREHENSION SCORE",
      scoreMetricUnit: "/ 100",
      scoreMetricLevelPrefix: "Evaluated level:",
      lengthMetricLabel: "SUMMARY LENGTH",
      lengthMetricUnit: "words",
      lengthMetricDesc: "Academic reference target: 100 words.",
      lexiconMetricLabel: "CONTEXTUAL LEXICON",
      lexiconMetricUnit: "terms",
      lexiconMetricDesc: "Key reading vocabulary integrated into your summary.",
      emptyFeedbackFallback:
        "Evaluation recorded by the system without additional comments.",
      emptyResponseFallback: "No submitted summary text available.",
    },
  },
  home: {
    feedbackButton: dictionaries.en.home.feedbackButton,
  },
};

const FR_FLOW_DICTIONARY: ReadingFlowDictionary = {
  readings: {
    historyTitle: "Historique des lectures",
    historySubtitle: "",
    statusAll: "TOUTES",
    statusPending: "EN ATTENTE",
    statusCompleted: "TERMINÉES",
    allLanguagesFilter: "TOUTES LES LANGUES",
    allDifficultiesFilter: "TOUS LES NIVEAUX",
    searchPlaceholder: "",
    columns: {
      title: "TITRE DE LA LECTURE",
      language: "LANGUE",
      difficulty: "NIVEAU",
      score: "COMPRÉHENSION",
      date: "DATE",
      action: "ACTION",
    },
    emptyTitle: "",
    emptyDescription: "",
    emptyAction: "",
    detailAction: "DÉTAIL",
    rereadAction: "RELIRE",
    startReadingAction: "LIRE",
    evaluateAction: "ÉVALUER",
    backToReadings: "RETOUR AUX LECTURES",
    estimatedReadUnit: "MIN DE LECTURE",
    readingStatusDone: "Lecture évaluée et terminée",
    readingStatusPending: "Texte prêt pour l'évaluation de compréhension",
    backToConfigButton: "Revenir à la configuration",
    continueEvaluationButton: "CONTINUER L'ÉVALUATION",
    detectedVocabularyTitle: "VOCABULAIRE DÉTECTÉ DANS CETTE LECTURE",
    consultedTermsTitle: "AIDES ET TERMES CONSULTÉS DANS CETTE LECTURE",
    termsSuffix: "Termes clés",
    aiContextTitle: "AIDE & EXPLICATION • IA",
    suggestedTranslationLabel: "Explication contextuelle :",
    literalMeaningLabel: "Sens littéral",
    meaningInTextLabel: "Ce que cela signifie dans cette lecture",
    wordBreakdownTitle: "Analyse mot à mot",
    wordBreakdownNoteLabel: "Rôle :",
    otherWaysTitle: "Autres façons de le dire",
    otherContextsTitle: "Autres contextes d'usage",
    selectionActionLabel: "Demander de l'aide / Expliquer",
    clearSelectionLabel: "Effacer la sélection",
    selectionTooLongNotice: "Max. 500 caractères par requête",
    selectionCrossParagraphNotice: "Sélectionnez dans un seul paragraphe",
    entryTypeWord: "MOT",
    entryTypePhrase: "PHRASE · EXPRESSION",
    cachedBadge: "EN CACHE",
    refreshAnalysisButton: "Régénérer l'aide",
    pronounceButton: "Prononcer",
    detailedExplanationButton: "Approfondir avec le tuteur IA",
    saveTermButton: "Enregistrer dans le glossaire",
    savedTermButton: "Enregistré dans le glossaire",
    clickWordHint:
      "Cliquez sur un mot pour le sélectionner, ajoutez d'autres mots du même paragraphe (clic par clic ou début–fin) ou glissez sur le texte, puis appuyez sur « Demander de l'aide / Expliquer ».",
    loadingContextNotice:
      "Génération de l'explication dans la langue de la lecture...",
    aiBadge: "IA",
    decreaseFontLabel: "Réduire la taille du texte",
    increaseFontLabel: "Agrandir la taille du texte",
    closeHelpLabel: "Fermer l'aide",
    excerptBadge: "EXTRAIT",
    loadingReadingText: "Chargement du texte de lecture",
    invalidIdTitle: "Identifiant de lecture invalide",
    invalidIdDescription:
      "Vérifiez le lien ou sélectionnez une lecture valide depuis votre historique.",
    loadErrorTitle: "Erreur lors du chargement de la lecture",
    notFoundFallback: "La lecture demandée est introuvable.",
    errors: {
      loadReadingFailed: "Impossible de charger la lecture.",
      explainFailed: "Impossible d'expliquer le passage sélectionné.",
      deepExplainFailed:
        "Impossible d'obtenir une explication approfondie du tuteur.",
      glossaryUpdateFailed: "Impossible de mettre à jour votre glossaire personnel.",
      loadEvaluationFailed:
        "Impossible d'ouvrir le module d'évaluation pour cette lecture.",
      submitEvaluationFailed: "Impossible d'envoyer votre évaluation.",
      loadResultFailed: "Impossible de charger le résultat d'évaluation.",
    },
    eval: {
      backToReading: "Revenir au texte original",
      activeSessionBadge: "• SESSION ACTIVE",
      eyebrow: "MODULE DE RÉTENTION",
      title: "Évaluation de compréhension contextuelle",
      readingPrefix: "Lecture :",
      criteriaTitle: "CRITÈRES DE RÉPONSE",
      goalMinWords: "Objectif : 100 mots minimum",
      criteriaDescription:
        "Rédigez un résumé ou une explication avec vos propres mots sur les idées centrales du texte que vous venez de lire. Votre compréhension globale, l'usage du lexique contextuel et la cohérence syntaxique seront évalués.",
      openResponseTitle: "RÉPONSE LIBRE",
      localSavedBadge: "Sauvegarde locale active",
      saveDraftButton: "Enregistrer le brouillon",
      draftSavedNotice: "Brouillon enregistré localement",
      textareaLabel: "Résumé de compréhension",
      textareaPlaceholder:
        "Rédigez avec vos propres mots les idées principales et l'argument central du texte...",
      minWordsSuffix: "/ 100 mots min.",
      charactersSuffix: "caractères",
      submitButton: "Envoyer le résumé pour évaluation par l'IA",
      submittingButton: "Évaluation de la compréhension par l'IA...",
      aiDisclaimer:
        "Votre réponse sera analysée de manière contextuelle par le moteur d'IA de DolyNation.",
      minWordsError:
        "Rédigez un résumé plus détaillé (au moins 15 mots) pour obtenir une évaluation précise.",
      dimensionsTitle: "CRITÈRES D'ÉVALUATION CONTEXTUELLE",
      dimensions: [
        {
          title: "1. Rétention thématique",
          description:
            "Identification des idées principales de l'auteur et synthèse claire des arguments centraux.",
        },
        {
          title: "2. Lexique contextuel",
          description:
            "Emploi précis du vocabulaire du texte sans perte de cohérence sémantique.",
        },
        {
          title: "3. Clarté syntaxique",
          description:
            "Phrases bien construites et reliées par des transitions naturelles.",
        },
      ],
      submitErrorTitle: "Erreur lors de l'envoi de l'évaluation",
      submittingAnalysisNotice:
        "Analyse de la rétention thématique, du lexique contextuel et de la clarté syntaxique...",
      loadingTitle: "Préparation du module d'évaluation",
      loadErrorTitle: "Erreur lors du chargement de l'évaluation",
      loadErrorFallback: "Impossible d'ouvrir la lecture pour l'évaluation.",
    },
    result: {
      completedBadge: "• ÉVALUATION TERMINÉE",
      subtitle:
        "Retour synthétique généré à partir du résumé que vous avez soumis.",
      globalIndexLabel: "INDICE GLOBAL D'ASSIMILATION",
      passedBadge: "NIVEAU DE COMPRÉHENSION : VALIDÉ",
      reviewBadge: "NIVEAU DE COMPRÉHENSION : À RENFORCER",
      breakdownTitle: "Analyse détaillée de la performance",
      dimensionsCount: "ÉVALUATION CONTEXTUELLE",
      strengthsTitle: "OBSERVATION GÉNÉRALE DE L'IA",
      improvementsTitle: "VOTRE RÉSUMÉ SOUMIS & AFFINEMENT",
      integrationSuggestionLabel: "SYNTHÈSE ÉVALUÉE :",
      submittedSummaryTitle: "Résumé envoyé lors de l'évaluation",
      assimilatedTermsTitle: "TERMES CLÉS ASSIMILÉS",
      generateNewButton: "Générer une nouvelle lecture",
      viewCompletedButton: "Voir mes lectures terminées",
      homeButton: "Accueil",
      sessionFooterStandard: "",
      loadingTitle: "Chargement des résultats d'évaluation",
      loadErrorTitle: "Erreur lors du chargement des résultats",
      loadErrorFallback: "Résultats introuvables pour cette lecture.",
      pendingTitle: "Évaluation en attente",
      pendingDescription:
        "Cette lecture n'a pas encore été évaluée. Rédigez votre résumé pour recevoir le retour de l'IA et votre score de compréhension.",
      pendingBadge: "EN ATTENTE",
      pendingActionButton: "CONTINUER L'ÉVALUATION",
      evaluatedOnPrefix: "Évaluée le",
      scoreMetricLabel: "NOTE DE L'IA",
      scoreMetricUnit: "/ 100",
      scoreMetricLevelPrefix: "Niveau évalué :",
      lengthMetricLabel: "LONGUEUR DU RÉSUMÉ",
      lengthMetricUnit: "mots",
      lengthMetricDesc: "Objectif académique de référence : 100 mots.",
      lexiconMetricLabel: "LEXIQUE RÉUTILISÉ",
      lexiconMetricUnit: "termes",
      lexiconMetricDesc: "Vocabulaire clé du texte intégré dans votre résumé.",
      emptyFeedbackFallback:
        "Évaluation enregistrée sans commentaire supplémentaire.",
      emptyResponseFallback: "Aucun texte de résumé disponible.",
    },
  },
  home: {
    feedbackButton: "Voir le retour",
  },
};

const IT_FLOW_DICTIONARY: ReadingFlowDictionary = {
  readings: {
    historyTitle: "Cronologia delle letture",
    historySubtitle: "",
    statusAll: "TUTTE",
    statusPending: "IN SOSPESO",
    statusCompleted: "COMPLETATE",
    allLanguagesFilter: "TUTTE LE LINGUE",
    allDifficultiesFilter: "TUTTI I LIVELLI",
    searchPlaceholder: "",
    columns: {
      title: "TITOLO DELLA LETTURA",
      language: "LINGUA",
      difficulty: "LIVELLO",
      score: "COMPRENSIONE",
      date: "DATA",
      action: "AZIONE",
    },
    emptyTitle: "",
    emptyDescription: "",
    emptyAction: "",
    detailAction: "DETTAGLIO",
    rereadAction: "RILEGGI",
    startReadingAction: "LEGGI",
    evaluateAction: "VALUTA",
    backToReadings: "TORNA ALLE LETTURE",
    estimatedReadUnit: "MIN DI LETTURA",
    readingStatusDone: "Lettura valutata e completata",
    readingStatusPending: "Testo pronto per la valutazione della comprensione",
    backToConfigButton: "Torna alla configurazione",
    continueEvaluationButton: "CONTINUA CON LA VALUTAZIONE",
    detectedVocabularyTitle: "VOCABOLARIO RILEVATO IN QUESTA LETTURA",
    consultedTermsTitle: "AIUTI E TERMINI CONSULTATI IN QUESTA LETTURA",
    termsSuffix: "Termini chiave",
    aiContextTitle: "AIUTO & SPIEGAZIONE • IA",
    suggestedTranslationLabel: "Spiegazione contestuale:",
    literalMeaningLabel: "Senso letterale",
    meaningInTextLabel: "Cosa significa in questa lettura",
    wordBreakdownTitle: "Analisi parola per parola",
    wordBreakdownNoteLabel: "Ruolo:",
    otherWaysTitle: "Altri modi di dirlo",
    otherContextsTitle: "Altri contesti d'uso",
    selectionActionLabel: "Chiedi aiuto / Spiega",
    clearSelectionLabel: "Annulla selezione",
    selectionTooLongNotice: "Max. 500 caratteri per richiesta",
    selectionCrossParagraphNotice: "Seleziona all'interno di un solo paragrafo",
    entryTypeWord: "PAROLA",
    entryTypePhrase: "FRASE · ESPRESSIONE",
    cachedBadge: "IN CACHE",
    refreshAnalysisButton: "Rigenera aiuto",
    pronounceButton: "Pronuncia",
    detailedExplanationButton: "Approfondisci con il Tutor IA",
    saveTermButton: "Salva nel glossario",
    savedTermButton: "Salvato nel glossario",
    clickWordHint:
      "Fai clic su una parola per selezionarla, aggiungi altre parole dello stesso paragrafo (clic dopo clic o inizio–fine) oppure trascina il testo, poi premi «Chiedi aiuto / Spiega».",
    loadingContextNotice:
      "Generazione della spiegazione nella lingua della lettura...",
    aiBadge: "IA",
    decreaseFontLabel: "Riduci dimensione del testo",
    increaseFontLabel: "Aumenta dimensione del testo",
    closeHelpLabel: "Chiudi aiuto",
    excerptBadge: "ESTRATTO",
    loadingReadingText: "Caricamento del testo di lettura",
    invalidIdTitle: "Identificatore di lettura non valido",
    invalidIdDescription:
      "Verifica il collegamento o seleziona una lettura valida dalla tua cronologia.",
    loadErrorTitle: "Errore durante il caricamento della lettura",
    notFoundFallback: "La lettura richiesta non è stata trovata.",
    errors: {
      loadReadingFailed: "Impossibile caricare la lettura.",
      explainFailed: "Impossibile spiegare il testo selezionato.",
      deepExplainFailed:
        "Impossibile caricare un approfondimento dal tutor.",
      glossaryUpdateFailed:
        "Impossibile aggiornare il tuo glossario personale.",
      loadEvaluationFailed:
        "Impossibile aprire il modulo di valutazione per questa lettura.",
      submitEvaluationFailed: "Impossibile inviare la valutazione.",
      loadResultFailed: "Impossibile caricare i risultati della valutazione.",
    },
    eval: {
      backToReading: "Torna al testo originale",
      activeSessionBadge: "• SESSIONE ATTIVA",
      eyebrow: "MODULO DI RITENZIONE",
      title: "Valutazione della comprensione contestuale",
      readingPrefix: "Lettura:",
      criteriaTitle: "CRITERI DI RISPOSTA",
      goalMinWords: "Obiettivo: Minimo 100 parole",
      criteriaDescription:
        "Scrivi un riassunto o una spiegazione con parole tue sulle idee centrali del testo appena letto. Verranno valutati comprensione globale, uso del lessico contestuale e coerenza sintattica.",
      openResponseTitle: "RISPOSTA APERTA",
      localSavedBadge: "Salvataggio locale attivo",
      saveDraftButton: "Salva bozza",
      draftSavedNotice: "Bozza salvata localmente",
      textareaLabel: "Riassunto di comprensione",
      textareaPlaceholder:
        "Scrivi con parole tue le idee principali e l'argomento centrale del testo...",
      minWordsSuffix: "/ 100 parole min.",
      charactersSuffix: "caratteri",
      submitButton: "Invia riassunto per la valutazione IA",
      submittingButton: "Valutazione della comprensione con IA...",
      aiDisclaimer:
        "La tua risposta verrà analizzata nel contesto dal modello IA di DolyNation.",
      minWordsError:
        "Scrivi un riassunto più completo (almeno 15 parole) per ricevere una valutazione accurata.",
      dimensionsTitle: "DIMENSIONI DI VALUTAZIONE CONTESTUALE",
      dimensions: [
        {
          title: "1. Ritenzione tematica",
          description:
            "Individuazione delle idee principali dell'autore e sintesi degli argomenti centrali.",
        },
        {
          title: "2. Lessico contestuale",
          description:
            "Uso preciso del vocabolario del testo mantenendo coerenza semantica.",
        },
        {
          title: "3. Chiarezza sintattica",
          description:
            "Frasi ben costruite e collegate con transizioni discorsive naturali.",
        },
      ],
      submitErrorTitle: "Errore nell'invio della valutazione",
      submittingAnalysisNotice:
        "Analisi della ritenzione tematica, del lessico contestuale e della chiarezza sintattica...",
      loadingTitle: "Preparazione del modulo di valutazione",
      loadErrorTitle: "Errore nel caricamento della valutazione",
      loadErrorFallback: "Impossibile aprire la lettura per la valutazione.",
    },
    result: {
      completedBadge: "• VALUTAZIONE COMPLETATA",
      subtitle:
        "Feedback sintetico generato a partire dal riassunto che hai inviato.",
      globalIndexLabel: "INDICE GLOBALE DI ASSIMILAZIONE",
      passedBadge: "LIVELLO DI COMPRENSIONE: SUPERATO",
      reviewBadge: "LIVELLO DI COMPRENSIONE: DA RAFFORZARE",
      breakdownTitle: "Analisi dettagliata delle prestazioni",
      dimensionsCount: "VALUTAZIONE CONTESTUALE",
      strengthsTitle: "OSSERVAZIONE GENERALE DELL'IA",
      improvementsTitle: "IL TUO RIASSUNTO INVIATO & PERFEZIONAMENTO",
      integrationSuggestionLabel: "SINTESI VALUTATA:",
      submittedSummaryTitle: "Riassunto inviato nella valutazione",
      assimilatedTermsTitle: "TERMINI CHIAVE ASSIMILATI",
      generateNewButton: "Genera nuova lettura",
      viewCompletedButton: "Vedi letture completate",
      homeButton: "Home",
      sessionFooterStandard: "",
      loadingTitle: "Caricamento dei risultati della valutazione",
      loadErrorTitle: "Errore nel caricamento dei risultati",
      loadErrorFallback: "Risultati di valutazione non trovati per questa lettura.",
      pendingTitle: "Valutazione in sospeso",
      pendingDescription:
        "Questa lettura non ha ancora una valutazione inviata. Scrivi il tuo riassunto per ricevere il feedback IA e il punteggio di comprensione.",
      pendingBadge: "IN SOSPESO",
      pendingActionButton: "CONTINUA CON LA VALUTAZIONE",
      evaluatedOnPrefix: "Valutata il",
      scoreMetricLabel: "VALUTAZIONE IA",
      scoreMetricUnit: "/ 100",
      scoreMetricLevelPrefix: "Livello valutato:",
      lengthMetricLabel: "LUNGHEZZA DELLA SINTESI",
      lengthMetricUnit: "parole",
      lengthMetricDesc: "Obiettivo accademico di riferimento: 100 parole.",
      lexiconMetricLabel: "LESSICO RIUTILIZZATO",
      lexiconMetricUnit: "termini",
      lexiconMetricDesc: "Vocabolario chiave del testo integrato nel riassunto.",
      emptyFeedbackFallback:
        "Valutazione registrata dal sistema senza commenti aggiuntivi.",
      emptyResponseFallback: "Nessun testo del riassunto disponibile.",
    },
  },
  home: {
    feedbackButton: "Vedi feedback",
  },
};

export const readingFlowDictionaries: Record<
  TargetLanguageCode,
  ReadingFlowDictionary
> = {
  es: ES_FLOW_DICTIONARY,
  en: EN_FLOW_DICTIONARY,
  fr: FR_FLOW_DICTIONARY,
  it: IT_FLOW_DICTIONARY,
};

/**
 * Devuelve el diccionario inmersivo completo correspondiente al idioma de la lectura.
 */
export function getReadingFlowDictionary(
  language: TargetLanguageCode,
): ReadingFlowDictionary {
  return readingFlowDictionaries[language] ?? EN_FLOW_DICTIONARY;
}

/**
 * Sincroniza temporalmente `<html lang>` con el idioma de la lectura activa
 * y restaura el valor anterior al salir del flujo inmersivo.
 */
export function useImmersionDocumentLanguage(
  language?: TargetLanguageCode | null,
): void {
  useEffect(() => {
    if (!language || typeof document === "undefined") {
      return;
    }
    const previous = document.documentElement.lang;
    document.documentElement.lang = language;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [language]);
}
