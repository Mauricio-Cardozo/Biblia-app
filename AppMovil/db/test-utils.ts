import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";

interface TestDb {
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
  runAsync(sql: string, params?: unknown[]): Promise<{ lastInsertRowId: number; changes: number }>;
}

let _db: TestDb | null = null;

export async function createTestDb(): Promise<TestDb> {
  if (_db) return _db;

  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(path.resolve(__dirname, "..", "assets", "iglesia_digital.db"));
  const sqlDb = new SQL.Database(buffer);

  const getAllAsync = <T>(sql: string, params?: unknown[]): Promise<T[]> => {
    const stmt = sqlDb.prepare(sql);
    if (params && params.length > 0) stmt.bind(params as any);
    const rows: T[] = [];
    while (stmt.step()) rows.push(stmt.getAsObject() as T);
    stmt.free();
    return Promise.resolve(rows);
  };

  _db = {
    getAllAsync,
    getFirstAsync: <T>(sql: string, params?: unknown[]) =>
      getAllAsync<T>(sql, params).then((r) => r[0] ?? null),
    runAsync: (sql: string, params?: unknown[]) => {
      sqlDb.run(sql, params as any);
      return Promise.resolve({ lastInsertRowId: 0, changes: 0 });
    },
  };
  return _db;
}
