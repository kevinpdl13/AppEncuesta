import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Trabajador, Periodo, EncuestaConfig, Area } from '../types';

// ============================================================
// Store de sesión v2.0
// Gestiona: quién responde, qué período/config está activo,
// y si la sesión es anónima o nominal.
// ============================================================

type AppState = {
  // Worker
  trabajadorActual: Trabajador | null;
  // Área seleccionada en el flujo anónimo
  areaAnonimaSeleccionada: Area | null;
  // Período activo cargado al inicio del flujo worker
  periodoActual: Periodo | null;
  // Config de encuesta seleccionada (ANONIMA | NOMINAL)
  encuestaConfigSeleccionada: EncuestaConfig | null;
  // Puntaje acumulado en la sesión actual
  puntajeSesionActual: number;
  // ID de la sesión guardada en BD
  sesionIdActual: string | null;

  // Acciones
  setTrabajador: (t: Trabajador | null) => void;
  setAreaAnonimaSeleccionada: (a: Area | null) => void;
  setPeriodoActual: (p: Periodo | null) => void;
  setEncuestaConfig: (c: EncuestaConfig | null) => void;
  setPuntajeSesion: (puntaje: number) => void;
  setSesionId: (id: string | null) => void;
  limpiarSesionWorker: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      trabajadorActual: null,
      areaAnonimaSeleccionada: null,
      periodoActual: null,
      encuestaConfigSeleccionada: null,
      puntajeSesionActual: 0,
      sesionIdActual: null,

      setTrabajador: (t) => set({ trabajadorActual: t }),
      setAreaAnonimaSeleccionada: (a) => set({ areaAnonimaSeleccionada: a }),
      setPeriodoActual: (p) => set({ periodoActual: p }),
      setEncuestaConfig: (c) => set({ encuestaConfigSeleccionada: c }),
      setPuntajeSesion: (puntaje) => set({ puntajeSesionActual: puntaje }),
      setSesionId: (id) => set({ sesionIdActual: id }),
      limpiarSesionWorker: () => set({
        trabajadorActual: null,
        areaAnonimaSeleccionada: null,
        periodoActual: null,
        encuestaConfigSeleccionada: null,
        puntajeSesionActual: 0,
        sesionIdActual: null,
      }),
    }),
    {
      name: 'encuesta-app-session-v2',
      partialize: (state) => ({
        trabajadorActual: state.trabajadorActual,
        areaAnonimaSeleccionada: state.areaAnonimaSeleccionada,
        periodoActual: state.periodoActual,
        encuestaConfigSeleccionada: state.encuestaConfigSeleccionada,
        sesionIdActual: state.sesionIdActual,
        puntajeSesionActual: state.puntajeSesionActual,
      }),
    }
  )
);
