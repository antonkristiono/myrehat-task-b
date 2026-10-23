import { defineRelationsPart } from "drizzle-orm";
import {
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
} from "drizzle-orm/pg-core";

import { LISTING_CATEGORIES } from "../categories";
import { user } from "./auth";

export const listingCategory = pgEnum("listing_category", LISTING_CATEGORIES);

export const listing = pgTable(
	"listing",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		title: text("title").notNull(),
		/** Harga penuh dalam MYR (integer, tanpa sen). */
		price: integer("price").notNull(),
		location: text("location").notNull(),
		category: listingCategory("category").notNull(),
		/** Nomor WhatsApp yang sudah dinormalisasi ke digit (contoh: 60123456789). */
		whatsapp: text("whatsapp").notNull(),
		description: text("description"),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true })
			.defaultNow()
			.notNull(),
	},
	(table) => [
		index("listing_created_at_idx").on(table.createdAt),
		index("listing_user_id_idx").on(table.userId),
	],
);

export const listingRelations = defineRelationsPart({ listing, user }, (r) => ({
	listing: {
		seller: r.one.user({
			from: r.listing.userId,
			to: r.user.id,
		}),
	},
}));
