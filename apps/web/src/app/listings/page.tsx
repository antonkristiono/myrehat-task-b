"use client";

import { Button } from "@myrehat-task-b/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { ListingCard } from "@/components/listing-card";
import { orpc } from "@/utils/orpc";

export default function ListingsPage() {
	const listings = useQuery(orpc.listings.list.queryOptions());

	return (
		<div className="mx-auto w-full max-w-6xl px-4 pb-16">
			<header className="flex flex-wrap items-end justify-between gap-3 pt-8 pb-6 sm:pt-10">
				<div className="min-w-0">
					<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
						Homestays for sale
					</h1>
					<p className="text-muted-foreground mt-1 text-sm">
						Property, land, and Airbnb businesses — contact the host directly.
					</p>
				</div>
				<Button
					className="shrink-0"
					nativeButton={false}
					render={<Link href="/listings/new" />}
				>
					Post a listing
				</Button>
			</header>

			{listings.isLoading ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[0, 1, 2, 3].map((key) => (
						<div
							key={key}
							className="bg-muted/40 h-56 animate-pulse rounded-xl border"
						/>
					))}
				</div>
			) : listings.isError ? (
				<div className="border-destructive/40 bg-destructive/5 rounded-xl border p-6">
					<p className="text-sm font-medium">Could not load listings.</p>
					<p className="text-muted-foreground mt-1 text-sm">
						{listings.error.message}
					</p>
					<Button
						variant="outline"
						className="mt-4"
						onClick={() => listings.refetch()}
					>
						Try again
					</Button>
				</div>
			) : listings.data && listings.data.length > 0 ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{listings.data.map((listing) => (
						<ListingCard key={listing.id} listing={listing} />
					))}
				</div>
			) : (
				<div className="rounded-xl border border-dashed p-10 text-center">
					<h2 className="text-lg font-medium">No listings yet</h2>
					<p className="text-muted-foreground mx-auto mt-1 max-w-md text-sm">
						Sign in and post the first homestay, land, or Airbnb business for
						sale.
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
		</div>
	);
}
