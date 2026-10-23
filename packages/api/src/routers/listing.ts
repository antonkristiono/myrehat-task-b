import {
	createListing,
	listListings,
} from "@myrehat-task-b/db/repositories/listing";

import { protectedProcedure, publicProcedure } from "../index";
import { createListingSchema, normalizeWhatsApp } from "../schemas/listing";

export const listingRouter = {
	/** Publik: semua orang boleh melihat daftar listing. */
	list: publicProcedure.handler(async ({ context }) => {
		return listListings(context.db);
	}),

	/**
	 * Hanya user yang login (Better-Auth) yang boleh submit. `protectedProcedure`
	 * melempar UNAUTHORIZED kalau tidak ada session, jadi pengecekan tidak bisa
	 * dilewati dari browser.
	 */
	create: protectedProcedure
		.input(createListingSchema)
		.handler(async ({ input, context }) => {
			return createListing(context.db, {
				title: input.title,
				price: input.price,
				location: input.location,
				category: input.category,
				whatsapp: normalizeWhatsApp(input.whatsapp),
				description:
					input.description && input.description.length > 0
						? input.description
						: null,
				userId: context.session.user.id,
			});
		}),
};
