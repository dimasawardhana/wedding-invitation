import { execFileSync } from "node:child_process";
import path from "node:path";

/**
 * Clears the dedicated e2e database after a run.
 *
 * The suite creates accounts, invitations and RSVPs. They live in `wedding_e2e`
 * — never the development database — and this teardown truncates them so
 * repeated runs start clean and nothing accumulates on the developer's disk.
 */
export default function globalTeardown(): void {
  // Playwright runs from the config's directory (the frontend package).
  const composeFile = path.resolve(process.cwd(), "..", "wedding-invitation-be", "docker-compose.yml");
  const db = process.env.E2E_DB ?? "wedding_e2e";

  try {
    execFileSync(
      "docker",
      [
        "compose",
        "-f",
        composeFile,
        "exec",
        "-T",
        "db",
        "psql",
        "-U",
        "postgres",
        "-d",
        db,
        "-c",
        "TRUNCATE rsvps, invitations, users RESTART IDENTITY CASCADE",
      ],
      { stdio: "ignore" },
    );
  } catch (error) {
    // Teardown is best-effort: a missing container must not fail the run, since
    // the tests already reported their own outcome. Surface it so the leftover
    // rows are not a silent surprise.
    console.warn(`[e2e] could not reset ${db}:`, error instanceof Error ? error.message : error);
  }
}
