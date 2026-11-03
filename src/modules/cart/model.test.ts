import { describe, expect, test } from "vitest";
import { addLine, readCart, serializeCart } from "./model";
describe("untrusted local cart", () => {
  test("keeps variants separate and round trips selection without prices", () => {
    const lines = addLine(addLine([], "small", 2), "large", 1);
    expect(lines).toHaveLength(2);
    expect(readCart(serializeCart(lines))).toEqual(lines);
    expect(JSON.parse(serializeCart(lines)).lines[0]).toEqual({
      variantId: "small",
      quantity: 2,
    });
  });
  test("combines duplicate ids and bounds quantity, actual stock is checked by server", () => {
    expect(addLine([{ variantId: "small", quantity: 98 }], "small", 5)).toEqual(
      [{ variantId: "small", quantity: 99 }],
    );
  });
  test("rejects invalid quantities and recovers corrupt storage", () => {
    expect(addLine([], "small", NaN)).toEqual([]);
    expect(addLine([], "small", -1)).toEqual([]);
    for (const raw of [
      null,
      "oops",
      "{}",
      '{"version":2,"lines":[]}',
      '{"version":1,"lines":[{"variantId":"a","quantity":-1}]}',
    ])
      expect(readCart(raw)).toEqual([]);
  });
});
