import path from "path";

export const TEST_DB_PATH = path.resolve(__dirname, "test.db");
export const TEST_DB_URL = `file:${TEST_DB_PATH}`;
