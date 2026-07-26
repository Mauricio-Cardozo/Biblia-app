/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { useDbQuery } from "@/hooks/use-db-query";

jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => ({
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    runAsync: jest.fn(),
  }),
}));

function TestComp({ fetcher }: { fetcher?: (db: unknown) => Promise<string> }) {
  const { data, loading, error } = useDbQuery(
    fetcher ?? jest.fn().mockResolvedValue("ok"),
  );
  return <div>{loading ? "loading..." : error ?? (data ?? "no data")}</div>;
}

describe("useDbQuery", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows loading then data", async () => {
    render(<TestComp />);
    expect(screen.getByText("loading...")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("ok")).toBeTruthy());
  });

  it("shows error on failure", async () => {
    render(<TestComp fetcher={jest.fn().mockRejectedValue(new Error("db error"))} />);
    await waitFor(() => expect(screen.getByText("db error")).toBeTruthy());
  });

  it("calls fetcher with db", async () => {
    const fetcher = jest.fn().mockResolvedValue("ok");
    render(<TestComp fetcher={fetcher} />);
    await waitFor(() => expect(screen.getByText("ok")).toBeTruthy());
    expect(fetcher).toHaveBeenCalledWith(
      expect.objectContaining({ getAllAsync: expect.any(Function) }),
    );
  });
});
