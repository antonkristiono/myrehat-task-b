export type Listing = {
	id: string;
	title: string;
	price: number;
	location: string;
	category: string;
	whatsapp: string;
	description: string | null;
	userId: string;
	createdAt: Date | string;
};
