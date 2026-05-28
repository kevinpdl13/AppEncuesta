import { httpClient } from './client';
import type {
  Trabajador, Pregunta, Premio, Tema, SesionEncuesta, ResultadoRuleta,
  NuevaSesionDto, Area, Periodo, EncuestaConfig,
  Grupo, KpiDashboard, ReporteAnonimoResponse, ReporteEvaluacionResponse,
} from '../types';

// ============================================================
// Capa de Datos v2.0 — Único punto de contacto con el backend.
// SoC: La UI nunca conoce URLs ni fetch directamente.
// ============================================================

// ─── AUTH ─────────────────────────────────────────────────────
async function loginAdmin(email: string, password: string): Promise<void> {
  const r = await httpClient.post<{ token: string }>('/auth/admin/login', { email, password });
  localStorage.setItem('auth_token', r.token);
}

async function ingresarTrabajador(cedula: string): Promise<Trabajador> {
  const r = await httpClient.post<{ token: string; trabajador: Trabajador }>('/auth/worker/login', { cedula });
  localStorage.setItem('auth_token', r.token);
  return r.trabajador;
}

// ─── ÁREAS ────────────────────────────────────────────────────
async function getAreas(): Promise<Area[]> {
  return httpClient.get<Area[]>('/areas');
}
async function getAreasActivas(): Promise<Area[]> {
  return httpClient.get<Area[]>('/areas/activas');
}
async function crearArea(payload: { nombre: string; descripcion?: string }): Promise<Area> {
  return httpClient.post<Area>('/areas', payload);
}
async function actualizarArea(id: string, payload: Partial<Area>): Promise<Area> {
  return httpClient.put<Area>(`/areas/${id}`, payload);
}
async function eliminarArea(id: string): Promise<void> {
  return httpClient.delete<void>(`/areas/${id}`);
}

// ─── PERÍODOS ─────────────────────────────────────────────────
async function getPeriodos(): Promise<Periodo[]> {
  return httpClient.get<Periodo[]>('/periodos');
}
async function getPeriodoVigente(): Promise<Periodo> {
  return httpClient.get<Periodo>('/periodos/vigente');
}
async function getPeriodosActivos(): Promise<Periodo[]> {
  return httpClient.get<Periodo[]>('/periodos/activos');
}
async function crearPeriodo(payload: { nombre: string; descripcion?: string; fechaInicio: string; fechaFin?: string }): Promise<Periodo> {
  return httpClient.post<Periodo>('/periodos', payload);
}
async function actualizarPeriodo(id: string, payload: Partial<Periodo>): Promise<Periodo> {
  return httpClient.put<Periodo>(`/periodos/${id}`, payload);
}
async function eliminarPeriodo(id: string): Promise<void> {
  return httpClient.delete<void>(`/periodos/${id}`);
}
async function crearEncuestaConfig(
  periodoId: string,
  payload: { nombre: string; tipo: 'ANONIMA' | 'EVALUACION'; escalaLabels?: string[] }
): Promise<EncuestaConfig> {
  return httpClient.post<EncuestaConfig>(`/periodos/${periodoId}/configs`, payload);
}
async function actualizarEncuestaConfig(
  periodoId: string, configId: string, payload: Partial<EncuestaConfig>
): Promise<EncuestaConfig> {
  return httpClient.put<EncuestaConfig>(`/periodos/${periodoId}/configs/${configId}`, payload);
}
async function eliminarEncuestaConfig(periodoId: string, configId: string): Promise<void> {
  return httpClient.delete<void>(`/periodos/${periodoId}/configs/${configId}`);
}

// ─── GRUPOS / SUBGRUPOS ───────────────────────────────────────
async function getGruposPorConfig(configId: string): Promise<Grupo[]> {
  return httpClient.get<Grupo[]>(`/grupos/config/${configId}`);
}
async function crearGrupo(payload: { encuestaConfigId: string; nombre: string; descripcion?: string; orden?: number }): Promise<Grupo> {
  return httpClient.post<Grupo>('/grupos', payload);
}
async function actualizarGrupo(id: string, payload: Partial<Grupo>): Promise<Grupo> {
  return httpClient.put<Grupo>(`/grupos/${id}`, payload);
}
async function eliminarGrupo(id: string): Promise<void> {
  return httpClient.delete<void>(`/grupos/${id}`);
}
async function crearSubGrupo(grupoId: string, payload: { nombre: string; orden?: number }): Promise<any> {
  return httpClient.post<any>(`/grupos/${grupoId}/subgrupos`, payload);
}
async function actualizarSubGrupo(id: string, payload: any): Promise<any> {
  return httpClient.put<any>(`/grupos/subgrupos/${id}`, payload);
}
async function eliminarSubGrupo(id: string): Promise<void> {
  return httpClient.delete<void>(`/grupos/subgrupos/${id}`);
}

