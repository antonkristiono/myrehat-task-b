"use client";

import { Button } from "@myrehat-task-b/ui/components/button";
import Link from "next/link";
import { ListingForm } from "@/components/listing-form";
import Loader from "@/components/loader";
import { authClient } from "@/lib/auth-client";

export default function NewListingPage() {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return <Loader />;
	}

	return (
		<div className="mx-auto w-full max-w-2xl px-4 pb-16">
			<header className="pt-8 pb-6 sm:pt-10">
				<h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
					List your homestay
				</h1>
				<p className="text-muted-foreground mt-1 text-sm">
					Only signed-in members can publish. Buyers will reach you directly on
					WhatsApp.
				</p>
			</header>

			{session ? (
				<div className="bg-card rounded-xl border p-4 sm:p-6">
					<ListingForm />
				</div>
			) : (
				<div className="rounded-xl border border-dashed p-8 text-center">
					<h2 className="text-lg font-medium">Sign in to post a listing</h2>
					<p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
						We ask every host to sign in so buyers know who they are talking to.
					</p>
					<Button
						className="mt-4"
						nativeButton={false}
						render={<Link href="/login" />}
					>
						Sign in
					</Button>
				</div>
			)}
		</div>
	);
}
