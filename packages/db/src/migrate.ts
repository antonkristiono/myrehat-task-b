import { migrate } from "drizzle-orm/node-postgres/migrator";

import type { Database } from "./index";

/**
 * Terapkan migrasi SQL yang ada di src/migrations. Aman dipanggil berkali-kali:
 * Drizzle menyimpan riwayat di tabel __drizzle_migrations.
 */
export async function runMigrations(
	db: Database,
	migrationsFolder: string,
): Promise<void> {
	await migrate(db, { migrationsFolder });
}
