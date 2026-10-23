import { desc } from "drizzle-orm";

import type { Database } from "../index";
import { listing } from "../schema/listing";

export type NewListing = typeof listing.$inferInsert;
export type ListingRow = typeof listing.$inferSelect;

export function listListings(db: Database, limit = 60): Promise<ListingRow[]> {
	return db
		.select()
		.from(listing)
		.orderBy(desc(listing.createdAt))
		.limit(limit);
}

export async function createListing(
	db: Database,
	values: NewListing,
): Promise<ListingRow> {
	const [created] = await db.insert(listing).values(values).returning();

	if (!created) {
		throw new Error("Listing insert returned no row");
	}

	return created;
}
