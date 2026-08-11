import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("verifies the correct password and rejects the wrong one", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("salts — the same password hashes differently each time", async () => {
    const a = await hashPassword("same");
    const b = await hashPassword("same");
    expect(a).not.toBe(b);
    expect(await verifyPassword("same", a)).toBe(true);
    expect(await verifyPassword("same", b)).toBe(true);
  });

  it("produces the documented self-describing format", async () => {
    const hash = await hashPassword("x");
    expect(hash).toMatch(/^scrypt\$16384\$8\$1\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  });

  it("rejects malformed stored values instead of throwing", async () => {
    for (const bad of ["", "plaintext", "scrypt$16384$8$1$onlyfive", "bcrypt$1$2$3$4$5", "scrypt$x$y$z$$"]) {
      expect(await verifyPassword("x", bad)).toBe(false);
    }
  });
});
