import { beforeEach, describe, expect, it } from "vitest";
import { readUiMode } from "@/hooks/useUiMode";

describe("saved StudyOS appearance choice", () => {
  beforeEach(() => window.localStorage.clear());

  it("opens in Liquid Glass when no choice has been saved", () => {
    expect(readUiMode()).toBe("liquid-glass");
  });

  it("restores the Current UI choice after reload", () => {
    window.localStorage.setItem("studyos:ui-mode-v1", "current");
    expect(readUiMode()).toBe("current");
  });

  it("uses Liquid Glass for the new design choice", () => {
    window.localStorage.setItem("studyos:ui-mode-v1", "liquid-glass");
    expect(readUiMode()).toBe("liquid-glass");
  });
});