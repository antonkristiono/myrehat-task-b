import { describe, expect, it, vi } from "vitest";

import {
	buildPolishPrompt,
	cleanPolishedText,
	POLISH_SYSTEM_PROMPT,
	polishListingDescription,
} from "../scripts/polish-core";

const INPUT = {
	title: "3-bedroom homestay near Tanah Rata",
	category: "Buy Property",
	description:
		"rumah 3 bilik, ada air panas, dekat pasar malam, boleh muat 8 orang",
};

const POLISHED =
	"Three-bedroom homestay in Tanah Rata with hot water, sleeping up to eight guests and a short walk from the night market.";

describe("buildPolishPrompt", () => {
	it("includes the title, category, and raw description", () => {
		const prompt = buildPolishPrompt(INPUT);

		expect(prompt).toContain(INPUT.title);
		expect(prompt).toContain(INPUT.category);
		expect(prompt).toContain(INPUT.description);
	});

	it("omits the category line when no category is given", () => {
		const prompt = buildPolishPrompt({
			title: "Land in Pahang",
			description: "tanah 2 ekar",
		});

		expect(prompt).not.toContain("Category:");
		expect(prompt).toContain("Land in Pahang");
	});
});

describe("cleanPolishedText", () => {
	it("strips markdown fences and wrapping quotes", () => {
		expect(cleanPolishedText('```text\n"Nice homestay."\n```')).toBe(
			"Nice homestay.",
		);
	});

	it("collapses three or more blank lines", () => {
		expect(cleanPolishedText("First line.\n\n\n\nSecond line.")).toBe(
			"First line.\n\nSecond line.",
		);
	});
});

describe("polishListingDescription", () => {
	it("passes the system prompt and generated prompt to the provider", async () => {
		const generate = vi.fn(async () => POLISHED);

		const result = await polishListingDescription(INPUT, generate);

		expect(result).toBe(POLISHED);
		expect(generate).toHaveBeenCalledTimes(1);
		expect(generate).toHaveBeenCalledWith(
			expect.stringContaining(INPUT.title),
			POLISH_SYSTEM_PROMPT,
		);
	});

	it("retries once when the model returns an empty string", async () => {
		const generate = vi
			.fn<() => Promise<string>>()
			.mockResolvedValueOnce("   ")
			.mockResolvedValueOnce(POLISHED);

		const result = await polishListingDescription(INPUT, generate);

		expect(result).toBe(POLISHED);
		expect(generate).toHaveBeenCalledTimes(2);
	});

	it("retries when the provider throws, then succeeds", async () => {
		const generate = vi
			.fn<() => Promise<string>>()
			.mockRejectedValueOnce(new Error("503 from provider"))
			.mockResolvedValueOnce(POLISHED);

		await expect(polishListingDescription(INPUT, generate)).resolves.toBe(
			POLISHED,
		);
		expect(generate).toHaveBeenCalledTimes(2);
	});

	it("throws the last error after all attempts fail", async () => {
		const generate = vi.fn(async () => {
			throw new Error("opencode server offline");
		});

		await expect(polishListingDescription(INPUT, generate)).rejects.toThrow(
			"opencode server offline",
		);
		expect(generate).toHaveBeenCalledTimes(2);
	});

	it("rejects a too-short description without calling the model", async () => {
		const generate = vi.fn(async () => POLISHED);

		await expect(
			polishListingDescription({ ...INPUT, description: "murah" }, generate),
		).rejects.toThrow("Description must be at least 10 characters");
		expect(generate).not.toHaveBeenCalled();
	});

	it("requires a title", async () => {
		const generate = vi.fn(async () => POLISHED);

		await expect(
			polishListingDescription({ ...INPUT, title: "  " }, generate),
		).rejects.toThrow("Listing title is required");
	});
});
