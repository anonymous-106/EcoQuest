// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { cn } from "../lib/utils";

describe("cn (class name utility)", () => {
  it("returns empty string for no arguments", () => {
    expect(cn()).toBe("");
  });

  it("returns a single class unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("joins multiple classes with a space", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("ignores falsy values (false, undefined, null)", () => {
    expect(cn("foo", false, undefined, null as unknown as undefined, "bar")).toBe("foo bar");
  });

  it("evaluates conditional classes correctly", () => {
    const active = true;
    expect(cn("base", active && "active")).toBe("base active");
  });

  it("drops false conditional classes", () => {
    const active = false;
    expect(cn("base", active && "active")).toBe("base");
  });

  it("supports object syntax (clsx feature)", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("merges conflicting Tailwind classes (last wins)", () => {
    // tailwind-merge resolves conflicts: p-2 + p-4 → p-4
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("merges conflicting text colour classes", () => {
    expect(cn("text-red-500", "text-green-600")).toBe("text-green-600");
  });

  it("merges conflicting background colour classes", () => {
    expect(cn("bg-blue-100", "bg-green-200")).toBe("bg-green-200");
  });

  it("does not deduplicate non-conflicting classes", () => {
    const result = cn("flex", "items-center", "justify-between");
    expect(result).toBe("flex items-center justify-between");
  });

  it("handles arrays of classes", () => {
    expect(cn(["foo", "bar"], "baz")).toBe("foo bar baz");
  });

  it("handles deeply nested conditional arrays", () => {
    expect(cn(["flex", [true && "items-center", false && "hidden"]])).toBe(
      "flex items-center",
    );
  });

  it("trims extra whitespace from class strings", () => {
    expect(cn("  foo  ", "  bar  ")).toBe("foo bar");
  });
});