// ─── TEMAS (legacy) ───────────────────────────────────────────
async function getTodosLosTemas(): Promise<Tema[]> {
  return httpClient.get<Tema[]>('/temas');
}
async function getTemasActivos(): Promise<Tema[]> {
  return httpClient.get<Tema[]>('/temas/activos');
}
async function crearTema(payload: Omit<Tema, 'id' | 'created_at'>): Promise<Tema> {
  return httpClient.post<Tema>('/temas', payload);
}
async function actualizarTema(id: string, payload: Partial<Tema>): Promise<Tema> {
  return httpClient.put<Tema>(`/temas/${id}`, payload);
}
async function eliminarTema(id: string): Promise<void> {
  return httpClient.delete<void>(`/temas/${id}`);
}

// ─── TRABAJADORES ─────────────────────────────────────────────
async function getTrabajadores(): Promise<Trabajador[]> {
  return httpClient.get<Trabajador[]>('/trabajadores');
}
async function crearTrabajador(payload: Partial<Trabajador>): Promise<Trabajador> {
  return httpClient.post<Trabajador>('/trabajadores', payload);
}
async function actualizarTrabajador(id: string, payload: Partial<Trabajador>): Promise<Trabajador> {
  return httpClient.put<Trabajador>(`/trabajadores/${id}`, payload);
}

// ─── PREGUNTAS ────────────────────────────────────────────────
async function getTodasLasPreguntas(filtros?: { tipo?: string; grupo_id?: string; encuesta_config_id?: string }): Promise<Pregunta[]> {
  const params = new URLSearchParams();
  if (filtros?.tipo) params.set('tipo', filtros.tipo);
  if (filtros?.grupo_id) params.set('grupo_id', filtros.grupo_id);
  if (filtros?.encuesta_config_id) params.set('encuesta_config_id', filtros.encuesta_config_id);
  const qs = params.toString();
  return httpClient.get<Pregunta[]>(`/preguntas${qs ? `?${qs}` : ''}`);
}
async function getPreguntasPorConfig(configId: string): Promise<Pregunta[]> {
  return httpClient.get<Pregunta[]>(`/preguntas/encuesta-config/${configId}`);
}
async function getPreguntasActivasPorTema(temaId: string): Promise<Pregunta[]> {
  return httpClient.get<Pregunta[]>(`/preguntas/tema/${temaId}`);
}
async function crearPregunta(payload: Partial<Pregunta>): Promise<Pregunta> {
  return httpClient.post<Pregunta>('/preguntas', payload);
}
async function actualizarPregunta(id: string, payload: Partial<Pregunta>): Promise<Pregunta> {
  return httpClient.put<Pregunta>(`/preguntas/${id}`, payload);
}
async function eliminarPregunta(id: string): Promise<void> {
  return httpClient.delete<void>(`/preguntas/${id}`);
}

// ─── PREMIOS ──────────────────────────────────────────────────
async function getPremiosActivos(): Promise<Premio[]> {
  return httpClient.get<Premio[]>('/premios/activos');
}
async function getTodosLosPremios(): Promise<Premio[]> {
  return httpClient.get<Premio[]>('/premios');
}
async function crearPremio(payload: Partial<Premio>): Promise<Premio> {
  return httpClient.post<Premio>('/premios', payload);
}
async function actualizarPremio(id: string, payload: Partial<Premio>): Promise<Premio> {
  return httpClient.put<Premio>(`/premios/${id}`, payload);
}
async function eliminarPremio(id: string): Promise<void> {
  return httpClient.delete<void>(`/premios/${id}`);
}

