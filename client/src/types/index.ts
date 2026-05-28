// ============================================================
// Tipos del dominio v2.0 — espejo del schema Prisma
// ============================================================

// ─── Enums ───────────────────────────────────────────────────
export type TipoEncuesta = 'ANONIMA' | 'EVALUACION';
export type TipoPregunta = 'VERDADERO_FALSO' | 'LIKERT_3';

// ─── Entidades base (legacy + v2) ────────────────────────────

export type Tema = {
  id: string;
  titulo: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
};

export type Area = {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
};

export type Periodo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  activo: boolean;
  createdAt: string;
  vigente?: boolean;
  encuestaConfigs?: EncuestaConfig[];
  _count?: { sesiones: number };
};

export type EncuestaConfig = {
  id: string;
  periodoId: string;
  nombre: string;
  tipo: TipoEncuesta;
  escalaLabels: string | null; // JSON string: ["Mala","Buena","Muy buena"]
  activo: boolean;
  createdAt: string;
};

export type Grupo = {
  id: string;
  encuestaConfigId: string;
  nombre: string;
  descripcion: string | null;
  orden: number;
  createdAt: string;
  subGrupos?: SubGrupo[];
  preguntas?: Pregunta[];
};

export type SubGrupo = {
  id: string;
  grupoId: string;
  nombre: string;
  orden: number;
  createdAt: string;
  preguntas?: Pregunta[];
};

export type Trabajador = {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  area: string;       // legacy text
  areaId: string | null;
  areaRel?: { nombre: string } | null;
  activo: boolean;
  createdAt: string;
};

export type Pregunta = {
  id: string;
  enunciado: string;
  respuesta_correcta: boolean | null; // null para Likert
  puntos: number;
  activo: boolean;
  orden: number;
  temaId: string | null;
  tipoPregunta: TipoPregunta;
  grupoId: string | null;
  subGrupoId: string | null;
  encuestaConfigId: string | null;
  createdAt: string;
  // relaciones opcionales
  tema?: { titulo: string } | null;
  grupo?: { nombre: string } | null;
  subGrupo?: { nombre: string } | null;
};

export type Premio = {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  probabilidad: number;
  activo: boolean;
  orden: number;
  createdAt: string;
};

export type SesionEncuesta = {
  id: string;
  trabajadorId: string | null;
  temaId: string | null;
  periodoId: string | null;
  encuestaConfigId: string | null;
  anonToken: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  puntajeTotal: number;
  createdAt: string;
};

export type ResultadoRuleta = {
  id: string;
  sesionId: string;
  premioId: string;
  obtenidoEn: string;
};

// ─── DTOs ─────────────────────────────────────────────────────

export type NuevaSesionDto = {
  tipo: TipoEncuesta;
  trabajador_id?: string;   // NOMINAL
  tema_id?: string;         // legacy
  encuesta_config_id?: string;
  periodo_id?: string;
  area_id?: string;         // ANONIMA / EVALUACION
  puntaje_total?: number;
  fecha_fin?: string;
  respuestas?: NuevaRespuestaDto[];
};

export type NuevaRespuestaDto = {
  pregunta_id: string;
  respuesta_dada?: boolean | null;   // V/F
  valor_numerico?: number | null;    // Likert 1-3
  es_correcta: boolean;
  puntos_obtenidos: number;
  sesion_id?: string;
};

// ─── Reportes ─────────────────────────────────────────────────

export type FilaReporteAnonimo = {
  numero: number;
  preguntaId: string;
  grupo: string;
  subGrupo: string;
  enunciado: string;
  mala: number;
  buena: number;
  muyBuena: number;
  total: number;
  porcentajeMuyBuena: number;
  promedio: number;
};

export type ReporteAnonimoResponse = {
  totalSesiones: number;
  filas: FilaReporteAnonimo[];
  promediosPorGrupo: Record<string, number>;
  sesiones?: {
    id: string;
    numero: number;
    fecha: string;
    area: string;
    puntaje: number;
  }[];
};

export type KpiDashboard = {
  totalSesionesAnonimas: number;
  totalSesionesEvaluaciones: number;
  totalTrabajadoresActivos: number;
  participacionEvaluacionPct: number;
};

export type RespuestaEvaluacionFila = {
  esCorrecta: boolean;
  puntosObtenidos: number;
  respuestaDada: string;
  valorNumerico?: number | null;
  pregunta: {
    id: string;
    enunciado: string;
    tipoPregunta?: 'VERDADERO_FALSO' | 'LIKERT_3';
    respuestaCorrecta?: boolean | null;
    grupo: { nombre: string } | null;
    subGrupo: { nombre: string } | null;
  };
};

export type FilaReporteEvaluacion = {
  trabajadorId: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  area: string;
  sesionId: string;
  puntajeTotal: number;
  totalPreguntas: number;
  correctas: number;
  porcentajeAcierto: number;
  respuestas?: RespuestaEvaluacionFila[];
};

export type ReporteEvaluacionResponse = {
  sesiones: FilaReporteEvaluacion[];
  estadisticasPorArea: { nombre: string; total: number; correctas: number; participantes: number; porcentajeAcierto: number }[];
};
