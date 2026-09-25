import { execSync } from "child_process";
import { TEST_DB_URL } from "./testDb";

// Garante que o banco de teste (Postgres, nunca o de dev/produção) está com
// o schema em dia antes da suíte rodar.
export default function globalSetup() {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    cwd: __dirname + "/..",
    env: { ...process.env, DATABASE_POSTGRES_URL: TEST_DB_URL },
    stdio: "inherit",
  });
}
