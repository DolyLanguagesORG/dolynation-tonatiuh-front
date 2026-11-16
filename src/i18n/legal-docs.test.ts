import fs from "node:fs";
import path from "node:path";

import {
  type LegalDocumentKind,
  parseLegalMarkdown,
  SUPPORTED_UI_LOCALES,
} from "@/i18n";

const CONTENT_KINDS: readonly LegalDocumentKind[] = [
  "terms",
  "privacy",
  "support",
];

describe("Localized legal Markdown content", () => {
  it("provides valid, non-empty Markdown documents for every kind and UI locale", () => {
    for (const kind of CONTENT_KINDS) {
      for (const locale of SUPPORTED_UI_LOCALES) {
        const filePath = path.join(
          process.cwd(),
          "src/i18n/content",
          kind,
          `${locale}.md`,
        );
        expect(fs.existsSync(filePath)).toBe(true);

        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = parseLegalMarkdown(raw);

        expect(parsed.eyebrow.length).toBeGreaterThan(0);
        expect(parsed.title.length).toBeGreaterThan(0);
        expect(parsed.updated.length).toBeGreaterThan(0);
        expect(parsed.intro.length).toBeGreaterThan(0);
        expect(parsed.sections.length).toBeGreaterThanOrEqual(3);

        for (const section of parsed.sections) {
          expect(section.heading.length).toBeGreaterThan(0);
          expect(section.body.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
