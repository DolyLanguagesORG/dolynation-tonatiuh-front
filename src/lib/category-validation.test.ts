import { describe, expect, it } from "@jest/globals";

import {
  canonicalCategoryKey,
  cleanCategoryName,
  MAX_CATEGORY_LENGTH,
  MIN_CATEGORY_LENGTH,
  validateCategoryInput,
} from "@/lib/category-validation";

describe("category-validation helpers", () => {
  it("strips zero-width characters and normalizes excessive spacing", () => {
    expect(cleanCategoryName("  Astro\u200Bfísica   Moderna \uFEFF ")).toBe(
      "Astrofísica Moderna",
    );
  });

  it("produces accent-, case-, and hyphen-insensitive canonical keys", () => {
    expect(canonicalCategoryKey("Inteligencia Artificial")).toBe(
      canonicalCategoryKey("  inteligencia-artificial  "),
    );
    expect(canonicalCategoryKey("Educación Física")).toBe("educacion fisica");
  });

  it("accepts legitimate categories including programming languages and SQL", () => {
    expect(validateCategoryInput("C++")).toEqual({
      ok: true,
      cleaned: "C++",
      canonicalKey: "c++",
    });
    expect(validateCategoryInput("C#")).toEqual({
      ok: true,
      cleaned: "C#",
      canonicalKey: "c#",
    });
    expect(validateCategoryInput("SQL")).toEqual({
      ok: true,
      cleaned: "SQL",
      canonicalKey: "sql",
    });
    expect(validateCategoryInput("Historia del Arte Contemporáneo")).toEqual({
      ok: true,
      cleaned: "Historia del Arte Contemporáneo",
      canonicalKey: "historia del arte contemporaneo",
    });
  });

  it("rejects empty inputs and out-of-range lengths with explicit reasons", () => {
    expect(validateCategoryInput("   \u200B ")).toEqual({
      ok: false,
      reason: "required",
    });
    expect(validateCategoryInput("A".repeat(MIN_CATEGORY_LENGTH - 1))).toEqual({
      ok: false,
      reason: "length",
    });
    expect(validateCategoryInput("A".repeat(MAX_CATEGORY_LENGTH + 1))).toEqual({
      ok: false,
      reason: "length",
    });
  });

  it("rejects URLs, emails, HTML tags, spam, keyboard mash, and gibberish", () => {
    expect(validateCategoryInput("https://spam.example.com")).toEqual({
      ok: false,
      reason: "format",
    });
    expect(validateCategoryInput("user@domain.com")).toEqual({
      ok: false,
      reason: "format",
    });
    expect(validateCategoryInput("<script>alert(1)</script>")).toEqual({
      ok: false,
      reason: "format",
    });
    expect(validateCategoryInput("hooooola")).toEqual({
      ok: false,
      reason: "format",
    });
    expect(validateCategoryInput("qwertyuiop")).toEqual({
      ok: false,
      reason: "format",
    });
    expect(validateCategoryInput("bcdfghj")).toEqual({
      ok: false,
      reason: "format",
    });
    expect(validateCategoryInput("12345678")).toEqual({
      ok: false,
      reason: "format",
    });
  });
});
