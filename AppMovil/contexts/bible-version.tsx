import React, { createContext, useContext } from "react";

export interface VersionBiblia {
  id: string;
  nombre: string;
  descripcion: string;
  tabla: string;
}

const VERSION: VersionBiblia = {
  id: "pueblo-dios",
  nombre: "Biblia del Pueblo de Dios",
  descripcion: "Traducción argentina aprobada por la Conferencia Episcopal",
  tabla: "biblia_pueblo_dios",
};

const Ctx = createContext<VersionBiblia>(VERSION);

export function BibliaVersionProvider({ children }: { children: React.ReactNode }) {
  return <Ctx.Provider value={VERSION}>{children}</Ctx.Provider>;
}

export function useBibliaVersion() {
  return useContext(Ctx);
}
