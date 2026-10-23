import { describe, expect, it } from "vitest";

import { parseWahaWebhook } from "../apps/web/src/lib/waha";

const VALID = {
	event: "message",
	payload: {
		id: "true_60123456789@c.us_ABCDEF",
		from: "60123456789@c.us",
		body: "Hi, do you have a homestay in Cameron Highlands?",
		fromMe: false,
	},
};

describe("parseWahaWebhook", () => {
	it("accepts a valid WAHA message payload and keeps from + body", () => {
		const result = parseWahaWebhook(VALID);

		expect(result).toEqual({
			ok: true,
			data: {
				from: "60123456789@c.us",
				body: "Hi, do you have a homestay in Cameron Highlands?",
			},
		});
	});

	it("trims surrounding whitespace in body and from", () => {
		const result = parseWahaWebhook({
			event: "message",
			payload: { from: "  60123456789@c.us  ", body: "  hello  " },
		});

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.data).toEqual({ from: "60123456789@c.us", body: "hello" });
		}
	});

	it.each([
		["a null body", null],
		["a non-object body", "not json"],
		["a missing payload", { event: "message" }],
		["a missing from", { event: "message", payload: { body: "hello" } }],
		[
			"a missing body",
			{ event: "message", payload: { from: "60123456789@c.us" } },
		],
		[
			"an empty body",
			{ event: "message", payload: { from: "60123456789@c.us", body: "   " } },
		],
		[
			"a missing event",
			{ payload: { from: "60123456789@c.us", body: "hello" } },
		],
	])("rejects %s", (_label, payload) => {
		const result = parseWahaWebhook(payload);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.length).toBeGreaterThan(0);
		}
	});

	it("rejects non-message events such as session.status", () => {
		const result = parseWahaWebhook({
			event: "session.status",
			payload: { from: "60123456789@c.us", body: "Connected" },
		});

		expect(result).toEqual({
			ok: false,
			error: "unsupported event: session.status",
		});
	});

	it("ignores messages sent by the bot itself to avoid reply loops", () => {
		const result = parseWahaWebhook({
			...VALID,
			payload: { ...VALID.payload, fromMe: true },
		});

		expect(result.ok).toBe(false);
	});

	it("caps very long bodies at 4000 characters", () => {
		const result = parseWahaWebhook({
			event: "message",
			payload: { from: "60123456789@c.us", body: "x".repeat(4001) },
		});

		expect(result.ok).toBe(false);
	});
});
