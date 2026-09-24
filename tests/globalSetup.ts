import { execSync } from "child_process";
import fs from "fs";
import { TEST_DB_PATH, TEST_DB_URL } from "./testDb";

// Provisiona um banco SQLite isolado para os testes (nunca o dev.db) —
// roda uma vez antes de toda a suíte.
export default function globalSetup() {
  for (const suffix of ["", "-journal"]) {
    const p = TEST_DB_PATH + suffix;
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: __dirname + "/..",
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: "inherit",
  });
}