// ─── SESIONES / ENCUESTA ──────────────────────────────────────
async function crearSesion(payload: NuevaSesionDto): Promise<SesionEncuesta> {
  return httpClient.post<SesionEncuesta>('/encuestas/sesion', payload);
}
async function verificarSesion(trabajadorId: string, configId: string, periodoId: string): Promise<{ yaRespondio: boolean }> {
  return httpClient.get<{ yaRespondio: boolean }>(
    `/encuestas/verificar?trabajador_id=${trabajadorId}&encuesta_config_id=${configId}&periodo_id=${periodoId}`
  );
}
async function getHistorialEncuestas(filtros?: { periodo_id?: string; tipo?: string; area_id?: string }): Promise<any[]> {
  const params = new URLSearchParams();
  if (filtros?.periodo_id) params.set('periodo_id', filtros.periodo_id);
  if (filtros?.tipo) params.set('tipo', filtros.tipo);
  if (filtros?.area_id) params.set('area_id', filtros.area_id);
  const qs = params.toString();
  return httpClient.get<any[]>(`/encuestas/historial${qs ? `?${qs}` : ''}`);
}
async function getHistorialRespuestas(): Promise<any[]> {
  return httpClient.get<any[]>('/encuestas/respuestas');
}

// ─── RULETA ───────────────────────────────────────────────────
async function guardarResultadoRuleta(sesionId: string, premioId: string): Promise<ResultadoRuleta> {
  return httpClient.post<ResultadoRuleta>('/premios/resultado', { sesion_id: sesionId, premio_id: premioId });
}

// ─── REPORTES V2 ──────────────────────────────────────────────
async function getKpiPeriodo(periodoId: string): Promise<KpiDashboard> {
  return httpClient.get<KpiDashboard>(`/reportes-v2/periodo/${periodoId}/kpi`);
}
async function getReporteAnonimo(periodoId: string, encuestaConfigId: string, areaId?: string): Promise<ReporteAnonimoResponse> {
  const url = `/reportes-v2/periodo/${periodoId}/anonimo?encuesta_config_id=${encuestaConfigId}${areaId ? `&area_id=${areaId}` : ''}`;
  return httpClient.get<ReporteAnonimoResponse>(url);
}
async function getReporteEvaluacion(periodoId: string, filtros?: { area_id?: string; encuesta_config_id?: string }): Promise<ReporteEvaluacionResponse> {
  const params = new URLSearchParams();
  if (filtros?.area_id) params.set('area_id', filtros.area_id);
  if (filtros?.encuesta_config_id) params.set('encuesta_config_id', filtros.encuesta_config_id);
  const qs = params.toString();
  return httpClient.get<ReporteEvaluacionResponse>(`/reportes-v2/periodo/${periodoId}/evaluacion${qs ? `?${qs}` : ''}`);
}
async function getTendenciaAreas(): Promise<any> {
  return httpClient.get<any>('/reportes-v2/tendencia-areas');
}

// ─── REPORTES LEGACY ──────────────────────────────────────────
async function getEstadisticasDashboard(): Promise<any> {
  return httpClient.get<any>('/reportes/stats');
}
async function getRankingTrabajadores(): Promise<any[]> {
  return httpClient.get<any[]>('/reportes/ranking');
}

// ─── Exports ──────────────────────────────────────────────────
export const api = {
  // Auth
  loginAdmin,
  ingresarTrabajador,
  // Áreas
  getAreas,
  getAreasActivas,
  crearArea,
  actualizarArea,
  eliminarArea,
  // Períodos
  getPeriodos,
  getPeriodoVigente,
  getPeriodosActivos,
  crearPeriodo,
  actualizarPeriodo,
  eliminarPeriodo,
  crearEncuestaConfig,
  actualizarEncuestaConfig,
  eliminarEncuestaConfig,
  // Grupos
  getGruposPorConfig,
  crearGrupo,
  actualizarGrupo,
  eliminarGrupo,
  crearSubGrupo,
  actualizarSubGrupo,
  eliminarSubGrupo,
  // Temas (legacy)
  getTodosLosTemas,
  getTemasActivos,
  crearTema,
  actualizarTema,
  eliminarTema,
  // Trabajadores
  getTrabajadores,
  crearTrabajador,
  actualizarTrabajador,
  // Preguntas
  getTodasLasPreguntas,
  getPreguntasPorConfig,
  getPreguntasActivasPorTema,
  crearPregunta,
  actualizarPregunta,
  eliminarPregunta,
  // Premios
  getPremiosActivos,
  getTodosLosPremios,
  crearPremio,
  actualizarPremio,
  eliminarPremio,
  // Sesiones
  crearSesion,
  verificarSesion,
  getHistorialEncuestas,
  getHistorialRespuestas,
  // Ruleta
  guardarResultadoRuleta,
  // Reportes v2
  getKpiPeriodo,
  getReporteAnonimo,
  getReporteEvaluacion,
  getTendenciaAreas,
  // Reportes legacy
  getEstadisticasDashboard,
  getRankingTrabajadores,
};
