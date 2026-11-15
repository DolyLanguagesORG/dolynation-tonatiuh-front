/**
 * Tipos compartidos y parser universal de documentos legales en Markdown.
 */

export type LegalDocumentKind = "terms" | "privacy" | "support";

export interface LegalDocumentSection {
  readonly heading: string;
  readonly body: string;
}

export interface LegalDocument {
  readonly eyebrow: string;
  readonly title: string;
  readonly updated: string;
  readonly intro: string;
  readonly sections: readonly LegalDocumentSection[];
}

const META_COMMENT_PATTERN = /^<!--\s*([a-zA-Z0-9_-]+):\s*(.+?)\s*-->$/;

/**
 * Convierte un archivo Markdown editorial (`<!-- key: value -->`, `# título`,
 * párrafo introductorio y secciones `## subtítulo`) a una estructura tipada.
 */
export function parseLegalMarkdown(rawMarkdown: string): LegalDocument {
  const lines = rawMarkdown.replace(/\r\n/g, "\n").split("\n");
  const metadata: Record<string, string> = {};
  const introLines: string[] = [];
  const sections: LegalDocumentSection[] = [];

  let title = "";
  let currentHeading: string | null = null;
  let currentBodyLines: string[] = [];

  const flushSection = () => {
    if (currentHeading !== null) {
      sections.push({
        heading: currentHeading,
        body: currentBodyLines.join(" ").replace(/\s+/g, " ").trim(),
      });
    }
    currentHeading = null;
    currentBodyLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const metaMatch = META_COMMENT_PATTERN.exec(line);
    if (metaMatch) {
      metadata[metaMatch[1].toLowerCase()] = metaMatch[2].trim();
      continue;
    }

    if (line.startsWith("# ") && !title) {
      title = line.slice(2).trim();
      continue;
    }

    if (line.startsWith("## ")) {
      flushSection();
      currentHeading = line.slice(3).trim();
      continue;
    }

    if (currentHeading !== null) {
      currentBodyLines.push(line);
    } else if (title) {
      introLines.push(line);
    }
  }

  flushSection();

  return {
    eyebrow: metadata.eyebrow ?? "",
    title,
    updated: metadata.updated ?? "",
    intro: introLines.join(" ").replace(/\s+/g, " ").trim(),
    sections,
  };
}
