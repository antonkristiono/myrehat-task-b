import { describe, expect, it } from "vitest";

import { buildWahaReply, FALLBACK_REPLY } from "../apps/web/src/lib/waha";

describe("buildWahaReply", () => {
	it("returns exactly { to, reply } in WAHA's expected shape", () => {
		const result = buildWahaReply(
			"60123456789@c.us",
			"Yes! We have two homestays in Cameron Highlands.",
		);

		expect(result).toEqual({
			to: "60123456789@c.us",
			reply: "Yes! We have two homestays in Cameron Highlands.",
		});
		expect(Object.keys(result).sort()).toEqual(["reply", "to"]);
		expect(JSON.parse(JSON.stringify(result))).toEqual(result);
	});

	it("trims the destination and the reply text", () => {
		const result = buildWahaReply("  60123456789@c.us ", "\n  Hi there  \n");

		expect(result).toEqual({ to: "60123456789@c.us", reply: "Hi there" });
	});

	it("uses the fallback when the model returns an empty reply", () => {
		expect(buildWahaReply("60123456789@c.us", "   ")).toEqual({
			to: "60123456789@c.us",
			reply: FALLBACK_REPLY,
		});
	});

	it("never returns an empty reply field", () => {
		const result = buildWahaReply("60123456789@c.us", "");

		expect(result.reply.length).toBeGreaterThan(0);
		expect(typeof result.to).toBe("string");
	});
});
