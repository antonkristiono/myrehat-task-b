import { describe, expect, it } from "vitest";

import {
	createListingSchema,
	normalizeWhatsApp,
} from "../packages/api/src/schemas/listing";

const BASE = {
	title: "3-bedroom homestay near Tanah Rata",
	price: 450000,
	location: "Cameron Highlands, Pahang",
	whatsapp: "+60 12-345 6789",
};

const ACCEPTED = [
	"Buy Property",
	"Buy land to build homestay",
	"Buy Airbnb Profile",
	"Buy Airbnb Business",
] as const;

const REJECTED = "Rent Property";

describe("listing categories", () => {
	it.each(ACCEPTED)("accepts the category %s", (category) => {
		const result = createListingSchema.safeParse({ ...BASE, category });

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.category).toBe(category);
		}
	});

	it("rejects a fifth option outside the four allowed categories", () => {
		const result = createListingSchema.safeParse({
			...BASE,
			category: REJECTED,
		});

		expect(result.success).toBe(false);
	});

	it("rejects a missing category", () => {
		const { category: _category, ...withoutCategory } = {
			...BASE,
			category: ACCEPTED[0],
		};

		expect(createListingSchema.safeParse(withoutCategory).success).toBe(false);
	});
});

describe("createListingSchema", () => {
	it("coerces a numeric string price (form input) to a number", () => {
		const result = createListingSchema.safeParse({
			...BASE,
			category: ACCEPTED[0],
			price: "450000",
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.price).toBe(450000);
		}
	});

	it("rejects a zero, negative, or fractional price", () => {
		for (const price of [0, -10, 12.5]) {
			expect(
				createListingSchema.safeParse({ ...BASE, category: ACCEPTED[0], price })
					.success,
			).toBe(false);
		}
	});

	it("rejects a too-short title and an invalid WhatsApp number", () => {
		expect(
			createListingSchema.safeParse({
				...BASE,
				category: ACCEPTED[0],
				title: "ab",
			}).success,
		).toBe(false);
		expect(
			createListingSchema.safeParse({
				...BASE,
				category: ACCEPTED[0],
				whatsapp: "call me",
			}).success,
		).toBe(false);
	});

	it("normalizes a WhatsApp number to digits for wa.me links", () => {
		expect(normalizeWhatsApp("+60 12-345 6789")).toBe("60123456789");
	});
});
