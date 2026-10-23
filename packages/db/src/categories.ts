/**
 * Satu-satunya sumber daftar kategori listing.
 *
 * Empat opsi ini dipakai tiga tempat sekaligus supaya tidak pernah berbeda:
 * enum Postgres (schema/listing.ts), validasi API (packages/api), dan dropdown
 * di form (apps/web). Opsi kelima harus ditolak di semua lapisan.
 */
export const LISTING_CATEGORIES = [
	"Buy Property",
	"Buy land to build homestay",
	"Buy Airbnb Profile",
	"Buy Airbnb Business",
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];
