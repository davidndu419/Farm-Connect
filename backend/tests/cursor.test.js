import { describe, expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "../src/utils/cursor.js";

describe("cursor utilities", () => {
  it("round trips an opaque pagination position", () => {
    const cursor = {
      value: "2026-07-02T12:00:00.000Z",
      id: "10000000-0000-4000-8000-000000000001"
    };

    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it("rejects malformed cursors with an API error", () => {
    expect(() => decodeCursor("not-a-cursor")).toThrow(
      "The pagination cursor is invalid."
    );
  });
});
