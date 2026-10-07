import { describe, it, expect, vi } from "vitest";

vi.mock("../../config/database", () => ({ prisma: {} }));

import { randomFamilyCode } from "./auth.repository.js";

describe("randomFamilyCode", () => {
  it("toujours 6 caractères A-Z0-9 (accepté par loginChildSchema)", () => {
    for (let i = 0; i < 1000; i++) {
      expect(randomFamilyCode()).toMatch(/^[A-Z0-9]{6}$/);
    }
  });
});
