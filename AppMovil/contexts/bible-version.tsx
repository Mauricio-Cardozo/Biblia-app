import React, { createContext, useCallback, useContext, useState } from "react";

export interface VersionBiblia {
  id: string;
  nombre: string;
  descripcion: string;
  tabla: string;
}

const VERSIONES: VersionBiblia[] = [
  {
    id: "pueblo-dios",
    nombre: "Biblia del Pueblo de Dios",
    descripcion: "Traducción argentina aprobada por la Conferencia Episcopal",
    tabla: "biblia_pueblo_dios",
  },
];

interface BibliaVersionCtx {
  version: VersionBiblia;
  versiones: VersionBiblia[];
  setVersion: (id: string) => void;
}

const Ctx = createContext<BibliaVersionCtx>({
  version: VERSIONES[0],
  versiones: VERSIONES,
  setVersion: () => {},
});

export function BibliaVersionProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(VERSIONES[0]);
  const setById = useCallback((id: string) => {
    const v = VERSIONES.find((x) => x.id === id);
    if (v) setVersion(v);
  }, []);
  return (
    <Ctx.Provider value={{ version, versiones: VERSIONES, setVersion: setById }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBibliaVersion() {
  return useContext(Ctx);
}
