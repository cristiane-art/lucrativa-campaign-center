// Banco de teste isolado — nunca o banco de desenvolvimento/produção. Usa
// TEST_DATABASE_URL se definida (ex: CI), senão um Postgres local por
// padrão (mesmo servidor do dev, banco separado).
export const TEST_DB_URL =
  process.env.TEST_DATABASE_URL || "postgresql://postgres:localdev@localhost:5432/lucrativa_test";
