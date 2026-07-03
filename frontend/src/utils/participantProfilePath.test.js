import { describe, expect, it } from "vitest";
import { participantProfilePath } from "./participantProfilePath.js";

describe("participantProfilePath", () => {
  it("opens rich farmer profiles and basic buyer profiles", () => {
    expect(
      participantProfilePath({ id: "farmer-1", role: "farmer" })
    ).toBe("/farmers/farmer-1");
    expect(participantProfilePath({ id: "buyer-1", role: "buyer" })).toBe(
      "/users/buyer-1"
    );
  });
});
