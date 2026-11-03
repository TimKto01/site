import { expect, test } from "vitest";
import { hashPassword, verifyPassword } from "./password";
test("password hashing uses independent salts and rejects wrong passwords", async () => {
  const first = await hashPassword("test-only-password-123");
  const second = await hashPassword("test-only-password-123");
  expect(first).not.toBe(second);
  expect(first).not.toContain("test-only-password");
  expect(await verifyPassword("test-only-password-123", first)).toBe(true);
  expect(await verifyPassword("wrong-password", first)).toBe(false);
  expect(await verifyPassword("test-only-password-123", "corrupt")).toBe(false);
});
