import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("argon2", () => ({ hash: vi.fn(async () => "new-hash") }));

vi.mock("../../config/database", () => ({
  prisma: {
    familyMember: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "../../config/database.js";
import {
  getMembersByFamily,
  createMember,
  updateMember,
  updateMemberPin,
  unlockMemberPin,
} from "./members.repository.js";

const fm = prisma.familyMember as any;
const row = (pin: string | null) => ({
  id: "member-1",
  familyId: "family-1",
  name: "Tom",
  role: "CHILD",
  pin,
  pinRequired: true,
  points: 0,
});

beforeEach(() => vi.clearAllMocks());

// Le hash du PIN (4 chiffres → cassable hors ligne) et le token FCM ne
// doivent jamais sortir de l'API.
describe("members.repository — champs sensibles", () => {
  it("getMembersByFamily : pas de pin, hasPin à la place, fcmToken omis", async () => {
    fm.findMany.mockResolvedValue([row("argon2-hash"), row(null)]);

    const members = await getMembersByFamily("family-1");

    expect(members[0]).not.toHaveProperty("pin");
    expect(members[0]?.hasPin).toBe(true);
    expect(members[1]?.hasPin).toBe(false);
    expect(fm.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ omit: { fcmToken: true } }),
    );
  });

  it("createMember et updateMember : pas de pin dans la réponse", async () => {
    fm.create.mockResolvedValue(row(null));
    fm.update.mockResolvedValue(row("argon2-hash"));

    const created = await createMember("family-1", { name: "Tom", role: "CHILD" });
    const updated = await updateMember("member-1", { pinRequired: false });

    expect(created).not.toHaveProperty("pin");
    expect(updated).not.toHaveProperty("pin");
    expect(updated.hasPin).toBe(true);
    expect(fm.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { pinRequired: false } }),
    );
  });
});

describe("members.repository — déblocage PIN", () => {
  it("nouveau PIN défini par le parent — blocage levé", async () => {
    fm.update.mockResolvedValue(row("new-hash"));

    await updateMemberPin("member-1", "1234");

    expect(fm.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { pin: "new-hash", failedPinAttempts: 0, pinLockedUntil: null },
      }),
    );
  });

  it("unlockMemberPin — compteur et blocage remis à zéro, pas de pin renvoyé", async () => {
    fm.update.mockResolvedValue(row("argon2-hash"));

    const member = await unlockMemberPin("member-1");

    expect(fm.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { failedPinAttempts: 0, pinLockedUntil: null },
      }),
    );
    expect(member).not.toHaveProperty("pin");
  });
});
