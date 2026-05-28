import { Router } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, isAdmin } from '../middlewares/auth';

const router = Router();

// Helper: cast query param safely
const qStr = (v: unknown): string => String(v ?? '');

// ─────────────────────────────────────────────────────────────
// REPORTE 1: Dashboard KPI por período
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/reportes-v2/periodo/{periodoId}/kpi:
 *   get:
 *     summary: KPIs generales de un período (Admin)
 *     tags: [ReportesV2]
 *     security:
 *       - bearerAuth: []
 */
router.get('/periodo/:periodoId/kpi', authenticateToken, isAdmin, async (req, res) => {
  const periodoId = req.params.periodoId as string;
  try {
    const [totalAnonimas, totalEvaluaciones, totalTrabajadores] = await Promise.all([
      prisma.sesionEncuesta.count({
        where: {
          periodoId,
          encuestaConfig: { tipo: 'ANONIMA' }
        }
      }),
      prisma.sesionEncuesta.count({
        where: {
          periodoId,
          encuestaConfig: { tipo: 'EVALUACION' },
          trabajadorId: { not: null }
        }
      }),
      prisma.trabajador.count({ where: { activo: true } })
    ]);

    const participacionPct = totalTrabajadores > 0
      ? Math.round((totalEvaluaciones / totalTrabajadores) * 100)
      : 0;

    res.json({
      totalSesionesAnonimas: totalAnonimas,
      totalSesionesEvaluaciones: totalEvaluaciones,
      totalTrabajadoresActivos: totalTrabajadores,
      participacionEvaluacionPct: participacionPct
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// REPORTE 2: Encuesta ANÓNIMA — tabla tipo imagen de referencia
// Filas: N° | Grupo | Sub-grupo | Pregunta | Mala | Buena | Muy buena | %
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/reportes-v2/periodo/{periodoId}/anonimo:
 *   get:
 *     summary: Reporte tabla anónima por grupo/subgrupo (como imagen referencia)
 *     tags: [ReportesV2]
 *     parameters:
 *       - in: query
 *         name: encuesta_config_id
 *         required: true
 */
router.get('/periodo/:periodoId/anonimo', authenticateToken, isAdmin, async (req, res) => {
  const periodoId = req.params.periodoId as string;
  const encuestaConfigId = qStr(req.query.encuesta_config_id);
  const areaId = req.query.area_id ? qStr(req.query.area_id) : undefined;

  if (!encuestaConfigId) {
    return res.status(400).json({ error: 'Parámetro encuesta_config_id requerido.' });
  }

  try {
    // Obtener todas las respuestas Likert con relaciones incluidas explícitamente
    const respuestas = await prisma.respuesta.findMany({
      where: {
        sesion: {
          periodoId,
          encuestaConfigId,
          ...(areaId ? { areaId } : {})
        },
        valorNumerico: { not: null },
        pregunta: { activo: true }
      },
      select: {
        valorNumerico: true,
        pregunta: {
          select: {
            id: true,
            enunciado: true,
            orden: true,
            grupo: { select: { id: true, nombre: true, orden: true } },
            subGrupo: { select: { id: true, nombre: true, orden: true } }
          }
        }
      }
    });

    // Contar total de sesiones para el denominador
    const totalSesiones = await prisma.sesionEncuesta.count({
      where: {
        periodoId,
        encuestaConfigId,
        ...(areaId ? { areaId } : {})
      }
    });

    // Obtener listado de sesiones individuales para reportar qué áreas respondieron
    const sesionesDb = await prisma.sesionEncuesta.findMany({
      where: {
        periodoId,
        encuestaConfigId,
        ...(areaId ? { areaId } : {})
      },
      include: {
        area: { select: { nombre: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const sesiones = sesionesDb.map((s, idx) => ({
      id: s.id,
      numero: sesionesDb.length - idx,
      fecha: s.createdAt,
      area: s.area?.nombre ?? 'No especificada',
      puntaje: s.puntajeTotal
    }));

    // Tipo explícito para el mapa de preguntas
    type ConteoLikert = { 1: number; 2: number; 3: number };
    type PreguntaStats = {
      preguntaId: string;
      enunciado: string;
      orden: number;
      grupo: { id: string; nombre: string; orden: number } | null;
      subGrupo: { id: string; nombre: string; orden: number } | null;
      conteo: ConteoLikert;
      total: number;
    };

    const mapaPreguntas = new Map<string, PreguntaStats>();

    for (const r of respuestas) {
      const pid = r.pregunta.id;
      if (!mapaPreguntas.has(pid)) {
        mapaPreguntas.set(pid, {
          preguntaId: pid,
          enunciado: r.pregunta.enunciado,
          orden: r.pregunta.orden,
          grupo: r.pregunta.grupo,
          subGrupo: r.pregunta.subGrupo,
          conteo: { 1: 0, 2: 0, 3: 0 },
          total: 0
        });
      }
      const stats = mapaPreguntas.get(pid)!;
      const val = r.valorNumerico as number;
      if (val === 1 || val === 2 || val === 3) {
        stats.conteo[val]++;
        stats.total++;
      }
    }

    // Construir filas ordenadas por grupo → subgrupo → orden
    const filas = Array.from(mapaPreguntas.values())
      .sort((a, b) => {
        const ga = a.grupo?.orden ?? 0;
        const gb = b.grupo?.orden ?? 0;
        if (ga !== gb) return ga - gb;
        const sa = a.subGrupo?.orden ?? 0;
        const sb = b.subGrupo?.orden ?? 0;
        if (sa !== sb) return sa - sb;
        return a.orden - b.orden;
      })
      .map((s, idx) => {
        const pct = totalSesiones > 0
          ? Math.round((s.conteo[3] / totalSesiones) * 10000) / 100
          : 0;
        const promedio = s.total > 0
          ? Math.round(((s.conteo[1] * 1 + s.conteo[2] * 2 + s.conteo[3] * 3) / s.total) * 100) / 100
          : 0;
        return {
          numero: idx + 1,
          preguntaId: s.preguntaId,
          grupo: s.grupo?.nombre ?? '—',
          subGrupo: s.subGrupo?.nombre ?? '—',
          enunciado: s.enunciado,
          mala: s.conteo[1],
          buena: s.conteo[2],
          muyBuena: s.conteo[3],
          total: s.total,
          porcentajeMuyBuena: pct,
          promedio
        };
      });

    // Calcular promedio por grupo para subtotales
    const gruposMap = new Map<string, number[]>();
    for (const f of filas) {
      if (!gruposMap.has(f.grupo)) gruposMap.set(f.grupo, []);
      gruposMap.get(f.grupo)!.push(f.porcentajeMuyBuena);
    }
    const promediosPorGrupo: Record<string, number> = {};
    gruposMap.forEach((pcts, grupoNombre) => {
      promediosPorGrupo[grupoNombre] =
        Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 100) / 100;
    });

    res.json({ totalSesiones, filas, promediosPorGrupo, sesiones });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// REPORTE 3: Encuesta de EVALUACION — por área y persona
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/reportes-v2/periodo/{periodoId}/evaluacion:
 *   get:
 *     summary: Reporte de evaluación por área/persona (Admin)
 *     tags: [ReportesV2]
 *     parameters:
 *       - in: query
 *         name: area_id
 *       - in: query
 *         name: encuesta_config_id
 */
router.get('/periodo/:periodoId/evaluacion', authenticateToken, isAdmin, async (req, res) => {
  const periodoId = req.params.periodoId as string;
  const areaId = req.query.area_id ? qStr(req.query.area_id) : undefined;
  const encuestaConfigId = req.query.encuesta_config_id
    ? qStr(req.query.encuesta_config_id)
    : undefined;

  try {
    const sesiones = await prisma.sesionEncuesta.findMany({
      where: {
        periodoId,
        ...(encuestaConfigId ? { encuestaConfigId } : {}),
        encuestaConfig: { tipo: 'EVALUACION' },
        trabajadorId: { not: null },
        ...(areaId ? { trabajador: { areaId } } : {})
      },
      include: {
        trabajador: {
          select: {
            id: true,
            nombres: true,
            apellidos: true,
            cedula: true,
            area: true,
            areaRel: { select: { nombre: true } }
          }
        },
        respuestas: {
          where: {
            pregunta: { activo: true }
          },
          select: {
            esCorrecta: true,
            puntosObtenidos: true,
            respuestaDada: true,
            valorNumerico: true,
            pregunta: {
              select: {
                id: true,
                enunciado: true,
                tipoPregunta: true,
                respuestaCorrecta: true,
                grupo: { select: { nombre: true } },
                subGrupo: { select: { nombre: true } }
              }
            }
          }
        }
      },
      orderBy: { trabajador: { apellidos: 'asc' } }
    });

    // Calcular estadísticas por área
    const areaStats = new Map<string, {
      nombre: string;
      total: number;
      correctas: number;
      participantes: number;
    }>();

    const resultado = sesiones.map(s => {
      const correctas = s.respuestas.filter(r => r.esCorrecta).length;
      const total = s.respuestas.length;
      const pct = total > 0 ? Math.round((correctas / total) * 10000) / 100 : 0;
      const areaNombre = s.trabajador?.areaRel?.nombre ?? s.trabajador?.area ?? 'Sin asignar';

      if (!areaStats.has(areaNombre)) {
        areaStats.set(areaNombre, { nombre: areaNombre, total: 0, correctas: 0, participantes: 0 });
      }
      const as = areaStats.get(areaNombre)!;
      as.correctas += correctas;
      as.total += total;
      as.participantes += 1;

      return {
        trabajadorId: s.trabajador?.id,
        nombres: s.trabajador?.nombres,
        apellidos: s.trabajador?.apellidos,
        cedula: s.trabajador?.cedula,
        area: areaNombre,
        sesionId: s.id,
        puntajeTotal: s.puntajeTotal,
        totalPreguntas: total,
        correctas,
        porcentajeAcierto: pct,
        respuestas: s.respuestas
      };
    });

    const estadisticasPorArea = Array.from(areaStats.values()).map(a => ({
      ...a,
      porcentajeAcierto: a.total > 0
        ? Math.round((a.correctas / a.total) * 10000) / 100
        : 0
    }));

    res.json({ sesiones: resultado, estadisticasPorArea });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// REPORTE 4: Tendencia por área (gráfico de barras agrupadas)
// ─────────────────────────────────────────────────────────────
/**
 * @swagger
 * /api/reportes-v2/tendencia-areas:
 *   get:
 *     summary: Promedio de respuestas correctas por área en todos los períodos
 *     tags: [ReportesV2]
 */
router.get('/tendencia-areas', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [areas, periodos] = await Promise.all([
      prisma.area.findMany({
        where: { activo: true },
        select: { id: true, nombre: true }
      }),
      prisma.periodo.findMany({
        orderBy: { fechaInicio: 'asc' },
        select: { id: true, nombre: true }
      })
    ]);

    const resultado = await Promise.all(
      areas.map(async (area) => {
        const dataPorPeriodo = await Promise.all(
          periodos.map(async (periodo) => {
            const respuestas = await prisma.respuesta.findMany({
              where: {
                sesion: {
                  periodoId: periodo.id,
                  trabajador: { areaId: area.id },
                  encuestaConfig: { tipo: 'EVALUACION' }
                }
              },
              select: { esCorrecta: true }
            });
            const total = respuestas.length;
            const correctas = respuestas.filter(r => r.esCorrecta).length;
            return {
              periodoId: periodo.id,
              periodoNombre: periodo.nombre,
              pct: total > 0
                ? Math.round((correctas / total) * 10000) / 100
                : null
            };
          })
        );
        return { areaId: area.id, areaNombre: area.nombre, dataPorPeriodo };
      })
    );

    res.json({ periodos, areas: resultado });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
