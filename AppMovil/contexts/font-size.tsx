import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "font_size_multiplier";
const DEFAULT = 1;
const MIN = 0.8;
const MAX = 1.5;
const STEP = 0.1;

interface FontSizeCtx {
  multiplier: number;
  setMultiplier: (v: number) => void;
  aumentar: () => void;
  disminuir: () => void;
  reset: () => void;
  min: number;
  max: number;
}

const Ctx = createContext<FontSizeCtx>({
  multiplier: DEFAULT,
  setMultiplier: () => {},
  aumentar: () => {},
  disminuir: () => {},
  reset: () => {},
  min: MIN,
  max: MAX,
});

export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [multiplier, setMultiplier] = useState(DEFAULT);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v) setMultiplier(parseFloat(v));
    });
  }, []);

  const persist = useCallback((v: number) => {
    setMultiplier(v);
    AsyncStorage.setItem(STORAGE_KEY, String(v)).catch(() => {});
  }, []);

  const aumentar = useCallback(() => {
    persist(Math.round((multiplier + STEP) * 10) / 10);
  }, [multiplier, persist]);

  const disminuir = useCallback(() => {
    persist(Math.round((multiplier - STEP) * 10) / 10);
  }, [multiplier, persist]);

  const reset = useCallback(() => {
    persist(DEFAULT);
  }, [persist]);

  return (
    <Ctx.Provider value={{ multiplier, setMultiplier: persist, aumentar, disminuir, reset, min: MIN, max: MAX }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFontSize() {
  return useContext(Ctx);
}

export function fs(base: number, multiplier: number): number {
  return Math.round(base * multiplier);
}
