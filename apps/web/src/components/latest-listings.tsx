"use client";

import { Button } from "@myrehat-task-b/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ListingCard } from "@/components/listing-card";
import { orpc } from "@/utils/orpc";

export function LatestListings() {
	const listings = useQuery(orpc.listings.list.queryOptions());
	const latest = (listings.data ?? []).slice(0, 6);

	return (
		<section
			aria-labelledby="latest-listings"
			className="border-t py-8 sm:py-10"
		>
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div className="min-w-0">
					<h2
						id="latest-listings"
						className="text-xl font-semibold tracking-tight sm:text-2xl"
					>
						Latest listings
					</h2>
					<p className="text-muted-foreground mt-1 text-sm">
						Posted by BuyHomestay members, with a direct WhatsApp contact.
					</p>
				</div>
				<Button
					variant="ghost"
					size="sm"
					className="shrink-0"
					nativeButton={false}
					render={<Link href="/listings" />}
				>
					View all
					<ArrowRight className="size-4" aria-hidden />
				</Button>
			</div>

			{listings.isLoading ? (
				<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[0, 1, 2].map((key) => (
						<div
							key={key}
							className="bg-muted/40 h-56 animate-pulse rounded-xl border"
						/>
					))}
				</div>
			) : latest.length > 0 ? (
				<div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{latest.map((listing) => (
						<ListingCard key={listing.id} listing={listing} />
					))}
				</div>
			) : (
				<div className="mt-5 rounded-xl border border-dashed p-8 text-center">
					<p className="text-muted-foreground text-sm">
						No listings yet — be the first host to post one.
					</p>
					<Button
						className="mt-4"
						nativeButton={false}
						render={<Link href="/listings/new" />}
					>
						Post a listing
					</Button>
				</div>
			)}
		</section>
	);
}
