import { useSQLiteContext, type SQLiteDatabase } from "expo-sqlite";
import { useEffect, useState, useCallback } from "react";

export function useDbQuery<T>(
  fetcher: (db: SQLiteDatabase) => Promise<T>,
  deps: React.DependencyList = [],
) {
  const db = useSQLiteContext();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(() => {
    setLoading(true);
    setError(null);
    fetcher(db)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Error desconocido"))
      .finally(() => setLoading(false));
  }, [db, fetcher, ...deps]);

  useEffect(() => { execute(); }, [execute]);

  return { data, loading, error, refetch: execute };
}
