export const MIN_CATEGORY_LENGTH = 2;
export const MAX_CATEGORY_LENGTH = 50;

const INVISIBLE_CHARS_REGEX = /[\u200B-\u200D\uFEFF\u00AD]/g;
const COMBINING_MARKS_REGEX = /[\u0300-\u036f]/g;

const SAFE_PROGRAMMING_NOTATION_REGEX = /^(?:c\+\+|c#|f#)$/i;
const URL_EMAIL_MARKUP_REGEX =
  /(?:https?:\/\/|www\.|<\/?[a-z][^>]*>|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\[[^\]]+\]\([^)]+\))/i;
const ALLOWED_CHARS_REGEX = /^[\p{Script=Latin}\p{N}\s'&+#\-.,/()]+$/u;
const REPEATED_CHAR_SPAM_REGEX = /(.)\1{3,}/u;
const REPEATED_CHUNK_SPAM_REGEX = /\b([a-z0-9]{2,4})\1{2,}\b/i;
const REPEATED_PHRASE_CHUNK_REGEX = /^(.{2,6})(?:\s*\1){2,}$/i;
const REPEATED_WORD_TWO_REGEX = /^([a-z0-9]{2,})\s+\1$/i;
const REPEATED_WORD_THREE_REGEX = /\b([a-z0-9]{2,})\b(?:\s+\1){2,}/i;
const KEYBOARD_MASH_REGEX =
  /(?:qwer|werty|wertz|ertyu|rtyu|tyui|uiop|poiu|azert|zerty|qsdfg|asdf|sdfg|dfgh|fghj|ghjk|hjkl|lkjh|fdsa|rewq|zxcv|xcvb|cvbn|vbnm|wxcvb|yxcvb|mnbv|vcxz|qazw|wsxe|edcrf|rfvt|tgby|yhnu|ujmik|ikolp|trewq|gfdsa|nbvcx)/i;
const CONSONANT_RUN_REGEX = /[bcdfghjklmnpqrstvwxz]{9,}/i;
const CONSONANT_ONLY_LONG_TOKEN_REGEX = /^[bcdfghjklmnpqrstvwxz]{5,}$/i;
const FRAGMENTED_CHARS_REGEX = /(?:^|\s)(?:[a-z0-9]\s+){3,}[a-z0-9](?:\s|$)/i;

const SAFE_NO_VOWEL_ACRONYMS = new Set<string>([
  "sql",
  "html",
  "css",
  "php",
  "http",
  "https",
  "tcp",
  "udp",
  "dns",
  "jwt",
  "npm",
  "xml",
  "yml",
  "yaml",
  "json",
  "rest",
  "grpc",
  "mvc",
  "mvvm",
  "llm",
  "nlp",
  "ml",
  "dl",
  "vr",
  "ar",
  "xr",
  "iot",
  "gps",
  "cpu",
  "gpu",
  "ram",
  "rom",
  "ssd",
  "hdd",
  "usb",
  "ssh",
  "tls",
  "ssl",
  "crud",
  "orm",
  "rdbms",
  "tdd",
  "bdd",
  "ci",
  "cd",
  "aws",
  "gcp",
  "sdk",
  "cli",
  "gui",
  "svg",
  "png",
  "pdf",
  "csv",
  "xhtml",
  "xslt",
  "srgb",
  "cmyk",
  "dna",
  "rna",
  "mri",
  "ecg",
  "ekg",
  "pcr",
  "adhd",
  "ptsd",
  "stem",
  "cnc",
  "cad",
  "cam",
  "plc",
  "hvac",
  "ptfe",
  "b2b",
  "b2c",
  "pgsql",
  "mysql",
  "c++",
  "c#",
  "f#",
]);

export type CategoryValidationErrorReason = "required" | "length" | "format";

export type CategoryValidationResult =
  | {
      ok: true;
      cleaned: string;
      canonicalKey: string;
    }
  | {
      ok: false;
      reason: CategoryValidationErrorReason;
    };

/**
 * Limpia caracteres invisibles y colapsa espacios redundantes preservando acentos y mayúsculas.
 */
export function cleanCategoryName(raw: string): string {
  return raw.replace(INVISIBLE_CHARS_REGEX, "").trim().replace(/\s+/g, " ");
}

function toAsciiLower(raw: string): string {
  return raw
    .replace(INVISIBLE_CHARS_REGEX, "")
    .normalize("NFKC")
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS_REGEX, "");
}

/**
 * Genera la clave canónica insensible a mayúsculas, acentos, guiones y espacios extras.
 */
export function canonicalCategoryKey(raw: string): string {
  return toAsciiLower(cleanCategoryName(raw))
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Valida una categoría personalizada en cliente usando las mismas reglas base de formato,
 * longitud y detección de gibberish que `dolynation-atl-back`.
 */
export function validateCategoryInput(raw: string): CategoryValidationResult {
  const cleaned = cleanCategoryName(raw);
  if (!cleaned) {
    return { ok: false, reason: "required" };
  }

  if (
    cleaned.length < MIN_CATEGORY_LENGTH ||
    cleaned.length > MAX_CATEGORY_LENGTH
  ) {
    return { ok: false, reason: "length" };
  }

  const isProgrammingNotation = SAFE_PROGRAMMING_NOTATION_REGEX.test(cleaned);
  const letterCount = (cleaned.match(/\p{L}/gu) ?? []).length;
  if (!isProgrammingNotation && letterCount < 2) {
    return { ok: false, reason: "format" };
  }

  if (!ALLOWED_CHARS_REGEX.test(cleaned)) {
    return { ok: false, reason: "format" };
  }

  if (URL_EMAIL_MARKUP_REGEX.test(cleaned)) {
    return { ok: false, reason: "format" };
  }

  const asciiLower = toAsciiLower(cleaned);
  if (REPEATED_CHAR_SPAM_REGEX.test(asciiLower)) {
    return { ok: false, reason: "format" };
  }

  const digitCount = (cleaned.match(/\d/g) ?? []).length;
  const nonSpaceLength = cleaned.replace(/\s+/g, "").length;
  if (
    nonSpaceLength > 0 &&
    digitCount >= 4 &&
    digitCount / nonSpaceLength > 0.4
  ) {
    return { ok: false, reason: "format" };
  }

  const spaced = asciiLower
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const compact = spaced.replace(/\s+/g, "");

  if (
    REPEATED_CHUNK_SPAM_REGEX.test(spaced) ||
    REPEATED_PHRASE_CHUNK_REGEX.test(spaced) ||
    REPEATED_WORD_TWO_REGEX.test(spaced) ||
    REPEATED_WORD_THREE_REGEX.test(spaced)
  ) {
    return { ok: false, reason: "format" };
  }

  if (KEYBOARD_MASH_REGEX.test(compact)) {
    return { ok: false, reason: "format" };
  }

  if (!isProgrammingNotation) {
    const tokens = spaced.split(" ").filter((t) => t.length > 0);
    const hasConsonantGibberish = tokens.some((token) => {
      if (SAFE_NO_VOWEL_ACRONYMS.has(token)) return false;
      return (
        CONSONANT_RUN_REGEX.test(token) ||
        CONSONANT_ONLY_LONG_TOKEN_REGEX.test(token)
      );
    });
    if (hasConsonantGibberish) {
      return { ok: false, reason: "format" };
    }
  }

  if (FRAGMENTED_CHARS_REGEX.test(spaced)) {
    return { ok: false, reason: "format" };
  }

  return {
    ok: true,
    cleaned,
    canonicalKey: canonicalCategoryKey(cleaned),
  };
}
