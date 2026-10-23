import { LISTING_CATEGORIES } from "@myrehat-task-b/db/categories";
import { z } from "zod";

export type { ListingCategory } from "@myrehat-task-b/db/categories";
export { LISTING_CATEGORIES } from "@myrehat-task-b/db/categories";

/** Terima +60 12-345 6789, 60123456789, (60) 12 345 6789, dst. */
const PHONE_PATTERN = /^\+?[\d\s().-]{8,20}$/;

/**
 * Hanya 4 kategori ini yang valid. Nilai diambil dari satu konstanta bersama
 * (packages/db/src/categories.ts) sehingga dropdown, API, dan enum DB selalu
 * sinkron — opsi kelima otomatis ditolak.
 */
export const listingCategorySchema = z.enum(LISTING_CATEGORIES, {
	error: `Category must be one of: ${LISTING_CATEGORIES.join(", ")}`,
});

export const createListingSchema = z.object({
	title: z
		.string()
		.trim()
		.min(3, "Title must be at least 3 characters")
		.max(120, "Title must be at most 120 characters"),
	price: z.coerce
		.number()
		.int("Price must be a whole number")
		.positive("Price must be greater than 0")
		.max(1_000_000_000, "Price is too large"),
	location: z
		.string()
		.trim()
		.min(2, "Location must be at least 2 characters")
		.max(120, "Location must be at most 120 characters"),
	category: listingCategorySchema,
	whatsapp: z
		.string()
		.trim()
		.regex(
			PHONE_PATTERN,
			"Enter a valid WhatsApp number (e.g. +60 12-345 6789)",
		),
	description: z
		.string()
		.trim()
		.max(2000, "Description must be at most 2000 characters")
		.optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

/**
 * Simpan nomor sebagai digit saja supaya link wa.me selalu valid
 * (+60 12-345 6789 -> 60123456789).
 */
export function normalizeWhatsApp(value: string): string {
	return value.replace(/[^\d]/g, "");
}
